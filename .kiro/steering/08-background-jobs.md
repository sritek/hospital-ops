---
# Background jobs - BullMQ queues, workers, scheduled jobs
inclusion: fileMatch
fileMatchPattern: "**/jobs/**/*.ts, **/queue/**/*.ts, **/workers/**/*.ts"
---

# Background Jobs Guide

## Overview

This document covers background job processing patterns for Hospital-Ops using BullMQ with Redis. Background jobs handle notifications, reminders, ABDM sync, report generation, and other async tasks.

---

## 1. BullMQ Setup

### Queue Configuration

```typescript
// lib/queue/config.ts
import { ConnectionOptions } from "bullmq";

export const redisConnection: ConnectionOptions = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
};

export const defaultJobOptions = {
  attempts: 3,
  backoff: {
    type: "exponential" as const,
    delay: 1000,
  },
  removeOnComplete: {
    count: 1000,
    age: 24 * 60 * 60, // 24 hours
  },
  removeOnFail: {
    count: 5000,
    age: 7 * 24 * 60 * 60, // 7 days
  },
};
```

### Queue Factory

```typescript
// lib/queue/queue-factory.ts
import { Queue, Worker, QueueEvents, Job } from "bullmq";
import { redisConnection, defaultJobOptions } from "./config";
import { logger } from "@/lib/logger";

export function createQueue<T>(name: string) {
  const queue = new Queue<T>(name, {
    connection: redisConnection,
    defaultJobOptions,
  });

  queue.on("error", (error) => {
    logger.error(`Queue ${name} error:`, error);
  });

  return queue;
}

export function createWorker<T, R>(
  name: string,
  processor: (job: Job<T>) => Promise<R>,
  options?: { concurrency?: number },
) {
  const worker = new Worker<T, R>(name, processor, {
    connection: redisConnection,
    concurrency: options?.concurrency || 5,
  });

  worker.on("completed", (job) => {
    logger.info(`Job ${job.id} in ${name} completed`);
  });

  worker.on("failed", (job, error) => {
    logger.error(`Job ${job?.id} in ${name} failed:`, error);
  });

  worker.on("error", (error) => {
    logger.error(`Worker ${name} error:`, error);
  });

  return worker;
}

export function createQueueEvents(name: string) {
  return new QueueEvents(name, { connection: redisConnection });
}
```

---

## 2. Queue Definitions

```typescript
// lib/queue/queues.ts
import { createQueue } from "./queue-factory";

// Notification Queues
export const whatsappQueue = createQueue<WhatsAppJobData>(
  "whatsapp-notifications",
);
export const smsQueue = createQueue<SMSJobData>("sms-notifications");
export const emailQueue = createQueue<EmailJobData>("email-notifications");
```

// Appointment Queues
export const appointmentReminderQueue = createQueue<ReminderJobData>('appointment-reminders');
export const followUpQueue = createQueue<FollowUpJobData>('follow-up-reminders');

// Clinical Queues
export const labResultsQueue = createQueue<LabResultsJobData>('lab-results-notify');
export const prescriptionQueue = createQueue<PrescriptionJobData>('prescription-dispatch');

// ABDM Queues
export const abdmSyncQueue = createQueue<ABDMSyncJobData>('abdm-sync');
export const consentQueue = createQueue<ConsentJobData>('consent-requests');

// Report Queues
export const reportQueue = createQueue<ReportJobData>('report-generation');
export const snapshotQueue = createQueue<SnapshotJobData>('data-snapshots');

// Inventory Queues
export const stockAlertQueue = createQueue<StockAlertJobData>('stock-alerts');
export const expiryAlertQueue = createQueue<ExpiryAlertJobData>('expiry-alerts');

// AI Queues
export const clinicalDocQueue = createQueue<ClinicalDocJobData>('clinical-documentation');
export const riskScoringQueue = createQueue<RiskScoringJobData>('risk-scoring');

````

---

## 3. Job Data Types

