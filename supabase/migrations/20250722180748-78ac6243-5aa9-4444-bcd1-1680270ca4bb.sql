-- Create a new migration that updates the alerts table RLS policies
-- to ensure alerts can be sent properly by admin users

-- First, let's create a function to check admin status without circular references
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin'
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Drop existing policies on the alerts table
DROP POLICY IF EXISTS "Admins can create alerts" ON public.alerts;
DROP POLICY IF EXISTS "System can create automated alerts" ON public.alerts;

-- Create a clearer, more permissive policy for admins to send alerts
CREATE POLICY "Admins can create alerts" ON public.alerts
FOR INSERT 
WITH CHECK (
  is_admin()
);

-- Ensure user preferences exist for all users with profiles
INSERT INTO public.user_preferences (user_id, emergency_alerts, weather_alerts, company_alerts, system_alerts, sms_enabled)
SELECT user_id, true, true, true, true, true
FROM profiles
WHERE NOT EXISTS (
  SELECT 1 FROM user_preferences WHERE user_preferences.user_id = profiles.user_id
);