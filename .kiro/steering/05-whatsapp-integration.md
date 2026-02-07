---
# WhatsApp integration patterns - Business API, chatbot, notifications
inclusion: fileMatch
fileMatchPattern: "apps/api/src/modules/integrations/whatsapp/**/*.ts, apps/api/src/**/*whatsapp*.ts"
---

# WhatsApp Integration Guide

## Overview

This document covers WhatsApp Business API integration for Hospital-Ops, including automated notifications, chatbot for bookings, and two-way messaging.

---

## 1. WhatsApp Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    WhatsApp Integration                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │  Hospital   │    │  WhatsApp   │    │   Patient   │         │
│  │    Ops      │───▶│  Business   │───▶│   Phone     │         │
│  │   Backend   │◀───│    API      │◀───│             │         │
│  └─────────────┘    └─────────────┘    └─────────────┘         │
│         │                                                        │
│         │                                                        │
│  ┌──────▼──────┐                                                │
│  │   Message   │                                                │
│  │   Queue     │                                                │
│  │  (BullMQ)   │                                                │
│  └─────────────┘                                                │
│                                                                  │
│  Message Types:                                                  │
│  • Template Messages (pre-approved)                             │
│  • Session Messages (24-hour window)                            │
│  • Interactive Messages (buttons, lists)                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Configuration

```typescript
// config/whatsapp.config.ts
export const whatsappConfig = {
  // Provider (can be switched)
  provider: process.env.WHATSAPP_PROVIDER || "meta", // meta | gupshup | twilio

  // Meta WhatsApp Business API
  meta: {
    apiVersion: "v18.0",
    baseUrl: "https://graph.facebook.com",
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID!,
    businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID!,
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN!,
    webhookVerifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN!,
  },

  // Gupshup (alternative provider)
  gupshup: {
    baseUrl: "https://api.gupshup.io/sm/api/v1",
    apiKey: process.env.GUPSHUP_API_KEY!,
    appName: process.env.GUPSHUP_APP_NAME!,
    sourceNumber: process.env.GUPSHUP_SOURCE_NUMBER!,
  },

  // Rate limiting
  rateLimit: {
    perSecond: 80,
    perMinute: 1000,
    perDay: 100000,
  },

  // Throttling per customer
  customerThrottle: {
    marketingPerDay: 2,
    marketingPerWeek: 5,
    transactionalPerDay: 10,
  },

  // Session window
  sessionWindowHours: 24,

  // Retry configuration
  retry: {
    maxAttempts: 3,
    backoffMs: 1000,
  },
};
```

---

## 3. WhatsApp Service

