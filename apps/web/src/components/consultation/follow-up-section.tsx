'use client';

import { useConsultationStore } from '@/stores/consultation.store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { CalendarPlus, Calendar, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const QUICK_OPTIONS = [
  { days: 3, label: '3 Days' },
  { days: 7, label: '1 Week' },
  { days: 14, label: '2 Weeks' },
  { days: 30, label: '1 Month' },
  { days: 90, label: '3 Months' },
];

export function FollowUpSection() {
  const { followUpDays, followUpNotes, setFollowUp } = useConsultationStore();

  const getFollowUpDate = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <CalendarPlus className="h-5 w-5 text-primary" />
          Follow-up
        </h2>
        <p className="text-sm text-muted-foreground">Schedule a follow-up appointment</p>
      </div>

      {/* Quick Options */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Quick Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {QUICK_OPTIONS.map((option) => (
              <Button
                key={option.days}
                variant={followUpDays === option.days ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFollowUp(option.days)}
                className={cn(followUpDays === option.days && 'ring-2 ring-primary/20')}
              >
                {followUpDays === option.days && <Check className="h-3 w-3 mr-1" />}
                {option.label}
              </Button>
            ))}
            <Button
              variant={followUpDays === null ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setFollowUp(null)}
            >
              No Follow-up
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Selected Follow-up */}
      {followUpDays && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Follow-up Scheduled</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {getFollowUpDate(followUpDays)}
                </p>
                <p className="text-xs text-muted-foreground">({followUpDays} days from today)</p>
              </div>
            </div>

            {/* Notes */}
            <div className="mt-4">
              <Label className="text-sm">Follow-up Notes (optional)</Label>
              <textarea
                value={followUpNotes}
                onChange={(e) => setFollowUp(followUpDays, e.target.value)}
                placeholder="Any specific instructions for the follow-up visit..."
                className="mt-1 w-full min-h-[80px] p-3 border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info */}
      <div className="text-sm text-muted-foreground bg-gray-50 p-4 rounded-lg">
        <p className="font-medium text-foreground mb-1">About Follow-ups</p>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>Patient will receive a WhatsApp reminder 24 hours before the follow-up</li>
          <li>Follow-up appointments are automatically prioritized in the queue</li>
          <li>You can view all pending follow-ups in the Appointments section</li>
        </ul>
      </div>
    </div>
  );
}
