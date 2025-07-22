import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, RefreshCw, User, AlertTriangle, Settings, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface AuditLogEntry {
  id: string;
  event_type: string;
  user_id: string | null;
  details: any;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export const AdminAuditLog = () => {
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAuditLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error loading audit logs:', error);
        return;
      }

      setAuditLogs((data || []) as AuditLogEntry[]);
    } catch (error) {
      console.error('Error loading audit logs:', error);
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
        return 'secondary';
      case 'admin_action':
        return 'default';
      case 'suspicious_activity':
        return 'destructive';
      case 'unauthorized_access':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'failed_auth':
        return AlertTriangle;
      case 'role_change_attempt':
        return User;
      case 'admin_action':
        return Settings;
      case 'suspicious_activity':
        return AlertTriangle;
      case 'unauthorized_access':
        return Shield;
      default:
        return Eye;
    }
  };

  const formatEventDetails = (details: Record<string, any>) => {
    if (!details || typeof details !== 'object') return 'No details';
    
    const items = Object.entries(details).map(([key, value]) => {
      if (typeof value === 'object') {
        return `${key}: ${JSON.stringify(value)}`;
      }
      return `${key}: ${value}`;
    });
    
    return items.join(', ');
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
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : auditLogs.length > 0 ? (
          <div className="space-y-4">
            {auditLogs.map((entry) => {
              const IconComponent = getEventIcon(entry.event_type);
              return (
                <div
                  key={entry.id}
                  className="flex items-start space-x-3 p-3 rounded-lg border bg-card"
                >
                  <IconComponent className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <Badge variant={getEventTypeColor(entry.event_type)}>
                        {entry.event_type.replace('_', ' ')}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {new Date(entry.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-foreground mb-2">
                      {formatEventDetails(entry.details)}
                    </p>
                    <div className="text-xs text-muted-foreground space-y-1">
                      {entry.user_id && (
                        <div>User ID: {entry.user_id}</div>
                      )}
                      {entry.ip_address && (
                        <div>IP: {entry.ip_address}</div>
                      )}
                      {entry.user_agent && (
                        <div className="truncate">User Agent: {entry.user_agent}</div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No security events logged yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};