```typescript
// modules/integrations/whatsapp/whatsapp.service.ts
import axios from "axios";
import { whatsappConfig } from "@/config/whatsapp.config";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { AppError } from "@/common/errors/app-error";

export class WhatsAppService {
  private baseUrl: string;
  private phoneNumberId: string;
  private accessToken: string;

  constructor() {
    const config = whatsappConfig.meta;
    this.baseUrl = `${config.baseUrl}/${config.apiVersion}`;
    this.phoneNumberId = config.phoneNumberId;
    this.accessToken = config.accessToken;
  }

  // Send template message
  async sendTemplate(params: SendTemplateParams): Promise<MessageResult> {
    // Check opt-out status
    const isOptedOut = await this.isOptedOut(params.tenantId, params.to);
    if (isOptedOut && params.category === "marketing") {
      throw new AppError(
        "OPTED_OUT",
        "Customer has opted out of marketing messages",
      );
    }

    // Check throttling for marketing messages
    if (params.category === "marketing") {
      await this.checkThrottle(params.tenantId, params.to);
    }

    // Get template
    const template = await prisma.messageTemplate.findFirst({
      where: {
        tenantId: params.tenantId,
        code: params.templateCode,
        channel: "whatsapp",
        isActive: true,
      },
    });

    if (!template) {
      throw AppError.notFound("WhatsApp template");
    }

    // Build message payload
    const payload = this.buildTemplatePayload(
      params.to,
      template,
      params.variables,
      params.language,
    );

    try {
      const response = await axios.post(
        `${this.baseUrl}/${this.phoneNumberId}/messages`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
        },
      );

      const messageId = response.data.messages[0].id;

      // Log message
      await this.logMessage({
        tenantId: params.tenantId,
        branchId: params.branchId,
        recipientType: params.recipientType,
        recipientId: params.recipientId,
        recipientPhone: params.to,
        channel: "whatsapp",
        templateId: template.id,
        content: this.renderTemplate(
          template,
          params.variables,
          params.language,
        ),
        status: "sent",
        sentAt: new Date(),
        providerMessageId: messageId,
      });

      // Update throttle counter for marketing
      if (params.category === "marketing") {
        await this.incrementThrottle(params.tenantId, params.to);
      }

      return { success: true, messageId };
    } catch (error: any) {
      // Log failed message
      await this.logMessage({
        tenantId: params.tenantId,
        branchId: params.branchId,
        recipientType: params.recipientType,
        recipientId: params.recipientId,
        recipientPhone: params.to,
        channel: "whatsapp",
        templateId: template.id,
        content: this.renderTemplate(
          template,
          params.variables,
          params.language,
        ),
        status: "failed",
        failedAt: new Date(),
        failureReason: error.response?.data?.error?.message || error.message,
      });

      throw new AppError(
        "WHATSAPP_ERROR",
        error.response?.data?.error?.message ||
          "Failed to send WhatsApp message",
        400,
      );
    }
  }

  // Send interactive message (buttons/list)
  async sendInteractive(params: SendInteractiveParams): Promise<MessageResult> {
    // Check if within session window
    const hasSession = await this.hasActiveSession(params.to);
    if (!hasSession) {
      throw new AppError(
        "NO_SESSION",
        "No active session. Use template message first.",
      );
    }

    const payload = this.buildInteractivePayload(params);

    try {
      const response = await axios.post(
        `${this.baseUrl}/${this.phoneNumberId}/messages`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
        },
      );

      return { success: true, messageId: response.data.messages[0].id };
    } catch (error: any) {
      throw new AppError(
        "WHATSAPP_ERROR",
        error.response?.data?.error?.message ||
          "Failed to send interactive message",
        400,
      );
    }
  }

  // Send text message (within session)
  async sendText(to: string, text: string): Promise<MessageResult> {
    const hasSession = await this.hasActiveSession(to);
    if (!hasSession) {
      throw new AppError(
        "NO_SESSION",
        "No active session. Use template message first.",
      );
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/${this.phoneNumberId}/messages`,
        {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: this.formatPhoneNumber(to),
          type: "text",
          text: { body: text },
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
        },
      );

      return { success: true, messageId: response.data.messages[0].id };
    } catch (error: any) {
      throw new AppError(
        "WHATSAPP_ERROR",
        error.response?.data?.error?.message,
        400,
      );
    }
  }

  // Handle incoming webhook
  async handleWebhook(payload: WebhookPayload): Promise<void> {
    const { entry } = payload;

    for (const e of entry) {
      for (const change of e.changes) {
        if (change.field === "messages") {
          const { messages, statuses } = change.value;

          // Handle incoming messages
          if (messages) {
            for (const message of messages) {
              await this.handleIncomingMessage(message);
            }
          }

          // Handle status updates
          if (statuses) {
            for (const status of statuses) {
              await this.handleStatusUpdate(status);
            }
          }
        }
      }
    }
  }

  // Handle incoming message
  private async handleIncomingMessage(message: IncomingMessage): Promise<void> {
    const from = message.from;
    const messageType = message.type;

    // Update session window
    await this.updateSession(from);

    // Find patient by phone
    const patient = await prisma.patient.findFirst({
      where: { phone: { endsWith: from.slice(-10) } },
    });

    // Route to chatbot or store for manual response
    if (messageType === "text") {
      await this.routeTextMessage(from, message.text.body, patient);
    } else if (messageType === "interactive") {
      await this.routeInteractiveResponse(from, message.interactive, patient);
    }
  }

  // Handle status update (delivered, read, etc.)
  private async handleStatusUpdate(status: StatusUpdate): Promise<void> {
    const { id, status: messageStatus, timestamp } = status;

    const updateData: any = {};
    if (messageStatus === "delivered") {
      updateData.deliveredAt = new Date(parseInt(timestamp) * 1000);
      updateData.status = "delivered";
    } else if (messageStatus === "read") {
      updateData.readAt = new Date(parseInt(timestamp) * 1000);
      updateData.status = "read";
    } else if (messageStatus === "failed") {
      updateData.failedAt = new Date(parseInt(timestamp) * 1000);
      updateData.status = "failed";
      updateData.failureReason = status.errors?.[0]?.message;
    }

    await prisma.messageLog.updateMany({
      where: { providerMessageId: id },
      data: updateData,
    });
  }

  // Build template payload
  private buildTemplatePayload(
    to: string,
    template: any,
    variables: Record<string, string>,
    language: string,
  ) {
    const components: any[] = [];

    // Build header component if needed
    if (template.headerType) {
      components.push({
        type: "header",
        parameters: this.buildParameters(template.headerVariables, variables),
      });
    }

    // Build body component
    const bodyParams = this.buildParameters(template.variables, variables);
    if (bodyParams.length > 0) {
      components.push({
        type: "body",
        parameters: bodyParams,
      });
    }

    return {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: this.formatPhoneNumber(to),
      type: "template",
      template: {
        name: template.whatsappTemplateId,
        language: { code: language === "hi" ? "hi" : "en" },
        components,
      },
    };
  }

  // Build interactive payload
  private buildInteractivePayload(params: SendInteractiveParams) {
    const payload: any = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: this.formatPhoneNumber(params.to),
      type: "interactive",
    };

    if (params.type === "button") {
      payload.interactive = {
        type: "button",
        body: { text: params.body },
        action: {
          buttons: params.buttons!.map((btn, index) => ({
            type: "reply",
            reply: {
              id: btn.id,
              title: btn.title,
            },
          })),
        },
      };
    } else if (params.type === "list") {
      payload.interactive = {
        type: "list",
        body: { text: params.body },
        action: {
          button: params.listButtonText || "Select",
          sections: params.sections,
        },
      };
    }

    return payload;
  }

  // Helper methods
  private formatPhoneNumber(phone: string): string {
    // Ensure Indian format with country code
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.startsWith("91") && cleaned.length === 12) {
      return cleaned;
    }
    if (cleaned.length === 10) {
      return `91${cleaned}`;
    }
    return cleaned;
  }

  private buildParameters(
    variableNames: string[],
    values: Record<string, string>,
  ) {
    return variableNames.map((name) => ({
      type: "text",
      text: values[name] || "",
    }));
  }

  private renderTemplate(
    template: any,
    variables: Record<string, string>,
    language: string,
  ): string {
    let content = language === "hi" ? template.contentHi : template.contentEn;
    for (const [key, value] of Object.entries(variables)) {
      content = content.replace(new RegExp(`{{${key}}}`, "g"), value);
    }
    return content;
  }

  private async isOptedOut(tenantId: string, phone: string): Promise<boolean> {
    const patient = await prisma.patient.findFirst({
      where: { tenantId, phone: { endsWith: phone.slice(-10) } },
    });
    return patient?.marketingConsent === false;
  }

  private async checkThrottle(tenantId: string, phone: string): Promise<void> {
    const dayKey = `throttle:${tenantId}:${phone}:day`;
    const weekKey = `throttle:${tenantId}:${phone}:week`;

    const [dayCount, weekCount] = await Promise.all([
      redis.get(dayKey),
      redis.get(weekKey),
    ]);

    if (
      dayCount &&
      parseInt(dayCount) >= whatsappConfig.customerThrottle.marketingPerDay
    ) {
      throw new AppError(
        "THROTTLED",
        "Daily marketing message limit reached for this customer",
      );
    }

    if (
      weekCount &&
      parseInt(weekCount) >= whatsappConfig.customerThrottle.marketingPerWeek
    ) {
      throw new AppError(
        "THROTTLED",
        "Weekly marketing message limit reached for this customer",
      );
    }
  }

  private async incrementThrottle(
    tenantId: string,
    phone: string,
  ): Promise<void> {
    const dayKey = `throttle:${tenantId}:${phone}:day`;
    const weekKey = `throttle:${tenantId}:${phone}:week`;

    await redis.incr(dayKey);
    await redis.expire(dayKey, 86400); // 24 hours

    await redis.incr(weekKey);
    await redis.expire(weekKey, 604800); // 7 days
  }

  private async hasActiveSession(phone: string): Promise<boolean> {
    const sessionKey = `wa_session:${phone}`;
    return (await redis.exists(sessionKey)) === 1;
  }

  private async updateSession(phone: string): Promise<void> {
    const sessionKey = `wa_session:${phone}`;
    await redis.setex(
      sessionKey,
      whatsappConfig.sessionWindowHours * 3600,
      "1",
    );
  }

  private async logMessage(data: any): Promise<void> {
    await prisma.messageLog.create({ data });
  }

  private async routeTextMessage(
    from: string,
    text: string,
    patient: any,
  ): Promise<void> {
    // Route to chatbot service
    const chatbotService = new ChatbotService(this);
    await chatbotService.handleMessage(from, text, patient);
  }

  private async routeInteractiveResponse(
    from: string,
    interactive: any,
    patient: any,
  ): Promise<void> {
    const chatbotService = new ChatbotService(this);

    if (interactive.type === "button_reply") {
      await chatbotService.handleButtonResponse(
        from,
        interactive.button_reply.id,
        patient,
      );
    } else if (interactive.type === "list_reply") {
      await chatbotService.handleListResponse(
        from,
        interactive.list_reply.id,
        patient,
      );
    }
  }
}

