---
# AI Features - Ambient scribe, clinical decision support, predictions
inclusion: fileMatch
fileMatchPattern: "**/ai/**/*.ts, **/scribe/**/*.ts, **/ml/**/*.ts"
---

# AI Features Guide

## Overview

This document covers AI-powered features for Hospital-Ops including ambient scribe for clinical documentation, clinical decision support, drug interaction alerts, and predictive analytics. All AI features are designed as assistive tools with human oversight.

---

## 1. AI Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    AI Services Layer                         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Ambient   │  │  Clinical   │  │ Predictive  │         │
│  │   Scribe    │  │  Decision   │  │  Analytics  │         │
│  │             │  │   Support   │  │             │         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘         │
│         │                │                │                 │
│  ┌──────┴────────────────┴────────────────┴──────┐         │
│  │              AI Gateway Service                │         │
│  │  (Rate limiting, logging, model routing)       │         │
│  └──────────────────────┬────────────────────────┘         │
│                         │                                   │
├─────────────────────────┼───────────────────────────────────┤
│  ┌──────────────────────┴────────────────────────┐         │
│  │              External AI Providers             │         │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐       │         │
│  │  │ Claude  │  │ GPT-4   │  │ Whisper │       │         │
│  │  │ (Text)  │  │ (Text)  │  │ (Audio) │       │         │
│  │  └─────────┘  └─────────┘  └─────────┘       │         │
│  └───────────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. AI Gateway Service

```typescript
// lib/ai/gateway.ts
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { logger } from '@/lib/logger';
import { redis } from '@/lib/redis';

export interface AIRequest {
  tenantId: string;
  userId: string;
  model: 'claude' | 'gpt4' | 'whisper';
  prompt?: string;
  audio?: Buffer;
  maxTokens?: number;
  temperature?: number;
}

export interface AIResponse {
  success: boolean;
  content?: string;
  usage?: { inputTokens: number; outputTokens: number };
  error?: string;
}

class AIGateway {
  private anthropic: Anthropic;
  private openai: OpenAI;

  constructor() {
    this.anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  async request(req: AIRequest): Promise<AIResponse> {
    // Rate limiting
    const rateLimitKey = `ai:ratelimit:${req.tenantId}`;
    const currentCount = await redis.incr(rateLimitKey);
    if (currentCount === 1) {
      await redis.expire(rateLimitKey, 60); // 1 minute window
    }
    if (currentCount > 100) { // 100 requests per minute per tenant
      return { success: false, error: 'Rate limit exceeded' };
    }

    try {
      let response: AIResponse;

      switch (req.model) {
        case 'claude':
          response = await this.callClaude(req);
          break;
        case 'gpt4':
          response = await this.callGPT4(req);
          break;
        case 'whisper':
          response = await this.callWhisper(req);
          break;
        default:
          return { success: false, error: 'Unknown model' };
      }
```

      // Log usage
      await this.logUsage(req, response);

      return response;
    } catch (error) {
      logger.error('AI Gateway error:', error);
      return { success: false, error: 'AI service unavailable' };
    }

}

private async callClaude(req: AIRequest): Promise<AIResponse> {
const response = await this.anthropic.messages.create({
model: 'claude-sonnet-4-20250514',
max_tokens: req.maxTokens || 4096,
temperature: req.temperature || 0.3,
messages: [{ role: 'user', content: req.prompt! }],
});

    return {
      success: true,
      content: response.content[0].type === 'text' ? response.content[0].text : '',
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    };

}

private async callGPT4(req: AIRequest): Promise<AIResponse> {
const response = await this.openai.chat.completions.create({
model: 'gpt-4-turbo-preview',
max_tokens: req.maxTokens || 4096,
temperature: req.temperature || 0.3,
messages: [{ role: 'user', content: req.prompt! }],
});

    return {
      success: true,
      content: response.choices[0].message.content || '',
      usage: {
        inputTokens: response.usage?.prompt_tokens || 0,
        outputTokens: response.usage?.completion_tokens || 0,
      },
    };

}

