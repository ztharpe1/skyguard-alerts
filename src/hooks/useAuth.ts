import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface User {
  username: string;
  role: 'admin' | 'employee';
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for existing session
    const stored = sessionStorage.getItem('skyguard_user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch (error) {
        console.error('Invalid session data');
        sessionStorage.removeItem('skyguard_user');
      }
    }
    setIsLoading(false);
  }, []);

  const logout = () => {
    sessionStorage.removeItem('skyguard_user');
    setUser(null);
    navigate('/', { replace: true });
  };

  const requireAuth = (allowedRoles?: string[]) => {
    if (!user) {
      navigate('/', { 
        state: { from: window.location.pathname },
        replace: true 
      });
      return false;
    }
    
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      navigate('/unauthorized', { replace: true });
      return false;
    }
    
    return true;
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout,
    requireAuth
  };
};