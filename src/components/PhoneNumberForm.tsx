import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Phone, Save } from 'lucide-react';
import { validatePhoneNumber, formatPhoneNumber } from '@/lib/security';

export const PhoneNumberForm = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [phone, setPhone] = useState(profile?.phone_number || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validate phone number
    const validation = validatePhoneNumber(phone);
    if (!validation.isValid) {
      setError(validation.error || 'Invalid phone number');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ phone_number: phone })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Phone Number Updated",
        description: "Your phone number has been saved successfully for SMS alerts.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update phone number.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhone(formatted);
    setError(''); // Clear error when user types
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Phone className="h-5 w-5 text-primary" />
          <span>Phone Number for SMS Alerts</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="phone" className="text-sm font-medium text-foreground">
              Phone Number
            </label>
            <Input
              id="phone"
              type="tel"
              placeholder="(555) 123-4567"
              value={phone}
              onChange={handlePhoneChange}
              maxLength={14}
              className={`mt-1 ${error ? 'border-destructive' : ''}`}
            />
            {error && <p className="text-sm text-destructive mt-1">{error}</p>}
            <p className="text-xs text-muted-foreground mt-1">
              Enter your phone number to receive SMS alerts
            </p>
          </div>
          <Button 
            type="submit" 
            disabled={isLoading || !phone}
            className="w-full"
          >
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? 'Saving...' : 'Save Phone Number'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};