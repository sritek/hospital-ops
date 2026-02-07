---
# ABDM integration patterns - ABHA, FHIR, consent management
inclusion: fileMatch
fileMatchPattern: "apps/api/src/modules/integrations/abdm/**/*.ts, apps/api/src/**/*abdm*.ts, apps/api/src/**/*fhir*.ts"
---

# ABDM Integration Guide

## Overview

This document covers integration with India's Ayushman Bharat Digital Mission (ABDM) ecosystem, including ABHA verification, FHIR data exchange, and consent management.

---

## 1. ABDM Architecture

### Components

```
┌─────────────────────────────────────────────────────────────────┐
│                    ABDM Ecosystem                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │    ABHA     │    │     HFR     │    │     HPR     │         │
│  │  (Patient   │    │  (Facility  │    │ (Provider   │         │
│  │   Health    │    │  Registry)  │    │  Registry)  │         │
│  │   Account)  │    │             │    │             │         │
│  └─────────────┘    └─────────────┘    └─────────────┘         │
│         │                  │                  │                  │
│         └──────────────────┼──────────────────┘                  │
│                            │                                     │
│                    ┌───────▼───────┐                            │
│                    │   HIE-CM      │                            │
│                    │  (Consent     │                            │
│                    │   Manager)    │                            │
│                    └───────────────┘                            │
│                            │                                     │
│              ┌─────────────┼─────────────┐                      │
│              │             │             │                      │
│        ┌─────▼─────┐ ┌─────▼─────┐ ┌─────▼─────┐               │
│        │    HIP    │ │    HIU    │ │   HCXP    │               │
│        │ (Provider)│ │  (User)   │ │ (Claims)  │               │
│        └───────────┘ └───────────┘ └───────────┘               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

Hospital-Ops acts as both HIP (Health Information Provider)
and HIU (Health Information User)
```

---

## 2. ABDM Configuration

```typescript
// config/abdm.config.ts
export const abdmConfig = {
  // Environment
  environment: process.env.ABDM_ENV || "sandbox", // sandbox | production

  // Base URLs
  baseUrl: {
    sandbox: "https://dev.abdm.gov.in",
    production: "https://abdm.gov.in",
  },

  // API Endpoints
  endpoints: {
    abha: {
      generateOtp: "/api/v3/enrollment/request/otp",
      verifyOtp: "/api/v3/enrollment/auth/byAbdm",
      createAbha: "/api/v3/enrollment/enrol/byAadhaar",
      getProfile: "/api/v3/profile/account",
    },
    hip: {
      linkCareContext: "/v0.5/links/link/add-contexts",
      onDiscover: "/v0.5/care-contexts/discover",
      onLinkInit: "/v0.5/links/link/init",
      onLinkConfirm: "/v0.5/links/link/confirm",
    },
    hiu: {
      consentRequest: "/v0.5/consent-requests/init",
      consentFetch: "/v0.5/consents/fetch",
      healthInfoRequest: "/v0.5/health-information/cm/request",
    },
  },

  // Credentials
  clientId: process.env.ABDM_CLIENT_ID!,
  clientSecret: process.env.ABDM_CLIENT_SECRET!,

  // Facility Details
  facilityId: process.env.ABDM_FACILITY_ID!, // HFR ID
  hipId: process.env.ABDM_HIP_ID!,
  hiuId: process.env.ABDM_HIU_ID!,

  // Callback URLs
  callbackUrl: process.env.ABDM_CALLBACK_URL!,

  // Token expiry
  tokenExpiryBuffer: 300, // 5 minutes before actual expiry
};
```

---

## 3. ABHA Service

### ABHA Verification & Creation

