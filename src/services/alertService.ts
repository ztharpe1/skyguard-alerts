// Mock alert service for testing - replace with actual backend integration
export interface AlertRequest {
  type: 'emergency' | 'weather' | 'company' | 'system';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  recipients: string;
}

export interface User {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: 'employee' | 'admin';
  preferences: {
    emergency: boolean;
    weather: boolean;
    company: boolean;
    sms: boolean;
    push: boolean;
  };
  isActive: boolean;
}

// Mock data for testing
const mockUsers: User[] = [
  {
    id: '1',
    name: 'John Smith',
    phone: '+1234567890',
    email: 'john.smith@skyguard.com',
    role: 'employee',
    preferences: {
      emergency: true,
      weather: true,
      company: true,
      sms: true,
      push: true
    },
    isActive: true
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    phone: '+1234567891',
    email: 'sarah.johnson@skyguard.com',
    role: 'admin',
    preferences: {
      emergency: true,
      weather: true,
      company: true,
      sms: true,
      push: true
    },
    isActive: true
  }
];

// Mock alert service functions
export const alertService = {
  // Send alert to users
  sendAlert: async (alert: AlertRequest): Promise<{ success: boolean; recipients: number }> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Calculate recipients based on preferences
    const eligibleUsers = mockUsers.filter(user => {
      if (alert.recipients === 'all') return user.isActive;
      if (alert.recipients === 'emergency') return user.role === 'admin' && user.isActive;
      if (alert.recipients === 'staff') return user.role === 'employee' && user.isActive;
      if (alert.recipients === 'management') return user.role === 'admin' && user.isActive;
      return false;
    }).filter(user => user.preferences[alert.type]);

    console.log(`Sending ${alert.type} alert to ${eligibleUsers.length} users:`, alert);
    
    return {
      success: true,
      recipients: eligibleUsers.length
    };
  },

  // Register user for notifications
  registerUser: async (user: Omit<User, 'id'>): Promise<{ success: boolean; id: string }> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newUser = {
      ...user,
      id: Date.now().toString()
    };
    
    mockUsers.push(newUser);
    console.log('User registered:', newUser);
    
    return {
      success: true,
      id: newUser.id
    };
  },

  // Update user preferences
  updatePreferences: async (userId: string, preferences: User['preferences']): Promise<{ success: boolean }> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const userIndex = mockUsers.findIndex(u => u.id === userId);
    if (userIndex >= 0) {
      mockUsers[userIndex].preferences = preferences;
      console.log('Preferences updated for user:', userId, preferences);
    }
    
    return { success: true };
  },

  // Get user stats
  getStats: async (): Promise<{
    totalUsers: number;
    activeUsers: number;
    alertsSentToday: number;
    responseRate: number;
  }> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return {
      totalUsers: mockUsers.length,
      activeUsers: mockUsers.filter(u => u.isActive).length,
      alertsSentToday: Math.floor(Math.random() * 50) + 10,
      responseRate: 94.2
    };
  },

  // Test system connectivity
  testSystem: async (): Promise<{
    sms: boolean;
    push: boolean;
    weather: boolean;
    database: boolean;
  }> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      sms: true,
      push: true,
      weather: true,
      database: true
    };
  }
};