```typescript
// lib/queue/types.ts

// WhatsApp
export interface WhatsAppJobData {
  tenantId: string;
  recipientPhone: string;
  templateId: string;
  templateParams: Record<string, string>;
  language?: 'en' | 'hi';
  priority?: 'high' | 'normal' | 'low';
}

// SMS
export interface SMSJobData {
  tenantId: string;
  recipientPhone: string;
  message: string;
  type: 'transactional' | 'promotional';
}

// Email
export interface EmailJobData {
  tenantId: string;
  to: string;
  subject: string;
  template: string;
  data: Record<string, unknown>;
  attachments?: Array<{ filename: string; content: Buffer }>;
}
````

// Appointment Reminder
export interface ReminderJobData {
tenantId: string;
appointmentId: string;
patientId: string;
reminderType: '24h' | '2h' | '30m';
channel: 'whatsapp' | 'sms';
}

// Follow-up
export interface FollowUpJobData {
tenantId: string;
patientId: string;
consultationId: string;
followUpDate: string;
doctorId: string;
}

// Lab Results
export interface LabResultsJobData {
tenantId: string;
labOrderId: string;
patientId: string;
hasCriticalValues: boolean;
}

// ABDM Sync
export interface ABDMSyncJobData {
tenantId: string;
entityType: 'patient' | 'consultation' | 'prescription' | 'lab_result';
entityId: string;
action: 'create' | 'update';
}

// Consent
export interface ConsentJobData {
tenantId: string;
patientId: string;
consentRequestId: string;
hiuId: string;
purpose: string;
}

// Report Generation
export interface ReportJobData {
tenantId: string;
branchId?: string;
reportType: string;
dateRange: { from: string; to: string };
format: 'pdf' | 'excel' | 'csv';
requestedBy: string;
deliveryEmail?: string;
}

// Data Snapshot
export interface SnapshotJobData {
tenantId: string;
branchId: string;
date: string;
metrics: string[];
}

// Stock Alert
export interface StockAlertJobData {
tenantId: string;
branchId: string;
itemId: string;
currentStock: number;
reorderLevel: number;
}

// Expiry Alert
export interface ExpiryAlertJobData {
tenantId: string;
branchId: string;
batchId: string;
itemName: string;
expiryDate: string;
daysUntilExpiry: number;
}

// Clinical Documentation (AI)
export interface ClinicalDocJobData {
tenantId: string;
consultationId: string;
audioUrl?: string;
transcription?: string;
doctorId: string;
}

// Risk Scoring
export interface RiskScoringJobData {
tenantId: string;
patientId: string;
admissionId?: string;
riskType: 'readmission' | 'no_show' | 'deterioration';
}

````

---

## 4. Worker Implementations

### WhatsApp Worker

```typescript
// jobs/workers/whatsapp.worker.ts
import { Job } from 'bullmq';
import { createWorker } from '@/lib/queue/queue-factory';
import { WhatsAppJobData } from '@/lib/queue/types';
import { whatsappService } from '@/lib/whatsapp';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export const whatsappWorker = createWorker<WhatsAppJobData, void>(
  'whatsapp-notifications',
  async (job: Job<WhatsAppJobData>) => {
    const { tenantId, recipientPhone, templateId, templateParams, language } = job.data;

    // Check opt-out status
    const patient = await prisma.patient.findFirst({
      where: { tenantId, phone: recipientPhone },
      select: { marketingConsent: true },
    });

    if (!patient?.marketingConsent && !isTransactional(templateId)) {
      logger.info(`Skipping WhatsApp to ${recipientPhone} - opted out`);
      return;
    }
````

    // Get template
    const template = await prisma.messageTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    // Send message
    const result = await whatsappService.sendTemplate({
      to: recipientPhone,
      templateName: template.whatsappTemplateName,
      language: language || 'en',
      components: buildTemplateComponents(template, templateParams),
    });

    // Log message
    await prisma.messageLog.create({
      data: {
        tenantId,
        recipientPhone,
        channel: 'whatsapp',
        templateId,
        status: result.success ? 'sent' : 'failed',
        externalId: result.messageId,
        error: result.error,
      },
    });

    if (!result.success) {
      throw new Error(result.error);
    }

},
{ concurrency: 10 }
);

function isTransactional(templateId: string): boolean {
const transactionalTemplates = [
'appointment_confirmation',
'appointment_reminder',
'lab_results_ready',
'prescription_ready',
];
return transactionalTemplates.some(t => templateId.includes(t));
}

````

### Appointment Reminder Worker

