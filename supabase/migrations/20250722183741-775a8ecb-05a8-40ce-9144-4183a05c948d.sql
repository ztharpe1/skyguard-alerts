-- Security Fix Migration Part 2: DELETE Policies and Rate Limiting

-- 1. Add missing DELETE policies to all tables

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

-- 2. Create rate limiting table for server-side rate limiting
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

-- 3. Create function for server-side rate limiting
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