import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Bell, 
  Shield, 
  Users, 
  Settings, 
  LogOut,
  AlertTriangle,
  Cloud,
  Building2,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import skyguardLogo from '@/assets/skyguard-logo.png';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, profile, user } = useAuth();

  // Default to loading state if no profile
  if (!profile || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const userRole = profile.role;
  const userName = profile.username || user.email || 'User';

  const navigationItems = [
    { 
      path: '/employee', 
      label: 'Dashboard', 
      icon: Shield, 
      roles: ['employee', 'admin'] 
    },
    { 
      path: '/alerts', 
      label: 'My Alerts', 
      icon: Bell, 
      roles: ['employee', 'admin'] 
    },
    { 
      path: '/admin', 
      label: 'Admin Panel', 
      icon: Users, 
      roles: ['admin'] 
    },
    { 
      path: '/admin/users', 
      label: 'Manage Users', 
      icon: Users, 
      roles: ['admin'] 
    },
    { 
      path: '/admin/send', 
      label: 'Send Alerts', 
      icon: AlertTriangle, 
      roles: ['admin'] 
    },
    { 
      path: '/settings', 
      label: 'Settings', 
      icon: Settings, 
      roles: ['employee', 'admin'] 
    }
  ];

  const filteredNavigation = navigationItems.filter(item => 
    item.roles.includes(userRole)
  );

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <img 
                src={skyguardLogo} 
                alt="SkyGuard" 
                className="h-10 w-auto"
              />
              <div>
                <h1 className="text-xl font-bold text-primary">SkyGuard</h1>
                <p className="text-xs text-muted-foreground">Alert System</p>
              </div>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open('https://yourcompany.com', '_blank')}
                className="text-muted-foreground hover:text-foreground"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Company Site
              </Button>
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">{userName}</p>
                <p className="text-xs text-muted-foreground capitalize">{userRole}</p>
              </div>
              <Avatar>
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {userName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={logout}
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-card border-r border-border min-h-[calc(100vh-4rem)]">
          <nav className="p-4 space-y-2">
            {filteredNavigation.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.path}
                  variant={isActive(item.path) ? "default" : "ghost"}
                  className={`w-full justify-start ${
                    isActive(item.path) 
                      ? "bg-primary text-primary-foreground" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => navigate(item.path)}
                >
                  <Icon className="h-4 w-4 mr-3" />
                  {item.label}
                </Button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};