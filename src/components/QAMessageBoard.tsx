import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { sanitizeInput, validateAlertTitle, validateAlertMessage } from '@/lib/security';
import { 
  MessageSquare, 
  Plus, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Building,
  User,
  Send,
  PaperclipIcon,
  Star
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Question {
  id: string;
  title: string;
  question: string;
  job_site: string | null;
  job_number: string | null;
  priority: string;
  category: string;
  status: string;
  created_at: string;
  updated_at: string;
  asked_by: string;
  assigned_to: string | null;
  asker?: {
    username: string;
  } | null;
  assignee?: {
    username: string;
  } | null;
  answers?: Answer[];
}

interface Answer {
  id: string;
  answer: string;
  created_at: string;
  answered_by: string;
  is_official: boolean;
  answerer?: {
    username: string;
  } | null;
}

const QAMessageBoard = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();

  const [newQuestion, setNewQuestion] = useState({
    title: '',
    question: '',
    job_site: '',
    job_number: '',
    priority: 'medium',
    category: 'general'
  });

  const [newAnswer, setNewAnswer] = useState('');

  const priorityColors = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800'
  };

  const statusColors = {
    open: 'bg-blue-100 text-blue-800',
    answered: 'bg-green-100 text-green-800',
    closed: 'bg-gray-100 text-gray-800'
  };

  const categoryIcons = {
    safety: <AlertTriangle className="h-4 w-4" />,
    equipment: <Building className="h-4 w-4" />,
    procedures: <MessageSquare className="h-4 w-4" />,
    general: <User className="h-4 w-4" />
  };

  const fetchQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('qa_questions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Get user profiles for the questions
      if (data && data.length > 0) {
        const userIds = [...new Set([...data.map(q => q.asked_by), ...data.filter(q => q.assigned_to).map(q => q.assigned_to)])];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, username')
          .in('user_id', userIds);

        const profileMap = profiles?.reduce((acc, p) => ({ ...acc, [p.user_id]: p }), {}) || {};
        
        const questionsWithProfiles = data.map(q => ({
          ...q,
          asker: profileMap[q.asked_by] || null,
          assignee: q.assigned_to ? profileMap[q.assigned_to] || null : null
        }));
        
        setQuestions(questionsWithProfiles as Question[]);
      } else {
        setQuestions([]);
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch questions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAnswers = async (questionId: string) => {
    try {
      const { data, error } = await supabase
        .from('qa_answers')
        .select('*')
        .eq('question_id', questionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      // Get user profiles for the answers
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(a => a.answered_by))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, username')
          .in('user_id', userIds);

        const profileMap = profiles?.reduce((acc, p) => ({ ...acc, [p.user_id]: p }), {}) || {};
        
        const answersWithProfiles = data.map(a => ({
          ...a,
          answerer: profileMap[a.answered_by] || null
        }));
        
        return answersWithProfiles as Answer[];
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching answers:', error);
      return [];
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    // Validate and sanitize inputs
    const titleValidation = validateAlertTitle(newQuestion.title);
    const questionValidation = validateAlertMessage(newQuestion.question);
    
    if (!titleValidation.isValid || !questionValidation.isValid) {
      toast({
        title: "Error",
        description: titleValidation.error || questionValidation.error || "Invalid input",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('qa_questions')
        .insert([{
          title: titleValidation.sanitized,
          question: questionValidation.sanitized,
          job_site: newQuestion.job_site ? sanitizeInput(newQuestion.job_site) : null,
          job_number: newQuestion.job_number ? sanitizeInput(newQuestion.job_number) : null,
          priority: newQuestion.priority,
          category: newQuestion.category,
          asked_by: user.id
        }]);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Question posted successfully"
      });

      setNewQuestion({
        title: '',
        question: '',
        job_site: '',
        job_number: '',
        priority: 'medium',
        category: 'general'
      });
      setIsCreateDialogOpen(false);
      fetchQuestions();
    } catch (error) {
      console.error('Error creating question:', error);
      toast({
        title: "Error",
        description: "Failed to post question",
        variant: "destructive"
      });
    }
  };

  const handleAnswer = async (questionId: string) => {
    if (!user) return;

    // Validate and sanitize answer
    const answerValidation = validateAlertMessage(newAnswer);
    
    if (!answerValidation.isValid) {
      toast({
        title: "Error",
        description: answerValidation.error || "Invalid answer",
        variant: "destructive"
      });
      return;
    }

    try {
      const isAdmin = user?.user_metadata?.role === 'admin'; // Check if user is admin
      
      const { data: answer, error } = await supabase
        .from('qa_answers')
        .insert([{
          question_id: questionId,
          answer: answerValidation.sanitized,
          answered_by: user.id,
          is_official: isAdmin
        }])
        .select()
        .single();

      if (error) throw error;
      
      // Send notification to the question asker
      try {
        await supabase.functions.invoke('notify-question-answer', {
          body: {
            questionId: questionId,
            answerId: answer.id,
            answerText: answerValidation.sanitized,
            isOfficial: isAdmin
          }
        });
      } catch (notificationError) {
        console.error('Error sending notification:', notificationError);
        // Don't fail the answer creation if notification fails
      }

      toast({
        title: "Success",
        description: "Answer posted successfully"
      });

      setNewAnswer('');
      
      // Refresh the question details
      if (selectedQuestion?.id === questionId) {
        const answers = await fetchAnswers(questionId);
        setSelectedQuestion(prev => prev ? { ...prev, answers } : null);
      }
      
      fetchQuestions();
    } catch (error) {
      console.error('Error posting answer:', error);
      toast({
        title: "Error",
        description: "Failed to post answer",
        variant: "destructive"
      });
    }
  };

  const openQuestionDetail = async (question: Question) => {
    const answers = await fetchAnswers(question.id);
    setSelectedQuestion({ ...question, answers });
  };

  const filteredQuestions = questions.filter(question => {
    const matchesStatus = filterStatus === 'all' || question.status === filterStatus;
    const matchesCategory = filterCategory === 'all' || question.category === filterCategory;
    const matchesSearch = searchTerm === '' || 
      question.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      question.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      question.job_site?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      question.job_number?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesCategory && matchesSearch;
  });

  if (loading) {
    return <div className="text-center">Loading Q&A board...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Q&A Message Board</h2>
          <p className="text-muted-foreground">Ask questions and get answers from experts</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Ask Question
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Ask a Question</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateQuestion} className="space-y-4">
              <div>
                <Label htmlFor="title">Question Title *</Label>
                <Input
                  id="title"
                  value={newQuestion.title}
                  onChange={(e) => setNewQuestion({ ...newQuestion, title: e.target.value })}
                  placeholder="Brief description of your question"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="job_site">Job Site</Label>
                  <Input
                    id="job_site"
                    value={newQuestion.job_site}
                    onChange={(e) => setNewQuestion({ ...newQuestion, job_site: e.target.value })}
                    placeholder="e.g., Downtown Office Building"
                  />
                </div>
                <div>
                  <Label htmlFor="job_number">Job Number</Label>
                  <Input
                    id="job_number"
                    value={newQuestion.job_number}
                    onChange={(e) => setNewQuestion({ ...newQuestion, job_number: e.target.value })}
                    placeholder="e.g., JOB-2024-001"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={newQuestion.category} onValueChange={(value) => setNewQuestion({ ...newQuestion, category: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="safety">Safety</SelectItem>
                      <SelectItem value="equipment">Equipment</SelectItem>
                      <SelectItem value="procedures">Procedures</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={newQuestion.priority} onValueChange={(value) => setNewQuestion({ ...newQuestion, priority: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="question">Question Details *</Label>
                <Textarea
                  id="question"
                  value={newQuestion.question}
                  onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })}
                  placeholder="Describe your question in detail..."
                  rows={4}
                  required
                />
              </div>

              <Button type="submit" className="w-full">
                <MessageSquare className="h-4 w-4 mr-2" />
                Post Question
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search questions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="answered">Answered</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="safety">Safety</SelectItem>
                  <SelectItem value="equipment">Equipment</SelectItem>
                  <SelectItem value="procedures">Procedures</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Questions List */}
      <div className="grid gap-4">
        {filteredQuestions.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No questions found. Be the first to ask!</p>
            </CardContent>
          </Card>
        ) : (
          filteredQuestions.map((question) => (
            <Card key={question.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6" onClick={() => openQuestionDetail(question)}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {categoryIcons[question.category as keyof typeof categoryIcons]}
                      <h3 className="font-semibold text-lg">{question.title}</h3>
                      <Badge className={priorityColors[question.priority as keyof typeof priorityColors]}>
                        {question.priority}
                      </Badge>
                      <Badge className={statusColors[question.status as keyof typeof statusColors]}>
                        {question.status}
                      </Badge>
                    </div>
                    
                    <p className="text-muted-foreground mb-3 line-clamp-2">{question.question}</p>
                    
                    {(question.job_site || question.job_number) && (
                      <div className="flex gap-4 text-sm text-muted-foreground mb-2">
                        {question.job_site && (
                          <span className="flex items-center gap-1">
                            <Building className="h-3 w-3" />
                            {question.job_site}
                          </span>
                        )}
                        {question.job_number && (
                          <span className="flex items-center gap-1">
                            <PaperclipIcon className="h-3 w-3" />
                            {question.job_number}
                          </span>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {question.asker?.username || 'Unknown'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(question.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Question Detail Dialog */}
      {selectedQuestion && (
        <Dialog open={!!selectedQuestion} onOpenChange={() => setSelectedQuestion(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {categoryIcons[selectedQuestion.category as keyof typeof categoryIcons]}
                {selectedQuestion.title}
                <Badge className={priorityColors[selectedQuestion.priority as keyof typeof priorityColors]}>
                  {selectedQuestion.priority}
                </Badge>
                <Badge className={statusColors[selectedQuestion.status as keyof typeof statusColors]}>
                  {selectedQuestion.status}
                </Badge>
              </DialogTitle>
            </DialogHeader>
            
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-6">
                {/* Question Details */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {selectedQuestion.asker?.username || 'Unknown'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(selectedQuestion.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>

                  {(selectedQuestion.job_site || selectedQuestion.job_number) && (
                    <div className="flex gap-4 text-sm mb-4 p-3 bg-muted rounded-lg">
                      {selectedQuestion.job_site && (
                        <span className="flex items-center gap-1">
                          <Building className="h-4 w-4" />
                          <strong>Site:</strong> {selectedQuestion.job_site}
                        </span>
                      )}
                      {selectedQuestion.job_number && (
                        <span className="flex items-center gap-1">
                          <PaperclipIcon className="h-4 w-4" />
                          <strong>Job #:</strong> {selectedQuestion.job_number}
                        </span>
                      )}
                    </div>
                  )}

                  <p className="text-foreground whitespace-pre-wrap">{selectedQuestion.question}</p>
                </div>

                <Separator />

                {/* Answers */}
                <div>
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Answers ({selectedQuestion.answers?.length || 0})
                  </h4>
                  
                  {selectedQuestion.answers && selectedQuestion.answers.length > 0 ? (
                    <div className="space-y-4">
                      {selectedQuestion.answers.map((answer) => (
                        <div key={answer.id} className={`p-4 rounded-lg border ${answer.is_official ? 'bg-green-50 border-green-200' : 'bg-muted'}`}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                                <User className="h-3 w-3" />
                                {answer.answerer?.username || 'Unknown'}
                              </span>
                              {answer.is_official && (
                                <Badge className="bg-green-100 text-green-800">
                                  <Star className="h-3 w-3 mr-1" />
                                  Official Answer
                                </Badge>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(answer.created_at), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="whitespace-pre-wrap">{answer.answer}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">No answers yet. Be the first to help!</p>
                  )}
                </div>

                <Separator />

                {/* Answer Form */}
                <div>
                  <h4 className="font-semibold mb-4">Your Answer</h4>
                  <div className="space-y-4">
                    <Textarea
                      value={newAnswer}
                      onChange={(e) => setNewAnswer(e.target.value)}
                      placeholder="Write your answer here..."
                      rows={4}
                    />
                    <Button 
                      onClick={() => handleAnswer(selectedQuestion.id)}
                      disabled={!newAnswer.trim()}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Post Answer
                    </Button>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default QAMessageBoard;