// Types
interface SendTemplateParams {
  tenantId: string;
  branchId?: string;
  recipientType: "patient" | "staff";
  recipientId: string;
  to: string;
  templateCode: string;
  variables: Record<string, string>;
  language: string;
  category: "transactional" | "marketing";
}

interface SendInteractiveParams {
  to: string;
  type: "button" | "list";
  body: string;
  buttons?: Array<{ id: string; title: string }>;
  sections?: Array<{
    title: string;
    rows: Array<{ id: string; title: string; description?: string }>;
  }>;
  listButtonText?: string;
}

interface MessageResult {
  success: boolean;
  messageId: string;
}

interface WebhookPayload {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      field: string;
      value: {
        messages?: IncomingMessage[];
        statuses?: StatusUpdate[];
      };
    }>;
  }>;
}

interface IncomingMessage {
  from: string;
  id: string;
  timestamp: string;
  type: string;
  text?: { body: string };
  interactive?: any;
}

interface StatusUpdate {
  id: string;
  status: string;
  timestamp: string;
  errors?: Array<{ message: string }>;
}
```

---

## 4. Chatbot Service

```typescript
// modules/integrations/whatsapp/chatbot.service.ts
import { WhatsAppService } from "./whatsapp.service";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";

export class ChatbotService {
  constructor(private whatsappService: WhatsAppService) {}