```typescript
// modules/integrations/abdm/abha.service.ts
import axios from "axios";
import { abdmConfig } from "@/config/abdm.config";
import { redis } from "@/lib/redis";
import { AppError } from "@/common/errors/app-error";

export class AbhaService {
  private baseUrl: string;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor() {
    this.baseUrl =
      abdmConfig.baseUrl[
        abdmConfig.environment as keyof typeof abdmConfig.baseUrl
      ];
  }

  // Get access token with caching
  private async getAccessToken(): Promise<string> {
    const now = Date.now();

    // Check cached token
    if (this.accessToken && this.tokenExpiry > now) {
      return this.accessToken;
    }

    // Check Redis cache
    const cachedToken = await redis.get("abdm:access_token");
    if (cachedToken) {
      const { token, expiry } = JSON.parse(cachedToken);
      if (expiry > now) {
        this.accessToken = token;
        this.tokenExpiry = expiry;
        return token;
      }
    }

    // Fetch new token
    const response = await axios.post(`${this.baseUrl}/gateway/v0.5/sessions`, {
      clientId: abdmConfig.clientId,
      clientSecret: abdmConfig.clientSecret,
    });

    const { accessToken, expiresIn } = response.data;
    const expiry = now + (expiresIn - abdmConfig.tokenExpiryBuffer) * 1000;

    // Cache token
    this.accessToken = accessToken;
    this.tokenExpiry = expiry;
    await redis.setex(
      "abdm:access_token",
      expiresIn - abdmConfig.tokenExpiryBuffer,
      JSON.stringify({ token: accessToken, expiry }),
    );

    return accessToken;
  }

  // Generate OTP for ABHA verification
  async generateOtp(abhaNumber: string): Promise<{ txnId: string }> {
    const token = await this.getAccessToken();

    try {
      const response = await axios.post(
        `${this.baseUrl}${abdmConfig.endpoints.abha.generateOtp}`,
        {
          scope: ["abha-enrol"],
          loginHint: "abha-number",
          loginId: abhaNumber,
          otpSystem: "abdm",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-CM-ID": abdmConfig.hipId,
          },
        },
      );

      return { txnId: response.data.txnId };
    } catch (error: any) {
      throw new AppError(
        "ABDM_ERROR",
        error.response?.data?.message || "Failed to generate OTP",
        400,
      );
    }
  }

  // Verify OTP and get ABHA profile
  async verifyOtp(txnId: string, otp: string): Promise<AbhaProfile> {
    const token = await this.getAccessToken();

    try {
      const response = await axios.post(
        `${this.baseUrl}${abdmConfig.endpoints.abha.verifyOtp}`,
        {
          scope: ["abha-enrol"],
          authData: {
            authMethods: ["otp"],
            otp: {
              txnId,
              otpValue: otp,
            },
          },
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-CM-ID": abdmConfig.hipId,
          },
        },
      );

      return this.mapAbhaProfile(response.data);
    } catch (error: any) {
      throw new AppError(
        "ABHA_VERIFICATION_FAILED",
        error.response?.data?.message || "OTP verification failed",
        400,
      );
    }
  }

  // Create new ABHA via Aadhaar
  async createAbhaViaAadhaar(
    aadhaarNumber: string,
    txnId: string,
    otp: string,
  ): Promise<AbhaProfile> {
    const token = await this.getAccessToken();

    try {
      const response = await axios.post(
        `${this.baseUrl}${abdmConfig.endpoints.abha.createAbha}`,
        {
          txnId,
          authData: {
            authMethods: ["otp"],
            otp: {
              txnId,
              otpValue: otp,
            },
          },
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-CM-ID": abdmConfig.hipId,
          },
        },
      );

      return this.mapAbhaProfile(response.data);
    } catch (error: any) {
      throw new AppError(
        "ABHA_CREATION_FAILED",
        error.response?.data?.message || "ABHA creation failed",
        400,
      );
    }
  }

  // Get ABHA profile
  async getProfile(abhaToken: string): Promise<AbhaProfile> {
    const token = await this.getAccessToken();

    try {
      const response = await axios.get(
        `${this.baseUrl}${abdmConfig.endpoints.abha.getProfile}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Token": `Bearer ${abhaToken}`,
          },
        },
      );

      return this.mapAbhaProfile(response.data);
    } catch (error: any) {
      throw new AppError(
        "ABDM_ERROR",
        error.response?.data?.message || "Failed to fetch profile",
        400,
      );
    }
  }

  private mapAbhaProfile(data: any): AbhaProfile {
    return {
      abhaNumber: data.ABHANumber || data.healthIdNumber,
      abhaAddress: data.preferredAbhaAddress || data.healthId,
      name: data.name,
      firstName: data.firstName,
      middleName: data.middleName,
      lastName: data.lastName,
      gender: data.gender,
      dateOfBirth: data.dayOfBirth
        ? `${data.yearOfBirth}-${data.monthOfBirth}-${data.dayOfBirth}`
        : null,
      mobile: data.mobile,
      email: data.email,
      address: data.address,
      state: data.stateName,
      district: data.districtName,
      pincode: data.pincode,
      photo: data.profilePhoto,
      kycVerified: data.kycVerified,
    };
  }
}

export interface AbhaProfile {
  abhaNumber: string;
  abhaAddress: string;
  name: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  gender: string;
  dateOfBirth: string | null;
  mobile: string;
  email?: string;
  address?: string;
  state?: string;
  district?: string;
  pincode?: string;
  photo?: string;
  kycVerified: boolean;
}
```

---

## 4. FHIR Data Transformation

### FHIR Bundle Generator

```typescript
// modules/integrations/abdm/fhir/fhir.service.ts
import { v4 as uuidv4 } from "uuid";

