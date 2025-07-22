import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { PhoneNumberForm } from '@/components/PhoneNumberForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { alertService } from '@/services/alertService';
import { 
  Bell, 
  Phone, 
  Mail, 
  MessageSquare,
  AlertTriangle,
  Cloud,
  Building2,
  Settings as SettingsIcon,
  Save
} from 'lucide-react';

export const Settings = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState({
    emergency_alerts: true,
    weather_alerts: true,
    company_alerts: true,
    system_alerts: true,
    sms_enabled: true,
    push_enabled: true,
    email_enabled: true,
  });

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const result = await alertService.getUserPreferences();
      if (result.success && result.data) {
        setPreferences(result.data);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePreferenceChange = (key: string, value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      const result = await alertService.updatePreferences(preferences);
      if (result.success) {
        toast({
          title: "Settings Saved",
          description: "Your notification preferences have been updated.",
        });
      } else {
        throw new Error('Failed to save preferences');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save preferences.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-muted-foreground">Loading settings...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center space-x-2">
            <SettingsIcon className="h-8 w-8" />
            <span>Settings</span>
          </h1>
          <p className="text-muted-foreground">
            Manage your alert preferences and contact information
          </p>
        </div>

        {/* Phone Number Setup */}
        <PhoneNumberForm />

        {/* Alert Type Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <span>Alert Type Preferences</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <div>
                  <p className="font-medium">Emergency Alerts</p>
                  <p className="text-sm text-muted-foreground">Critical safety notifications</p>
                </div>
              </div>
              <Switch
                checked={preferences.emergency_alerts}
                onCheckedChange={(checked) => handlePreferenceChange('emergency_alerts', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Cloud className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="font-medium">Weather Alerts</p>
                  <p className="text-sm text-muted-foreground">Weather warnings and updates</p>
                </div>
              </div>
              <Switch
                checked={preferences.weather_alerts}
                onCheckedChange={(checked) => handlePreferenceChange('weather_alerts', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Building2 className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium">Company Alerts</p>
                  <p className="text-sm text-muted-foreground">Company announcements and updates</p>
                </div>
              </div>
              <Switch
                checked={preferences.company_alerts}
                onCheckedChange={(checked) => handlePreferenceChange('company_alerts', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <SettingsIcon className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="font-medium">System Alerts</p>
                  <p className="text-sm text-muted-foreground">System maintenance and updates</p>
                </div>
              </div>
              <Switch
                checked={preferences.system_alerts}
                onCheckedChange={(checked) => handlePreferenceChange('system_alerts', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Delivery Method Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5" />
              <span>Delivery Methods</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium">SMS Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive alerts via text message</p>
                </div>
              </div>
              <Switch
                checked={preferences.sms_enabled}
                onCheckedChange={(checked) => handlePreferenceChange('sms_enabled', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Bell className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="font-medium">Push Notifications</p>
                  <p className="text-sm text-muted-foreground">Browser push notifications</p>
                </div>
              </div>
              <Switch
                checked={preferences.push_enabled}
                onCheckedChange={(checked) => handlePreferenceChange('push_enabled', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive alerts via email</p>
                </div>
              </div>
              <Switch
                checked={preferences.email_enabled}
                onCheckedChange={(checked) => handlePreferenceChange('email_enabled', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={savePreferences} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Preferences'}
          </Button>
        </div>

        {/* Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>Important Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              • Emergency alerts cannot be disabled for safety reasons
            </p>
            <p className="text-sm text-muted-foreground">
              • You must have a phone number to receive SMS alerts
            </p>
            <p className="text-sm text-muted-foreground">
              • Changes take effect immediately after saving
            </p>
            <p className="text-sm text-muted-foreground">
              • Contact your administrator if you need assistance
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};