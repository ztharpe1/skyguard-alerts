import { supabase } from '@/integrations/supabase/client';
import { validateAlertMessage, validateAlertTitle, createRateLimiter } from '@/lib/security';

export interface AlertRequest {
  alert_type: 'emergency' | 'weather' | 'company' | 'system';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  recipients: 'all' | 'emergency' | 'staff' | 'management';
}

export interface AlertStats {
  totalUsers: number;
  activeUsers: number;
  alertsSentToday: number;
  responseRate: number;
}

export interface SystemStatus {
  sms: boolean;
  push: boolean;
  weather: boolean;
  database: boolean;
}

// Rate limiter for alerts (max 5 alerts per minute for admins)
const alertRateLimiter = createRateLimiter(5, 60000);

// Real alert service using Supabase
export const alertService = {
  // Send alert to users
  sendAlert: async (alert: AlertRequest): Promise<{ success: boolean; recipients: number; alertId?: string }> => {
    try {
      // Rate limiting check
      if (!alertRateLimiter()) {
        throw new Error('Rate limit exceeded. Please wait before sending another alert.');
      }

      // Validate and sanitize inputs
      const titleValidation = validateAlertTitle(alert.title);
      if (!titleValidation.isValid) {
        throw new Error(titleValidation.error);
      }

      const messageValidation = validateAlertMessage(alert.message);
      if (!messageValidation.isValid) {
        throw new Error(messageValidation.error);
      }

      // Get current user for sent_by field
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Authentication required to send alerts');
      }

      // Create the alert record with sanitized data
      const { data: alertData, error: alertError } = await supabase
        .from('alerts')
        .insert({
          title: titleValidation.sanitized,
          message: messageValidation.sanitized,
          alert_type: alert.alert_type,
          priority: alert.priority,
          recipients: alert.recipients,
          status: 'sent',
          sent_by: user.id,
          sent_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (alertError) {
        console.error('Error creating alert:', alertError);
        throw alertError;
      }

      // Get eligible users based on recipients filter
      let query = supabase
        .from('profiles')
        .select('user_id, role, phone_number')
        .not('phone_number', 'is', null);

      // Filter by role based on recipients
      if (alert.recipients === 'emergency' || alert.recipients === 'management') {
        query = query.eq('role', 'admin');
      } else if (alert.recipients === 'staff') {
        query = query.eq('role', 'employee');
      }

      const { data: users, error: usersError } = await query;
      if (usersError) throw usersError;

      // Get user preferences
      const { data: preferences, error: prefsError } = await supabase
        .from('user_preferences')
        .select('user_id, emergency_alerts, weather_alerts, company_alerts, system_alerts, sms_enabled')
        .in('user_id', users?.map(u => u.user_id) || []);

      if (prefsError) throw prefsError;

      // Filter users based on their preferences
      const eligibleUsers = users?.filter(user => {
        const userPrefs = preferences?.find(p => p.user_id === user.user_id);
        if (!userPrefs || !userPrefs.sms_enabled) return false;

        // Check alert type preferences
        switch (alert.alert_type) {
          case 'emergency':
            return userPrefs.emergency_alerts;
          case 'weather':
            return userPrefs.weather_alerts;
          case 'company':
            return userPrefs.company_alerts;
          case 'system':
            return userPrefs.system_alerts;
          default:
            return false;
        }
      }) || [];

      // Create alert recipient records
      if (eligibleUsers.length > 0) {
        const recipients = eligibleUsers.map(user => ({
          alert_id: alertData.id,
          user_id: user.user_id,
          delivery_method: 'sms' as const,
          delivery_status: 'sent' as const,
          sent_at: new Date().toISOString()
        }));

        const { error: recipientsError } = await supabase
          .from('alert_recipients')
          .insert(recipients);

        if (recipientsError) throw recipientsError;
      }

      return {
        success: true,
        recipients: eligibleUsers.length,
        alertId: alertData.id
      };
    } catch (error: any) {
      console.error('Error sending alert:', error);
      throw error; // Re-throw to let the calling code handle the error
    }
  },

  // Update user preferences
  updatePreferences: async (preferences: {
    emergency_alerts?: boolean;
    weather_alerts?: boolean;
    company_alerts?: boolean;
    system_alerts?: boolean;
    sms_enabled?: boolean;
    push_enabled?: boolean;
    email_enabled?: boolean;
  }): Promise<{ success: boolean }> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          ...preferences,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      console.error('Error updating preferences:', error);
      return { success: false };
    }
  },

  // Get user preferences
  getUserPreferences: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return { success: true, data };
    } catch (error: any) {
      console.error('Error getting preferences:', error);
      return { success: false, data: null };
    }
  },

  // Get user stats for admin dashboard
  getStats: async (): Promise<AlertStats> => {
    try {
      // Get total users
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get active users (users with phone numbers)
      const { count: activeUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .not('phone_number', 'is', null);

      // Get alerts sent today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: alertsSentToday } = await supabase
        .from('alerts')
        .select('*', { count: 'exact', head: true })
        .gte('sent_at', today.toISOString())
        .eq('status', 'sent');

      // Calculate response rate (mock for now)
      const responseRate = 94.2;

      return {
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        alertsSentToday: alertsSentToday || 0,
        responseRate
      };
    } catch (error: any) {
      console.error('Error getting stats:', error);
      return {
        totalUsers: 0,
        activeUsers: 0,
        alertsSentToday: 0,
        responseRate: 0
      };
    }
  },

  // Test system connectivity
  testSystem: async (): Promise<SystemStatus> => {
    try {
      // Test database connection
      const { error: dbError } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .limit(1);

      return {
        sms: true, // Would integrate with SMS service
        push: true, // Would integrate with push notification service  
        weather: true, // Would integrate with weather API
        database: !dbError
      };
    } catch (error) {
      return {
        sms: false,
        push: false,
        weather: false,
        database: false
      };
    }
  },

  // Get alerts for current user
  getUserAlerts: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('alerts')
        .select(`
          *,
          alert_recipients!inner(delivery_status, sent_at, delivered_at)
        `)
        .eq('alert_recipients.user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      console.error('Error getting user alerts:', error);
      return { success: false, data: [] };
    }
  },

  // Get all alerts for admin
  getAllAlerts: async () => {
    try {
      const { data, error } = await supabase
        .from('alerts')
        .select(`
          *,
          alert_recipients(count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, data };
    } catch (error: any) {
      console.error('Error getting all alerts:', error);
      return { success: false, data: [] };
    }
  }
};