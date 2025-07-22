-- Security Fix Migration Part 2: Database Function Security Hardening

-- Ensure all database functions have proper search_path settings
-- This prevents search path confusion attacks

-- Update create_user_preferences function
CREATE OR REPLACE FUNCTION public.create_user_preferences()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.user_preferences (user_id)
  VALUES (NEW.user_id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Update update_question_status_on_answer function
CREATE OR REPLACE FUNCTION public.update_question_status_on_answer()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Update question status to 'answered' and set assigned_to if it's an official answer
  IF NEW.is_official = true THEN
    UPDATE public.qa_questions 
    SET status = 'answered',
        assigned_to = NEW.answered_by,
        updated_at = now()
    WHERE id = NEW.question_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create audit log entry for all critical security fixes applied
INSERT INTO public.audit_logs (event_type, details) 
VALUES ('security_hardening', '{"fixes": ["role_escalation_prevention", "input_validation", "function_security"], "completed_at": "2025-01-22"}'::jsonb);