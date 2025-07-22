// Security configuration and monitoring utilities
import { supabase } from '@/integrations/supabase/client';

// Security event types for audit logging
export type SecurityEventType = 
  | 'role_change_attempt'
  | 'admin_action'
  | 'failed_auth'
  | 'suspicious_activity'
  | 'unauthorized_access';

// Audit log entry interface
export interface AuditLogEntry {
  event_type: SecurityEventType;
  user_id?: string;
  details: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
}

// Security monitoring class
export class SecurityMonitor {
  // Log security events (in production, this would go to a secure audit table)
  static async logSecurityEvent(entry: AuditLogEntry): Promise<void> {
    try {
      // In a production app, you'd want to store these in a dedicated audit_logs table
      console.warn('Security Event:', {
        ...entry,
        timestamp: new Date().toISOString(),
        session_id: await this.getSessionId()
      });
      
      // For now, we'll use browser storage for demonstration
      // In production, send to secure logging service
      const existingLogs = JSON.parse(localStorage.getItem('security_audit_logs') || '[]');
      existingLogs.push({
        ...entry,
        timestamp: new Date().toISOString(),
        id: crypto.randomUUID()
      });
      
      // Keep only last 100 entries in browser storage
      if (existingLogs.length > 100) {
        existingLogs.splice(0, existingLogs.length - 100);
      }
      
      localStorage.setItem('security_audit_logs', JSON.stringify(existingLogs));
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  // Monitor failed authentication attempts
  static async monitorFailedAuth(email: string, error: string): Promise<void> {
    await this.logSecurityEvent({
      event_type: 'failed_auth',
      details: {
        email,
        error_message: error,
        attempt_count: await this.getFailedAttemptCount(email)
      },
      ip_address: await this.getClientIP(),
      user_agent: navigator.userAgent
    });
  }

  // Monitor role change attempts
  static async monitorRoleChange(targetUserId: string, oldRole: string, newRole: string, success: boolean): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    
    await this.logSecurityEvent({
      event_type: 'role_change_attempt',
      user_id: user?.id,
      details: {
        target_user_id: targetUserId,
        old_role: oldRole,
        new_role: newRole,
        success,
        action: 'role_change'
      },
      ip_address: await this.getClientIP(),
      user_agent: navigator.userAgent
    });
  }

  // Monitor admin actions
  static async monitorAdminAction(action: string, details: Record<string, any>): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    
    await this.logSecurityEvent({
      event_type: 'admin_action',
      user_id: user?.id,
      details: {
        action,
        ...details
      },
      ip_address: await this.getClientIP(),
      user_agent: navigator.userAgent
    });
  }

  // Get session ID for tracking
  private static async getSessionId(): Promise<string | undefined> {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token.substring(0, 16); // First 16 chars as session identifier
  }

  // Get client IP (best effort)
  private static async getClientIP(): Promise<string> {
    try {
      // In production, you might want to use a service to get the real IP
      return 'client-ip-unavailable';
    } catch {
      return 'unknown';
    }
  }

  // Track failed authentication attempts
  private static async getFailedAttemptCount(email: string): Promise<number> {
    const attempts = JSON.parse(localStorage.getItem(`failed_attempts_${email}`) || '0');
    return attempts;
  }

  // Increment failed attempt counter
  static incrementFailedAttempts(email: string): void {
    const current = JSON.parse(localStorage.getItem(`failed_attempts_${email}`) || '0');
    localStorage.setItem(`failed_attempts_${email}`, JSON.stringify(current + 1));
    
    // Clear after 1 hour
    setTimeout(() => {
      localStorage.removeItem(`failed_attempts_${email}`);
    }, 60 * 60 * 1000);
  }

  // Clear failed attempts on successful login
  static clearFailedAttempts(email: string): void {
    localStorage.removeItem(`failed_attempts_${email}`);
  }
}

// Rate limiting for sensitive operations
export class RateLimiter {
  private static limits = new Map<string, { count: number; resetTime: number }>();

  static isAllowed(operation: string, maxAttempts: number = 5, windowMs: number = 60000): boolean {
    const now = Date.now();
    const key = operation;
    const limit = this.limits.get(key);

    if (!limit || now > limit.resetTime) {
      this.limits.set(key, { count: 1, resetTime: now + windowMs });
      return true;
    }

    if (limit.count >= maxAttempts) {
      return false;
    }

    limit.count++;
    return true;
  }

  static getRemainingAttempts(operation: string, maxAttempts: number = 5): number {
    const limit = this.limits.get(operation);
    if (!limit || Date.now() > limit.resetTime) {
      return maxAttempts;
    }
    return Math.max(0, maxAttempts - limit.count);
  }
}

// Security headers validation
export const validateSecurityHeaders = (): boolean => {
  // Check if CSP is properly set
  const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
  if (!cspMeta) {
    console.warn('Content Security Policy not found');
    return false;
  }

  // Check if other security headers are present
  const requiredHeaders = [
    'X-Content-Type-Options',
    'X-Frame-Options',
    'X-XSS-Protection'
  ];

  for (const header of requiredHeaders) {
    const meta = document.querySelector(`meta[http-equiv="${header}"]`);
    if (!meta) {
      console.warn(`Security header ${header} not found`);
      return false;
    }
  }

  return true;
};
