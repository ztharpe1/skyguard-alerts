import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, AlertTriangle, User, Clock, RefreshCw } from 'lucide-react';

interface AuditLogEntry {
  id: string;
  event_type: string;
  user_id?: string;
  details: Record<string, any>;
  timestamp: string;
  ip_address?: string;
  user_agent?: string;
}

export const SecurityAuditLog = () => {
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const loadAuditLogs = () => {
    setLoading(true);
    try {
      const logs = JSON.parse(localStorage.getItem('security_audit_logs') || '[]');
      setAuditLogs(logs.slice(-20).reverse()); // Show last 20 entries, newest first
    } catch (error) {
      console.error('Error loading audit logs:', error);
      setAuditLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const getEventTypeColor = (eventType: string) => {
    switch (eventType) {
      case 'failed_auth':
        return 'destructive';
      case 'role_change_attempt':
        return 'warning';
      case 'admin_action':
        return 'default';
      case 'suspicious_activity':
        return 'destructive';
      case 'unauthorized_access':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'failed_auth':
        return <AlertTriangle className="h-4 w-4" />;
      case 'role_change_attempt':
        return <User className="h-4 w-4" />;
      case 'admin_action':
        return <Shield className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const formatEventDetails = (details: Record<string, any>) => {
    const key = Object.keys(details)[0];
    const value = details[key];
    
    if (typeof value === 'object') {
      return `${key}: ${JSON.stringify(value)}`;
    }
    
    return `${key}: ${value}`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-primary" />
            <span>Security Audit Log</span>
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadAuditLogs}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-4">
            <Clock className="h-6 w-6 animate-spin mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading audit logs...</p>
          </div>
        ) : auditLogs.length > 0 ? (
          <div className="space-y-3">
            {auditLogs.map((log) => (
              <div key={log.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                <div className="flex-shrink-0 mt-1">
                  {getEventIcon(log.event_type)}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center space-x-2">
                    <Badge variant={getEventTypeColor(log.event_type) as any}>
                      {log.event_type.replace('_', ' ').toUpperCase()}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-foreground">
                    {formatEventDetails(log.details)}
                  </p>
                  {log.user_id && (
                    <p className="text-xs text-muted-foreground">
                      User ID: {log.user_id.substring(0, 8)}...
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Shield className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No security events recorded</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};