```typescript
// jobs/workers/appointment-reminder.worker.ts
import { Job } from 'bullmq';
import { createWorker } from '@/lib/queue/queue-factory';
import { ReminderJobData } from '@/lib/queue/types';
import { whatsappQueue, smsQueue } from '@/lib/queue/queues';
import { prisma } from '@/lib/prisma';
````

export const appointmentReminderWorker = createWorker<ReminderJobData, void>(
'appointment-reminders',
async (job: Job<ReminderJobData>) => {
const { tenantId, appointmentId, patientId, reminderType, channel } = job.data;

    // Get appointment details
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: true,
        doctor: { select: { name: true } },
        branch: { select: { name: true, address: true } },
      },
    });

    if (!appointment || appointment.status === 'cancelled') {
      return; // Skip cancelled appointments
    }

    const templateParams = {
      patientName: appointment.patient.name,
      doctorName: appointment.doctor.name,
      date: formatDate(appointment.date),
      time: formatTime(appointment.startTime),
      branchName: appointment.branch.name,
      branchAddress: appointment.branch.address || '',
    };

    const templateId = `appointment_reminder_${reminderType}`;

    if (channel === 'whatsapp') {
      await whatsappQueue.add('reminder', {
        tenantId,
        recipientPhone: appointment.patient.phone,
        templateId,
        templateParams,
        language: appointment.patient.preferredLanguage as 'en' | 'hi',
        priority: reminderType === '30m' ? 'high' : 'normal',
      });
    } else {
      await smsQueue.add('reminder', {
        tenantId,
        recipientPhone: appointment.patient.phone,
        message: buildSMSMessage(templateId, templateParams),
        type: 'transactional',
      });
    }

}
);

````

### Lab Results Worker

```typescript
// jobs/workers/lab-results.worker.ts
import { Job } from 'bullmq';
import { createWorker } from '@/lib/queue/queue-factory';
import { LabResultsJobData } from '@/lib/queue/types';
import { whatsappQueue } from '@/lib/queue/queues';
import { prisma } from '@/lib/prisma';
````

export const labResultsWorker = createWorker<LabResultsJobData, void>(
'lab-results-notify',
async (job: Job<LabResultsJobData>) => {
const { tenantId, labOrderId, patientId, hasCriticalValues } = job.data;

    const labOrder = await prisma.labOrder.findUnique({
      where: { id: labOrderId },
      include: {
        patient: true,
        doctor: { select: { name: true, phone: true } },
        tests: { include: { results: true } },
      },
    });

    if (!labOrder) return;

    // Notify patient
    await whatsappQueue.add('lab-results-patient', {
      tenantId,
      recipientPhone: labOrder.patient.phone,
      templateId: 'lab_results_ready',
      templateParams: {
        patientName: labOrder.patient.name,
        testNames: labOrder.tests.map(t => t.name).join(', '),
        orderDate: formatDate(labOrder.createdAt),
      },
      priority: hasCriticalValues ? 'high' : 'normal',
    });

    // Notify doctor for critical values
    if (hasCriticalValues && labOrder.doctor) {
      await whatsappQueue.add('lab-results-doctor', {
        tenantId,
        recipientPhone: labOrder.doctor.phone,
        templateId: 'critical_lab_results',
        templateParams: {
          doctorName: labOrder.doctor.name,
          patientName: labOrder.patient.name,
          criticalTests: getCriticalTests(labOrder.tests),
        },
        priority: 'high',
      });
    }

}
);

````

### ABDM Sync Worker

```typescript
// jobs/workers/abdm-sync.worker.ts
import { Job } from 'bullmq';
import { createWorker } from '@/lib/queue/queue-factory';
import { ABDMSyncJobData } from '@/lib/queue/types';
import { abdmService } from '@/lib/abdm';
import { fhirTransformer } from '@/lib/abdm/fhir-transformer';
import { prisma } from '@/lib/prisma';
````

export const abdmSyncWorker = createWorker<ABDMSyncJobData, void>(
'abdm-sync',
async (job: Job<ABDMSyncJobData>) => {
const { tenantId, entityType, entityId, action } = job.data;

    // Get tenant ABDM config
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { hipId: true, hfrId: true },
    });

    if (!tenant?.hipId) {
      throw new Error('Tenant not registered with ABDM');
    }

    // Transform to FHIR
    let fhirBundle;
    switch (entityType) {
      case 'consultation':
        const consultation = await prisma.consultation.findUnique({
          where: { id: entityId },
          include: { patient: true, doctor: true, diagnoses: true, vitals: true },
        });
        fhirBundle = fhirTransformer.consultationToFHIR(consultation);
        break;

      case 'prescription':
        const prescription = await prisma.prescription.findUnique({
          where: { id: entityId },
          include: { patient: true, doctor: true, items: true },
        });
        fhirBundle = fhirTransformer.prescriptionToFHIR(prescription);
        break;

      case 'lab_result':
        const labOrder = await prisma.labOrder.findUnique({
          where: { id: entityId },
          include: { patient: true, tests: { include: { results: true } } },
        });
        fhirBundle = fhirTransformer.labResultToFHIR(labOrder);
        break;

      default:
        throw new Error(`Unknown entity type: ${entityType}`);
    }

    // Push to ABDM
    await abdmService.pushHealthRecord({
      hipId: tenant.hipId,
      bundle: fhirBundle,
    });

    // Update sync status
    await prisma.abdmSyncLog.create({
      data: {
        tenantId,
        entityType,
        entityId,
        action,
        status: 'synced',
        syncedAt: new Date(),
      },
    });

},
{ concurrency: 3 }
);

````

---

## 5. Scheduled Jobs

### Scheduler Setup

```typescript
// jobs/scheduler.ts
import { Queue } from 'bullmq';
import { redisConnection } from '@/lib/queue/config';
````

