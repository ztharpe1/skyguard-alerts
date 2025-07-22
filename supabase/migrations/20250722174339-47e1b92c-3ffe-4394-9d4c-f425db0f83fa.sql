-- Update the alerts table RLS policies to handle sent_by field properly
-- and allow system to send alerts

-- First, update the insert policy to ensure sent_by is set
DROP POLICY IF EXISTS "Admins can create alerts" ON public.alerts;

CREATE POLICY "Admins can create alerts" ON public.alerts
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin'
  )
  AND sent_by = auth.uid()
);

-- Add a policy for system alerts (when sent_by is null, like for automated alerts)
CREATE POLICY "System can create automated alerts" ON public.alerts
FOR INSERT 
WITH CHECK (
  sent_by IS NULL 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role = 'admin'
  )
);