  // Handle incoming text message
  async handleMessage(from: string, text: string, patient: any): Promise<void> {
    const normalizedText = text.toLowerCase().trim();

    // Get conversation state
    const state = await this.getConversationState(from);

    // Route based on state or intent
    if (state) {
      await this.handleStatefulMessage(from, normalizedText, state, patient);
    } else {
      await this.handleNewMessage(from, normalizedText, patient);
    }
  }

  // Handle new message (no existing state)
  private async handleNewMessage(
    from: string,
    text: string,
    patient: any,
  ): Promise<void> {
    const intent = this.detectIntent(text);

    switch (intent) {
      case "book_appointment":
        await this.startBookingFlow(from, patient);
        break;
      case "reschedule":
        await this.startRescheduleFlow(from, patient);
        break;
      case "cancel":
        await this.startCancelFlow(from, patient);
        break;
      case "status":
        await this.showAppointmentStatus(from, patient);
        break;
      case "help":
        await this.showMainMenu(from);
        break;
      default:
        await this.showMainMenu(from);
    }
  }

  // Detect intent from text
  private detectIntent(text: string): string {
    const intents: Record<string, string[]> = {
      book_appointment: [
        "book",
        "appointment",
        "schedule",
        "doctor",
        "visit",
        "appoint",
      ],
      reschedule: ["reschedule", "change", "modify", "shift"],
      cancel: ["cancel", "delete", "remove"],
      status: ["status", "check", "upcoming", "my appointment"],
      help: ["help", "menu", "hi", "hello", "start"],
    };

    for (const [intent, keywords] of Object.entries(intents)) {
      if (keywords.some((kw) => text.includes(kw))) {
        return intent;
      }
    }

    return "unknown";
  }

  // Show main menu
  private async showMainMenu(from: string): Promise<void> {
    await this.whatsappService.sendInteractive({
      to: from,
      type: "list",
      body: "Welcome to Hospital-Ops! How can I help you today?",
      listButtonText: "Select Option",
      sections: [
        {
          title: "Appointments",
          rows: [
            {
              id: "book_new",
              title: "📅 Book Appointment",
              description: "Schedule a new appointment",
            },
            {
              id: "view_upcoming",
              title: "📋 View Appointments",
              description: "Check your upcoming visits",
            },
            {
              id: "reschedule",
              title: "🔄 Reschedule",
              description: "Change appointment time",
            },
            {
              id: "cancel",
              title: "❌ Cancel",
              description: "Cancel an appointment",
            },
          ],
        },
        {
          title: "Other Services",
          rows: [
            {
              id: "lab_reports",
              title: "🔬 Lab Reports",
              description: "View your test results",
            },
            {
              id: "prescriptions",
              title: "💊 Prescriptions",
              description: "View your prescriptions",
            },
            {
              id: "talk_to_human",
              title: "👤 Talk to Staff",
              description: "Connect with reception",
            },
          ],
        },
      ],
    });
  }

  // Start booking flow
  private async startBookingFlow(from: string, patient: any): Promise<void> {
    if (!patient) {
      // New patient - collect details
      await this.setConversationState(from, {
        flow: "booking",
        step: "collect_name",
      });
      await this.whatsappService.sendText(
        from,
        "I don't have your details yet. Let's get you registered first.\n\nPlease enter your full name:",
      );
      return;
    }

    // Existing patient - show departments
    await this.setConversationState(from, {
      flow: "booking",
      step: "select_department",
      patientId: patient.id,
    });
    await this.showDepartments(from, patient.tenantId);
  }

