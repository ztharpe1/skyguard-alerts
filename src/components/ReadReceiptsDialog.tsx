import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { alertService } from '@/services/alertService';
import { useToast } from '@/hooks/use-toast';
import { 
  Eye, 
  Clock, 
  CheckCircle2, 
  User,
  Calendar,
  Users
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ReadReceiptsDialogProps {
  alertId: string;
  alertTitle: string;
  children: React.ReactNode;
}

export const ReadReceiptsDialog = ({ alertId, alertTitle, children }: ReadReceiptsDialogProps) => {
  const [receipts, setReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const loadReadReceipts = async () => {
    setLoading(true);
    try {
      const result = await alertService.getAlertReadReceipts(alertId);
      if (result.success) {
        setReceipts(result.data || []);
      } else {
        toast({
          title: "Error",
          description: "Failed to load read receipts.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error loading read receipts:', error);
      toast({
        title: "Error", 
        description: "Failed to load read receipts.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadReadReceipts();
    }
  }, [open, alertId]);

  const readReceipts = receipts.filter(r => r.read_status === 'read');
  const unreadReceipts = receipts.filter(r => r.read_status === 'unread');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Eye className="h-5 w-5 text-primary" />
            <span>Read Receipts</span>
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{alertTitle}</p>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Clock className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading read receipts...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <Users className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold text-foreground">{receipts.length}</p>
                <p className="text-sm text-muted-foreground">Total Recipients</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <CheckCircle2 className="h-6 w-6 mx-auto mb-2 text-success" />
                <p className="text-2xl font-bold text-foreground">{readReceipts.length}</p>
                <p className="text-sm text-muted-foreground">Read</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <Clock className="h-6 w-6 mx-auto mb-2 text-warning" />
                <p className="text-2xl font-bold text-foreground">{unreadReceipts.length}</p>
                <p className="text-sm text-muted-foreground">Unread</p>
              </div>
            </div>

            <ScrollArea className="h-[400px] w-full">
              <div className="space-y-4">
                {/* Read Recipients */}
                {readReceipts.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-foreground mb-3 flex items-center">
                      <CheckCircle2 className="h-4 w-4 mr-2 text-success" />
                      Read ({readReceipts.length})
                    </h3>
                    <div className="space-y-2">
                      {readReceipts.map((receipt) => (
                        <div key={receipt.id} className="flex items-center justify-between p-3 bg-success/10 rounded-lg border border-success/20">
                          <div className="flex items-center space-x-3">
                            <User className="h-4 w-4 text-success" />
                            <div>
                              <p className="font-medium text-foreground">{receipt.profiles.username}</p>
                              <Badge variant="secondary" className="text-xs">
                                {receipt.profiles.role}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-foreground flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {formatDistanceToNow(new Date(receipt.read_at), { addSuffix: true })}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(receipt.read_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Unread Recipients */}
                {unreadReceipts.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-foreground mb-3 flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-warning" />
                      Unread ({unreadReceipts.length})
                    </h3>
                    <div className="space-y-2">
                      {unreadReceipts.map((receipt) => (
                        <div key={receipt.id} className="flex items-center justify-between p-3 bg-warning/10 rounded-lg border border-warning/20">
                          <div className="flex items-center space-x-3">
                            <User className="h-4 w-4 text-warning" />
                            <div>
                              <p className="font-medium text-foreground">{receipt.profiles.username}</p>
                              <Badge variant="secondary" className="text-xs">
                                {receipt.profiles.role}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">
                              Sent {formatDistanceToNow(new Date(receipt.sent_at), { addSuffix: true })}
                            </p>
                            <Badge variant="outline" className="text-xs">
                              Pending
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {receipts.length === 0 && (
                  <div className="text-center py-8">
                    <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground">No recipients found for this alert</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};