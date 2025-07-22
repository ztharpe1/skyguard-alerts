import React, { useState } from 'react';
import { Layout } from '@/components/Layout';
import { AlertCard, Alert } from '@/components/AlertCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  Send, 
  AlertTriangle, 
  Clock, 
  CheckCircle,
  TrendingUp,
  MessageSquare,
  UserCheck
} from 'lucide-react';

const mockAlerts: Alert[] = [
  {
    id: '1',
    type: 'emergency',
    title: 'Severe Weather Warning',
    message: 'High winds and potential flooding expected.',
    timestamp: new Date(),
    priority: 'critical',
    status: 'delivered',
    recipients: 234
  },
  {
    id: '2',
    type: 'company',
    title: 'Emergency Drill',
    message: 'Mandatory drill scheduled for tomorrow.',
    timestamp: new Date(Date.now() - 60 * 60 * 1000),
    priority: 'high',
    status: 'sent',
    recipients: 156
  }
];

export const AdminDashboard = () => {
  const { toast } = useToast();
  const [alertForm, setAlertForm] = useState({
    type: '',
    title: '',
    message: '',
    priority: '',
    recipients: 'all'
  });

  const stats = [
    {
      title: 'Total Users',
      value: '2,847',
      icon: Users,
      color: 'text-primary',
      change: '+12%'
    },
    {
      title: 'Alerts Sent Today',
      value: '23',
      icon: Send,
      color: 'text-success',
      change: '+5%'
    },
    {
      title: 'Active Users',
      value: '2,634',
      icon: UserCheck,
      color: 'text-accent',
      change: '+3%'
    },
    {
      title: 'Response Rate',
      value: '94.2%',
      icon: TrendingUp,
      color: 'text-warning',
      change: '+1.2%'
    }
  ];

  const handleSendAlert = () => {
    if (!alertForm.type || !alertForm.title || !alertForm.message || !alertForm.priority) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    // Simulate sending alert
    toast({
      title: "Alert Sent Successfully",
      description: `${alertForm.type} alert sent to ${alertForm.recipients === 'all' ? 'all users' : alertForm.recipients}.`,
    });

    // Reset form
    setAlertForm({
      type: '',
      title: '',
      message: '',
      priority: '',
      recipients: 'all'
    });
  };

  return (
    <Layout userRole="admin" userName="Admin User">
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
          {stats.map((stat) => {
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
                  <Select value={alertForm.type} onValueChange={(value) => 
                    setAlertForm(prev => ({ ...prev, type: value }))
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
                  setAlertForm(prev => ({ ...prev, recipients: value }))
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
                className="w-full bg-primary hover:bg-primary/90"
              >
                <Send className="h-4 w-4 mr-2" />
                Send Alert
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

        {/* Recent Alerts */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-4">Recent Alerts Sent</h2>
          <div className="space-y-4">
            {mockAlerts.map((alert) => (
              <AlertCard key={alert.id} alert={alert} showRecipients />
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};