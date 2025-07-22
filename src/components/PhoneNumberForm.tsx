import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Phone, CheckCircle, AlertTriangle } from 'lucide-react';

export const PhoneNumberForm = () => {
  const { toast } = useToast();
  const { profile } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState(profile?.phone_number || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const formatPhoneNumber = (value: string) => {
    // Remove all non-numeric characters
    const numbers = value.replace(/\D/g, '');
    
    // Format as (XXX) XXX-XXXX
    if (numbers.length <= 3) {
      return numbers;
    } else if (numbers.length <= 6) {
      return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`;
    } else {
      return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
    }
  };

  const validatePhoneNumber = (phone: string) => {
    const numbers = phone.replace(/\D/g, '');
    return numbers.length === 10;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!validatePhoneNumber(phoneNumber)) {
      setError('Please enter a valid 10-digit phone number');
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ phone_number: phoneNumber })
        .eq('user_id', profile?.user_id);

      if (error) throw error;

      toast({
        title: "Phone Number Updated",
        description: "Your phone number has been saved successfully",
      });
    } catch (error: any) {
      setError(error.message || 'Failed to update phone number');
      toast({
        title: "Update Failed",
        description: error.message || 'Failed to update phone number',
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Phone className="h-5 w-5 text-primary" />
          <span>Emergency Contact Number</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground">
              Phone Number
            </label>
            <Input
              type="tel"
              placeholder="(555) 123-4567"
              value={phoneNumber}
              onChange={handlePhoneChange}
              className="mt-1"
              maxLength={14}
            />
            {error && (
              <div className="flex items-center space-x-2 mt-2 text-destructive">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm">{error}</span>
              </div>
            )}
            {phoneNumber && validatePhoneNumber(phoneNumber) && !error && (
              <div className="flex items-center space-x-2 mt-2 text-success">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">Valid phone number format</span>
              </div>
            )}
          </div>

          <Button 
            type="submit" 
            disabled={isLoading || !validatePhoneNumber(phoneNumber)}
            className="w-full"
          >
            {isLoading ? 'Updating...' : 'Save Phone Number'}
          </Button>

          <div className="text-xs text-muted-foreground">
            <p>Your phone number will be used to receive emergency alerts via SMS.</p>
            <p>We will never share your phone number with third parties.</p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};