export class FhirService {
  // Generate FHIR Bundle for OPD Visit
  generateOpdBundle(consultation: ConsultationWithRelations): FhirBundle {
    const bundleId = uuidv4();
    const entries: FhirBundleEntry[] = [];

    // Patient resource
    entries.push(this.createPatientResource(consultation.patient));

    // Practitioner resource
    entries.push(this.createPractitionerResource(consultation.doctor));

    // Encounter resource
    entries.push(this.createEncounterResource(consultation));

    // Condition resources (diagnoses)
    for (const diagnosis of consultation.diagnoses || []) {
      entries.push(this.createConditionResource(diagnosis, consultation));
    }

    // Observation resources (vitals)
    if (consultation.vitals) {
      entries.push(
        ...this.createVitalObservations(consultation.vitals, consultation),
      );
    }

    // MedicationRequest resources (prescriptions)
    for (const item of consultation.prescription?.items || []) {
      entries.push(this.createMedicationRequest(item, consultation));
    }

    return {
      resourceType: "Bundle",
      id: bundleId,
      meta: {
        lastUpdated: new Date().toISOString(),
        profile: [
          "https://nrces.in/ndhm/fhir/r4/StructureDefinition/DocumentBundle",
        ],
      },
      identifier: {
        system: "https://hospitalops.in/bundle",
        value: bundleId,
      },
      type: "document",
      timestamp: new Date().toISOString(),
      entry: entries,
    };
  }

  // Patient Resource
  private createPatientResource(patient: Patient): FhirBundleEntry {
    return {
      fullUrl: `Patient/${patient.id}`,
      resource: {
        resourceType: "Patient",
        id: patient.id,
        meta: {
          profile: [
            "https://nrces.in/ndhm/fhir/r4/StructureDefinition/Patient",
          ],
        },
        identifier: [
          ...(patient.abhaNumber
            ? [
                {
                  type: {
                    coding: [
                      {
                        system: "https://ndhm.gov.in/identifier",
                        code: "ABHA",
                      },
                    ],
                  },
                  system: "https://healthid.ndhm.gov.in",
                  value: patient.abhaNumber,
                },
              ]
            : []),
          {
            type: {
              coding: [
                {
                  system: "http://terminology.hl7.org/CodeSystem/v2-0203",
                  code: "MR",
                },
              ],
            },
            system: "https://hospitalops.in/patient",
            value: patient.id,
          },
        ],
        name: [
          {
            text: patient.name,
            family: patient.name.split(" ").pop(),
            given: patient.name.split(" ").slice(0, -1),
          },
        ],
        telecom: [
          {
            system: "phone",
            value: patient.phone,
            use: "mobile",
          },
        ],
        gender: this.mapGender(patient.gender),
        birthDate: patient.dateOfBirth?.toISOString().split("T")[0],
      },
    };
  }

  // Practitioner Resource
  private createPractitionerResource(doctor: User): FhirBundleEntry {
    return {
      fullUrl: `Practitioner/${doctor.id}`,
      resource: {
        resourceType: "Practitioner",
        id: doctor.id,
        meta: {
          profile: [
            "https://nrces.in/ndhm/fhir/r4/StructureDefinition/Practitioner",
          ],
        },
        identifier: [
          ...(doctor.hprId
            ? [
                {
                  type: {
                    coding: [
                      {
                        system: "https://ndhm.gov.in/identifier",
                        code: "HPR",
                      },
                    ],
                  },
                  system: "https://hpr.ndhm.gov.in",
                  value: doctor.hprId,
                },
              ]
            : []),
          ...(doctor.registrationNumber
            ? [
                {
                  type: {
                    coding: [
                      {
                        system: "http://terminology.hl7.org/CodeSystem/v2-0203",
                        code: "MD",
                      },
                    ],
                  },
                  system: `https://mci.gov.in/${doctor.registrationCouncil}`,
                  value: doctor.registrationNumber,
                },
              ]
            : []),
        ],
        name: [
          {
            text: doctor.name,
            prefix: ["Dr."],
          },
        ],
        qualification: doctor.qualification
          ? [
              {
                code: {
                  text: doctor.qualification,
                },
              },
            ]
          : undefined,
      },
    };
  }

  // Encounter Resource
  private createEncounterResource(
    consultation: ConsultationWithRelations,
  ): FhirBundleEntry {
    return {
      fullUrl: `Encounter/${consultation.id}`,
      resource: {
        resourceType: "Encounter",
        id: consultation.id,
        meta: {
          profile: [
            "https://nrces.in/ndhm/fhir/r4/StructureDefinition/Encounter",
          ],
        },
        status: "finished",
        class: {
          system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
          code: consultation.isTelemedicine ? "VR" : "AMB",
          display: consultation.isTelemedicine ? "Virtual" : "Ambulatory",
        },
        subject: {
          reference: `Patient/${consultation.patientId}`,
        },
        participant: [
          {
            individual: {
              reference: `Practitioner/${consultation.doctorId}`,
            },
          },
        ],
        period: {
          start: consultation.startedAt?.toISOString(),
          end: consultation.completedAt?.toISOString(),
        },
        reasonCode: consultation.chiefComplaints
          ? [
              {
                text: consultation.chiefComplaints,
              },
            ]
          : undefined,
      },
    };
  }