const schedulerQueue = new Queue('scheduler', { connection: redisConnection });

export async function setupScheduledJobs() {
// Clear existing repeatable jobs
const existingJobs = await schedulerQueue.getRepeatableJobs();
for (const job of existingJobs) {
await schedulerQueue.removeRepeatableByKey(job.key);
}

// Appointment reminders - every 5 minutes
await schedulerQueue.add(
'check-appointment-reminders',
{},
{
repeat: { pattern: '_/5 _ \* \* \*' },
jobId: 'appointment-reminders-check',
}
);

// Daily data snapshots - 2 AM IST
await schedulerQueue.add(
'daily-snapshot',
{},
{
repeat: { pattern: '30 20 \* \* \*' }, // 2 AM IST = 8:30 PM UTC
jobId: 'daily-snapshot',
}
);

// Stock alerts - 8 AM IST
await schedulerQueue.add(
'stock-alerts',
{},
{
repeat: { pattern: '30 2 \* \* \*' }, // 8 AM IST
jobId: 'stock-alerts',
}
);

// Expiry alerts - 9 AM IST
await schedulerQueue.add(
'expiry-alerts',
{},
{
repeat: { pattern: '30 3 \* \* \*' }, // 9 AM IST
jobId: 'expiry-alerts',
}
);

// Follow-up reminders - 10 AM IST
await schedulerQueue.add(
'follow-up-check',
{},
{
repeat: { pattern: '30 4 \* \* \*' }, // 10 AM IST
jobId: 'follow-up-check',
}
);

// Consent expiry check - midnight IST
await schedulerQueue.add(
'consent-expiry',
{},
{
repeat: { pattern: '30 18 \* \* \*' }, // 12 AM IST
jobId: 'consent-expiry',
}
);

// Weekly reports - Monday 6 AM IST
await schedulerQueue.add(
'weekly-reports',
{},
{
repeat: { pattern: '30 0 \* \* 1' }, // Monday 6 AM IST
jobId: 'weekly-reports',
}
);
}

```

```

### Scheduler Worker

```typescript
// jobs/workers/scheduler.worker.ts
import { Job } from 'bullmq';
import { createWorker } from '@/lib/queue/queue-factory';
import { prisma } from '@/lib/prisma';
import {
  appointmentReminderQueue,
  stockAlertQueue,
  expiryAlertQueue,
  snapshotQueue,
  followUpQueue,
} from '@/lib/queue/queues';

export const schedulerWorker = createWorker<{ type?: string }, void>(
  'scheduler',
  async (job: Job) => {
    switch (job.name) {
      case 'check-appointment-reminders':
        await checkAppointmentReminders();
        break;
      case 'daily-snapshot':
        await triggerDailySnapshots();
        break;
      case 'stock-alerts':
        await checkStockLevels();
        break;
      case 'expiry-alerts':
        await checkExpiringItems();
        break;
      case 'follow-up-check':
        await checkFollowUps();
        break;
      case 'consent-expiry':
        await checkConsentExpiry();
        break;
      case 'weekly-reports':
        await generateWeeklyReports();
        break;
    }
  }
);

async function checkAppointmentReminders() {
  const now = new Date();

  // 24-hour reminders
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const appointments24h = await prisma.appointment.findMany({
    where: {
      date: {
        gte: new Date(tomorrow.setHours(0, 0, 0, 0)),
        lt: new Date(tomorrow.setHours(23, 59, 59, 999)),
      },
      status: 'booked',
      reminder24hSent: false,
    },
    select: { id: true, tenantId: true, patientId: true },
  });

  for (const apt of appointments24h) {
    await appointmentReminderQueue.add('24h-reminder', {
      tenantId: apt.tenantId,
      appointmentId: apt.id,
      patientId: apt.patientId,
      reminderType: '24h',
      channel: 'whatsapp',
    });

    await prisma.appointment.update({
      where: { id: apt.id },
      data: { reminder24hSent: true },
    });
  }
```