private async callWhisper(req: AIRequest): Promise<AIResponse> {
if (!req.audio) {
return { success: false, error: 'Audio required for Whisper' };
}

    const response = await this.openai.audio.transcriptions.create({
      model: 'whisper-1',
      file: new File([req.audio], 'audio.webm', { type: 'audio/webm' }),
      language: 'en',
    });

    return {
      success: true,
      content: response.text,
    };

}

private async logUsage(req: AIRequest, response: AIResponse) {
await prisma.aiUsageLog.create({
data: {
tenantId: req.tenantId,
userId: req.userId,
model: req.model,
inputTokens: response.usage?.inputTokens || 0,
outputTokens: response.usage?.outputTokens || 0,
success: response.success,
error: response.error,
},
});
}
}

export const aiGateway = new AIGateway();

```

```

---

## 3. Ambient Scribe

### Overview

The ambient scribe listens to doctor-patient conversations and automatically generates clinical documentation in SOAP format.

### Scribe Service

```typescript
// lib/ai/scribe/scribe.service.ts
import { aiGateway } from '../gateway';
import { prisma } from '@/lib/prisma';

export interface ScribeInput {
  tenantId: string;
  consultationId: string;
  doctorId: string;
  audioChunks: Buffer[];
  patientContext: PatientContext;
}

export interface PatientContext {
  name: string;
  age: number;
  gender: string;
  allergies: string[];
  chronicConditions: string[];
  currentMedications: string[];
  chiefComplaint?: string;
}

export interface SOAPNote {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  icdCodes: Array<{ code: string; description: string }>;
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
  }>;
  followUp?: string;
}

export class AmbientScribeService {
  async processConsultation(input: ScribeInput): Promise<SOAPNote> {
    // Step 1: Transcribe audio
    const transcription = await this.transcribeAudio(input);

    // Step 2: Generate SOAP note
    const soapNote = await this.generateSOAPNote(input, transcription);

    // Step 3: Extract ICD codes
    const icdCodes = await this.extractICDCodes(soapNote.assessment);

    // Step 4: Extract medications
    const medications = await this.extractMedications(soapNote.plan);

    // Save draft
    await prisma.consultationDraft.create({
      data: {
        consultationId: input.consultationId,
        transcription,
        soapNote: soapNote as any,
        icdCodes: icdCodes as any,
        medications: medications as any,
        status: 'pending_review',
      },
    });

    return { ...soapNote, icdCodes, medications };
  }
```

private async transcribeAudio(input: ScribeInput): Promise<string> {
const combinedAudio = Buffer.concat(input.audioChunks);

    const response = await aiGateway.request({
      tenantId: input.tenantId,
      userId: input.doctorId,
      model: 'whisper',
      audio: combinedAudio,
    });

    if (!response.success) {
      throw new Error('Transcription failed: ' + response.error);
    }

    return response.content!;

}

private async generateSOAPNote(
input: ScribeInput,
transcription: string
): Promise<Omit<SOAPNote, 'icdCodes' | 'medications'>> {
const prompt = this.buildSOAPPrompt(input.patientContext, transcription);

    const response = await aiGateway.request({
      tenantId: input.tenantId,
      userId: input.doctorId,
      model: 'claude',
      prompt,
      temperature: 0.2,
    });

    if (!response.success) {
      throw new Error('SOAP generation failed: ' + response.error);
    }

    return this.parseSOAPResponse(response.content!);

}