  // Show departments for booking
  private async showDepartments(from: string, tenantId: string): Promise<void> {
    // Get active departments/specializations
    const doctors = await prisma.user.findMany({
      where: {
        tenantId,
        role: "doctor",
        isActive: true,
        deletedAt: null,
      },
      select: { specialization: true },
      distinct: ["specialization"],
    });

    const departments = doctors
      .filter((d) => d.specialization)
      .map((d) => ({
        id: `dept_${d.specialization}`,
        title: d.specialization!,
        description: `Book with ${d.specialization} specialist`,
      }));

    await this.whatsappService.sendInteractive({
      to: from,
      type: "list",
      body: "Please select a department:",
      listButtonText: "Select Department",
      sections: [{ title: "Departments", rows: departments }],
    });
  }

  // Handle button response
  async handleButtonResponse(
    from: string,
    buttonId: string,
    patient: any,
  ): Promise<void> {
    const state = await this.getConversationState(from);

    switch (buttonId) {
      case "confirm_booking":
        await this.confirmBooking(from, state);
        break;
      case "cancel_booking":
        await this.cancelBookingFlow(from);
        break;
      case "yes_reschedule":
        await this.processReschedule(from, state);
        break;
      case "no_reschedule":
        await this.cancelRescheduleFlow(from);
        break;
      default:
        await this.showMainMenu(from);
    }
  }

  // Handle list response
  async handleListResponse(
    from: string,
    rowId: string,
    patient: any,
  ): Promise<void> {
    const state = await this.getConversationState(from);

    // Main menu options
    if (rowId === "book_new") {
      await this.startBookingFlow(from, patient);
      return;
    }
    if (rowId === "view_upcoming") {
      await this.showAppointmentStatus(from, patient);
      return;
    }
    if (rowId === "reschedule") {
      await this.startRescheduleFlow(from, patient);
      return;
    }
    if (rowId === "cancel") {
      await this.startCancelFlow(from, patient);
      return;
    }
    if (rowId === "talk_to_human") {
      await this.transferToHuman(from, patient);
      return;
    }

    // Booking flow responses
    if (rowId.startsWith("dept_")) {
      const department = rowId.replace("dept_", "");
      await this.handleDepartmentSelection(from, department, state);
      return;
    }
    if (rowId.startsWith("doctor_")) {
      const doctorId = rowId.replace("doctor_", "");
      await this.handleDoctorSelection(from, doctorId, state);
      return;
    }
    if (rowId.startsWith("slot_")) {
      const slotData = rowId.replace("slot_", "");
      await this.handleSlotSelection(from, slotData, state);
      return;
    }
    if (rowId.startsWith("apt_")) {
      const appointmentId = rowId.replace("apt_", "");
      await this.handleAppointmentSelection(from, appointmentId, state);
      return;
    }
  }

  // Handle department selection
  private async handleDepartmentSelection(
    from: string,
    department: string,
    state: any,
  ): Promise<void> {
    // Get doctors in department
    const doctors = await prisma.user.findMany({
      where: {
        tenantId: state.tenantId,
        role: "doctor",
        specialization: department,
        isActive: true,
        deletedAt: null,
      },
      select: { id: true, name: true, qualification: true },
    });

    await this.setConversationState(from, {
      ...state,
      step: "select_doctor",
      department,
    });

    await this.whatsappService.sendInteractive({
      to: from,
      type: "list",
      body: `Select a doctor from ${department}:`,
      listButtonText: "Select Doctor",
      sections: [
        {
          title: "Available Doctors",
          rows: doctors.map((d) => ({
            id: `doctor_${d.id}`,
            title: `Dr. ${d.name}`,
            description: d.qualification || department,
          })),
        },
      ],
    });
  }

  // Handle doctor selection - show available slots
  private async handleDoctorSelection(
    from: string,
    doctorId: string,
    state: any,
  ): Promise<void> {
    // Get available slots for next 7 days
    const slots = await this.getAvailableSlots(state.tenantId, doctorId, 7);

    await this.setConversationState(from, {
      ...state,
      step: "select_slot",
      doctorId,
    });

    if (slots.length === 0) {
      await this.whatsappService.sendText(
        from,
        "Sorry, no slots available for this doctor in the next 7 days. Would you like to try another doctor?",
      );
      await this.showDepartments(from, state.tenantId);
      return;
    }

    // Group slots by date
    const slotsByDate = this.groupSlotsByDate(slots);
    const sections = Object.entries(slotsByDate)
      .slice(0, 3)
      .map(([date, dateSlots]) => ({
        title: this.formatDate(date),
        rows: (dateSlots as any[]).slice(0, 5).map((slot) => ({
          id: `slot_${slot.date}_${slot.time}`,
          title: slot.time,
          description: `Available`,
        })),
      }));

    await this.whatsappService.sendInteractive({
      to: from,
      type: "list",
      body: "Select a time slot:",
      listButtonText: "Select Time",
      sections,
    });
  }

