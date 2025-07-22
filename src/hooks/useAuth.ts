import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SecurityMonitor } from '@/lib/security-config';

interface Profile {
  id: string;
  user_id: string;
  username: string | null;
  role: 'admin' | 'employee';
  phone_number: string | null;
  created_at: string;
  updated_at: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Defer profile fetching to prevent deadlocks
          setTimeout(async () => {
            if (!mounted) return;
            
            try {
              const { data: profileData, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', session.user.id)
                .single();
              
              if (error) {
                console.error('Error fetching profile:', error);
                if (mounted) {
                  setProfile(null);
                  setIsLoading(false);
                }
                return;
              }
              
              if (mounted) {
                setProfile(profileData as Profile);
                setIsLoading(false);
              }
            } catch (error) {
              console.error('Error in profile fetch:', error);
              if (mounted) {
                setProfile(null);
                setIsLoading(false);
              }
            }
          }, 100);
        } else {
          if (mounted) {
            setProfile(null);
            setIsLoading(false);
          }
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      
      if (!session) {
        setSession(null);
        setUser(null);
        setProfile(null);
        setIsLoading(false);
      }
      // If there's a session, let the auth state change handler deal with it
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, username: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            username
            // Role is now enforced server-side as 'employee'
          }
        }
      });

      if (error) {
        SecurityMonitor.monitorFailedAuth(email, error.message);
        SecurityMonitor.incrementFailedAttempts(email);
        return { data: null, error };
      }

      if (data.user) {
        SecurityMonitor.clearFailedAttempts(email);
        // Profile will be created automatically by the trigger with 'employee' role
        // Update username only (role is enforced server-side)
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ username })
          .eq('user_id', data.user.id);

        if (profileError) {
          console.error('Error updating profile username:', profileError);
        }
      }

      return { data, error: null };
    } catch (error: any) {
      SecurityMonitor.monitorFailedAuth(email, error.message);
      SecurityMonitor.incrementFailedAttempts(email);
      return { data: null, error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      // Clear failed attempts on successful login
      SecurityMonitor.clearFailedAttempts(email);
      
      return { data, error: null };
    } catch (error: any) {
      // Monitor failed authentication
      await SecurityMonitor.monitorFailedAuth(email, error.message);
      SecurityMonitor.incrementFailedAttempts(email);
      
      return { data: null, error };
    }
  };

  const logout = async () => {
    try {
      // Clean up auth state
      const cleanupAuthState = () => {
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
            localStorage.removeItem(key);
          }
        });
        Object.keys(sessionStorage || {}).forEach((key) => {
          if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
            sessionStorage.removeItem(key);
          }
        });
      };

      cleanupAuthState();
      
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        // Continue even if this fails
      }
      
      setUser(null);
      setSession(null);
      setProfile(null);
      
      // Force page reload for clean state
      window.location.href = '/';
    } catch (error) {
      console.error('Error during logout:', error);
      // Force reload even if logout fails
      window.location.href = '/';
    }
  };

  const requireAuth = (allowedRoles?: string[]) => {
    if (!user || !profile) {
      navigate('/', { 
        state: { from: window.location.pathname },
        replace: true 
      });
      return false;
    }
    
    if (allowedRoles && !allowedRoles.includes(profile.role)) {
      navigate('/unauthorized', { replace: true });
      return false;
    }
    
    return true;
  };

  return {
    user,
    session,
    profile,
    isLoading,
    isAuthenticated: !!user && !!profile,
    signUp,
    signIn,
    logout,
    requireAuth
  };
};