  // Condition Resource (Diagnosis)
  private createConditionResource(
    diagnosis: { code: string; description: string; type: string },
    consultation: ConsultationWithRelations,
  ): FhirBundleEntry {
    const conditionId = uuidv4();
    return {
      fullUrl: `Condition/${conditionId}`,
      resource: {
        resourceType: "Condition",
        id: conditionId,
        meta: {
          profile: [
            "https://nrces.in/ndhm/fhir/r4/StructureDefinition/Condition",
          ],
        },
        clinicalStatus: {
          coding: [
            {
              system:
                "http://terminology.hl7.org/CodeSystem/condition-clinical",
              code: "active",
            },
          ],
        },
        code: {
          coding: [
            {
              system: "http://hl7.org/fhir/sid/icd-10",
              code: diagnosis.code,
              display: diagnosis.description,
            },
          ],
          text: diagnosis.description,
        },
        subject: {
          reference: `Patient/${consultation.patientId}`,
        },
        encounter: {
          reference: `Encounter/${consultation.id}`,
        },
        recordedDate: consultation.createdAt.toISOString(),
      },
    };
  }

  // Vital Observations
  private createVitalObservations(
    vitals: Vital,
    consultation: ConsultationWithRelations,
  ): FhirBundleEntry[] {
    const entries: FhirBundleEntry[] = [];

    const vitalMappings = [
      {
        value: vitals.temperature,
        code: "8310-5",
        display: "Body temperature",
        unit: "Cel",
      },
      {
        value: vitals.bloodPressureSystolic,
        code: "8480-6",
        display: "Systolic BP",
        unit: "mm[Hg]",
      },
      {
        value: vitals.bloodPressureDiastolic,
        code: "8462-4",
        display: "Diastolic BP",
        unit: "mm[Hg]",
      },
      {
        value: vitals.pulseRate,
        code: "8867-4",
        display: "Heart rate",
        unit: "/min",
      },
      {
        value: vitals.respiratoryRate,
        code: "9279-1",
        display: "Respiratory rate",
        unit: "/min",
      },
      {
        value: vitals.oxygenSaturation,
        code: "2708-6",
        display: "Oxygen saturation",
        unit: "%",
      },
      {
        value: vitals.weight,
        code: "29463-7",
        display: "Body weight",
        unit: "kg",
      },
      {
        value: vitals.height,
        code: "8302-2",
        display: "Body height",
        unit: "cm",
      },
    ];

    for (const mapping of vitalMappings) {
      if (mapping.value != null) {
        const obsId = uuidv4();
        entries.push({
          fullUrl: `Observation/${obsId}`,
          resource: {
            resourceType: "Observation",
            id: obsId,
            meta: {
              profile: [
                "https://nrces.in/ndhm/fhir/r4/StructureDefinition/Observation",
              ],
            },
            status: "final",
            code: {
              coding: [
                {
                  system: "http://loinc.org",
                  code: mapping.code,
                  display: mapping.display,
                },
              ],
            },
            subject: {
              reference: `Patient/${consultation.patientId}`,
            },
            encounter: {
              reference: `Encounter/${consultation.id}`,
            },
            effectiveDateTime: vitals.recordedAt.toISOString(),
            valueQuantity: {
              value: Number(mapping.value),
              unit: mapping.unit,
              system: "http://unitsofmeasure.org",
              code: mapping.unit,
            },
          },
        });
      }
    }

    return entries;
  }

  // MedicationRequest Resource
  private createMedicationRequest(
    item: PrescriptionItem,
    consultation: ConsultationWithRelations,
  ): FhirBundleEntry {
    return {
      fullUrl: `MedicationRequest/${item.id}`,
      resource: {
        resourceType: "MedicationRequest",
        id: item.id,
        meta: {
          profile: [
            "https://nrces.in/ndhm/fhir/r4/StructureDefinition/MedicationRequest",
          ],
        },
        status: "active",
        intent: "order",
        medicationCodeableConcept: {
          text: item.drugName,
        },
        subject: {
          reference: `Patient/${consultation.patientId}`,
        },
        encounter: {
          reference: `Encounter/${consultation.id}`,
        },
        authoredOn: consultation.createdAt.toISOString(),
        requester: {
          reference: `Practitioner/${consultation.doctorId}`,
        },
        dosageInstruction: [
          {
            text: `${item.dosage} ${item.frequency} for ${item.duration} ${item.durationUnit}`,
            timing: {
              code: {
                text: item.frequency,
              },
            },
            route: item.route
              ? {
                  coding: [
                    {
                      system: "http://snomed.info/sct",
                      display: item.route,
                    },
                  ],
                }
              : undefined,
            doseAndRate: [
              {
                doseQuantity: {
                  value: item.quantity,
                },
              },
            ],
          },
        ],
        dispenseRequest: {
          quantity: {
            value: item.quantity,
          },
        },
      },
    };
  }

