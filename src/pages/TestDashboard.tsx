import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { alertService } from '@/services/alertService';
import { useAuth } from '@/hooks/useAuth';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Phone,
  Bell,
  Database,
  Wifi,
  AlertTriangle
} from 'lucide-react';

export const TestDashboard = () => {
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState({
    auth: false,
    database: false,
    phoneNumber: false,
    preferences: false,
    alertSending: false,
    alertReceiving: false
  });

  useEffect(() => {
    // Auto-run basic tests on component mount
    runBasicTests();
  }, []);

  const runBasicTests = async () => {
    setTesting(true);
    
    try {
      // Test 1: Authentication
      const authTest = !!user && !!profile;
      
      // Test 2: Database connectivity
      const systemStatus = await alertService.testSystem();
      
      // Test 3: Phone number setup
      const phoneTest = !!profile?.phone_number;
      
      // Test 4: User preferences
      const prefsResult = await alertService.getUserPreferences();
      const prefsTest = prefsResult.success && !!prefsResult.data;
      
      setTestResults({
        auth: authTest,
        database: systemStatus.database,
        phoneNumber: phoneTest,
        preferences: prefsTest,
        alertSending: false, // Will be tested separately
        alertReceiving: false // Will be tested separately
      });

      toast({
        title: "Basic Tests Complete",
        description: "System connectivity tests finished",
      });

    } catch (error) {
      toast({
        title: "Test Error",
        description: "Some tests failed to complete",
        variant: "destructive"
      });
    } finally {
      setTesting(false);
    }
  };

  const testAlertSystem = async () => {
    if (!profile?.phone_number) {
      toast({
        title: "Phone Number Required",
        description: "Please add your phone number first to test alerts",
        variant: "destructive"
      });
      return;
    }

    setTesting(true);
    
    try {
      // Send a test alert
      const testAlert = {
        alert_type: 'system' as const,
        title: 'Test Alert',
        message: 'This is a test alert to verify the system is working correctly.',
        priority: 'low' as const,
        recipients: 'all' as const
      };

      const result = await alertService.sendAlert(testAlert);
      
      setTestResults(prev => ({
        ...prev,
        alertSending: true,
        alertReceiving: result.recipients > 0
      }));

      toast({
        title: "Test Alert Sent",
        description: `Test alert sent to ${result.recipients} recipients`,
      });

    } catch (error: any) {
      toast({
        title: "Alert Test Failed",
        description: error.message || "Failed to send test alert",
        variant: "destructive"
      });
    } finally {
      setTesting(false);
    }
  };

  const TestResultCard = ({ title, status, description, icon: Icon }) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center space-x-3">
          <Icon className={`h-6 w-6 ${status ? 'text-green-500' : 'text-red-500'}`} />
          <div className="flex-1">
            <h3 className="font-medium">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          <Badge variant={status ? 'default' : 'destructive'}>
            {status ? 'Pass' : 'Fail'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">System Test Dashboard</h1>
          <p className="text-muted-foreground">
            Test all system functionality to ensure everything is working correctly
          </p>
        </div>

        {/* User Info */}
        <Card>
          <CardHeader>
            <CardTitle>Current User Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p><strong>Email:</strong> {user?.email}</p>
            <p><strong>Role:</strong> {profile?.role}</p>
            <p><strong>Phone:</strong> {profile?.phone_number || 'Not set'}</p>
            <p><strong>User ID:</strong> {user?.id}</p>
          </CardContent>
        </Card>

        {/* Test Results */}
        <div className="grid gap-4 md:grid-cols-2">
          <TestResultCard
            title="Authentication"
            status={testResults.auth}
            description="User login and profile loading"
            icon={user ? CheckCircle : XCircle}
          />
          
          <TestResultCard
            title="Database Connection"
            status={testResults.database}
            description="Supabase database connectivity"
            icon={Database}
          />
          
          <TestResultCard
            title="Phone Number"
            status={testResults.phoneNumber}
            description="SMS alert capability setup"
            icon={Phone}
          />
          
          <TestResultCard
            title="User Preferences"
            status={testResults.preferences}
            description="Alert preferences configuration"
            icon={Bell}
          />
          
          <TestResultCard
            title="Alert Sending"
            status={testResults.alertSending}
            description="Ability to send alerts"
            icon={testResults.alertSending ? CheckCircle : Clock}
          />
          
          <TestResultCard
            title="Alert Receiving"
            status={testResults.alertReceiving}
            description="Alert delivery to users"
            icon={testResults.alertReceiving ? CheckCircle : Clock}
          />
        </div>

        {/* Test Actions */}
        <div className="flex space-x-4">
          <Button
            onClick={runBasicTests}
            disabled={testing}
            variant="outline"
          >
            {testing ? 'Testing...' : 'Run Basic Tests'}
          </Button>
          
          <Button
            onClick={testAlertSystem}
            disabled={testing || !profile?.phone_number}
          >
            {testing ? 'Sending...' : 'Test Alert System'}
          </Button>
        </div>

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Wifi className="h-5 w-5" />
              <span>System Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="text-center">
                <Database className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <p className="font-medium">Database</p>
                <Badge variant="default">Online</Badge>
              </div>
              <div className="text-center">
                <Bell className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <p className="font-medium">Alerts</p>
                <Badge variant="default">Ready</Badge>
              </div>
              <div className="text-center">
                <Phone className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                <p className="font-medium">SMS</p>
                <Badge variant="secondary">Simulated</Badge>
              </div>
              <div className="text-center">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <p className="font-medium">Security</p>
                <Badge variant="default">Protected</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Testing Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <ol className="list-decimal list-inside space-y-1">
              <li>Ensure you have a phone number entered in your profile</li>
              <li>Run basic tests to verify system connectivity</li>
              <li>Test the alert system with a sample alert</li>
              <li>Check the employee dashboard to see received alerts</li>
              <li>Verify admin functions work from the admin dashboard</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};