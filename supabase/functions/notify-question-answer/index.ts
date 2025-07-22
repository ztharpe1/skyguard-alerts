import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotifyQuestionAnswerRequest {
  questionId: string;
  answerId: string;
  answerText: string;
  isOfficial: boolean;
}

// Input validation functions
function sanitizeInput(input: string): string {
  return input.replace(/<[^>]*>/g, '').trim();
}

function validateInput(input: string, maxLength: number = 1000): { isValid: boolean; sanitized: string; error?: string } {
  if (!input || typeof input !== 'string') {
    return { isValid: false, sanitized: '', error: 'Input is required' };
  }
  
  if (input.length > maxLength) {
    return { isValid: false, sanitized: '', error: `Input exceeds maximum length of ${maxLength} characters` };
  }
  
  const sanitized = sanitizeInput(input);
  if (sanitized.length === 0) {
    return { isValid: false, sanitized: '', error: 'Input cannot be empty after sanitization' };
  }
  
  return { isValid: true, sanitized };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const requestData: NotifyQuestionAnswerRequest = await req.json();
    const { questionId, answerId, answerText, isOfficial } = requestData;

    // Validate inputs
    if (!questionId || !answerId || typeof isOfficial !== 'boolean') {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const answerValidation = validateInput(answerText, 1000);
    if (!answerValidation.isValid) {
      return new Response(
        JSON.stringify({ error: answerValidation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the question details and the person who asked it
    const { data: question, error: questionError } = await supabaseClient
      .from('qa_questions')
      .select(`
        *,
        asker:profiles!qa_questions_asked_by_fkey(username),
        answerer:qa_answers!inner(
          answered_by,
          profiles!qa_answers_answered_by_fkey(username)
        )
      `)
      .eq('id', questionId)
      .eq('qa_answers.id', answerId)
      .single();

    if (questionError || !question) {
      console.error('Error fetching question:', questionError);
      return new Response(
        JSON.stringify({ error: 'Question not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the answer details
    const { data: answer, error: answerError } = await supabaseClient
      .from('qa_answers')
      .select(`
        *,
        answerer:profiles!qa_answers_answered_by_fkey(username)
      `)
      .eq('id', answerId)
      .single();

    if (answerError || !answer) {
      console.error('Error fetching answer:', answerError);
      return new Response(
        JSON.stringify({ error: 'Answer not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create the alert message
    const alertTitle = isOfficial 
      ? `✅ Official Answer to Your Question: ${question.title}`
      : `💬 New Response to Your Question: ${question.title}`;

    const jobInfo = question.job_site || question.job_number 
      ? `\n\nJob Details:\n${question.job_site ? `Site: ${question.job_site}` : ''}${question.job_number ? `\nJob #: ${question.job_number}` : ''}`
      : '';

    const alertMessage = `Your question has been ${isOfficial ? 'officially answered' : 'responded to'}!\n\nOriginal Question:\n"${question.question}"\n\nAnswer by ${answer.answerer?.username || 'Unknown'}:\n"${answerValidation.sanitized}"${jobInfo}\n\nCategory: ${question.category}\nPriority: ${question.priority}`;

    // Create the alert
    const { data: newAlert, error: alertError } = await supabaseClient
      .from('alerts')
      .insert({
        title: alertTitle,
        message: alertMessage,
        alert_type: 'company',
        priority: isOfficial ? 'high' : 'medium',
        recipients: 'specific',
        status: 'sent',
        sent_at: new Date().toISOString(),
        sent_by: answer.answered_by
      })
      .select()
      .single();

    if (alertError) {
      console.error('Error creating alert:', alertError);
      return new Response(
        JSON.stringify({ error: 'Failed to create alert' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create alert recipient for the person who asked the question
    const { error: recipientError } = await supabaseClient
      .from('alert_recipients')
      .insert({
        alert_id: newAlert.id,
        user_id: question.asked_by,
        delivery_method: 'system',
        delivery_status: 'delivered',
        delivered_at: new Date().toISOString()
      });

    if (recipientError) {
      console.error('Error creating alert recipient:', recipientError);
      return new Response(
        JSON.stringify({ error: 'Failed to send alert to user' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Alert sent successfully for question ${questionId} to user ${question.asked_by}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        alertId: newAlert.id,
        message: 'Question answer notification sent successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in notify-question-answer function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});