// 2-hour reminders
const twoHoursLater = new Date(now.getTime() + 2 _ 60 _ 60 _ 1000);
const appointments2h = await prisma.appointment.findMany({
where: {
date: now,
startTime: {
gte: twoHoursLater,
lt: new Date(twoHoursLater.getTime() + 5 _ 60 \* 1000),
},
status: 'booked',
reminder2hSent: false,
},
select: { id: true, tenantId: true, patientId: true },
});

for (const apt of appointments2h) {
await appointmentReminderQueue.add('2h-reminder', {
tenantId: apt.tenantId,
appointmentId: apt.id,
patientId: apt.patientId,
reminderType: '2h',
channel: 'whatsapp',
});

    await prisma.appointment.update({
      where: { id: apt.id },
      data: { reminder2hSent: true },
    });

}
}

async function checkStockLevels() {
const lowStockItems = await prisma.inventoryItem.findMany({
where: {
currentStock: { lte: prisma.inventoryItem.fields.reorderLevel },
isActive: true,
},
include: { branch: true },
});

for (const item of lowStockItems) {
await stockAlertQueue.add('low-stock', {
tenantId: item.tenantId,
branchId: item.branchId,
itemId: item.id,
currentStock: item.currentStock,
reorderLevel: item.reorderLevel,
});
}
}

async function checkExpiringItems() {
const thirtyDaysFromNow = new Date();
thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

const expiringBatches = await prisma.inventoryBatch.findMany({
where: {
expiryDate: { lte: thirtyDaysFromNow },
currentQuantity: { gt: 0 },
},
include: { item: true },
});

for (const batch of expiringBatches) {
const daysUntilExpiry = Math.ceil(
(batch.expiryDate.getTime() - Date.now()) / (1000 _ 60 _ 60 \* 24)
);

    await expiryAlertQueue.add('expiring', {
      tenantId: batch.tenantId,
      branchId: batch.branchId,
      batchId: batch.id,
      itemName: batch.item.name,
      expiryDate: batch.expiryDate.toISOString(),
      daysUntilExpiry,
    });

}
}

```

```

---

## 6. Report Generation Worker

```typescript
// jobs/workers/report.worker.ts
import { Job } from 'bullmq';
import { createWorker } from '@/lib/queue/queue-factory';
import { ReportJobData } from '@/lib/queue/types';
import { reportService } from '@/modules/reports/reports.service';
import { s3Service } from '@/lib/s3';
import { emailQueue } from '@/lib/queue/queues';
import { prisma } from '@/lib/prisma';

export const reportWorker = createWorker<ReportJobData, void>(
  'report-generation',
  async (job: Job<ReportJobData>) => {
    const { tenantId, branchId, reportType, dateRange, format, requestedBy, deliveryEmail } = job.data;

    // Update job progress
    await job.updateProgress(10);

    // Generate report data
    const reportData = await reportService.generateReportData({
      tenantId,
      branchId,
      reportType,
      dateRange,
    });

    await job.updateProgress(50);

    // Generate file
    let fileBuffer: Buffer;
    let contentType: string;
    let extension: string;

    switch (format) {
      case 'pdf':
        fileBuffer = await reportService.generatePDF(reportType, reportData);
        contentType = 'application/pdf';
        extension = 'pdf';
        break;
      case 'excel':
        fileBuffer = await reportService.generateExcel(reportType, reportData);
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        extension = 'xlsx';
        break;
      case 'csv':
        fileBuffer = await reportService.generateCSV(reportType, reportData);
        contentType = 'text/csv';
        extension = 'csv';
        break;
    }

    await job.updateProgress(80);

    // Upload to S3
    const fileName = `reports/${tenantId}/${reportType}_${dateRange.from}_${dateRange.to}.${extension}`;
    const uploadResult = await s3Service.upload({
      bucket: process.env.S3_REPORTS_BUCKET!,
      key: fileName,
      body: fileBuffer,
      contentType,
    });
```

    // Save report record
    const report = await prisma.generatedReport.create({
      data: {
        tenantId,
        branchId,
        reportType,
        dateFrom: new Date(dateRange.from),
        dateTo: new Date(dateRange.to),
        format,
        fileUrl: uploadResult.url,
        fileSize: fileBuffer.length,
        requestedBy,
        status: 'completed',
      },
    });

    await job.updateProgress(90);

    // Send email if requested
    if (deliveryEmail) {
      const signedUrl = await s3Service.getSignedUrl(fileName, 24 * 60 * 60); // 24 hours

      await emailQueue.add('report-delivery', {
        tenantId,
        to: deliveryEmail,
        subject: `Your ${reportType} Report is Ready`,
        template: 'report_ready',
        data: {
          reportType,
          dateRange,
          downloadUrl: signedUrl,
          expiresIn: '24 hours',
        },
      });
    }

    await job.updateProgress(100);

},
{ concurrency: 2 }
);

