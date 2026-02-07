'use client';

import { useConsultationStore } from '@/stores/consultation.store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { FileText } from 'lucide-react';

export function ClinicalNotes() {
  const {
    chiefComplaint,
    historyOfPresentIllness,
    clinicalNotes,
    setChiefComplaint,
    setHistoryOfPresentIllness,
    setClinicalNotes,
  } = useConsultationStore();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Clinical Notes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Chief Complaint */}
        <div>
          <Label className="text-sm font-medium">Chief Complaint</Label>
          <textarea
            value={chiefComplaint}
            onChange={(e) => setChiefComplaint(e.target.value)}
            placeholder="Patient's main reason for visit..."
            className="mt-1 w-full min-h-[60px] p-3 border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* History of Present Illness */}
        <div>
          <Label className="text-sm font-medium">History of Present Illness</Label>
          <textarea
            value={historyOfPresentIllness}
            onChange={(e) => setHistoryOfPresentIllness(e.target.value)}
            placeholder="Detailed history of the current illness..."
            className="mt-1 w-full min-h-[120px] p-3 border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Clinical Notes / Examination */}
        <div>
          <Label className="text-sm font-medium">Examination & Notes</Label>
          <textarea
            value={clinicalNotes}
            onChange={(e) => setClinicalNotes(e.target.value)}
            placeholder="Physical examination findings, observations, and additional notes..."
            className="mt-1 w-full min-h-[150px] p-3 border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </CardContent>
    </Card>
  );
}
