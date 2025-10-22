import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { bookingService } from '@/services/ServiceFactory';
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

  // Mutation hook for updating booking communication
  const updateCommunicationMutation = useServiceMutation(
    () => bookingService.updateBookingCommunication(bookingId, lastContactDate?.toISOString() || '', customerResponse)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!lastContactDate || !customerResponse.trim()) {
      return;
    }

    try {
      await updateCommunicationMutation.mutateAsync();
      onCommunicationAdded();
      onClose();
      setLastContactDate(undefined);
      setCustomerResponse('');
    } catch (error) {
      console.error('Failed to update communication:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Communication</DialogTitle>
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
              disabled={!lastContactDate || !customerResponse.trim() || updateCommunicationMutation.isLoading}
            >
              {updateCommunicationMutation.isLoading ? 'Updating...' : 'Update'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