private buildSOAPPrompt(context: PatientContext, transcription: string): string {
return `You are a medical documentation assistant. Generate a SOAP note from the following doctor-patient conversation.

PATIENT CONTEXT:

- Name: ${context.name}
- Age: ${context.age} years
- Gender: ${context.gender}
- Known Allergies: ${context.allergies.join(', ') || 'None'}
- Chronic Conditions: ${context.chronicConditions.join(', ') || 'None'}
- Current Medications: ${context.currentMedications.join(', ') || 'None'}
${context.chiefComplaint ? `- Chief Complaint: ${context.chiefComplaint}` : ''}

CONVERSATION TRANSCRIPT:
${transcription}

Generate a structured SOAP note with the following sections:

1. SUBJECTIVE: Patient's reported symptoms, history, and concerns
2. OBJECTIVE: Physical examination findings, vital signs mentioned
3. ASSESSMENT: Clinical impression and differential diagnoses
4. PLAN: Treatment plan, medications, tests ordered, follow-up

Format your response as JSON:
{
"subjective": "...",
"objective": "...",
"assessment": "...",
"plan": "...",
"followUp": "..."
}

IMPORTANT:

- Be concise and clinically relevant
- Use standard medical terminology
- Flag any drug allergies or contraindications
- This is a DRAFT for doctor review - mark uncertain items with [?]`;
  }

  private async extractICDCodes(assessment: string): Promise<Array<{ code: string; description: string }>> {
  const prompt = `Extract ICD-10 diagnosis codes from this clinical assessment. Return only codes that are clearly indicated.

ASSESSMENT:
${assessment}

Return as JSON array:
[{"code": "J06.9", "description": "Acute upper respiratory infection, unspecified"}]

Only include codes you are confident about. If uncertain, do not include.`;

    const response = await aiGateway.request({
      tenantId: 'system',
      userId: 'system',
      model: 'claude',
      prompt,
      temperature: 0.1,
    });

    if (!response.success) return [];

    try {
      return JSON.parse(response.content!);
    } catch {
      return [];
    }

}

private async extractMedications(plan: string): Promise<Array<{
name: string;
dosage: string;
frequency: string;
duration: string;
}>> {
const prompt = `Extract medication prescriptions from this treatment plan.

PLAN:
${plan}

Return as JSON array:
[{"name": "Paracetamol", "dosage": "500mg", "frequency": "TDS", "duration": "5 days"}]

Use standard abbreviations: OD (once daily), BD (twice daily), TDS (thrice daily), QID (four times daily), SOS (as needed)`;

    const response = await aiGateway.request({
      tenantId: 'system',
      userId: 'system',
      model: 'claude',
      prompt,
      temperature: 0.1,
    });

    if (!response.success) return [];

    try {
      return JSON.parse(response.content!);
    } catch {
      return [];
    }

}

private parseSOAPResponse(content: string): Omit<SOAPNote, 'icdCodes' | 'medications'> {
try {
const jsonMatch = content.match(/\{[\s\S]\*\}/);
if (jsonMatch) {
return JSON.parse(jsonMatch[0]);
}
} catch (e) {
// Fallback parsing
}

    return {
      subjective: '',
      objective: '',
      assessment: '',
      plan: '',
    };

}
}

export const ambientScribe = new AmbientScribeService();

````

---

## 4. Clinical Decision Support

### Drug Interaction Checker