  // Handle slot selection - confirm booking
  private async handleSlotSelection(
    from: string,
    slotData: string,
    state: any,
  ): Promise<void> {
    const [date, time] = slotData.split("_");

    // Get doctor details
    const doctor = await prisma.user.findUnique({
      where: { id: state.doctorId },
      select: { name: true, consultationFee: true },
    });

    await this.setConversationState(from, {
      ...state,
      step: "confirm",
      date,
      time,
    });

    await this.whatsappService.sendInteractive({
      to: from,
      type: "button",
      body:
        `📅 *Appointment Summary*\n\n` +
        `Doctor: Dr. ${doctor?.name}\n` +
        `Date: ${this.formatDate(date)}\n` +
        `Time: ${time}\n` +
        `Fee: ₹${doctor?.consultationFee || "TBD"}\n\n` +
        `Would you like to confirm this booking?`,
      buttons: [
        { id: "confirm_booking", title: "✅ Confirm" },
        { id: "cancel_booking", title: "❌ Cancel" },
      ],
    });
  }

  // Confirm and create booking
  private async confirmBooking(from: string, state: any): Promise<void> {
    try {
      // Create appointment
      const appointment = await prisma.appointment.create({
        data: {
          tenantId: state.tenantId,
          branchId: state.branchId,
          patientId: state.patientId,
          doctorId: state.doctorId,
          appointmentDate: new Date(state.date),
          startTime: state.time,
          endTime: this.addMinutes(state.time, 15),
          duration: 15,
          status: "scheduled",
          type: "whatsapp",
          chiefComplaint: state.chiefComplaint,
        },
        include: {
          doctor: true,
          branch: true,
        },
      });

      // Clear conversation state
      await this.clearConversationState(from);

      // Send confirmation
      await this.whatsappService.sendText(
        from,
        `✅ *Appointment Confirmed!*\n\n` +
          `Appointment ID: ${appointment.id.slice(0, 8).toUpperCase()}\n` +
          `Doctor: Dr. ${appointment.doctor.name}\n` +
          `Date: ${this.formatDate(state.date)}\n` +
          `Time: ${state.time}\n` +
          `Location: ${appointment.branch.name}\n\n` +
          `You will receive a reminder before your appointment.\n\n` +
          `Reply MENU for more options.`,
      );
    } catch (error) {
      await this.whatsappService.sendText(
        from,
        "Sorry, there was an error booking your appointment. Please try again or contact us directly.",
      );
    }
  }

  // Show appointment status
  private async showAppointmentStatus(
    from: string,
    patient: any,
  ): Promise<void> {
    if (!patient) {
      await this.whatsappService.sendText(
        from,
        "I couldn't find your records. Please contact our reception for assistance.",
      );
      return;
    }

    const appointments = await prisma.appointment.findMany({
      where: {
        patientId: patient.id,
        appointmentDate: { gte: new Date() },
        status: { in: ["scheduled", "confirmed"] },
        deletedAt: null,
      },
      include: { doctor: true, branch: true },
      orderBy: { appointmentDate: "asc" },
      take: 5,
    });

    if (appointments.length === 0) {
      await this.whatsappService.sendText(
        from,
        "You don't have any upcoming appointments.\n\nWould you like to book one? Reply BOOK to get started.",
      );
      return;
    }

    let message = "📋 *Your Upcoming Appointments*\n\n";
    for (const apt of appointments) {
      message += `📅 ${this.formatDate(apt.appointmentDate.toISOString().split("T")[0])}\n`;
      message += `⏰ ${apt.startTime}\n`;
      message += `👨‍⚕️ Dr. ${apt.doctor.name}\n`;
      message += `📍 ${apt.branch.name}\n`;
      message += `Status: ${apt.status}\n\n`;
    }

    await this.whatsappService.sendText(from, message);
  }

  // Transfer to human
  private async transferToHuman(from: string, patient: any): Promise<void> {
    // Mark conversation for human handoff
    await this.setConversationState(from, {
      flow: "human_handoff",
      patientId: patient?.id,
    });

    await this.whatsappService.sendText(
      from,
      "I'm connecting you with our reception team. They will respond shortly.\n\n" +
        "Our working hours are 9 AM - 8 PM. If you're messaging outside these hours, " +
        "we'll get back to you as soon as possible.",
    );

    // Notify staff (could be via internal notification system)
    // await notifyStaff(from, patient);
  }

