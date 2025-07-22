-- Security Fix Migration: Role Selection, DELETE Policies, and Audit Logging

-- 1. Create audit_logs table for server-side audit logging
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view all audit logs" 
ON public.audit_logs 
FOR SELECT 
USING (get_current_user_role() = 'admin');

-- System can insert audit logs (for server-side logging)
CREATE POLICY "System can insert audit logs" 
ON public.audit_logs 
FOR INSERT 
WITH CHECK (true);

-- 2. Fix role selection during registration - ensure new users always get 'employee' role
-- Update the handle_new_user function to enforce employee role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username, role)
  VALUES (new.id, new.email, 'employee');
  RETURN new;
END;
$$;

-- 3. Add missing DELETE policies to all tables

-- Profiles DELETE policies
CREATE POLICY "Admins can delete profiles" 
ON public.profiles 
FOR DELETE 
USING (get_current_user_role() = 'admin');

-- User preferences DELETE policies  
CREATE POLICY "Admins can delete user preferences" 
ON public.user_preferences 
FOR DELETE 
USING (get_current_user_role() = 'admin');

CREATE POLICY "Users can delete their own preferences" 
ON public.user_preferences 
FOR DELETE 
USING (user_id = auth.uid());

-- Alerts DELETE policies
CREATE POLICY "Admins can delete alerts" 
ON public.alerts 
FOR DELETE 
USING (get_current_user_role() = 'admin');

-- Alert recipients DELETE policies
CREATE POLICY "Admins can delete alert recipients" 
ON public.alert_recipients 
FOR DELETE 
USING (get_current_user_role() = 'admin');

-- 4. Add policy to prevent role escalation during profile updates
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id AND 
  (OLD.role = NEW.role OR get_current_user_role() = 'admin')
);

-- 5. Create function for server-side audit logging
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_event_type TEXT,
  p_details JSONB DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO public.audit_logs (event_type, user_id, details, ip_address, user_agent)
  VALUES (p_event_type, auth.uid(), p_details, p_ip_address, p_user_agent)
  RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;

-- 6. Create rate limiting table for server-side rate limiting
CREATE TABLE public.rate_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  operation TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address INET,
  attempt_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on rate_limits
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Only system can manage rate limits
CREATE POLICY "System can manage rate limits" 
ON public.rate_limits 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Add trigger for rate_limits updated_at
CREATE TRIGGER update_rate_limits_updated_at
BEFORE UPDATE ON public.rate_limits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Create function for server-side rate limiting
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_operation TEXT,
  p_max_attempts INTEGER DEFAULT 5,
  p_window_minutes INTEGER DEFAULT 1
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_user_id UUID := auth.uid();
  current_ip INET := inet_client_addr();
  window_start TIMESTAMP WITH TIME ZONE := now() - (p_window_minutes || ' minutes')::INTERVAL;
  current_attempts INTEGER := 0;
BEGIN
  -- Clean up old rate limit entries
  DELETE FROM public.rate_limits 
  WHERE window_start < window_start;
  
  -- Check current attempts for this user/operation
  SELECT COALESCE(SUM(attempt_count), 0) INTO current_attempts
  FROM public.rate_limits
  WHERE operation = p_operation
    AND (user_id = current_user_id OR ip_address = current_ip)
    AND window_start >= window_start;
  
  -- If under limit, increment counter
  IF current_attempts < p_max_attempts THEN
    INSERT INTO public.rate_limits (operation, user_id, ip_address, attempt_count, window_start)
    VALUES (p_operation, current_user_id, current_ip, 1, now())
    ON CONFLICT (operation, user_id, ip_address, window_start) 
    DO UPDATE SET 
      attempt_count = rate_limits.attempt_count + 1,
      updated_at = now();
    
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$;