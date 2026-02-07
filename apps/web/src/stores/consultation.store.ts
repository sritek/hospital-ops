/**
 * Consultation State Management
 * Handles active consultation, vitals, notes, prescriptions, and AI scribe
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Appointment, Patient, VisitHistory, Vitals } from '@/lib/mock-data/types';

// Prescription item
export interface PrescriptionItem {
  id: string;
  drugId: string;
  drugName: string;
  genericName?: string;
  dosage: string;
  frequency: string;
  duration: string;
  durationUnit: 'days' | 'weeks' | 'months';
  instructions?: string;
  quantity?: number;
}

// Lab order item
export interface LabOrderItem {
  id: string;
  testId: string;
  testName: string;
  testCode: string;
  instructions?: string;
  urgent: boolean;
}

// Diagnosis item
export interface DiagnosisItem {
  id: string;
  code: string;
  description: string;
  type: 'primary' | 'secondary';
}

// AI Scribe state
export interface AIScribeState {
  isRecording: boolean;
  isProcessing: boolean;
  recordingDuration: number;
  transcript: string;
  generatedNotes: {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
  } | null;
}

// Consultation state
interface ConsultationState {
  // Current consultation
  activeAppointment: Appointment | null;
  activePatient: Patient | null;
  patientHistory: VisitHistory[];

  // Vitals
  vitals: Partial<Vitals> | null;

  // Clinical notes
  chiefComplaint: string;
  historyOfPresentIllness: string;
  clinicalNotes: string;

  // AI Scribe
  aiScribe: AIScribeState;

  // Diagnosis
  diagnoses: DiagnosisItem[];

  // Prescriptions
  prescriptions: PrescriptionItem[];

  // Lab orders
  labOrders: LabOrderItem[];

  // Follow-up
  followUpDays: number | null;
  followUpNotes: string;

  // Status
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;

  // Actions
  startConsultation: (appointment: Appointment, patient: Patient, history: VisitHistory[]) => void;
  endConsultation: () => void;

  // Vitals
  setVitals: (vitals: Partial<Vitals>) => void;

  // Notes
  setChiefComplaint: (complaint: string) => void;
  setHistoryOfPresentIllness: (history: string) => void;
  setClinicalNotes: (notes: string) => void;

  // AI Scribe
  startRecording: () => void;
  stopRecording: () => void;
  setTranscript: (transcript: string) => void;
  generateSOAPNotes: () => Promise<void>;
  applyGeneratedNotes: () => void;
  clearAIScribe: () => void;

  // Diagnosis
  addDiagnosis: (diagnosis: Omit<DiagnosisItem, 'id'>) => void;
  removeDiagnosis: (id: string) => void;
  updateDiagnosis: (id: string, updates: Partial<DiagnosisItem>) => void;

  // Prescriptions
  addPrescription: (prescription: Omit<PrescriptionItem, 'id'>) => void;
  removePrescription: (id: string) => void;
  updatePrescription: (id: string, updates: Partial<PrescriptionItem>) => void;

  // Lab orders
  addLabOrder: (order: Omit<LabOrderItem, 'id'>) => void;
  removeLabOrder: (id: string) => void;

  // Follow-up
  setFollowUp: (days: number | null, notes?: string) => void;

  // Save
  saveConsultation: () => Promise<boolean>;
}

// Generate unique ID
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Mock AI SOAP notes generation
const mockGenerateSOAPNotes = async (
  transcript: string
): Promise<AIScribeState['generatedNotes']> => {
  // Simulate AI processing delay
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Mock generated notes based on transcript keywords
  const lowerTranscript = transcript.toLowerCase();

  let subjective = '';
  let objective = '';
  let assessment = '';
  let plan = '';

  // Generate contextual notes based on common symptoms
  if (lowerTranscript.includes('fever') || lowerTranscript.includes('temperature')) {
    subjective =
      'Patient presents with fever for the past 2-3 days. Associated symptoms include body ache and mild headache. No history of cough, cold, or sore throat. Appetite slightly reduced. Sleep disturbed due to fever.';
    objective =
      'Temperature: 101°F. General appearance: Mild distress. Throat: Normal. Chest: Clear. Abdomen: Soft, non-tender.';
    assessment = 'Viral fever, likely upper respiratory tract infection.';
    plan =
      '1. Tab. Paracetamol 500mg TDS for 3 days\n2. Plenty of oral fluids\n3. Rest advised\n4. Review if fever persists beyond 3 days';
  } else if (lowerTranscript.includes('cough') || lowerTranscript.includes('cold')) {
    subjective =
      'Patient complains of cough and cold for 4-5 days. Cough is productive with whitish sputum. Associated with mild sore throat and nasal congestion. No fever, no breathlessness.';
    objective =
      'Afebrile. Throat: Mild congestion. Chest: Bilateral rhonchi, no crepitations. SpO2: 98%.';
    assessment = 'Acute bronchitis with upper respiratory tract infection.';
    plan =
      '1. Syp. Ambroxol 5ml TDS for 5 days\n2. Tab. Cetirizine 10mg OD for 5 days\n3. Steam inhalation twice daily\n4. Warm fluids advised';
  } else if (lowerTranscript.includes('diabetes') || lowerTranscript.includes('sugar')) {
    subjective =
      'Patient is a known case of Type 2 Diabetes Mellitus on regular medication. Comes for routine follow-up. No complaints of polyuria, polydipsia, or weight loss. Compliance to medication is good.';
    objective =
      'BP: 130/80 mmHg. Weight: Stable. Feet examination: Normal, no ulcers. Peripheral pulses: Present.';
    assessment = 'Type 2 Diabetes Mellitus - Controlled on current medication.';
    plan =
      '1. Continue current medications\n2. HbA1c test advised\n3. Fasting and PP blood sugar monitoring\n4. Diet and exercise counseling reinforced\n5. Review after 1 month with reports';
  } else if (lowerTranscript.includes('pain') || lowerTranscript.includes('ache')) {
    subjective =
      'Patient presents with generalized body ache and joint pain for the past 1 week. Pain is more in the morning, improves with activity. No history of trauma or injury. No swelling or redness of joints.';
    objective =
      'No joint swelling or tenderness. Range of motion: Full in all joints. No muscle wasting.';
    assessment = 'Myalgia, possibly viral or stress-related.';
    plan =
      '1. Tab. Paracetamol 500mg SOS for pain\n2. Hot fomentation locally\n3. Adequate rest\n4. Review if symptoms persist';
  } else {
    // Default generic notes
    subjective =
      'Patient presents for consultation. ' +
      (transcript.length > 50 ? transcript.substring(0, 100) + '...' : transcript);
    objective = 'General examination: Patient appears comfortable. Vitals within normal limits.';
    assessment = 'To be determined based on clinical findings.';
    plan = '1. Symptomatic treatment\n2. Investigations if required\n3. Follow-up as needed';
  }

  return { subjective, objective, assessment, plan };
};

export const useConsultationStore = create<ConsultationState>()(
  persist(
    (set, get) => ({
      // Initial state
      activeAppointment: null,
      activePatient: null,
      patientHistory: [],
      vitals: null,
      chiefComplaint: '',
      historyOfPresentIllness: '',
      clinicalNotes: '',
      aiScribe: {
        isRecording: false,
        isProcessing: false,
        recordingDuration: 0,
        transcript: '',
        generatedNotes: null,
      },
      diagnoses: [],
      prescriptions: [],
      labOrders: [],
      followUpDays: null,
      followUpNotes: '',
      isLoading: false,
      isSaving: false,
      error: null,

      // Start consultation
      startConsultation: (appointment, patient, history) => {
        set({
          activeAppointment: appointment,
          activePatient: patient,
          patientHistory: history,
          vitals: null,
          chiefComplaint: appointment.reason || '',
          historyOfPresentIllness: '',
          clinicalNotes: '',
          aiScribe: {
            isRecording: false,
            isProcessing: false,
            recordingDuration: 0,
            transcript: '',
            generatedNotes: null,
          },
          diagnoses: [],
          prescriptions: [],
          labOrders: [],
          followUpDays: null,
          followUpNotes: '',
          error: null,
        });
      },

      // End consultation
      endConsultation: () => {
        set({
          activeAppointment: null,
          activePatient: null,
          patientHistory: [],
          vitals: null,
          chiefComplaint: '',
          historyOfPresentIllness: '',
          clinicalNotes: '',
          aiScribe: {
            isRecording: false,
            isProcessing: false,
            recordingDuration: 0,
            transcript: '',
            generatedNotes: null,
          },
          diagnoses: [],
          prescriptions: [],
          labOrders: [],
          followUpDays: null,
          followUpNotes: '',
        });
      },

      // Vitals
      setVitals: (vitals) => set({ vitals }),

      // Notes
      setChiefComplaint: (complaint) => set({ chiefComplaint: complaint }),
      setHistoryOfPresentIllness: (history) => set({ historyOfPresentIllness: history }),
      setClinicalNotes: (notes) => set({ clinicalNotes: notes }),

      // AI Scribe
      startRecording: () => {
        set((state) => ({
          aiScribe: { ...state.aiScribe, isRecording: true, recordingDuration: 0 },
        }));
      },

      stopRecording: () => {
        set((state) => ({
          aiScribe: { ...state.aiScribe, isRecording: false },
        }));
      },

      setTranscript: (transcript) => {
        set((state) => ({
          aiScribe: { ...state.aiScribe, transcript },
        }));
      },

      generateSOAPNotes: async () => {
        const { aiScribe } = get();
        if (!aiScribe.transcript) return;

        set((state) => ({
          aiScribe: { ...state.aiScribe, isProcessing: true },
        }));

        try {
          const notes = await mockGenerateSOAPNotes(aiScribe.transcript);
          set((state) => ({
            aiScribe: { ...state.aiScribe, isProcessing: false, generatedNotes: notes },
          }));
        } catch {
          set((state) => ({
            aiScribe: { ...state.aiScribe, isProcessing: false },
            error: 'Failed to generate notes',
          }));
        }
      },

      applyGeneratedNotes: () => {
        const { aiScribe } = get();
        if (!aiScribe.generatedNotes) return;

        const { subjective, objective, assessment, plan } = aiScribe.generatedNotes;
        set({
          historyOfPresentIllness: subjective,
          clinicalNotes: `Objective:\n${objective}\n\nAssessment:\n${assessment}\n\nPlan:\n${plan}`,
        });
      },

      clearAIScribe: () => {
        set({
          aiScribe: {
            isRecording: false,
            isProcessing: false,
            recordingDuration: 0,
            transcript: '',
            generatedNotes: null,
          },
        });
      },

      // Diagnosis
      addDiagnosis: (diagnosis) => {
        set((state) => ({
          diagnoses: [...state.diagnoses, { ...diagnosis, id: generateId() }],
        }));
      },

      removeDiagnosis: (id) => {
        set((state) => ({
          diagnoses: state.diagnoses.filter((d) => d.id !== id),
        }));
      },

      updateDiagnosis: (id, updates) => {
        set((state) => ({
          diagnoses: state.diagnoses.map((d) => (d.id === id ? { ...d, ...updates } : d)),
        }));
      },

      // Prescriptions
      addPrescription: (prescription) => {
        set((state) => ({
          prescriptions: [...state.prescriptions, { ...prescription, id: generateId() }],
        }));
      },

      removePrescription: (id) => {
        set((state) => ({
          prescriptions: state.prescriptions.filter((p) => p.id !== id),
        }));
      },

      updatePrescription: (id, updates) => {
        set((state) => ({
          prescriptions: state.prescriptions.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        }));
      },

      // Lab orders
      addLabOrder: (order) => {
        set((state) => ({
          labOrders: [...state.labOrders, { ...order, id: generateId() }],
        }));
      },

      removeLabOrder: (id) => {
        set((state) => ({
          labOrders: state.labOrders.filter((o) => o.id !== id),
        }));
      },

      // Follow-up
      setFollowUp: (days, notes = '') => {
        set({ followUpDays: days, followUpNotes: notes });
      },

      // Save consultation
      saveConsultation: async () => {
        set({ isSaving: true, error: null });

        try {
          // Simulate API call
          await new Promise((resolve) => setTimeout(resolve, 1000));

          // In real implementation, this would save to backend
          // For demo, we just clear the state
          set({ isSaving: false });
          return true;
        } catch {
          set({ isSaving: false, error: 'Failed to save consultation' });
          return false;
        }
      },
    }),
    {
      name: 'consultation-storage',
      partialize: (state) => ({
        // Only persist active consultation data
        activeAppointment: state.activeAppointment,
        activePatient: state.activePatient,
        vitals: state.vitals,
        chiefComplaint: state.chiefComplaint,
        historyOfPresentIllness: state.historyOfPresentIllness,
        clinicalNotes: state.clinicalNotes,
        diagnoses: state.diagnoses,
        prescriptions: state.prescriptions,
        labOrders: state.labOrders,
        followUpDays: state.followUpDays,
        followUpNotes: state.followUpNotes,
      }),
    }
  )
);