  private mapGender(gender?: string): string {
    const genderMap: Record<string, string> = {
      male: "male",
      female: "female",
      other: "other",
    };
    return genderMap[gender?.toLowerCase() || ""] || "unknown";
  }
}

// Types
interface FhirBundle {
  resourceType: "Bundle";
  id: string;
  meta: any;
  identifier: any;
  type: string;
  timestamp: string;
  entry: FhirBundleEntry[];
}

interface FhirBundleEntry {
  fullUrl: string;
  resource: any;
}
```

---

## 5. Consent Management

### Consent Service

```typescript
// modules/integrations/abdm/consent.service.ts
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import { abdmConfig } from "@/config/abdm.config";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/common/errors/app-error";

export class ConsentService {
  private baseUrl: string;

  constructor(private abhaService: AbhaService) {
    this.baseUrl =
      abdmConfig.baseUrl[
        abdmConfig.environment as keyof typeof abdmConfig.baseUrl
      ];
  }

  // Request consent from patient (as HIU)
  async requestConsent(
    params: ConsentRequestParams,
  ): Promise<{ requestId: string }> {
    const token = await this.abhaService.getAccessToken();
    const requestId = uuidv4();

    const consentRequest = {
      requestId,
      timestamp: new Date().toISOString(),
      consent: {
        purpose: {
          text: params.purpose,
          code: params.purposeCode,
          refUri: "https://ndhm.gov.in/purpose",
        },
        patient: {
          id: params.patientAbhaAddress,
        },
        hiu: {
          id: abdmConfig.hiuId,
        },
        requester: {
          name: params.requesterName,
          identifier: {
            type: "REGNO",
            value: params.requesterRegNo,
            system: "https://mci.gov.in",
          },
        },
        hiTypes: params.hiTypes,
        permission: {
          accessMode: "VIEW",
          dateRange: {
            from: params.dataFromDate,
            to: params.dataToDate,
          },
          dataEraseAt: params.consentExpiryDate,
          frequency: {
            unit: "HOUR",
            value: 1,
            repeats: 0,
          },
        },
      },
    };

    try {
      await axios.post(
        `${this.baseUrl}${abdmConfig.endpoints.hiu.consentRequest}`,
        consentRequest,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-CM-ID": abdmConfig.hiuId,
          },
        },
      );

      // Store consent request
      await prisma.patientConsent.create({
        data: {
          tenantId: params.tenantId,
          patientId: params.patientId,
          consentId: requestId,
          consentType: "data_sharing",
          purpose: params.purpose,
          requesterName: params.requesterName,
          requesterId: abdmConfig.hiuId,
          expiresAt: new Date(params.consentExpiryDate),
          dataFromDate: new Date(params.dataFromDate),
          dataToDate: new Date(params.dataToDate),
          hiTypes: params.hiTypes,
          status: "requested",
        },
      });

      return { requestId };
    } catch (error: any) {
      throw new AppError(
        "CONSENT_REQUEST_FAILED",
        error.response?.data?.message || "Failed to request consent",
        400,
      );
    }
  }

  // Handle consent notification callback (from ABDM)
  async handleConsentNotification(notification: ConsentNotification) {
    const { consentRequestId, status, consentArtefacts } = notification;

    // Update consent status
    await prisma.patientConsent.updateMany({
      where: { consentId: consentRequestId },
      data: {
        status: status === "GRANTED" ? "active" : "denied",
        consentArtifact: consentArtefacts?.[0] || null,
        grantedAt: status === "GRANTED" ? new Date() : undefined,
      },
    });

    // Log transaction
    await prisma.abdmTransaction.create({
      data: {
        tenantId: notification.tenantId,
        transactionId: uuidv4(),
        transactionType: "consent_notification",
        requestPayload: notification as any,
        status: "completed",
        completedAt: new Date(),
      },
    });
  }

  // Fetch health information using consent
  async fetchHealthInfo(consentId: string): Promise<void> {
    const consent = await prisma.patientConsent.findFirst({
      where: { consentId, status: "active" },
    });

    if (!consent) {
      throw AppError.notFound("Active consent");
    }

    const token = await this.abhaService.getAccessToken();
    const transactionId = uuidv4();

    try {
      await axios.post(
        `${this.baseUrl}${abdmConfig.endpoints.hiu.healthInfoRequest}`,
        {
          requestId: uuidv4(),
          timestamp: new Date().toISOString(),
          hiRequest: {
            consent: {
              id: consentId,
            },
            dateRange: {
              from: consent.dataFromDate?.toISOString(),
              to: consent.dataToDate?.toISOString(),
            },
            dataPushUrl: `${abdmConfig.callbackUrl}/abdm/health-info/receive`,
            keyMaterial: this.generateKeyMaterial(),
          },
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-CM-ID": abdmConfig.hiuId,
          },
        },
      );

      // Log transaction
      await prisma.abdmTransaction.create({
        data: {
          tenantId: consent.tenantId,
          transactionId,
          transactionType: "data_fetch",
          status: "initiated",
        },
      });
    } catch (error: any) {
      throw new AppError(
        "HEALTH_INFO_FETCH_FAILED",
        error.response?.data?.message || "Failed to fetch health information",
        400,
      );
    }
  }

  // Revoke consent
  async revokeConsent(tenantId: string, consentId: string) {
    const consent = await prisma.patientConsent.findFirst({
      where: { tenantId, consentId, status: "active" },
    });

    if (!consent) {
      throw AppError.notFound("Active consent");
    }

    await prisma.patientConsent.update({
      where: { id: consent.id },
      data: {
        status: "revoked",
        revokedAt: new Date(),
      },
    });

    // Notify ABDM about revocation (if required)
    // ...
  }

  private generateKeyMaterial() {
    // Generate ECDH key pair for secure data transfer
    // This is a simplified version - production should use proper crypto
    return {
      cryptoAlg: "ECDH",
      curve: "Curve25519",
      dhPublicKey: {
        expiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        parameters: "Curve25519/32byte random key",
        keyValue: "base64-encoded-public-key",
      },
      nonce: "random-nonce",
    };
  }
}