  // Conversation state management
  private async getConversationState(from: string): Promise<any> {
    const state = await redis.get(`chatbot:state:${from}`);
    return state ? JSON.parse(state) : null;
  }

  private async setConversationState(from: string, state: any): Promise<void> {
    await redis.setex(`chatbot:state:${from}`, 3600, JSON.stringify(state)); // 1 hour TTL
  }

  private async clearConversationState(from: string): Promise<void> {
    await redis.del(`chatbot:state:${from}`);
  }

  // Helper methods
  private async getAvailableSlots(
    tenantId: string,
    doctorId: string,
    days: number,
  ): Promise<any[]> {
    // Implementation would check doctor schedule and existing appointments
    // This is a simplified version
    const slots = [];
    const now = new Date();

    for (let d = 0; d < days; d++) {
      const date = new Date(now);
      date.setDate(date.getDate() + d);
      const dateStr = date.toISOString().split("T")[0];

      // Add sample slots (real implementation would check availability)
      for (const time of [
        "09:00",
        "09:30",
        "10:00",
        "10:30",
        "11:00",
        "14:00",
        "14:30",
        "15:00",
      ]) {
        slots.push({ date: dateStr, time });
      }
    }

    return slots;
  }

  private groupSlotsByDate(slots: any[]): Record<string, any[]> {
    return slots.reduce(
      (acc, slot) => {
        if (!acc[slot.date]) acc[slot.date] = [];
        acc[slot.date].push(slot);
        return acc;
      },
      {} as Record<string, any[]>,
    );
  }

