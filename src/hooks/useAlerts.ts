import { useState, useEffect } from 'react';
import { Alert } from '@/components/AlertCard';

// Mock alerts data for demonstration
const generateMockAlerts = (): Alert[] => [
  {
    id: '1',
    type: 'emergency',
    title: 'Severe Weather Warning',
    message: 'High winds and potential flooding expected in your area. Please take necessary precautions and avoid unnecessary travel.',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    priority: 'critical',
    status: 'delivered'
  },
  {
    id: '2',
    type: 'company',
    title: 'Emergency Drill Scheduled',
    message: 'Mandatory emergency evacuation drill scheduled for tomorrow at 2:00 PM. All staff must participate.',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    priority: 'high',
    status: 'read'
  },
  {
    id: '3',
    type: 'weather',
    title: 'Heat Advisory',
    message: 'Temperatures expected to reach 95°F today. Stay hydrated and limit outdoor activities.',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    priority: 'medium',
    status: 'delivered'
  },
  {
    id: '4',
    type: 'system',
    title: 'System Maintenance',
    message: 'Scheduled maintenance will occur tonight from 2-4 AM. Brief service interruptions may occur.',
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    priority: 'low',
    status: 'read'
  }
];

export const useAlerts = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading alerts
    const loadAlerts = async () => {
      setLoading(true);
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      setAlerts(generateMockAlerts());
      setLoading(false);
    };

    loadAlerts();
  }, []);

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