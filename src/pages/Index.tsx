import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Bell, Users, Smartphone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import skyguardLogo from '@/assets/skyguard-logo.png';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-background">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src={skyguardLogo} alt="SkyGuard" className="h-8 w-8" />
            <h1 className="text-xl font-bold">SkyGuard Alert System</h1>
          </div>
          <Button onClick={() => navigate('/auth')}>
            Sign In
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Stay Alert, Stay Safe
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Professional emergency alert system designed to keep your organization informed and protected during critical situations.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" onClick={() => navigate('/auth')}>
              <Shield className="mr-2 h-5 w-5" />
              Access Dashboard
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/setup')}>
              Demo Setup
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 mb-16">
          <Card>
            <CardHeader className="text-center">
              <Bell className="h-12 w-12 mx-auto mb-4 text-primary" />
              <CardTitle>Instant Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground">
                Send critical alerts instantly to all team members via multiple channels
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <Smartphone className="h-12 w-12 mx-auto mb-4 text-primary" />
              <CardTitle>SMS Delivery</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground">
                Reliable SMS delivery ensures alerts reach everyone, even offline
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-primary" />
              <CardTitle>Team Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground">
                Organize users, assign roles, and manage permissions efficiently
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <Shield className="h-12 w-12 mx-auto mb-4 text-primary" />
              <CardTitle>Secure Platform</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground">
                Enterprise-grade security with role-based access control
              </p>
            </CardContent>
          </Card>
        </div>

        {/* System Status */}
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-center">System Status</CardTitle>
          </CardHeader>
          <CardContent>
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
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t mt-16">
        <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">
          <p>&copy; 2024 SkyGuard Alert System. Professional emergency communications.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
