import React, { useState } from 'react';
import { Layout } from '@/components/Layout';
import { AlertCard, Alert } from '@/components/AlertCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { 
  Bell, 
  AlertTriangle, 
  Cloud, 
  Building2, 
  CheckCircle,
  Clock,
  Phone
} from 'lucide-react';

const mockAlerts: Alert[] = [
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
  }
];

export const EmployeeDashboard = () => {
  const [preferences, setPreferences] = useState({
    emergency: true,
    weather: true,
    company: true,
    sms: true,
    push: true
  });

  const stats = [
    {
      title: 'Total Alerts',
      value: mockAlerts.length,
      icon: Bell,
      color: 'text-primary'
    },
    {
      title: 'Unread',
      value: mockAlerts.filter(a => a.status !== 'read').length,
      icon: Clock,
      color: 'text-warning'
    },
    {
      title: 'Critical',
      value: mockAlerts.filter(a => a.priority === 'critical').length,
      icon: AlertTriangle,
      color: 'text-destructive'
    },
    {
      title: 'Active Status',
      value: 'Online',
      icon: CheckCircle,
      color: 'text-success'
    }
  ];

  return (
    <Layout userRole="employee" userName="John Smith">
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
                      checked={preferences.emergency}
                      onCheckedChange={(checked) => 
                        setPreferences(p => ({ ...p, emergency: checked }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Cloud className="h-4 w-4 text-accent" />
                      <span>Weather Updates</span>
                    </div>
                    <Switch 
                      checked={preferences.weather}
                      onCheckedChange={(checked) => 
                        setPreferences(p => ({ ...p, weather: checked }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Building2 className="h-4 w-4 text-primary" />
                      <span>Company News</span>
                    </div>
                    <Switch 
                      checked={preferences.company}
                      onCheckedChange={(checked) => 
                        setPreferences(p => ({ ...p, company: checked }))
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
                      checked={preferences.sms}
                      onCheckedChange={(checked) => 
                        setPreferences(p => ({ ...p, sms: checked }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Push Notifications</span>
                    <Switch 
                      checked={preferences.push}
                      onCheckedChange={(checked) => 
                        setPreferences(p => ({ ...p, push: checked }))
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
          <div className="space-y-4">
            {mockAlerts.map((alert) => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};