  private formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  }

  private addMinutes(time: string, minutes: number): string {
    const [hours, mins] = time.split(":").map(Number);
    const totalMins = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMins / 60) % 24;
    const newMins = totalMins % 60;
    return `${newHours.toString().padStart(2, "0")}:${newMins.toString().padStart(2, "0")}`;
  }
}
```

---

## 5. Message Templates

### Common Templates

```typescript
// modules/integrations/whatsapp/templates.ts
export const MESSAGE_TEMPLATES = {
  // Appointment Reminders
  APPOINTMENT_REMINDER_24H: {
    code: "APPOINTMENT_REMINDER_24H",
    category: "transactional",
    variables: ["patient_name", "doctor_name", "date", "time", "branch_name"],
    contentEn:
      "Hi {{patient_name}}, this is a reminder for your appointment with Dr. {{doctor_name}} tomorrow ({{date}}) at {{time}} at {{branch_name}}. Reply YES to confirm or call us to reschedule.",
    contentHi:
      "नमस्ते {{patient_name}}, यह आपकी कल ({{date}}) {{time}} बजे डॉ. {{doctor_name}} के साथ {{branch_name}} में अपॉइंटमेंट की याद दिलाने के लिए है। पुष्टि के लिए YES लिखें।",
  },

  APPOINTMENT_REMINDER_2H: {
    code: "APPOINTMENT_REMINDER_2H",
    category: "transactional",
    variables: ["patient_name", "doctor_name", "time", "branch_name"],
    contentEn:
      "Hi {{patient_name}}, your appointment with Dr. {{doctor_name}} is in 2 hours at {{time}}. Location: {{branch_name}}. See you soon!",
    contentHi:
      "नमस्ते {{patient_name}}, डॉ. {{doctor_name}} के साथ आपकी अपॉइंटमेंट 2 घंटे में {{time}} बजे है। स्थान: {{branch_name}}।",
  },

  // Booking Confirmations
  APPOINTMENT_CONFIRMED: {
    code: "APPOINTMENT_CONFIRMED",
    category: "transactional",
    variables: [
      "patient_name",
      "doctor_name",
      "date",
      "time",
      "branch_name",
      "appointment_id",
    ],
    contentEn:
      "✅ Appointment Confirmed!\n\nHi {{patient_name}},\nYour appointment is booked:\n\n👨‍⚕️ Dr. {{doctor_name}}\n📅 {{date}}\n⏰ {{time}}\n📍 {{branch_name}}\n\nBooking ID: {{appointment_id}}\n\nReply MENU for more options.",
    contentHi:
      "✅ अपॉइंटमेंट कन्फर्म!\n\nनमस्ते {{patient_name}},\nआपकी अपॉइंटमेंट बुक हो गई:\n\n👨‍⚕️ डॉ. {{doctor_name}}\n📅 {{date}}\n⏰ {{time}}\n📍 {{branch_name}}\n\nबुकिंग ID: {{appointment_id}}",
  },

  // Lab Results
  LAB_RESULTS_READY: {
    code: "LAB_RESULTS_READY",
    category: "transactional",
    variables: ["patient_name", "test_name"],
    contentEn:
      "Hi {{patient_name}}, your lab results for {{test_name}} are ready. You can view them in your patient portal or visit us to collect the report.",
    contentHi:
      "नमस्ते {{patient_name}}, आपकी {{test_name}} की रिपोर्ट तैयार है। आप इसे पेशेंट पोर्टल पर देख सकते हैं या रिपोर्ट लेने आ सकते हैं।",
  },

  // Prescription
  PRESCRIPTION_READY: {
    code: "PRESCRIPTION_READY",
    category: "transactional",
    variables: ["patient_name", "doctor_name"],
    contentEn:
      "Hi {{patient_name}}, Dr. {{doctor_name}} has sent your prescription. You can view it in your patient portal or visit our pharmacy.",
    contentHi:
      "नमस्ते {{patient_name}}, डॉ. {{doctor_name}} ने आपका प्रिस्क्रिप्शन भेज दिया है। आप इसे पेशेंट पोर्टल पर देख सकते हैं।",
  },

  // Payment
  PAYMENT_RECEIVED: {
    code: "PAYMENT_RECEIVED",
    category: "transactional",
    variables: ["patient_name", "amount", "bill_number"],
    contentEn:
      "Hi {{patient_name}}, we have received your payment of ₹{{amount}}. Bill No: {{bill_number}}. Thank you!",
    contentHi:
      "नमस्ते {{patient_name}}, हमें आपका ₹{{amount}} का भुगतान मिल गया। बिल नंबर: {{bill_number}}। धन्यवाद!",
  },

  // Follow-up
  FOLLOW_UP_REMINDER: {
    code: "FOLLOW_UP_REMINDER",
    category: "transactional",
    variables: ["patient_name", "doctor_name", "days"],
    contentEn:
      "Hi {{patient_name}}, Dr. {{doctor_name}} has recommended a follow-up visit in {{days}} days. Would you like to book an appointment? Reply BOOK to schedule.",
    contentHi:
      "नमस्ते {{patient_name}}, डॉ. {{doctor_name}} ने {{days}} दिनों में फॉलो-अप विजिट की सलाह दी है। अपॉइंटमेंट बुक करने के लिए BOOK लिखें।",
  },

  // Marketing
  HEALTH_CHECKUP_PROMO: {
    code: "HEALTH_CHECKUP_PROMO",
    category: "marketing",
    variables: ["patient_name", "offer_details"],
    contentEn:
      "Hi {{patient_name}}, {{offer_details}}. Book now and take care of your health! Reply BOOK or call us.",
    contentHi:
      "नमस्ते {{patient_name}}, {{offer_details}}। अभी बुक करें! BOOK लिखें या कॉल करें।",
  },
};
```

---

## 6. WhatsApp Routes

```typescript
// modules/integrations/whatsapp/whatsapp.routes.ts
import { FastifyInstance } from "fastify";
import { WhatsAppService } from "./whatsapp.service";
import { whatsappConfig } from "@/config/whatsapp.config";

export async function whatsappRoutes(fastify: FastifyInstance) {
  const whatsappService = new WhatsAppService();

  // Webhook verification (GET)
  fastify.get("/webhook", async (request, reply) => {
    const mode = (request.query as any)["hub.mode"];
    const token = (request.query as any)["hub.verify_token"];
    const challenge = (request.query as any)["hub.challenge"];

    if (
      mode === "subscribe" &&
      token === whatsappConfig.meta.webhookVerifyToken
    ) {
      return reply.send(challenge);
    }

    return reply.status(403).send("Forbidden");
  });

  // Webhook handler (POST)
  fastify.post("/webhook", async (request, reply) => {
    await whatsappService.handleWebhook(request.body as any);
    return reply.send("OK");
  });

  // Send template message (internal API)
  fastify.post("/send-template", {
    preHandler: [authenticate],
    handler: async (request, reply) => {
      const result = await whatsappService.sendTemplate(request.body as any);
      return reply.send({ success: true, data: result });
    },
  });
}
```

---

## Summary

This WhatsApp integration guide covers:

1. **Architecture**: Message flow and components
2. **Configuration**: Provider setup and rate limits
3. **WhatsApp Service**: Template and interactive messages
4. **Chatbot Service**: Conversational booking flow
5. **Message Templates**: Pre-approved templates
6. **Webhook Routes**: Handling incoming messages

Key features:

- Multi-language support (English/Hindi)
- Opt-out and throttling compliance
- Session-based messaging
- Interactive booking flow
- Human handoff capability
- Status tracking and delivery reports
