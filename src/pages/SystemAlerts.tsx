import React, { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Cloud, Building, Send, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { alertService } from '@/services/alertService';

const SystemAlerts = () => {
  const [alertType, setAlertType] = useState<string>('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<string>('');
  const [recipients, setRecipients] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const weatherTemplates = [
    { id: 'severe_weather', title: 'Severe Weather Alert', message: 'Severe weather conditions are expected in our area. Please take necessary precautions and stay safe.' },
    { id: 'storm_warning', title: 'Storm Warning', message: 'A storm warning has been issued for our region. Avoid unnecessary travel and secure any outdoor equipment.' },
    { id: 'heat_advisory', title: 'Heat Advisory', message: 'Extreme heat conditions are forecasted. Stay hydrated, seek air conditioning, and limit outdoor activities.' },
    { id: 'winter_weather', title: 'Winter Weather Advisory', message: 'Winter weather conditions including snow/ice are expected. Use caution when traveling and dress appropriately.' },
  ];

  const companyTemplates = [
    { id: 'emergency_procedures', title: 'Emergency Procedures Update', message: 'Important updates to our emergency procedures have been implemented. Please review the latest safety protocols.' },
    { id: 'facility_closure', title: 'Facility Closure Notice', message: 'Due to unforeseen circumstances, our facility will be temporarily closed. Please check for updates on reopening.' },
    { id: 'safety_reminder', title: 'Safety Reminder', message: 'This is a reminder to follow all safety protocols and report any hazards immediately to management.' },
    { id: 'system_maintenance', title: 'System Maintenance Notice', message: 'Scheduled system maintenance will occur during off-hours. Some systems may be temporarily unavailable.' },
  ];

  const handleTemplateSelect = (templateId: string) => {
    const allTemplates = [...weatherTemplates, ...companyTemplates];
    const template = allTemplates.find(t => t.id === templateId);
    if (template) {
      setTitle(template.title);
      setMessage(template.message);
    }
  };

  const handleSendAlert = async () => {
    if (!alertType || !title || !message || !priority) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await alertService.sendAlert({
        title,
        message,
        alert_type: alertType as 'weather' | 'company',
        priority: priority as 'low' | 'medium' | 'high' | 'critical',
        recipients: recipients as 'all' | 'emergency' | 'staff' | 'management',
      });

      toast({
        title: "Alert Sent Successfully",
        description: `${alertType === 'weather' ? 'Weather' : 'Company'} alert has been sent to ${recipients === 'all' ? 'all users' : 'selected recipients'}.`,
      });

      // Reset form
      setTitle('');
      setMessage('');
      setAlertType('');
      setPriority('');
      setRecipients('all');
    } catch (error) {
      toast({
        title: "Error Sending Alert",
        description: "Failed to send alert. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto p-6 space-y-8">
        <div className="flex items-center space-x-4">
          <AlertTriangle className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">System Alerts</h1>
            <p className="text-muted-foreground">Send weather updates and company alerts to users</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Alert Type Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5" />
                <span>Alert Type</span>
              </CardTitle>
              <CardDescription>Choose the type of alert to send</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                <Button
                  variant={alertType === 'weather' ? 'default' : 'outline'}
                  className="justify-start h-auto p-4"
                  onClick={() => setAlertType('weather')}
                >
                  <Cloud className="h-5 w-5 mr-3" />
                  <div className="text-left">
                    <div className="font-medium">Weather Alert</div>
                    <div className="text-sm text-muted-foreground">Weather conditions & advisories</div>
                  </div>
                </Button>
                <Button
                  variant={alertType === 'company' ? 'default' : 'outline'}
                  className="justify-start h-auto p-4"
                  onClick={() => setAlertType('company')}
                >
                  <Building className="h-5 w-5 mr-3" />
                  <div className="text-left">
                    <div className="font-medium">Company Alert</div>
                    <div className="text-sm text-muted-foreground">Company announcements & notices</div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Templates */}
          {alertType && (
            <Card>
              <CardHeader>
                <CardTitle>Quick Templates</CardTitle>
                <CardDescription>Select a pre-made template or create custom message</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {(alertType === 'weather' ? weatherTemplates : companyTemplates).map((template) => (
                    <Button
                      key={template.id}
                      variant="ghost"
                      className="w-full justify-start text-left h-auto p-3"
                      onClick={() => handleTemplateSelect(template.id)}
                    >
                      <div>
                        <div className="font-medium text-sm">{template.title}</div>
                        <div className="text-xs text-muted-foreground line-clamp-2">{template.message}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Alert Form */}
          {alertType && (
            <Card>
              <CardHeader>
                <CardTitle>Alert Details</CardTitle>
                <CardDescription>Configure your alert message and settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Alert Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter alert title..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Enter your alert message..."
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority Level</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low - Informational</SelectItem>
                      <SelectItem value="medium">Medium - Important</SelectItem>
                      <SelectItem value="high">High - Urgent</SelectItem>
                      <SelectItem value="critical">Critical - Emergency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recipients">Recipients</Label>
                  <Select value={recipients} onValueChange={setRecipients}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="employees">Employees Only</SelectItem>
                      <SelectItem value="admins">Admins Only</SelectItem>
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
          )}
        </div>

        {/* Recent Alerts Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Alert Guidelines</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">Weather Alerts</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Use for weather-related warnings and advisories</li>
                  <li>• Include specific precautions and safety measures</li>
                  <li>• Set appropriate priority based on severity</li>
                  <li>• Provide timely updates as conditions change</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Company Alerts</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Use for company announcements and notices</li>
                  <li>• Include clear action items when applicable</li>
                  <li>• Provide contact information for questions</li>
                  <li>• Use appropriate tone for the message type</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default SystemAlerts;