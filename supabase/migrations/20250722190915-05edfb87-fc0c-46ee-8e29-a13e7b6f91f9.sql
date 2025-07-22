-- Create Q&A message board tables
CREATE TABLE public.qa_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  title TEXT NOT NULL,
  question TEXT NOT NULL,
  job_site TEXT,
  job_number TEXT,
  priority TEXT NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
  category TEXT NOT NULL DEFAULT 'general', -- 'safety', 'equipment', 'procedures', 'general'
  status TEXT NOT NULL DEFAULT 'open', -- 'open', 'answered', 'closed'
  asked_by UUID REFERENCES auth.users(id) NOT NULL,
  assigned_to UUID REFERENCES auth.users(id),
  attachments JSONB -- For storing file URLs/metadata
);

-- Create answers table
CREATE TABLE public.qa_answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  question_id UUID REFERENCES public.qa_questions(id) ON DELETE CASCADE NOT NULL,
  answer TEXT NOT NULL,
  answered_by UUID REFERENCES auth.users(id) NOT NULL,
  is_official BOOLEAN NOT NULL DEFAULT false, -- Mark official admin responses
  attachments JSONB -- For storing file URLs/metadata
);

-- Enable RLS
ALTER TABLE public.qa_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qa_answers ENABLE ROW LEVEL SECURITY;

-- Create policies for qa_questions
CREATE POLICY "Users can view all questions" 
ON public.qa_questions 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own questions" 
ON public.qa_questions 
FOR INSERT 
WITH CHECK (auth.uid() = asked_by);

CREATE POLICY "Users can update their own questions" 
ON public.qa_questions 
FOR UPDATE 
USING (auth.uid() = asked_by);

CREATE POLICY "Admins can manage all questions" 
ON public.qa_questions 
FOR ALL 
USING (get_current_user_role() = 'admin');

-- Create policies for qa_answers
CREATE POLICY "Users can view all answers" 
ON public.qa_answers 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create answers" 
ON public.qa_answers 
FOR INSERT 
WITH CHECK (auth.uid() = answered_by);

CREATE POLICY "Users can update their own answers" 
ON public.qa_answers 
FOR UPDATE 
USING (auth.uid() = answered_by);

CREATE POLICY "Admins can manage all answers" 
ON public.qa_answers 
FOR ALL 
USING (get_current_user_role() = 'admin');

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_qa_questions_updated_at
BEFORE UPDATE ON public.qa_questions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_qa_answers_updated_at
BEFORE UPDATE ON public.qa_answers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to automatically update question status when answered
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

-- Create trigger for automatic question status updates
CREATE TRIGGER update_question_on_official_answer
AFTER INSERT ON public.qa_answers
FOR EACH ROW
EXECUTE FUNCTION public.update_question_status_on_answer();