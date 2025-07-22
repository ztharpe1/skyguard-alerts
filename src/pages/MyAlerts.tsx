import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { AlertCard } from '@/components/AlertCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Bell, Search, Filter, Archive, AlertTriangle, Clock, CheckCircle, Cloud, Building2, Info } from 'lucide-react';
import { alertService } from '@/services/alertService';
import { useToast } from '@/hooks/use-toast';

interface DatabaseAlert {
  id: string;
  title: string;
  message: string;
  alert_type: string;
  priority: string;
  created_at: string;
  sent_at: string;
  alert_recipients: Array<{
    delivery_status: string;
    sent_at: string;
    delivered_at: string;
    read_status?: string;
    read_at?: string;
  }>;
}

const MyAlerts = () => {
  const [alerts, setAlerts] = useState<DatabaseAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const { toast } = useToast();

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      const response = await alertService.getUserAlerts();
      if (response.success) {
        setAlerts(response.data || []);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load alerts.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getAlertStats = () => {
    const total = alerts.length;
    const unread = alerts.filter(alert => 
      alert.alert_recipients[0]?.read_status === 'unread'
    ).length;
    const urgent = alerts.filter(alert => 
      alert.priority === 'high' || alert.priority === 'critical'
    ).length;
    
    return { total, unread, urgent };
  };

  const filteredAlerts = alerts
    .filter(alert => {
      if (filter === 'unread') {
        return alert.alert_recipients[0]?.read_status === 'unread';
      }
      if (filter === 'urgent') {
        return alert.priority === 'high' || alert.priority === 'critical';
      }
      if (filter === 'emergency') {
        return alert.alert_type === 'emergency';
      }
      if (filter === 'weather') {
        return alert.alert_type === 'weather';
      }
      if (filter === 'company') {
        return alert.alert_type === 'company';
      }
      return true;
    })
    .filter(alert => 
      alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.message.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      if (sortBy === 'priority') {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) - 
               (priorityOrder[a.priority as keyof typeof priorityOrder] || 0);
      }
      return 0;
    });

  const stats = getAlertStats();

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-muted-foreground">Loading alerts...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Bell className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">My Alerts</h1>
              <p className="text-muted-foreground">View and manage your received alerts</p>
            </div>
          </div>
          <Button variant="outline" onClick={loadAlerts}>
            <Archive className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">All time received</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unread</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">{stats.unread}</div>
              <p className="text-xs text-muted-foreground">Require attention</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Urgent</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{stats.urgent}</div>
              <p className="text-xs text-muted-foreground">High priority alerts</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="h-5 w-5" />
              <span>Filter & Search</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search alerts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Alerts</SelectItem>
                  <SelectItem value="unread">Unread Only</SelectItem>
                  <SelectItem value="urgent">Urgent Only</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                  <SelectItem value="weather">Weather</SelectItem>
                  <SelectItem value="company">Company</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="priority">Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Alerts List */}
        <div className="space-y-4">
          {filteredAlerts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No alerts found</h3>
                <p className="text-muted-foreground text-center">
                  {searchTerm || filter !== 'all' 
                    ? "Try adjusting your search or filter criteria."
                    : "You haven't received any alerts yet."
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredAlerts.map((alert) => (
              <Card key={alert.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-full ${
                        alert.alert_type === 'emergency' ? 'bg-red-100 text-red-600' :
                        alert.alert_type === 'weather' ? 'bg-blue-100 text-blue-600' :
                        alert.alert_type === 'company' ? 'bg-green-100 text-green-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {alert.alert_type === 'emergency' && <AlertTriangle className="h-4 w-4" />}
                        {alert.alert_type === 'weather' && <Cloud className="h-4 w-4" />}
                        {alert.alert_type === 'company' && <Building2 className="h-4 w-4" />}
                        {alert.alert_type === 'system' && <Info className="h-4 w-4" />}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{alert.title}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {new Date(alert.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant={
                          alert.priority === 'critical' ? 'destructive' :
                          alert.priority === 'high' ? 'destructive' :
                          alert.priority === 'medium' ? 'default' : 
                          'secondary'
                        }
                      >
                        {alert.priority}
                      </Badge>
                      {alert.alert_recipients[0]?.read_status === 'unread' && (
                        <Badge variant="outline" className="text-orange-600 border-orange-600">
                          Unread
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground">{alert.message}</p>
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>
                        Status: {alert.alert_recipients[0]?.delivery_status === 'sent' ? 'Delivered' : 'Pending'}
                      </span>
                      {alert.alert_recipients[0]?.read_at && (
                        <span>
                          Read: {new Date(alert.alert_recipients[0].read_at).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
};

export default MyAlerts;