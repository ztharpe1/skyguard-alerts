import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { AlertCard } from '@/components/AlertCard';
import { PhoneNumberForm } from '@/components/PhoneNumberForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useAlerts } from '@/hooks/useAlerts';
import { alertService } from '@/services/alertService';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { 
  Bell, 
  AlertTriangle, 
  Cloud, 
  Building2, 
  CheckCircle,
  Clock,
  Phone
} from 'lucide-react';

export const EmployeeDashboard = () => {
  const { alerts, loading } = useAlerts();
  const { toast } = useToast();
  const { profile } = useAuth();
  const [preferences, setPreferences] = useState({
    emergency_alerts: true,
    weather_alerts: true,
    company_alerts: true,
    system_alerts: true,
    sms_enabled: true,
    push_enabled: true
  });

  useEffect(() => {
    // Load user preferences
    const loadPreferences = async () => {
      const result = await alertService.getUserPreferences();
      if (result.success && result.data) {
        setPreferences({
          emergency_alerts: result.data.emergency_alerts,
          weather_alerts: result.data.weather_alerts,
          company_alerts: result.data.company_alerts,
          system_alerts: result.data.system_alerts,
          sms_enabled: result.data.sms_enabled,
          push_enabled: result.data.push_enabled
        });
      }
    };

    loadPreferences();
  }, []);

  const updatePreference = async (key: string, value: boolean) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
    
    const result = await alertService.updatePreferences({ [key]: value });
    if (result.success) {
      toast({
        title: "Preferences Updated",
        description: "Your alert preferences have been saved.",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to update preferences.",
        variant: "destructive"
      });
      // Revert the change
      setPreferences(prev => ({ ...prev, [key]: !value }));
    }
  };

  const stats = [
    {
      title: 'Total Alerts',
      value: alerts.length,
      icon: Bell,
      color: 'text-primary'
    },
    {
      title: 'Unread',
      value: alerts.filter(a => a.status !== 'read').length,
      icon: Clock,
      color: 'text-warning'
    },
    {
      title: 'Critical',
      value: alerts.filter(a => a.priority === 'critical').length,
      icon: AlertTriangle,
      color: 'text-destructive'
    },
    {
      title: 'Phone Status',
      value: profile?.phone_number ? 'Registered' : 'Missing',
      icon: Phone,
      color: profile?.phone_number ? 'text-success' : 'text-warning'
    }
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Employee Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, stay informed and stay safe</p>
          </div>
          <Button className="bg-primary hover:bg-primary/90">
            <Phone className="h-4 w-4 mr-2" />
            Emergency Contact
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title}>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <Icon className={`h-8 w-8 ${stat.color}`} />
                    <div>
                      <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                      <p className="text-sm text-muted-foreground">{stat.title}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Phone Number Form */}
        {!profile?.phone_number && (
          <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              <h3 className="font-semibold text-warning">Phone Number Required</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              You need to add your phone number to receive SMS alerts.
            </p>
            <PhoneNumberForm />
          </div>
        )}

        {/* Alert Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5 text-primary" />
              <span>Alert Preferences</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3 text-foreground">Alert Types</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      <span>Emergency Alerts</span>
                    </div>
                    <Switch 
                      checked={preferences.emergency_alerts}
                      onCheckedChange={(checked) => 
                        updatePreference('emergency_alerts', checked)
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Cloud className="h-4 w-4 text-accent" />
                      <span>Weather Updates</span>
                    </div>
                    <Switch 
                      checked={preferences.weather_alerts}
                      onCheckedChange={(checked) => 
                        updatePreference('weather_alerts', checked)
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Building2 className="h-4 w-4 text-primary" />
                      <span>Company News</span>
                    </div>
                    <Switch 
                      checked={preferences.company_alerts}
                      onCheckedChange={(checked) => 
                        updatePreference('company_alerts', checked)
                      }
                    />
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-3 text-foreground">Delivery Methods</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>SMS Notifications</span>
                    <Switch 
                      checked={preferences.sms_enabled}
                      onCheckedChange={(checked) => 
                        updatePreference('sms_enabled', checked)
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Push Notifications</span>
                    <Switch 
                      checked={preferences.push_enabled}
                      onCheckedChange={(checked) => 
                        updatePreference('push_enabled', checked)
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Alerts */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-4">Recent Alerts</h2>
          {loading ? (
            <div className="text-center py-8">
              <Clock className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">Loading alerts...</p>
            </div>
          ) : alerts.length > 0 ? (
            <div className="space-y-4">
              {alerts.map((alert) => (
                <AlertCard key={alert.id} alert={alert} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Bell className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">No alerts yet</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};