interface ConsentRequestParams {
  tenantId: string;
  patientId: string;
  patientAbhaAddress: string;
  purpose: string;
  purposeCode: string;
  requesterName: string;
  requesterRegNo: string;
  hiTypes: string[];
  dataFromDate: string;
  dataToDate: string;
  consentExpiryDate: string;
}

interface ConsentNotification {
  tenantId: string;
  consentRequestId: string;
  status: "GRANTED" | "DENIED" | "EXPIRED" | "REVOKED";
  consentArtefacts?: any[];
}
```

---

## 6. HIP (Health Information Provider) Service

### Care Context Linking

```typescript
// modules/integrations/abdm/hip.service.ts
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import { abdmConfig } from "@/config/abdm.config";
import { prisma } from "@/lib/prisma";
import { FhirService } from "./fhir/fhir.service";

export class HipService {
  private baseUrl: string;
  private fhirService: FhirService;

  constructor(private abhaService: AbhaService) {
    this.baseUrl =
      abdmConfig.baseUrl[
        abdmConfig.environment as keyof typeof abdmConfig.baseUrl
      ];
    this.fhirService = new FhirService();
  }

  // Link care context to patient's ABHA
  async linkCareContext(params: LinkCareContextParams) {
    const token = await this.abhaService.getAccessToken();

    const careContext = {
      patientReference: params.patientId,
      careContextReference: params.careContextId,
      display: params.display,
    };

    try {
      await axios.post(
        `${this.baseUrl}${abdmConfig.endpoints.hip.linkCareContext}`,
        {
          requestId: uuidv4(),
          timestamp: new Date().toISOString(),
          link: {
            accessToken: params.patientAbhaToken,
            patient: {
              referenceNumber: params.patientId,
              display: params.patientName,
              careContexts: [careContext],
            },
          },
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-CM-ID": abdmConfig.hipId,
          },
        },
      );

      // Update health record as linked
      await prisma.healthRecord.updateMany({
        where: { recordId: params.careContextId },
        data: {
          linkedToAbdm: true,
          linkedAt: new Date(),
          careContextId: params.careContextId,
        },
      });

      return { success: true };
    } catch (error: any) {
      throw new AppError(
        "LINK_CARE_CONTEXT_FAILED",
        error.response?.data?.message || "Failed to link care context",
        400,
      );
    }
  }

  // Handle patient discovery request (callback from ABDM)
  async handleDiscovery(request: DiscoveryRequest): Promise<DiscoveryResponse> {
    const { patient, requestId } = request;

    // Search for patient by identifiers
    let foundPatient = null;

    // Try ABHA number first
    if (patient.id) {
      foundPatient = await prisma.patient.findFirst({
        where: {
          OR: [{ abhaNumber: patient.id }, { abhaAddress: patient.id }],
          deletedAt: null,
        },
        include: {
          consultations: {
            where: { deletedAt: null },
            orderBy: { createdAt: "desc" },
            take: 10,
          },
          admissions: {
            where: { deletedAt: null },
            orderBy: { admissionDate: "desc" },
            take: 5,
          },
          labOrders: {
            where: { deletedAt: null },
            orderBy: { orderDate: "desc" },
            take: 10,
          },
        },
      });
    }

    // Try phone + name if ABHA not found
    if (!foundPatient && patient.verifiedIdentifiers) {
      const mobile = patient.verifiedIdentifiers.find(
        (i: any) => i.type === "MOBILE",
      )?.value;
      if (mobile) {
        foundPatient = await prisma.patient.findFirst({
          where: {
            phone: mobile,
            name: { contains: patient.name, mode: "insensitive" },
            deletedAt: null,
          },
          include: {
            consultations: { where: { deletedAt: null }, take: 10 },
            admissions: { where: { deletedAt: null }, take: 5 },
            labOrders: { where: { deletedAt: null }, take: 10 },
          },
        });
      }
    }

    if (!foundPatient) {
      return {
        requestId,
        transactionId: request.transactionId,
        patient: null,
        matchedBy: [],
      };
    }

    // Build care contexts from patient records
    const careContexts = this.buildCareContexts(foundPatient);

    return {
      requestId,
      transactionId: request.transactionId,
      patient: {
        referenceNumber: foundPatient.id,
        display: foundPatient.name,
        careContexts,
        matchedBy: ["MOBILE", "NAME"],
      },
    };
  }

  // Handle link init request (callback from ABDM)
  async handleLinkInit(request: LinkInitRequest): Promise<void> {
    // Store link request for confirmation
    await prisma.abdmTransaction.create({
      data: {
        tenantId: request.tenantId,
        transactionId: request.transactionId,
        transactionType: "link_init",
        requestPayload: request as any,
        status: "processing",
      },
    });

    // Send OTP to patient for confirmation
    // This would trigger an OTP flow
  }

  // Handle link confirm (after patient confirms via OTP)
  async handleLinkConfirm(transactionId: string, otp: string): Promise<void> {
    const transaction = await prisma.abdmTransaction.findFirst({
      where: { transactionId, transactionType: "link_init" },
    });

    if (!transaction) {
      throw AppError.notFound("Link transaction");
    }

    const token = await this.abhaService.getAccessToken();

    // Confirm link with ABDM
    await axios.post(
      `${this.baseUrl}${abdmConfig.endpoints.hip.onLinkConfirm}`,
      {
        requestId: uuidv4(),
        timestamp: new Date().toISOString(),
        confirmation: {
          linkRefNumber: transactionId,
          token: otp,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-CM-ID": abdmConfig.hipId,
        },
      },
    );

    // Update transaction status
    await prisma.abdmTransaction.update({
      where: { id: transaction.id },
      data: { status: "completed", completedAt: new Date() },
    });
  }

  // Handle health information request (data push)
  async handleHealthInfoRequest(request: HealthInfoRequest): Promise<void> {
    const { hiRequest, transactionId } = request;

    // Fetch consent details
    const consent = await prisma.patientConsent.findFirst({
      where: { consentId: hiRequest.consent.id, status: "active" },
    });

    if (!consent) {
      throw AppError.forbidden("Invalid or expired consent");
    }

    // Fetch patient records within date range
    const patient = await prisma.patient.findUnique({
      where: { id: consent.patientId },
      include: {
        consultations: {
          where: {
            createdAt: {
              gte: consent.dataFromDate || undefined,
              lte: consent.dataToDate || undefined,
            },
            deletedAt: null,
          },
          include: {
            doctor: true,
            prescription: { include: { items: true } },
          },
        },
        vitals: {
          where: {
            recordedAt: {
              gte: consent.dataFromDate || undefined,
              lte: consent.dataToDate || undefined,
            },
          },
        },
        labOrders: {
          where: {
            orderDate: {
              gte: consent.dataFromDate || undefined,
              lte: consent.dataToDate || undefined,
            },
            deletedAt: null,
          },
          include: { tests: { include: { results: true } } },
        },
      },
    });

    if (!patient) {
      throw AppError.notFound("Patient");
    }

    // Generate FHIR bundles for each care context
    const bundles = [];
    for (const consultation of patient.consultations) {
      const bundle = this.fhirService.generateOpdBundle({
        ...consultation,
        patient,
        vitals: patient.vitals.find(
          (v) =>
            v.recordedAt >= consultation.startedAt! &&
            v.recordedAt <= consultation.completedAt!,
        ),
      } as any);
      bundles.push(bundle);
    }

    // Push data to HIU
    await this.pushHealthInfo(
      transactionId,
      hiRequest.dataPushUrl,
      bundles,
      hiRequest.keyMaterial,
    );
  }

  private async pushHealthInfo(
    transactionId: string,
    dataPushUrl: string,
    bundles: any[],
    keyMaterial: any,
  ) {
    // Encrypt data using key material
    const encryptedData = this.encryptData(bundles, keyMaterial);

    await axios.post(dataPushUrl, {
      transactionId,
      entries: encryptedData.map((data, index) => ({
        content: data,
        media: "application/fhir+json",
        checksum: this.calculateChecksum(data),
        careContextReference: bundles[index].id,
      })),
      keyMaterial: this.generateResponseKeyMaterial(),
    });
  }

  private buildCareContexts(patient: any): CareContext[] {
    const contexts: CareContext[] = [];

    // Add consultations as care contexts
    for (const consultation of patient.consultations || []) {
      contexts.push({
        referenceNumber: consultation.id,
        display: `OPD Visit - ${new Date(consultation.createdAt).toLocaleDateString("en-IN")}`,
      });
    }

    // Add admissions as care contexts
    for (const admission of patient.admissions || []) {
      contexts.push({
        referenceNumber: admission.id,
        display: `IPD Admission - ${new Date(admission.admissionDate).toLocaleDateString("en-IN")}`,
      });
    }

    // Add lab orders as care contexts
    for (const labOrder of patient.labOrders || []) {
      contexts.push({
        referenceNumber: labOrder.id,
        display: `Lab Report - ${new Date(labOrder.orderDate).toLocaleDateString("en-IN")}`,
      });
    }

    return contexts;
  }

  private encryptData(data: any[], keyMaterial: any): string[] {
    // Implement ECDH encryption as per ABDM specs
    // This is a placeholder - production should use proper crypto
    return data.map((d) => Buffer.from(JSON.stringify(d)).toString("base64"));
  }

  private calculateChecksum(data: string): string {
    // Calculate SHA-256 checksum
    const crypto = require("crypto");
    return crypto.createHash("sha256").update(data).digest("hex");
  }

  private generateResponseKeyMaterial() {
    return {
      cryptoAlg: "ECDH",
      curve: "Curve25519",
      dhPublicKey: {
        expiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        parameters: "Curve25519/32byte random key",
        keyValue: "base64-encoded-public-key",
      },
      nonce: "random-nonce",
    };
  }
}

