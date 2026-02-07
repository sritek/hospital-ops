'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useConsultationStore } from '@/stores/consultation.store';
import { useAppointmentsStore } from '@/stores/appointments.store';
import { getPatientById, getPatientVisitHistory, getDoctorById } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  CheckCircle,
  FileText,
  Pill,
  FlaskConical,
  CalendarPlus,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Import consultation components
import { PatientSummary } from '@/components/consultation/patient-summary';
import { VitalsEntry } from '@/components/consultation/vitals-entry';
import { AIScribe } from '@/components/consultation/ai-scribe';
import { ClinicalNotes } from '@/components/consultation/clinical-notes';
import { DiagnosisSection } from '@/components/consultation/diagnosis-section';
import { PrescriptionSection } from '@/components/consultation/prescription-section';
import { LabOrderSection } from '@/components/consultation/lab-order-section';
import { FollowUpSection } from '@/components/consultation/follow-up-section';
import { ConsultationComplete } from '@/components/consultation/consultation-complete';

type TabType = 'notes' | 'prescription' | 'labs' | 'followup';

export default function ConsultationPage() {
  const router = useRouter();
  const params = useParams();
  const appointmentId = params.id as string;

  const [activeTab, setActiveTab] = useState<TabType>('notes');
  const [showComplete, setShowComplete] = useState(false);

  const { todayAppointments, completeConsultation } = useAppointmentsStore();
  const {
    activeAppointment,
    activePatient,
    startConsultation,
    endConsultation,
    saveConsultation,
    isSaving,
    prescriptions,
    diagnoses,
  } = useConsultationStore();

  // Initialize consultation
  useEffect(() => {
    const appointment = todayAppointments.find((a) => a.id === appointmentId);
    if (appointment) {
      const patient = getPatientById(appointment.patientId);
      const history = patient ? getPatientVisitHistory(patient.id) : [];
      if (patient) {
        startConsultation(appointment, patient, history);
      }
    }
  }, [appointmentId, todayAppointments, startConsultation]);

  // Handle back navigation
  const handleBack = () => {
    if (confirm('Are you sure you want to leave? Unsaved changes will be lost.')) {
      endConsultation();
      router.push('/appointments');
    }
  };

  // Handle save and complete
  const handleComplete = async () => {
    const success = await saveConsultation();
    if (success) {
      await completeConsultation(appointmentId);
      setShowComplete(true);
    }
  };

  // Handle close complete dialog
  const handleCloseComplete = () => {
    setShowComplete(false);
    endConsultation();
    router.push('/appointments');
  };

  if (!activeAppointment || !activePatient) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading consultation...</p>
        </div>
      </div>
    );
  }

  const doctor = getDoctorById(activeAppointment.doctorId);

  const tabs = [
    { id: 'notes' as const, label: 'Notes', icon: FileText },
    { id: 'prescription' as const, label: 'Prescription', icon: Pill, count: prescriptions.length },
    { id: 'labs' as const, label: 'Lab Orders', icon: FlaskConical },
    { id: 'followup' as const, label: 'Follow-up', icon: CalendarPlus },
  ];

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-white">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Consultation</h1>
            <p className="text-sm text-muted-foreground">
              {activePatient.name} • Token #{activeAppointment.tokenNumber}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right text-sm">
            <p className="font-medium">{doctor?.name}</p>
            <p className="text-muted-foreground">{doctor?.specialization}</p>
          </div>
          <Button onClick={handleComplete} disabled={isSaving || diagnoses.length === 0}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            Complete
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Patient Summary */}
        <div className="w-80 border-r bg-gray-50 overflow-y-auto">
          <PatientSummary />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b bg-white px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary/10 text-primary rounded-full">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'notes' && (
              <div className="space-y-6 max-w-4xl">
                {/* Vitals */}
                <VitalsEntry />

                {/* AI Scribe - The WOW Feature */}
                <AIScribe />

                {/* Clinical Notes */}
                <ClinicalNotes />

                {/* Diagnosis */}
                <DiagnosisSection />
              </div>
            )}

            {activeTab === 'prescription' && (
              <div className="max-w-4xl">
                <PrescriptionSection />
              </div>
            )}

            {activeTab === 'labs' && (
              <div className="max-w-4xl">
                <LabOrderSection />
              </div>
            )}

            {activeTab === 'followup' && (
              <div className="max-w-4xl">
                <FollowUpSection />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Completion Dialog */}
      {showComplete && <ConsultationComplete onClose={handleCloseComplete} />}
    </div>
  );
}
