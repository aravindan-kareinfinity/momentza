import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { bookingService, communicationService } from '@/services/ServiceFactory';
import { useToast } from '@/hooks/use-toast';
import { useServiceMutation } from '@/hooks/useService';

interface CommunicationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  onCommunicationAdded: () => void;
}

export function CommunicationDialog({ 
  isOpen, 
  onClose, 
  bookingId,
  onCommunicationAdded 
}: CommunicationDialogProps) {
  const [lastContactDate, setLastContactDate] = useState<Date | undefined>(undefined);
  const [customerResponse, setCustomerResponse] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!lastContactDate || !customerResponse.trim()) {
      return;
    }

    setSubmitting(true);

    // Build time as ISO and date as YYYY-MM-DD (server expects proper DateTime for time)
    const isoTime = lastContactDate.toISOString();
    const dateOnly = format(lastContactDate, 'yyyy-MM-dd');

    const commBody: any = {
      booking_id: bookingId,
      date: dateOnly,
      time: isoTime,
      from_Person: 'System',
      to_Person: 'Customer',
      detail: customerResponse
    };

    try {
      // Send flat payload (server expects the communication object directly)
      await communicationService.createCommunication(commBody as any);
      // Created successfully as independent communication
      onCommunicationAdded();
      onClose();
      setLastContactDate(undefined);
      setCustomerResponse('');
    } catch (err: any) {
      // Surface API validation errors to the user via toast. Do not fall back to booking update.
      console.error('createCommunication failed:', err);

      const defaultMsg = 'Failed to create communication. Please check the form and try again.';
      // If ApiError nested with response body exists, try to extract validation errors
      const detailMessage = (() => {
        try {
          if (!err) return defaultMsg;
          // ApiError from ApiClient should have a `body` or `message`
          const payload = err?.body ?? err?.response ?? err?.data ?? err;
          if (payload && typeof payload === 'object') {
            // If errors object present (from .NET model validation)
            if (payload.errors && typeof payload.errors === 'object') {
              return Object.entries(payload.errors)
                .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
                .join('\n');
            }
            // If message/title present
            if (payload.title || payload.message) {
              return `${payload.title ?? ''}${payload.message ? ': ' + payload.message : ''}`;
            }
          }
          // Fallback to err.message
          return err?.message ?? defaultMsg;
        } catch (e) {
          return defaultMsg;
        }
      })();

      toast({
        title: 'Communication not saved',
        description: detailMessage,
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Communication</DialogTitle>
          <DialogDescription>
            Update the last contact date and notes for this booking. This helps keep track of customer communications.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="lastContactDate">Last Contact Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !lastContactDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {lastContactDate ? format(lastContactDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={lastContactDate}
                  onSelect={setLastContactDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerResponse">Customer Response</Label>
            <Textarea
              id="customerResponse"
              placeholder="Enter customer response or notes..."
              value={customerResponse}
              onChange={(e) => setCustomerResponse(e.target.value)}
              rows={4}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!lastContactDate || !customerResponse.trim() || submitting}
            >
              {submitting ? 'Updating...' : 'Update'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
