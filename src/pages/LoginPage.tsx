import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Shield, Eye, EyeOff, ArrowLeft, Mail, User, UserPlus } from 'lucide-react';
import skyguardLogo from '@/assets/skyguard-logo.png';

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { signIn, signUp, user, profile, isLoading: authLoading } = useAuth();
  
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
    username: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<'admin' | 'employee'>('employee');
  
  // Check for return URL from query params or state
  const returnUrl = location.state?.from || new URLSearchParams(location.search).get('return');
  const showBackButton = !!returnUrl;

  // Redirect authenticated users
  useEffect(() => {
    // Only redirect if we have both user and profile, and we're not loading
    if (user && profile && !authLoading) {
      console.log('Redirecting authenticated user:', { user: user.email, role: profile.role, hasPhone: !!profile.phone_number });
      
      // Check if user has phone number, if not redirect to settings first
      const hasPhoneNumber = profile.phone_number && profile.phone_number.trim() !== '';
      
      if (!hasPhoneNumber && !returnUrl) {
        navigate('/settings', { replace: true });
        toast({
          title: "Complete Your Profile",
          description: "Please add your phone number to receive emergency alerts.",
          duration: 5000
        });
      } else {
        const targetUrl = returnUrl || (profile.role === 'admin' ? '/admin' : '/employee');
        navigate(targetUrl, { replace: true });
      }
    }
  }, [user, profile, authLoading, navigate, returnUrl, toast]);

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

    if (credentials.password.length < 6) {
      toast({
        title: "Registration Failed",
        description: "Password must be at least 6 characters long",
        variant: "destructive"
      });
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await signUp(
        credentials.email, 
        credentials.password, 
        credentials.username,
        selectedRole
      );

      if (error) {
        toast({
          title: "Registration Failed",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Registration Successful",
          description: "Please check your email to confirm your account.",
        });
        setIsRegistering(false);
        setCredentials({ email: '', password: '', username: '' });
        setConfirmPassword('');
      }
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive"
      });
    }
    
    setIsLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await signIn(credentials.email, credentials.password);

      if (error) {
        toast({
          title: "Login Failed",
          description: error.message,
          variant: "destructive"
        });
      } else if (data.user) {
        toast({
          title: "Login Successful",
          description: "Welcome to SkyGuard Alert System",
        });
        // Navigation is handled by useEffect when user/profile state updates
      }
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive"
      });
    }
    
    setIsLoading(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

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
              <span>{isRegistering ? 'Create Account' : 'Secure Login'}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-4">
              {isRegistering && (
                <div>
                  <label className="text-sm font-medium text-foreground flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span>Username</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="Enter your username"
                    value={credentials.username}
                    onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                    className="mt-1"
                    required
                  />
                </div>
              )}
              
              <div>
                <label className="text-sm font-medium text-foreground flex items-center space-x-2">
                  <Mail className="h-4 w-4" />
                  <span>Email</span>
                </label>
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={credentials.email}
                  onChange={(e) => setCredentials(prev => ({ ...prev, email: e.target.value }))}
                  className="mt-1"
                  required
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
                    required
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
                <>
                  <div>
                    <label className="text-sm font-medium text-foreground">Confirm Password</label>
                    <Input
                      type="password"
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="mt-1"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground flex items-center space-x-2">
                      <UserPlus className="h-4 w-4" />
                      <span>Role</span>
                    </label>
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value as 'admin' | 'employee')}
                      className="mt-1 w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                    >
                      <option value="employee">Employee</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </>
              )}
              
              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90"
                disabled={isLoading}
              >
                {isLoading ? 
                  (isRegistering ? "Creating Account..." : "Signing in...") : 
                  (isRegistering ? "Create Account" : "Sign In")
                }
              </Button>
            </form>

            <div className="mt-4 text-center">
              <Button
                variant="ghost"
                onClick={() => {
                  setIsRegistering(!isRegistering);
                  setConfirmPassword('');
                  setCredentials({ email: '', password: '', username: '' });
                }}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                {isRegistering ? "Already have an account? Sign in" : "Don't have an account? Create one"}
              </Button>
            </div>

            {/* Demo Information */}
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium text-foreground mb-2">For Testing:</p>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Create an account with any email format</p>
                <p>Check your email for confirmation (if enabled)</p>
                <p>Choose 'Admin' role for admin features</p>
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