```typescript
// lib/ai/clinical/drug-interactions.ts
import { aiGateway } from '../gateway';
import { prisma } from '@/lib/prisma';
````

export interface DrugInteraction {
drug1: string;
drug2: string;
severity: 'minor' | 'moderate' | 'major' | 'contraindicated';
description: string;
recommendation: string;
}

export interface InteractionCheckResult {
hasInteractions: boolean;
interactions: DrugInteraction[];
allergyAlerts: AllergyAlert[];
}

export interface AllergyAlert {
drug: string;
allergen: string;
severity: 'warning' | 'critical';
description: string;
}

export class DrugInteractionService {
// First check local database, then AI for unknown combinations
async checkInteractions(
drugs: string[],
patientAllergies: string[]
): Promise<InteractionCheckResult> {
const interactions: DrugInteraction[] = [];
const allergyAlerts: AllergyAlert[] = [];

    // Check allergies first
    for (const drug of drugs) {
      const allergyCheck = await this.checkDrugAllergy(drug, patientAllergies);
      if (allergyCheck) {
        allergyAlerts.push(allergyCheck);
      }
    }

    // Check drug-drug interactions
    for (let i = 0; i < drugs.length; i++) {
      for (let j = i + 1; j < drugs.length; j++) {
        const interaction = await this.checkPairInteraction(drugs[i], drugs[j]);
        if (interaction) {
          interactions.push(interaction);
        }
      }
    }

    return {
      hasInteractions: interactions.length > 0 || allergyAlerts.length > 0,
      interactions,
      allergyAlerts,
    };

}

private async checkDrugAllergy(
drug: string,
allergies: string[]
): Promise<AllergyAlert | null> {
if (allergies.length === 0) return null;

    // Check local database first
    const knownAllergy = await prisma.drugAllergyMapping.findFirst({
      where: {
        drugName: { contains: drug, mode: 'insensitive' },
        allergen: { in: allergies.map(a => a.toLowerCase()) },
      },
    });

    if (knownAllergy) {
      return {
        drug,
        allergen: knownAllergy.allergen,
        severity: knownAllergy.severity as 'warning' | 'critical',
        description: knownAllergy.description,
      };
    }

    // AI fallback for unknown combinations
    const prompt = `Check if the drug "${drug}" could cause an allergic reaction in a patient with these known allergies: ${allergies.join(', ')}.

Consider:

- Drug class cross-reactivity
- Common allergen components
- Excipient allergies

If there's a potential allergy concern, respond with JSON:
{"hasAllergy": true, "allergen": "...", "severity": "warning|critical", "description": "..."}

If no concern, respond with:
{"hasAllergy": false}`;

    const response = await aiGateway.request({
      tenantId: 'system',
      userId: 'system',
      model: 'claude',
      prompt,
      temperature: 0.1,
    });

    if (response.success) {
      try {
        const result = JSON.parse(response.content!);
        if (result.hasAllergy) {
          return {
            drug,
            allergen: result.allergen,
            severity: result.severity,
            description: result.description,
          };
        }
      } catch {}
    }

    return null;

}

private async checkPairInteraction(
drug1: string,
drug2: string
): Promise<DrugInteraction | null> {
// Check local database first
const knownInteraction = await prisma.drugInteraction.findFirst({
where: {
OR: [
{ drug1: { contains: drug1, mode: 'insensitive' }, drug2: { contains: drug2, mode: 'insensitive' } },
{ drug1: { contains: drug2, mode: 'insensitive' }, drug2: { contains: drug1, mode: 'insensitive' } },
],
},
});

    if (knownInteraction) {
      return {
        drug1,
        drug2,
        severity: knownInteraction.severity as any,
        description: knownInteraction.description,
        recommendation: knownInteraction.recommendation,
      };
    }

    // AI fallback
    const prompt = `Check for drug-drug interaction between "${drug1}" and "${drug2}".

If there's an interaction, respond with JSON:
{
"hasInteraction": true,
"severity": "minor|moderate|major|contraindicated",
"description": "Brief description of the interaction",
"recommendation": "Clinical recommendation"
}

If no significant interaction, respond with:
{"hasInteraction": false}`;

    const response = await aiGateway.request({
      tenantId: 'system',
      userId: 'system',
      model: 'claude',
      prompt,
      temperature: 0.1,
    });

    if (response.success) {
      try {
        const result = JSON.parse(response.content!);
        if (result.hasInteraction) {
          // Cache for future use
          await prisma.drugInteraction.create({
            data: {
              drug1,
              drug2,
              severity: result.severity,
              description: result.description,
              recommendation: result.recommendation,
              source: 'ai_generated',
            },
          });

          return {
            drug1,
            drug2,
            severity: result.severity,
            description: result.description,
            recommendation: result.recommendation,
          };
        }
      } catch {}
    }

    return null;

}
}

export const drugInteractionService = new DrugInteractionService();

```

