-- Create alerts table
CREATE TABLE public.alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('emergency', 'weather', 'company', 'system')),
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  recipients TEXT NOT NULL CHECK (recipients IN ('all', 'emergency', 'staff', 'management')),
  sent_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sent_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'delivered', 'failed'))
);

-- Create alert_recipients table to track who received each alert
CREATE TABLE public.alert_recipients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_id UUID NOT NULL REFERENCES public.alerts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  delivery_method TEXT NOT NULL CHECK (delivery_method IN ('sms', 'push', 'email')),
  delivery_status TEXT NOT NULL DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'sent', 'delivered', 'failed')),
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(alert_id, user_id, delivery_method)
);

-- Create user_preferences table for alert preferences
CREATE TABLE public.user_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  emergency_alerts BOOLEAN NOT NULL DEFAULT true,
  weather_alerts BOOLEAN NOT NULL DEFAULT true,
  company_alerts BOOLEAN NOT NULL DEFAULT true,
  system_alerts BOOLEAN NOT NULL DEFAULT true,
  sms_enabled BOOLEAN NOT NULL DEFAULT true,
  push_enabled BOOLEAN NOT NULL DEFAULT true,
  email_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for alerts
CREATE POLICY "Admins can view all alerts" 
ON public.alerts 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = 'admin'
));

CREATE POLICY "Users can view alerts sent to them" 
ON public.alerts 
FOR SELECT 
USING (id IN (
  SELECT alert_id FROM public.alert_recipients 
  WHERE user_id = auth.uid()
));

CREATE POLICY "Admins can create alerts" 
ON public.alerts 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = 'admin'
));

CREATE POLICY "Admins can update alerts" 
ON public.alerts 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = 'admin'
));

-- RLS Policies for alert_recipients
CREATE POLICY "Users can view their own alert receipts" 
ON public.alert_recipients 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all alert receipts" 
ON public.alert_recipients 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = 'admin'
));

CREATE POLICY "System can insert alert receipts" 
ON public.alert_recipients 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "System can update alert receipts" 
ON public.alert_recipients 
FOR UPDATE 
USING (true);

-- RLS Policies for user_preferences
CREATE POLICY "Users can view their own preferences" 
ON public.user_preferences 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own preferences" 
ON public.user_preferences 
FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own preferences" 
ON public.user_preferences 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all preferences" 
ON public.user_preferences 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = 'admin'
));

-- Create triggers for timestamps
CREATE TRIGGER update_alerts_updated_at
BEFORE UPDATE ON public.alerts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
BEFORE UPDATE ON public.user_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create default preferences for new users
CREATE OR REPLACE FUNCTION public.create_user_preferences()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_preferences (user_id)
  VALUES (NEW.user_id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Trigger to create preferences when profile is created
CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_user_preferences();