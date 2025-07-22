import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Shield, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import skyguardLogo from '@/assets/skyguard-logo.png';

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Check for return URL from query params or state
  const returnUrl = location.state?.from || new URLSearchParams(location.search).get('return');
  const showBackButton = !!returnUrl;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (credentials.password !== confirmPassword) {
      toast({
        title: "Registration Failed",
        description: "Passwords do not match",
        variant: "destructive"
      });
      setIsLoading(false);
      return;
    }

    // Get existing users
    const existingUsers = JSON.parse(localStorage.getItem('skyguard_users') || '[]');
    
    // Check if username already exists
    if (existingUsers.find((user: any) => user.username === credentials.username)) {
      toast({
        title: "Registration Failed",
        description: "Username already exists",
        variant: "destructive"
      });
      setIsLoading(false);
      return;
    }

    setTimeout(() => {
      // Create new user
      const userRole = credentials.username.toLowerCase().includes('admin') ? 'admin' : 'employee';
      const newUser = { 
        username: credentials.username, 
        password: credentials.password,
        role: userRole 
      };
      
      // Save to localStorage
      existingUsers.push(newUser);
      localStorage.setItem('skyguard_users', JSON.stringify(existingUsers));
      
      toast({
        title: "Registration Successful",
        description: "Account created successfully. You can now sign in.",
      });
      
      setIsRegistering(false);
      setConfirmPassword('');
      setIsLoading(false);
    }, 1000);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      if (credentials.username && credentials.password) {
        // Check against registered users first
        const existingUsers = JSON.parse(localStorage.getItem('skyguard_users') || '[]');
        const user = existingUsers.find((u: any) => 
          u.username === credentials.username && u.password === credentials.password
        );
        
        let userRole = 'employee';
        if (user) {
          userRole = user.role;
        } else if (credentials.username.toLowerCase().includes('admin')) {
          userRole = 'admin';
        }
        
        const userData = { username: credentials.username, role: userRole };
        sessionStorage.setItem('skyguard_user', JSON.stringify(userData));
        
        // Navigate to return URL or default dashboard
        const targetUrl = returnUrl || (userRole === 'admin' ? '/admin' : '/employee');
        navigate(targetUrl, { replace: true });
        
        toast({
          title: "Login Successful",
          description: `Welcome to the ${userRole === 'admin' ? 'Admin' : 'Employee'} Dashboard`,
        });
      } else {
        toast({
          title: "Login Failed",
          description: "Please enter valid credentials",
          variant: "destructive"
        });
      }
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back Button for Web Integration */}
        {showBackButton && (
          <Button
            variant="ghost"
            onClick={() => window.history.back()}
            className="mb-4 flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Company Site</span>
          </Button>
        )}
        
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <img 
              src={skyguardLogo} 
              alt="SkyGuard" 
              className="h-20 w-auto"
            />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">SkyGuard Alert System</h1>
          <p className="text-muted-foreground">Secure access to emergency communications</p>
        </div>

        {/* Login Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-center space-x-2">
              <Shield className="h-5 w-5 text-primary" />
              <span>Secure Login</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Username</label>
                <Input
                  type="text"
                  placeholder="Enter your username"
                  value={credentials.username}
                  onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                  className="mt-1"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-foreground">Password</label>
                <div className="relative mt-1">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={credentials.password}
                    onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              {isRegistering && (
                <div>
                  <label className="text-sm font-medium text-foreground">Confirm Password</label>
                  <Input
                    type="password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="mt-1"
                  />
                </div>
              )}
              
              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90"
                disabled={isLoading}
              >
                {isLoading ? (isRegistering ? "Creating Account..." : "Signing in...") : (isRegistering ? "Create Account" : "Sign In")}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <Button
                variant="ghost"
                onClick={() => {
                  setIsRegistering(!isRegistering);
                  setConfirmPassword('');
                  setCredentials({ username: '', password: '' });
                }}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                {isRegistering ? "Already have an account? Sign in" : "Don't have an account? Create one"}
              </Button>
            </div>

            {/* Demo Credentials */}
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium text-foreground mb-2">Demo Credentials:</p>
              <div className="text-xs text-muted-foreground space-y-1">
                <p><strong>Employee:</strong> employee / password</p>
                <p><strong>Admin:</strong> admin / password</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-xs text-muted-foreground">
            SkyGuard Emergency Alert System © 2024
          </p>
        </div>
      </div>
    </div>
  );
};