````

---

## 7. Worker Startup

```typescript
// jobs/index.ts
import { logger } from '@/lib/logger';
import { setupScheduledJobs } from './scheduler';

// Import all workers
import { whatsappWorker } from './workers/whatsapp.worker';
import { smsWorker } from './workers/sms.worker';
import { emailWorker } from './workers/email.worker';
import { appointmentReminderWorker } from './workers/appointment-reminder.worker';
import { labResultsWorker } from './workers/lab-results.worker';
import { abdmSyncWorker } from './workers/abdm-sync.worker';
import { reportWorker } from './workers/report.worker';
import { schedulerWorker } from './workers/scheduler.worker';

const workers = [
  whatsappWorker,
  smsWorker,
  emailWorker,
  appointmentReminderWorker,
  labResultsWorker,
  abdmSyncWorker,
  reportWorker,
  schedulerWorker,
];

export async function startWorkers() {
  logger.info('Starting background workers...');

  // Setup scheduled jobs
  await setupScheduledJobs();
  logger.info('Scheduled jobs configured');

  // Workers auto-start on creation
  logger.info(`${workers.length} workers started`);
}
````

export async function stopWorkers() {
logger.info('Stopping background workers...');

await Promise.all(workers.map(w => w.close()));

logger.info('All workers stopped');
}

// Graceful shutdown
process.on('SIGTERM', async () => {
await stopWorkers();
process.exit(0);
});

process.on('SIGINT', async () => {
await stopWorkers();
process.exit(0);
});

````

---

## 8. Job Monitoring

### Bull Board Setup

```typescript
// lib/queue/dashboard.ts
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { FastifyAdapter } from '@bull-board/fastify';
import {
  whatsappQueue,
  smsQueue,
  emailQueue,
  appointmentReminderQueue,
  labResultsQueue,
  abdmSyncQueue,
  reportQueue,
} from './queues';

export function setupBullBoard(fastify: FastifyInstance) {
  const serverAdapter = new FastifyAdapter();
  serverAdapter.setBasePath('/admin/queues');

  createBullBoard({
    queues: [
      new BullMQAdapter(whatsappQueue),
      new BullMQAdapter(smsQueue),
      new BullMQAdapter(emailQueue),
      new BullMQAdapter(appointmentReminderQueue),
      new BullMQAdapter(labResultsQueue),
      new BullMQAdapter(abdmSyncQueue),
      new BullMQAdapter(reportQueue),
    ],
    serverAdapter,
  });

  fastify.register(serverAdapter.registerPlugin(), {
    prefix: '/admin/queues',
    basePath: '/admin/queues',
  });
}
````

---

## 9. Error Handling & Retries

```typescript
// lib/queue/error-handler.ts
import { Job } from "bullmq";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

export async function handleJobError(job: Job, error: Error) {
  logger.error(`Job ${job.id} failed:`, {
    queue: job.queueName,
    data: job.data,
    error: error.message,
    attemptsMade: job.attemptsMade,
  });

  // Log to database for critical jobs
  if (isCriticalJob(job)) {
    await prisma.jobFailure.create({
      data: {
        jobId: job.id!,
        queueName: job.queueName,
        jobData: job.data as any,
        error: error.message,
        stack: error.stack,
        attemptsMade: job.attemptsMade,
      },
    });
  }
}

function isCriticalJob(job: Job): boolean {
  const criticalQueues = ["abdm-sync", "billing", "prescription-dispatch"];
  return criticalQueues.includes(job.queueName);
}
```
