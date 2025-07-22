-- Security Fix Migration Part 1: Critical Role Escalation Prevention

-- Fix the profiles UPDATE policy to prevent users from changing their own role
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create a more secure update policy that prevents role escalation
CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id AND 
  (OLD.role = NEW.role OR get_current_user_role() = 'admin')
);

-- Add explicit policy for admins to update any profile including roles
CREATE POLICY "Admins can update any profile" 
ON public.profiles 
FOR UPDATE 
USING (get_current_user_role() = 'admin')
WITH CHECK (get_current_user_role() = 'admin');