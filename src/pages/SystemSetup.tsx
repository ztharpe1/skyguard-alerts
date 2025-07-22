import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Copy, Users, Shield, TestTube, Phone } from 'lucide-react';

export const SystemSetup = () => {
  const { toast } = useToast();
  const [newUser, setNewUser] = useState({
    email: '',
    password: 'Demo123!',
    username: '',
    role: 'employee' as 'admin' | 'employee'
  });
  const [isCreating, setIsCreating] = useState(false);

  const demoUsers = [
    {
      email: 'admin@demo.com',
      password: 'Admin123!',
      role: 'admin',
      description: 'Full admin access - can send alerts and manage users'
    },
    {
      email: 'employee@demo.com', 
      password: 'Employee123!',
      role: 'employee',
      description: 'Employee access - can receive alerts and manage preferences'
    }
  ];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: `${text} copied to clipboard`
    });
  };

  const createDemoUser = async () => {
    if (!newUser.email || !newUser.username) {
      toast({
        title: "Missing Information",
        description: "Please fill in email and username",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            username: newUser.username,
            role: newUser.role
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        // Update the profile with the correct role
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ 
            username: newUser.username, 
            role: newUser.role,
            phone_number: '+1234567890' // Demo phone number
          })
          .eq('user_id', data.user.id);

        if (profileError) {
          console.error('Profile update error:', profileError);
        }
      }

      toast({
        title: "Demo User Created",
        description: `${newUser.role} user created successfully with email: ${newUser.email}`,
      });

      // Reset form
      setNewUser({
        email: '',
        password: 'Demo123!',
        username: '',
        role: 'employee'
      });

    } catch (error: any) {
      toast({
        title: "Error Creating User",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TestTube className="h-6 w-6 text-primary" />
              <span>SkyGuard Alert System - Demo Setup</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-muted-foreground">
                Welcome to SkyGuard Alert System! Use the demo credentials below or create new users to test the system.
              </p>
            </div>

            {/* Demo Users */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Demo User Accounts</span>
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                {demoUsers.map((user, index) => (
                  <Card key={index}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                          {user.role === 'admin' ? (
                            <Shield className="h-3 w-3 mr-1" />
                          ) : (
                            <Users className="h-3 w-3 mr-1" />
                          )}
                          {user.role.toUpperCase()}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground">{user.description}</p>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Email:</span>
                          <div className="flex items-center space-x-2">
                            <code className="text-xs bg-muted px-2 py-1 rounded">{user.email}</code>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => copyToClipboard(user.email)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Password:</span>
                          <div className="flex items-center space-x-2">
                            <code className="text-xs bg-muted px-2 py-1 rounded">{user.password}</code>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => copyToClipboard(user.password)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Create New Demo User */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Create New Demo User</h3>
              <Card>
                <CardContent className="pt-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium">Email</label>
                      <Input
                        type="email"
                        placeholder="user@example.com"
                        value={newUser.email}
                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Username</label>
                      <Input
                        placeholder="Demo User"
                        value={newUser.username}
                        onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Password</label>
                      <Input
                        value={newUser.password}
                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Role</label>
                      <select 
                        className="w-full p-2 border rounded-md"
                        value={newUser.role}
                        onChange={(e) => setNewUser({ ...newUser, role: e.target.value as 'admin' | 'employee' })}
                      >
                        <option value="employee">Employee</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  </div>
                  <Button 
                    onClick={createDemoUser}
                    disabled={isCreating}
                    className="w-full mt-4"
                  >
                    {isCreating ? 'Creating...' : 'Create Demo User'}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Quick Start Guide */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Start Guide</h3>
              <Card>
                <CardContent className="pt-6">
                  <ol className="space-y-3 text-sm">
                    <li className="flex items-start space-x-2">
                      <Badge className="mt-0.5">1</Badge>
                      <div>
                        <strong>Login:</strong> Use one of the demo accounts above or create a new user
                      </div>
                    </li>
                    <li className="flex items-start space-x-2">
                      <Badge className="mt-0.5">2</Badge>
                      <div>
                        <strong>Add Phone Number:</strong> Go to Settings to add your phone number for SMS alerts
                      </div>
                    </li>
                    <li className="flex items-start space-x-2">
                      <Badge className="mt-0.5">3</Badge>
                      <div>
                        <strong>Test Alerts:</strong> Admin users can send test alerts from the Admin Dashboard
                      </div>
                    </li>
                    <li className="flex items-start space-x-2">
                      <Badge className="mt-0.5">4</Badge>
                      <div>
                        <strong>Configure Preferences:</strong> Set which types of alerts you want to receive
                      </div>
                    </li>
                  </ol>
                </CardContent>
              </Card>
            </div>

            {/* Navigation */}
            <div className="text-center">
              <Button onClick={() => window.location.href = '/auth'} size="lg">
                <Shield className="mr-2 h-5 w-5" />
                Go to Login Page
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};