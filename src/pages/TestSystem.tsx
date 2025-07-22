import React, { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { alertService } from '@/services/alertService';
import { 
  TestTube, 
  Send, 
  CheckCircle, 
  AlertTriangle, 
  MessageSquare,
  Users,
  Clock,
  Wifi,
  Database,
  Cloud,
  Phone
} from 'lucide-react';

export const TestSystem = () => {
  const { toast } = useToast();
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);

  const runSystemTest = async () => {
    setTesting(true);
    setTestResults(null);

    try {
      // Test system connectivity
      const systemStatus = await alertService.testSystem();
      
      // Test sending sample alerts
      const testAlert = await alertService.sendAlert({
        type: 'system',
        title: 'System Test Alert',
        message: 'This is a test alert to verify system functionality.',
        priority: 'low',
        recipients: 'management'
      });

      // Get current stats
      const stats = await alertService.getStats();

      setTestResults({
        systemStatus,
        testAlert,
        stats,
        timestamp: new Date()
      });

      toast({
        title: "System Test Complete",
        description: "All systems tested successfully",
      });
    } catch (error) {
      toast({
        title: "Test Failed",
        description: "Some system components are not responding",
        variant: "destructive"
      });
    } finally {
      setTesting(false);
    }
  };

  const testComponents = [
    { 
      name: 'SMS Service', 
      icon: Phone, 
      status: testResults?.systemStatus?.sms,
      description: 'Text message delivery system'
    },
    { 
      name: 'Push Notifications', 
      icon: MessageSquare, 
      status: testResults?.systemStatus?.push,
      description: 'Mobile push notification service'
    },
    { 
      name: 'Weather API', 
      icon: Cloud, 
      status: testResults?.systemStatus?.weather,
      description: 'Weather data integration'
    },
    { 
      name: 'Database', 
      icon: Database, 
      status: testResults?.systemStatus?.database,
      description: 'User and alert data storage'
    }
  ];

  const quickTests = [
    {
      name: 'Emergency Alert Test',
      description: 'Send test emergency alert to admin users',
      action: () => alertService.sendAlert({
        type: 'emergency',
        title: 'TEST: Emergency System Check',
        message: 'This is a test of the emergency alert system. No action required.',
        priority: 'high',
        recipients: 'management'
      })
    },
    {
      name: 'Weather Alert Test',
      description: 'Send test weather alert to all users',
      action: () => alertService.sendAlert({
        type: 'weather',
        title: 'TEST: Weather System Check',
        message: 'This is a test of the weather alert system. No action required.',
        priority: 'medium',
        recipients: 'all'
      })
    },
    {
      name: 'Company Alert Test',
      description: 'Send test company announcement',
      action: () => alertService.sendAlert({
        type: 'company',
        title: 'TEST: Company System Check',
        message: 'This is a test of the company alert system. No action required.',
        priority: 'low',
        recipients: 'staff'
      })
    }
  ];

  return (
    <Layout userRole="admin" userName="System Admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">System Testing</h1>
            <p className="text-muted-foreground">Test and validate all system components</p>
          </div>
          <Button 
            onClick={runSystemTest}
            disabled={testing}
            className="bg-primary hover:bg-primary/90"
          >
            <TestTube className="h-4 w-4 mr-2" />
            {testing ? 'Running Tests...' : 'Run Full System Test'}
          </Button>
        </div>

        {/* System Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Wifi className="h-5 w-5 text-primary" />
                <span>Component Status</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {testComponents.map((component) => {
                const Icon = component.icon;
                return (
                  <div key={component.name} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-foreground">{component.name}</p>
                        <p className="text-xs text-muted-foreground">{component.description}</p>
                      </div>
                    </div>
                    <Badge 
                      className={
                        component.status === true ? 'bg-success text-success-foreground' :
                        component.status === false ? 'bg-destructive text-destructive-foreground' :
                        'bg-muted text-muted-foreground'
                      }
                    >
                      {component.status === true ? 'Online' :
                       component.status === false ? 'Offline' :
                       'Unknown'}
                    </Badge>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Test Results */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-success" />
                <span>Last Test Results</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {testResults ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground">Test Alert Sent</span>
                    <Badge className="bg-success text-success-foreground">
                      {testResults.testAlert.recipients} recipients
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground">Total Users</span>
                    <span className="text-sm font-medium">{testResults.stats.totalUsers}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground">Active Users</span>
                    <span className="text-sm font-medium">{testResults.stats.activeUsers}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground">Last Test</span>
                    <span className="text-xs text-muted-foreground">
                      {testResults.timestamp.toLocaleString()}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No test results available</p>
                  <p className="text-xs text-muted-foreground">Run a system test to see results</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Tests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Send className="h-5 w-5 text-primary" />
              <span>Quick Tests</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {quickTests.map((test, index) => (
                <div key={index} className="border border-border rounded-lg p-4">
                  <h3 className="font-medium text-foreground mb-2">{test.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{test.description}</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={async () => {
                      try {
                        const result = await test.action();
                        toast({
                          title: "Test Alert Sent",
                          description: `Sent to ${result.recipients} recipients`,
                        });
                      } catch (error) {
                        toast({
                          title: "Test Failed",
                          description: "Unable to send test alert",
                          variant: "destructive"
                        });
                      }
                    }}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send Test
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Cost Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-accent" />
              <span>Cost Analysis (Minimal Cost Strategy)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-foreground mb-3">Current Setup (FREE/LOW-COST)</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Backend Hosting (Render Free)</span>
                    <span className="text-success font-medium">$0/month</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Database (Firebase Free)</span>
                    <span className="text-success font-medium">$0/month</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Push Notifications (FCM)</span>
                    <span className="text-success font-medium">$0/month</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Weather API (Free tier)</span>
                    <span className="text-success font-medium">$0/month</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-medium">Total Monthly Cost</span>
                    <span className="text-success font-bold">$0/month</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-3">Optional SMS (Pay-per-use)</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Twilio SMS (per message)</span>
                    <span className="text-warning">$0.0075 each</span>
                  </div>
                  <div className="flex justify-between">
                    <span>100 SMS alerts/month</span>
                    <span className="text-warning">$0.75/month</span>
                  </div>
                  <div className="flex justify-between">
                    <span>1000 SMS alerts/month</span>
                    <span className="text-warning">$7.50/month</span>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-accent/10 rounded-lg">
                  <p className="text-xs text-muted-foreground">
                    <strong>Recommendation:</strong> Use free push notifications primarily, 
                    SMS only for critical emergency alerts to minimize costs.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};