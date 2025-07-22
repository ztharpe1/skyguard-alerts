import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { AlertCard } from '@/components/AlertCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAlerts } from '@/hooks/useAlerts';
import { alertService, AlertRequest } from '@/services/alertService';
import { SecurityMonitor } from '@/lib/security-config';
import { SecurityAuditLog } from '@/components/SecurityAuditLog';
import { AdminAuditLog } from '@/components/AdminAuditLog';
import { 
  Users, 
  Send, 
  AlertTriangle, 
  Clock, 
  CheckCircle,
  TrendingUp,
  MessageSquare,
  UserCheck,
  Settings,
  Cloud,
  Building
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import WeatherAlertsManager from '@/components/WeatherAlertsManager';
import QAMessageBoard from '@/components/QAMessageBoard';

export const AdminDashboard = () => {
  const { toast } = useToast();
  const { alerts, loading } = useAlerts();
  const navigate = useNavigate();
  const [alertForm, setAlertForm] = useState({
    alert_type: '',
    title: '',
    message: '',
    priority: '',
    recipients: 'all' as 'all' | 'emergency' | 'staff' | 'management'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    alertsSentToday: 0,
    responseRate: 0
  });

  useEffect(() => {
    // Load stats
    const loadStats = async () => {
      try {
        console.log('Loading admin dashboard stats...');
        const statsData = await alertService.getStats();
        console.log('Stats loaded:', statsData);
        setStats(statsData);
      } catch (error) {
        console.error('Error loading stats:', error);
      }
    };

    loadStats();
  }, []);

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers.toString(),
      icon: Users,
      color: 'text-primary',
      change: '+12%'
    },
    {
      title: 'Alerts Sent Today',
      value: stats.alertsSentToday.toString(),
      icon: Send,
      color: 'text-success',
      change: '+5%'
    },
    {
      title: 'Active Users',
      value: stats.activeUsers.toString(),
      icon: UserCheck,
      color: 'text-accent',
      change: '+3%'
    },
    {
      title: 'Response Rate',
      value: `${stats.responseRate}%`,
      icon: TrendingUp,
      color: 'text-warning',
      change: '+1.2%'
    }
  ];

  const handleSendAlert = async () => {
    console.log('Send alert button clicked');
    console.log('Alert form state:', alertForm);
    
    if (!alertForm.alert_type || !alertForm.title || !alertForm.message || !alertForm.priority) {
      console.log('Form validation failed - missing fields');
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      console.log('Sending alert with data:', alertForm);
      
      const alertData: AlertRequest = {
        alert_type: alertForm.alert_type as AlertRequest['alert_type'],
        title: alertForm.title,
        message: alertForm.message,
        priority: alertForm.priority as AlertRequest['priority'],
        recipients: alertForm.recipients
      };

      console.log('Alert data prepared:', alertData);
      const result = await alertService.sendAlert(alertData);
      console.log('Alert send result:', result);
      
      if (result.success) {
        // Log admin action for security monitoring
        await SecurityMonitor.monitorAdminAction('send_alert', {
          alert_type: alertData.alert_type,
          priority: alertData.priority,
          recipients: alertData.recipients,
          title: alertData.title
        });
        
        toast({
          title: "Alert Sent Successfully",
          description: `Alert sent to ${result.recipients} users.`,
        });

        // Reset form
        setAlertForm({
          alert_type: '',
          title: '',
          message: '',
          priority: '',
          recipients: 'all'
        });

        // Refresh stats
        const statsData = await alertService.getStats();
        setStats(statsData);
      } else {
        throw new Error('Failed to send alert');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send alert.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Administrator Dashboard</h1>
            <p className="text-muted-foreground">Manage alerts and monitor system status</p>
          </div>
          <Button className="bg-primary hover:bg-primary/90">
            <MessageSquare className="h-4 w-4 mr-2" />
            Broadcast Message
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.title}</p>
                      <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                      <Badge variant="secondary" className="text-xs">
                        {stat.change}
                      </Badge>
                    </div>
                    <Icon className={`h-8 w-8 ${stat.color}`} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Tabs for different sections */}
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="qa-board">Q&A Board</TabsTrigger>
            <TabsTrigger value="weather-alerts">Weather Alerts</TabsTrigger>
            <TabsTrigger value="system-status">System Status</TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard" className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5 text-primary" />
                  <span>Quick Actions</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button 
                    onClick={() => navigate('/system-alerts')}
                    variant="outline" 
                    className="h-auto p-4 justify-start"
                  >
                    <Cloud className="h-6 w-6 mr-3 text-blue-500" />
                    <div className="text-left">
                      <div className="font-medium">Weather Alerts</div>
                      <div className="text-sm text-muted-foreground">Send weather updates</div>
                    </div>
                  </Button>
                  <Button 
                    onClick={() => navigate('/system-alerts')}
                    variant="outline" 
                    className="h-auto p-4 justify-start"
                  >
                    <Building className="h-6 w-6 mr-3 text-green-500" />
                    <div className="text-left">
                      <div className="font-medium">Company Alerts</div>
                      <div className="text-sm text-muted-foreground">Send company notices</div>
                    </div>
                  </Button>
                  <Button 
                    onClick={() => navigate('/system-alerts')}
                    variant="outline" 
                    className="h-auto p-4 justify-start"
                  >
                    <AlertTriangle className="h-6 w-6 mr-3 text-orange-500" />
                    <div className="text-left">
                      <div className="font-medium">System Alerts</div>
                      <div className="text-sm text-muted-foreground">Manage all alert types</div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Send Alert Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Send className="h-5 w-5 text-primary" />
                    <span>Send New Alert</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground">Alert Type</label>
                      <Select value={alertForm.alert_type} onValueChange={(value) => 
                        setAlertForm(prev => ({ ...prev, alert_type: value }))
                      }>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="emergency">Emergency</SelectItem>
                          <SelectItem value="weather">Weather</SelectItem>
                          <SelectItem value="company">Company</SelectItem>
                          <SelectItem value="system">System</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground">Priority</label>
                      <Select value={alertForm.priority} onValueChange={(value) => 
                        setAlertForm(prev => ({ ...prev, priority: value }))
                      }>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-foreground">Title</label>
                    <Input 
                      placeholder="Alert title"
                      value={alertForm.title}
                      onChange={(e) => setAlertForm(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-foreground">Message</label>
                    <Textarea 
                      placeholder="Alert message"
                      rows={3}
                      value={alertForm.message}
                      onChange={(e) => setAlertForm(prev => ({ ...prev, message: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-foreground">Recipients</label>
                    <Select value={alertForm.recipients} onValueChange={(value) => 
                      setAlertForm(prev => ({ ...prev, recipients: value as 'all' | 'emergency' | 'staff' | 'management' }))
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="Select recipients" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Users</SelectItem>
                        <SelectItem value="emergency">Emergency Personnel</SelectItem>
                        <SelectItem value="staff">Staff Only</SelectItem>
                        <SelectItem value="management">Management</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button 
                    onClick={handleSendAlert}
                    disabled={isLoading}
                    className="w-full bg-primary hover:bg-primary/90"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {isLoading ? 'Sending...' : 'Send Alert'}
                  </Button>
                </CardContent>
              </Card>

              {/* System Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-success" />
                    <span>System Status</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-foreground">SMS Service</span>
                      <Badge className="bg-success text-success-foreground">Operational</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-foreground">Push Notifications</span>
                      <Badge className="bg-success text-success-foreground">Operational</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-foreground">Weather Service</span>
                      <Badge className="bg-success text-success-foreground">Operational</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-foreground">Database</span>
                      <Badge className="bg-success text-success-foreground">Operational</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-foreground">Last Check</span>
                      <span className="text-sm text-muted-foreground">2 minutes ago</span>
                    </div>
                  </div>
                  
                  <Button variant="outline" className="w-full">
                    <Clock className="h-4 w-4 mr-2" />
                    View Detailed Logs
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Security Audit Logs */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SecurityAuditLog />
              <AdminAuditLog />
            </div>

            {/* Recent Alerts */}
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-4">Recent Alerts Sent</h2>
              {loading ? (
                <div className="text-center py-8">
                  <Clock className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">Loading alerts...</p>
                </div>
              ) : alerts.length > 0 ? (
                <div className="space-y-4">
                  {alerts.map((alert) => (
                    <AlertCard key={alert.id} alert={alert} showRecipients showReadReceipts />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Send className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">No alerts sent yet</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="qa-board">
            <QAMessageBoard />
          </TabsContent>

          <TabsContent value="weather-alerts">
            <WeatherAlertsManager />
          </TabsContent>

          <TabsContent value="system-status" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <span>Detailed System Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center justify-between">
                    <span>Alert System</span>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-sm text-muted-foreground">Operational</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>SMS Gateway</span>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-sm text-muted-foreground">Active</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Weather API</span>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-sm text-muted-foreground">Connected</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Database</span>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-sm text-muted-foreground">Online</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Security</span>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-sm text-muted-foreground">Protected</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Weather Monitor</span>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-sm text-muted-foreground">Monitoring</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};