```

### Diagnosis Suggestions

```typescript
// lib/ai/clinical/diagnosis-suggestions.ts

export interface DiagnosisSuggestion {
  icdCode: string;
  description: string;
  confidence: "high" | "medium" | "low";
  reasoning: string;
}

export class DiagnosisSuggestionService {
  async suggestDiagnoses(input: {
    symptoms: string[];
    vitals?: Record<string, number>;
    labResults?: Array<{
      test: string;
      value: number;
      unit: string;
      normal: string;
    }>;
    patientAge: number;
    patientGender: string;
  }): Promise<DiagnosisSuggestion[]> {
    const prompt = `Based on the following clinical information, suggest possible diagnoses with ICD-10 codes.

PATIENT:
- Age: ${input.patientAge} years
- Gender: ${input.patientGender}

SYMPTOMS:
${input.symptoms.map((s) => `- ${s}`).join("\n")}

${
  input.vitals
    ? `VITALS:
${Object.entries(input.vitals)
  .map(([k, v]) => `- ${k}: ${v}`)
  .join("\n")}`
    : ""
}

${
  input.labResults
    ? `LAB RESULTS:
${input.labResults.map((l) => `- ${l.test}: ${l.value} ${l.unit} (Normal: ${l.normal})`).join("\n")}`
    : ""
}

Provide up to 5 differential diagnoses ranked by likelihood. Format as JSON:
[
  {
    "icdCode": "J06.9",
    "description": "Acute upper respiratory infection",
    "confidence": "high|medium|low",
    "reasoning": "Brief clinical reasoning"
  }
]

IMPORTANT: These are SUGGESTIONS only. Final diagnosis must be made by the treating physician.`;

    const response = await aiGateway.request({
      tenantId: "system",
      userId: "system",
      model: "claude",
      prompt,
      temperature: 0.2,
    });

    if (!response.success) return [];

    try {
      const suggestions = JSON.parse(response.content!);
      return suggestions.slice(0, 5);
    } catch {
      return [];
    }
  }
}

export const diagnosisSuggestionService = new DiagnosisSuggestionService();
```

---

## 5. Predictive Analytics

### No-Show Prediction

```typescript
// lib/ai/predictions/no-show.ts
import { prisma } from "@/lib/prisma";

