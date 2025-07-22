import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Phone, Save } from 'lucide-react';

export const PhoneNumberForm = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [phone, setPhone] = useState(profile?.phone_number || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ phone_number: phone })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Phone Number Updated",
        description: "Your phone number has been saved successfully.",
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

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const cleaned = value.replace(/\D/g, '');
    
    // Format as (XXX) XXX-XXXX
    if (cleaned.length >= 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
    } else if (cleaned.length >= 6) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    } else if (cleaned.length >= 3) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    }
    return cleaned;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhone(formatted);
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
              className="mt-1"
            />
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