interface LinkCareContextParams {
  patientId: string;
  patientName: string;
  patientAbhaToken: string;
  careContextId: string;
  display: string;
}

interface CareContext {
  referenceNumber: string;
  display: string;
}

interface DiscoveryRequest {
  requestId: string;
  transactionId: string;
  patient: {
    id?: string;
    name: string;
    gender: string;
    yearOfBirth: number;
    verifiedIdentifiers?: Array<{ type: string; value: string }>;
  };
}

interface DiscoveryResponse {
  requestId: string;
  transactionId: string;
  patient: {
    referenceNumber: string;
    display: string;
    careContexts: CareContext[];
    matchedBy: string[];
  } | null;
}
```

---

## 7. ABDM Callback Routes

```typescript
// modules/integrations/abdm/abdm.routes.ts
import { FastifyInstance } from "fastify";
import { AbhaService } from "./abha.service";
import { ConsentService } from "./consent.service";
import { HipService } from "./hip.service";

export async function abdmRoutes(fastify: FastifyInstance) {
  const abhaService = new AbhaService();
  const consentService = new ConsentService(abhaService);
  const hipService = new HipService(abhaService);

  // ABHA verification endpoints
  fastify.post("/abha/generate-otp", async (request, reply) => {
    const { abhaNumber } = request.body as { abhaNumber: string };
    const result = await abhaService.generateOtp(abhaNumber);
    return reply.send({ success: true, data: result });
  });

  fastify.post("/abha/verify-otp", async (request, reply) => {
    const { txnId, otp } = request.body as { txnId: string; otp: string };
    const profile = await abhaService.verifyOtp(txnId, otp);
    return reply.send({ success: true, data: profile });
  });

  // Consent endpoints
  fastify.post("/consent/request", async (request, reply) => {
    const result = await consentService.requestConsent(request.body as any);
    return reply.send({ success: true, data: result });
  });

  // ABDM Callbacks (webhook endpoints)
  fastify.post("/callback/consent/notify", async (request, reply) => {
    await consentService.handleConsentNotification(request.body as any);
    return reply.send({ success: true });
  });

  fastify.post("/callback/discover", async (request, reply) => {
    const response = await hipService.handleDiscovery(request.body as any);
    return reply.send(response);
  });

  fastify.post("/callback/link/init", async (request, reply) => {
    await hipService.handleLinkInit(request.body as any);
    return reply.send({ success: true });
  });

  fastify.post("/callback/health-info/request", async (request, reply) => {
    await hipService.handleHealthInfoRequest(request.body as any);
    return reply.send({ success: true });
  });
}
```

---

## Summary

This ABDM integration guide covers:

1. **ABDM Architecture**: Components and data flow
2. **Configuration**: Environment setup and credentials
3. **ABHA Service**: Verification and profile management
4. **FHIR Transformation**: Converting records to FHIR R4 bundles
5. **Consent Management**: Request, grant, revoke consent
6. **HIP Service**: Care context linking and data sharing
7. **Callback Routes**: Webhook handlers for ABDM

Key compliance points:

- FHIR R4 format for all health records
- Consent-based data sharing
- Secure data transfer with encryption
- Audit logging for all ABDM transactions
- Support for both HIP and HIU roles