export interface NoShowPrediction {
  patientId: string;
  appointmentId: string;
  probability: number;
  riskLevel: "low" | "medium" | "high";
  factors: string[];
  recommendation: string;
}
```

export class NoShowPredictionService {
async predictNoShow(appointmentId: string): Promise<NoShowPrediction> {
const appointment = await prisma.appointment.findUnique({
where: { id: appointmentId },
include: {
patient: true,
doctor: true,
},
});

    if (!appointment) {
      throw new Error('Appointment not found');
    }

    // Get patient history
    const patientHistory = await prisma.appointment.findMany({
      where: {
        patientId: appointment.patientId,
        date: { lt: appointment.date },
      },
      orderBy: { date: 'desc' },
      take: 20,
    });

    // Calculate features
    const features = this.calculateFeatures(appointment, patientHistory);

    // Simple rule-based model (can be replaced with ML model)
    const probability = this.calculateProbability(features);
    const riskLevel = probability > 0.6 ? 'high' : probability > 0.3 ? 'medium' : 'low';

    const factors: string[] = [];
    if (features.noShowRate > 0.2) factors.push('History of no-shows');
    if (features.daysSinceLastVisit > 180) factors.push('Long gap since last visit');
    if (features.isWeekend) factors.push('Weekend appointment');
    if (features.leadTimeDays > 14) factors.push('Booked far in advance');

    const recommendation = this.getRecommendation(riskLevel, factors);

    return {
      patientId: appointment.patientId,
      appointmentId,
      probability,
      riskLevel,
      factors,
      recommendation,
    };

}

private calculateFeatures(appointment: any, history: any[]) {
const totalAppointments = history.length;
const noShows = history.filter(a => a.status === 'no_show').length;
const noShowRate = totalAppointments > 0 ? noShows / totalAppointments : 0;

    const lastVisit = history.find(a => a.status === 'completed');
    const daysSinceLastVisit = lastVisit
      ? Math.floor((appointment.date.getTime() - lastVisit.date.getTime()) / (1000 * 60 * 60 * 24))
      : 365;

    const appointmentDay = appointment.date.getDay();
    const isWeekend = appointmentDay === 0 || appointmentDay === 6;

    const leadTimeDays = Math.floor(
      (appointment.date.getTime() - appointment.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      noShowRate,
      totalAppointments,
      daysSinceLastVisit,
      isWeekend,
      leadTimeDays,
      appointmentHour: appointment.startTime.getHours(),
    };

}

private calculateProbability(features: any): number {
let score = 0.1; // Base probability

    // Historical no-show rate (strongest predictor)
    score += features.noShowRate * 0.4;

    // Days since last visit
    if (features.daysSinceLastVisit > 180) score += 0.15;
    else if (features.daysSinceLastVisit > 90) score += 0.08;

    // Weekend appointments
    if (features.isWeekend) score += 0.1;

    // Lead time
    if (features.leadTimeDays > 14) score += 0.1;
    else if (features.leadTimeDays > 7) score += 0.05;

    // Early morning or late evening
    if (features.appointmentHour < 9 || features.appointmentHour > 18) score += 0.05;

    return Math.min(score, 0.95);

}

private getRecommendation(riskLevel: string, factors: string[]): string {
switch (riskLevel) {
case 'high':
return 'Consider requiring prepayment or sending additional reminders. Call patient 24 hours before.';
case 'medium':
return 'Send reminder via WhatsApp and SMS. Consider confirmation call.';
default:
return 'Standard reminder protocol sufficient.';
}
}
}

export const noShowPrediction = new NoShowPredictionService();

````

### Readmission Risk

```typescript
// lib/ai/predictions/readmission.ts

export interface ReadmissionRisk {
  patientId: string;
  admissionId: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  factors: string[];
  interventions: string[];
}

