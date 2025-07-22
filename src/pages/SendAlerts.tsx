import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Send, Users, Clock, CheckCircle, MessageSquare, History, Eye } from 'lucide-react';
import { alertService, AlertRequest } from '@/services/alertService';
import { useToast } from '@/hooks/use-toast';
import { ReadReceiptsDialog } from '@/components/ReadReceiptsDialog';

interface SentAlert {
  id: string;
  title: string;
  message: string;
  alert_type: string;
  priority: string;
  recipients: string;
  status: string;
  created_at: string;
  sent_at: string;
  alert_recipients: Array<{ count: number }>;
}

const SendAlerts = () => {
  const [alertForm, setAlertForm] = useState({
    alert_type: '',
    title: '',
    message: '',
    priority: '',
    recipients: 'all' as 'all' | 'emergency' | 'staff' | 'management'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [recentAlerts, setRecentAlerts] = useState<SentAlert[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    alertsSentToday: 0,
    responseRate: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    loadStats();
    loadRecentAlerts();
  }, []);

  const loadStats = async () => {
    try {
      const statsData = await alertService.getStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadRecentAlerts = async () => {
    try {
      const response = await alertService.getAllAlerts();
      if (response.success) {
        setRecentAlerts(response.data?.slice(0, 10) || []);
      }
    } catch (error) {
      console.error('Error loading recent alerts:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setAlertForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSendAlert = async () => {
    if (!alertForm.alert_type || !alertForm.title || !alertForm.message || !alertForm.priority) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await alertService.sendAlert(alertForm as AlertRequest);
      
      if (result.success) {
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

        // Refresh data
        loadStats();
        loadRecentAlerts();
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

  const getAlertTypeColor = (type: string) => {
    switch (type) {
      case 'emergency': return 'bg-red-100 text-red-800';
      case 'weather': return 'bg-blue-100 text-blue-800';
      case 'company': return 'bg-green-100 text-green-800';
      case 'system': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Send className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Send Alerts</h1>
            <p className="text-muted-foreground">Create and send alerts to users</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">Registered users</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{stats.activeUsers}</div>
              <p className="text-xs text-muted-foreground">Can receive alerts</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Alerts</CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-500">{stats.alertsSentToday}</div>
              <p className="text-xs text-muted-foreground">Sent today</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
              <MessageSquare className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">{stats.responseRate}%</div>
              <p className="text-xs text-muted-foreground">Read rate</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Send Alert Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Send className="h-5 w-5 text-primary" />
                <span>Create New Alert</span>
              </CardTitle>
              <CardDescription>
                Send emergency, weather, company, or system alerts to users
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="alert_type">Alert Type</Label>
                  <Select value={alertForm.alert_type} onValueChange={(value) => handleInputChange('alert_type', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="emergency">Emergency</SelectItem>
                      <SelectItem value="weather">Weather</SelectItem>
                      <SelectItem value="company">Company</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={alertForm.priority} onValueChange={(value) => handleInputChange('priority', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority..." />
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

              <div className="space-y-2">
                <Label htmlFor="title">Alert Title</Label>
                <Input
                  id="title"
                  value={alertForm.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Enter alert title..."
                  maxLength={100}
                />
                <p className="text-xs text-muted-foreground">
                  {alertForm.title.length}/100 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={alertForm.message}
                  onChange={(e) => handleInputChange('message', e.target.value)}
                  placeholder="Enter your alert message..."
                  rows={4}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground">
                  {alertForm.message.length}/500 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="recipients">Recipients</Label>
                <Select value={alertForm.recipients} onValueChange={(value) => handleInputChange('recipients', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="emergency">Emergency Team</SelectItem>
                    <SelectItem value="staff">Staff Only</SelectItem>
                    <SelectItem value="management">Management Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={handleSendAlert}
                disabled={isLoading}
                className="w-full"
                size="lg"
              >
                <Send className="h-4 w-4 mr-2" />
                {isLoading ? 'Sending Alert...' : 'Send Alert'}
              </Button>
            </CardContent>
          </Card>

          {/* Recent Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <History className="h-5 w-5" />
                <span>Recent Alerts</span>
              </CardTitle>
              <CardDescription>
                View recently sent alerts and their delivery status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentAlerts.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No alerts sent yet</p>
                  </div>
                ) : (
                  recentAlerts.map((alert) => (
                    <div key={alert.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{alert.title}</h4>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {alert.message}
                          </p>
                        </div>
                        <ReadReceiptsDialog alertId={alert.id} alertTitle={alert.title}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </ReadReceiptsDialog>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge className={getAlertTypeColor(alert.alert_type)}>
                            {alert.alert_type}
                          </Badge>
                          <Badge variant={getPriorityColor(alert.priority)}>
                            {alert.priority}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(alert.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          Recipients: {alert.recipients}
                        </span>
                        <span className="text-green-600">
                          Delivered: {alert.alert_recipients[0]?.count || 0}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Guidelines */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5" />
              <span>Alert Guidelines</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">Best Practices</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Use clear, concise titles that immediately convey the alert's purpose</li>
                  <li>• Include specific actions users should take in the message</li>
                  <li>• Set appropriate priority levels based on urgency</li>
                  <li>• Target the right audience with recipient filters</li>
                  <li>• Follow up on critical alerts to ensure receipt</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Priority Levels</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• <strong>Critical:</strong> Immediate life/safety threats</li>
                  <li>• <strong>High:</strong> Urgent situations requiring prompt action</li>
                  <li>• <strong>Medium:</strong> Important information with time sensitivity</li>
                  <li>• <strong>Low:</strong> General announcements and updates</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default SendAlerts;