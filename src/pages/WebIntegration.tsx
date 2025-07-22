import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Code, ExternalLink, Globe, Shield } from 'lucide-react';

export const WebIntegration = () => {
  const embedCode = `<!-- SkyGuard Alert Dashboard Embed -->
<iframe 
  src="${window.location.origin}/employee" 
  width="100%" 
  height="600"
  frameborder="0"
  style="border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"
  title="SkyGuard Employee Dashboard">
</iframe>`;

  const ssoExample = `<!-- SSO Integration Example -->
<a href="${window.location.origin}/?return=/employee&token=USER_TOKEN" 
   class="btn btn-primary">
  Access Alert Dashboard
</a>`;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Web Integration Guide</h1>
        <p className="text-muted-foreground">Integrate SkyGuard Alert System with your company website</p>
      </div>

      {/* Quick Access Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-primary" />
              <span>Employee Dashboard</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Direct link for employees to access their alert dashboard
            </p>
            <Button asChild className="w-full">
              <a href="/employee" target="_blank">
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Employee Dashboard
              </a>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-accent" />
              <span>Admin Dashboard</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Administrative access for alert management
            </p>
            <Button asChild className="w-full" variant="outline">
              <a href="/admin" target="_blank">
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Admin Dashboard
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Integration Methods */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Code className="h-5 w-5 text-primary" />
              <span>Iframe Embed</span>
              <Badge variant="secondary">Recommended</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Embed the alert dashboard directly into your company website
            </p>
            <div className="bg-muted p-4 rounded-lg">
              <pre className="text-xs overflow-x-auto">
                <code>{embedCode}</code>
              </pre>
            </div>
            <Button 
              onClick={() => navigator.clipboard.writeText(embedCode)}
              className="mt-4"
              variant="outline"
              size="sm"
            >
              Copy Embed Code
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Globe className="h-5 w-5 text-accent" />
              <span>Direct Link Integration</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Add direct links to your website navigation or employee portal
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between p-2 bg-muted rounded">
                <span>Employee Dashboard:</span>
                <code className="text-xs">{window.location.origin}/employee</code>
              </div>
              <div className="flex items-center justify-between p-2 bg-muted rounded">
                <span>Admin Dashboard:</span>
                <code className="text-xs">{window.location.origin}/admin</code>
              </div>
              <div className="flex items-center justify-between p-2 bg-muted rounded">
                <span>Login Page:</span>
                <code className="text-xs">{window.location.origin}/</code>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-warning" />
              <span>SSO Integration</span>
              <Badge variant="outline">Advanced</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Single Sign-On integration for seamless user experience
            </p>
            <div className="bg-muted p-4 rounded-lg">
              <pre className="text-xs overflow-x-auto">
                <code>{ssoExample}</code>
              </pre>
            </div>
            <div className="mt-4 p-4 bg-warning/10 border border-warning/20 rounded-lg">
              <p className="text-sm text-warning">
                <strong>Note:</strong> SSO implementation requires backend integration with your authentication system.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Benefits */}
      <Card>
        <CardHeader>
          <CardTitle>Integration Benefits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">For Employees:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Single access point from company portal</li>
                <li>• Consistent branding experience</li>
                <li>• No separate login required (with SSO)</li>
                <li>• Mobile-responsive design</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">For Administrators:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Centralized alert management</li>
                <li>• Real-time monitoring capabilities</li>
                <li>• User engagement analytics</li>
                <li>• Seamless workflow integration</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};