export class ReadmissionRiskService {
  async assessRisk(admissionId: string): Promise<ReadmissionRisk> {
    const admission = await prisma.admission.findUnique({
      where: { id: admissionId },
      include: {
        patient: {
          include: {
            admissions: { orderBy: { admitDate: 'desc' }, take: 5 },
          },
        },
        diagnoses: true,
      },
    });

    if (!admission) throw new Error('Admission not found');

    const factors: string[] = [];
    let riskScore = 0;

    // Age factor
    const age = this.calculateAge(admission.patient.dateOfBirth);
    if (age > 75) {
      riskScore += 0.15;
      factors.push('Age > 75 years');
    } else if (age > 65) {
      riskScore += 0.08;
      factors.push('Age > 65 years');
    }
````

    // Previous admissions
    const recentAdmissions = admission.patient.admissions.filter(
      a => a.id !== admissionId &&
      a.dischargeDate &&
      (new Date().getTime() - a.dischargeDate.getTime()) < 365 * 24 * 60 * 60 * 1000
    );

    if (recentAdmissions.length >= 2) {
      riskScore += 0.2;
      factors.push('Multiple admissions in past year');
    } else if (recentAdmissions.length === 1) {
      riskScore += 0.1;
      factors.push('Previous admission in past year');
    }

    // Chronic conditions
    const chronicConditions = admission.patient.chronicConditions || [];
    if (chronicConditions.length >= 3) {
      riskScore += 0.15;
      factors.push('Multiple chronic conditions');
    }

    // Length of stay
    const los = admission.dischargeDate
      ? Math.ceil((admission.dischargeDate.getTime() - admission.admitDate.getTime()) / (1000 * 60 * 60 * 24))
      : 0;
    if (los > 7) {
      riskScore += 0.1;
      factors.push('Extended length of stay');
    }

    // High-risk diagnoses
    const highRiskDiagnoses = ['heart failure', 'copd', 'pneumonia', 'diabetes'];
    const hasHighRiskDiagnosis = admission.diagnoses.some(d =>
      highRiskDiagnoses.some(hr => d.description.toLowerCase().includes(hr))
    );
    if (hasHighRiskDiagnosis) {
      riskScore += 0.15;
      factors.push('High-risk diagnosis');
    }

    const riskLevel = riskScore > 0.5 ? 'high' : riskScore > 0.25 ? 'medium' : 'low';
    const interventions = this.getInterventions(riskLevel, factors);

    return {
      patientId: admission.patientId,
      admissionId,
      riskScore: Math.min(riskScore, 0.95),
      riskLevel,
      factors,
      interventions,
    };

}

private getInterventions(riskLevel: string, factors: string[]): string[] {
const interventions: string[] = [];

    if (riskLevel === 'high') {
      interventions.push('Schedule follow-up within 7 days of discharge');
      interventions.push('Arrange home health visit');
      interventions.push('Medication reconciliation before discharge');
      interventions.push('Patient education on warning signs');
    } else if (riskLevel === 'medium') {
      interventions.push('Schedule follow-up within 14 days');
      interventions.push('Phone call check-in at 48 hours post-discharge');
    }

    if (factors.includes('Multiple chronic conditions')) {
      interventions.push('Care coordination with specialists');
    }

    return interventions;

}

private calculateAge(dob: Date | null): number {
if (!dob) return 0;
const today = new Date();
let age = today.getFullYear() - dob.getFullYear();
const monthDiff = today.getMonth() - dob.getMonth();
if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
age--;
}
return age;
}
}

export const readmissionRisk = new ReadmissionRiskService();

```

```

---

## 6. AI Safety Guidelines

### Human Oversight Requirements

```typescript
// All AI outputs must be marked as suggestions
interface AIOutput {
  content: any;
  isAISuggestion: true;
  requiresReview: boolean;
  reviewedBy?: string;
  reviewedAt?: Date;
  approved?: boolean;
}

// Audit all AI decisions
async function auditAIDecision(params: {
  tenantId: string;
  userId: string;
  aiFeature: string;
  input: any;
  output: any;
  action: "accepted" | "modified" | "rejected";
  modifications?: any;
}) {
  await prisma.aiAuditLog.create({
    data: {
      tenantId: params.tenantId,
      userId: params.userId,
      feature: params.aiFeature,
      input: params.input,
      output: params.output,
      action: params.action,
      modifications: params.modifications,
      timestamp: new Date(),
    },
  });
}
```

### Disclaimer Requirements

All AI-generated content must include:

```typescript
const AI_DISCLAIMER = {
  scribe:
    "This clinical note was generated by AI and requires physician review and approval before becoming part of the medical record.",
  diagnosis:
    "AI-suggested diagnoses are for reference only. Final diagnosis must be made by the treating physician based on clinical judgment.",
  drugInteraction:
    "Drug interaction alerts are generated using AI and database lookups. Always verify with current pharmacological references.",
  prediction:
    "Risk predictions are statistical estimates and should not replace clinical assessment.",
};
```

---

## 7. Best Practices

### Do's

- Always mark AI outputs as suggestions requiring review
- Log all AI interactions for audit
- Provide confidence levels with predictions
- Allow easy override/modification of AI suggestions
- Use AI to augment, not replace, clinical judgment

### Don'ts

- Never auto-approve AI-generated clinical content
- Don't hide AI involvement from users
- Don't use AI for final clinical decisions
- Don't store PHI in AI prompts longer than necessary
- Don't bypass human review for high-stakes decisions
