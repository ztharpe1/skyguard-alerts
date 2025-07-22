-- Create weather_alerts table to store weather alert configurations
CREATE TABLE public.weather_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  alert_type TEXT NOT NULL, -- 'temperature', 'storm', 'wind', 'precipitation'
  condition_operator TEXT NOT NULL, -- 'greater_than', 'less_than', 'equals'
  threshold_value NUMERIC NOT NULL,
  location_filter TEXT, -- Optional location filter (city, state, coordinates)
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  alert_title TEXT NOT NULL,
  alert_message TEXT NOT NULL
);

-- Enable RLS
ALTER TABLE public.weather_alerts ENABLE ROW LEVEL SECURITY;

-- Create policies for weather alerts
CREATE POLICY "Admins can manage weather alerts" 
ON public.weather_alerts 
FOR ALL 
USING (get_current_user_role() = 'admin');

CREATE POLICY "Users can view weather alerts" 
ON public.weather_alerts 
FOR SELECT 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_weather_alerts_updated_at
BEFORE UPDATE ON public.weather_alerts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create weather_alert_logs table to track sent weather alerts
CREATE TABLE public.weather_alert_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  weather_alert_id UUID REFERENCES public.weather_alerts(id),
  alert_id UUID REFERENCES public.alerts(id),
  weather_data JSONB NOT NULL, -- Store the weather conditions that triggered the alert
  affected_users_count INTEGER NOT NULL DEFAULT 0
);

-- Enable RLS for weather alert logs
ALTER TABLE public.weather_alert_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for weather alert logs
CREATE POLICY "Admins can view weather alert logs" 
ON public.weather_alert_logs 
FOR SELECT 
USING (get_current_user_role() = 'admin');