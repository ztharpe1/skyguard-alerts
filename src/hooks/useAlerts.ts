import { useState, useEffect } from 'react';
import { Alert } from '@/components/AlertCard';
import { alertService } from '@/services/alertService';
import { useAuth } from '@/hooks/useAuth';

export const useAlerts = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, profile } = useAuth();

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const loadAlerts = async () => {
      setLoading(true);
      try {
        if (profile?.role === 'admin') {
          const result = await alertService.getAllAlerts();
          if (result.success && result.data) {
            const transformedAlerts = result.data.map((alert: any) => ({
              id: alert.id,
              type: alert.alert_type,
              title: alert.title,
              message: alert.message,
              timestamp: new Date(alert.created_at),
              priority: alert.priority,
              status: alert.status,
              recipients: alert.alert_recipients?.length || 0
            }));
            setAlerts(transformedAlerts);
          }
        } else {
          const result = await alertService.getUserAlerts();
          if (result.success && result.data) {
            const transformedAlerts = result.data.map((alert: any) => ({
              id: alert.id,
              type: alert.alert_type,
              title: alert.title,
              message: alert.message,
              timestamp: new Date(alert.created_at),
              priority: alert.priority,
              status: alert.alert_recipients?.[0]?.delivery_status || 'sent'
            }));
            setAlerts(transformedAlerts);
          }
        }
      } catch (error) {
        console.error('Error loading alerts:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAlerts();
  }, [user, profile]);

  const markAsRead = (alertId: string) => {
    setAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, status: 'read' as const }
          : alert
      )
    );
  };

  const addAlert = (newAlert: Omit<Alert, 'id' | 'timestamp' | 'status'>) => {
    const alert: Alert = {
      ...newAlert,
      id: Date.now().toString(),
      timestamp: new Date(),
      status: 'sent'
    };
    setAlerts(prev => [alert, ...prev]);
  };

  return {
    alerts,
    loading,
    markAsRead,
    addAlert
  };
};