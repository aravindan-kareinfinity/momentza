
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sun, Moon, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface TimeSlotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date | null;
  onTimeSlotSelect: (timeSlot: 'morning' | 'evening' | 'fullday') => void;
}

export function TimeSlotDialog({ open, onOpenChange, date, onTimeSlotSelect }: TimeSlotDialogProps) {
  if (!date) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select Time Slot</DialogTitle>
          <DialogDescription>
            Choose your preferred time slot for {format(date, 'PPP')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 gap-3">
          <Button
            variant="outline"
            className="p-4 h-auto flex items-center gap-3"
            onClick={() => onTimeSlotSelect('morning')}
          >
            <Sun className="h-5 w-5 text-yellow-500" />
            <div className="text-left">
              <div className="font-semibold">Morning Slot</div>
              <div className="text-sm text-gray-600">6:00 AM - 2:00 PM</div>
            </div>
          </Button>
          
          <Button
            variant="outline"
            className="p-4 h-auto flex items-center gap-3"
            onClick={() => onTimeSlotSelect('evening')}
          >
            <Moon className="h-5 w-5 text-blue-500" />
            <div className="text-left">
              <div className="font-semibold">Evening Slot</div>
              <div className="text-sm text-gray-600">2:00 PM - 12:00 AM</div>
            </div>
          </Button>
          
          <Button
            variant="outline"
            className="p-4 h-auto flex items-center gap-3"
            onClick={() => onTimeSlotSelect('fullday')}
          >
            <Clock className="h-5 w-5 text-green-500" />
            <div className="text-left">
              <div className="font-semibold">Full Day</div>
              <div className="text-sm text-gray-600">6:00 AM - 12:00 AM</div>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
