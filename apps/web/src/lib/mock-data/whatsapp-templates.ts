/**
 * Mock WhatsApp templates and conversation data
 */

import type { WhatsAppTemplate, WhatsAppMessage } from './types';

export const mockWhatsAppTemplates: WhatsAppTemplate[] = [
  // Appointment templates
  {
    id: 'tpl-001',
    name: 'appointment_confirmation',
    category: 'appointments',
    contentEn: `✅ *Appointment Confirmed*

Hi {{patient_name}},

Your appointment has been booked:
👨‍⚕️ *Doctor:* {{doctor_name}}
📅 *Date:* {{date}}
⏰ *Time:* {{time}}
🎫 *Token:* #{{token}}
📍 *Location:* {{clinic_name}}, {{branch_address}}

Please arrive 15 minutes early.

Reply CANCEL to cancel
Reply RESCHEDULE to change`,
    contentHi: `✅ *अपॉइंटमेंट कन्फर्म*

नमस्ते {{patient_name}},

आपकी अपॉइंटमेंट बुक हो गई है:
👨‍⚕️ *डॉक्टर:* {{doctor_name}}
📅 *तारीख:* {{date}}
⏰ *समय:* {{time}}
🎫 *टोकन:* #{{token}}
📍 *पता:* {{clinic_name}}, {{branch_address}}

कृपया 15 मिनट पहले पहुंचें।

रद्द करने के लिए CANCEL लिखें
बदलने के लिए RESCHEDULE लिखें`,
    variables: [
      'patient_name',
      'doctor_name',
      'date',
      'time',
      'token',
      'clinic_name',
      'branch_address',
    ],
    isActive: true,
  },
  {
    id: 'tpl-002',
    name: 'appointment_reminder_24h',
    category: 'reminders',
    contentEn: `⏰ *Appointment Reminder*

Hi {{patient_name}},

This is a reminder for your appointment *tomorrow*:
👨‍⚕️ {{doctor_name}}
📅 {{date}} at {{time}}
🎫 Token: #{{token}}

Please arrive 15 minutes early with any previous reports.

Reply CONFIRM to confirm
Reply RESCHEDULE to change`,
    contentHi: `⏰ *अपॉइंटमेंट रिमाइंडर*

नमस्ते {{patient_name}},

*कल* आपकी अपॉइंटमेंट है:
👨‍⚕️ {{doctor_name}}
📅 {{date}}, {{time}}
🎫 टोकन: #{{token}}

कृपया पुरानी रिपोर्ट्स लेकर 15 मिनट पहले आएं।

कन्फर्म करने के लिए CONFIRM लिखें
बदलने के लिए RESCHEDULE लिखें`,
    variables: ['patient_name', 'doctor_name', 'date', 'time', 'token'],
    isActive: true,
  },
  {
    id: 'tpl-003',
    name: 'appointment_reminder_2h',
    category: 'reminders',
    contentEn: `🔔 *Reminder: Appointment in 2 hours*

Hi {{patient_name}},

Your appointment with {{doctor_name}} is at {{time}} today.

📍 {{clinic_name}}
🎫 Token: #{{token}}

See you soon!`,
    contentHi: `🔔 *रिमाइंडर: 2 घंटे में अपॉइंटमेंट*

नमस्ते {{patient_name}},

आज {{time}} पर {{doctor_name}} के साथ आपकी अपॉइंटमेंट है।

📍 {{clinic_name}}
🎫 टोकन: #{{token}}

जल्द मिलते हैं!`,
    variables: ['patient_name', 'doctor_name', 'time', 'clinic_name', 'token'],
    isActive: true,
  },
  // Results templates
  {
    id: 'tpl-004',
    name: 'lab_results_ready',
    category: 'results',
    contentEn: `📋 *Lab Results Ready*

Hi {{patient_name}},

Your lab test results for *{{test_name}}* are now available.

You can:
1. View online at {{portal_link}}
2. Collect from the clinic

For any concerns, please consult your doctor.`,
    contentHi: `📋 *लैब रिजल्ट तैयार*

नमस्ते {{patient_name}},

*{{test_name}}* की रिपोर्ट तैयार है।

आप:
1. ऑनलाइन देख सकते हैं: {{portal_link}}
2. क्लिनिक से ले सकते हैं

किसी भी सवाल के लिए डॉक्टर से मिलें।`,
    variables: ['patient_name', 'test_name', 'portal_link'],
    isActive: true,
  },
  {
    id: 'tpl-005',
    name: 'prescription_reminder',
    category: 'reminders',
    contentEn: `💊 *Medication Reminder*

Hi {{patient_name}},

Time to take your medication:
{{medication_name}} - {{dosage}}

Stay healthy! 🌟`,
    contentHi: `💊 *दवाई रिमाइंडर*

नमस्ते {{patient_name}},

दवाई लेने का समय:
{{medication_name}} - {{dosage}}

स्वस्थ रहें! 🌟`,
    variables: ['patient_name', 'medication_name', 'dosage'],
    isActive: true,
  },
  // Marketing templates
  {
    id: 'tpl-006',
    name: 'health_checkup_reminder',
    category: 'marketing',
    contentEn: `🏥 *Annual Health Checkup Reminder*

Hi {{patient_name}},

It's been a year since your last health checkup. Regular checkups help detect health issues early.

📅 Book your checkup today!
Reply BOOK to schedule

Special offer: 20% off on comprehensive health packages this month.`,
    contentHi: `🏥 *वार्षिक हेल्थ चेकअप रिमाइंडर*

नमस्ते {{patient_name}},

आपके पिछले चेकअप को एक साल हो गया। नियमित जांच से बीमारियों का जल्दी पता चलता है।

📅 आज ही बुक करें!
BOOK लिखें

विशेष ऑफर: इस महीने हेल्थ पैकेज पर 20% छूट।`,
    variables: ['patient_name'],
    isActive: true,
  },
  {
    id: 'tpl-007',
    name: 'birthday_greeting',
    category: 'marketing',
    contentEn: `🎂 *Happy Birthday, {{patient_name}}!*

Wishing you a wonderful birthday filled with good health and happiness!

As a birthday gift, enjoy *15% off* on your next consultation.

Use code: BDAY15

From your friends at {{clinic_name}} 💐`,
    contentHi: `🎂 *जन्मदिन मुबारक, {{patient_name}}!*

आपको स्वस्थ और खुशहाल जन्मदिन की शुभकामनाएं!

बर्थडे गिफ्ट: अगली विजिट पर *15% छूट*

कोड: BDAY15

{{clinic_name}} की ओर से 💐`,
    variables: ['patient_name', 'clinic_name'],
    isActive: true,
  },
  {
    id: 'tpl-008',
    name: 'follow_up_reminder',
    category: 'reminders',
    contentEn: `📅 *Follow-up Reminder*

Hi {{patient_name}},

Dr. {{doctor_name}} recommended a follow-up visit around this time.

Would you like to book an appointment?

Reply BOOK to schedule
Reply LATER to be reminded next week`,
    contentHi: `📅 *फॉलो-अप रिमाइंडर*

नमस्ते {{patient_name}},

डॉ. {{doctor_name}} ने इस समय फॉलो-अप की सलाह दी थी।

क्या आप अपॉइंटमेंट बुक करना चाहेंगे?

BOOK लिखें बुक करने के लिए
LATER लिखें अगले हफ्ते याद दिलाने के लिए`,
    variables: ['patient_name', 'doctor_name'],
    isActive: true,
  },
  // General templates
  {
    id: 'tpl-009',
    name: 'welcome_message',
    category: 'general',
    contentEn: `👋 *Welcome to {{clinic_name}}!*

Hi {{patient_name}},

Thank you for registering with us. We're committed to providing you the best healthcare.

📞 For appointments: {{clinic_phone}}
🌐 Book online: {{booking_link}}

Reply HELP for assistance.`,
    contentHi: `👋 *{{clinic_name}} में आपका स्वागत है!*

नमस्ते {{patient_name}},

हमारे साथ रजिस्टर करने के लिए धन्यवाद।

📞 अपॉइंटमेंट के लिए: {{clinic_phone}}
🌐 ऑनलाइन बुक करें: {{booking_link}}

मदद के लिए HELP लिखें।`,
    variables: ['patient_name', 'clinic_name', 'clinic_phone', 'booking_link'],
    isActive: true,
  },
  {
    id: 'tpl-010',
    name: 'feedback_request',
    category: 'general',
    contentEn: `⭐ *How was your visit?*

Hi {{patient_name}},

We hope your visit with {{doctor_name}} was helpful.

Please rate your experience:
1️⃣ Excellent
2️⃣ Good
3️⃣ Average
4️⃣ Poor

Your feedback helps us improve!`,
    contentHi: `⭐ *आपकी विजिट कैसी रही?*

नमस्ते {{patient_name}},

हमें उम्मीद है {{doctor_name}} से मिलकर आपको मदद मिली।

कृपया रेटिंग दें:
1️⃣ बहुत अच्छा
2️⃣ अच्छा
3️⃣ ठीक
4️⃣ खराब

आपका फीडबैक हमें बेहतर बनाता है!`,
    variables: ['patient_name', 'doctor_name'],
    isActive: true,
  },
];

// Pre-scripted conversations for demo
export const mockBookingConversation: WhatsAppMessage[] = [
  {
    id: 'msg-001',
    patientId: 'demo-patient',
    sender: 'patient',
    content: 'Hi, I want to book an appointment',
    timestamp: '10:30 AM',
    status: 'read',
  },
  {
    id: 'msg-002',
    patientId: 'demo-patient',
    templateId: 'bot-menu',
    sender: 'bot',
    content: `Welcome to *HealthFirst Clinic*! 🏥

How can I help you today?

1️⃣ Book Appointment
2️⃣ Reschedule Appointment
3️⃣ Cancel Appointment
4️⃣ View My Appointments
5️⃣ Talk to Reception

Reply with a number`,
    timestamp: '10:30 AM',
    status: 'delivered',
  },
  {
    id: 'msg-003',
    patientId: 'demo-patient',
    sender: 'patient',
    content: '1',
    timestamp: '10:31 AM',
    status: 'read',
  },
  {
    id: 'msg-004',
    patientId: 'demo-patient',
    sender: 'bot',
    content: `Please select a doctor:

1️⃣ *Dr. Priya Sharma*
   General Physician | ₹500
   Next: Tomorrow 10:00 AM

2️⃣ *Dr. Rajesh Kumar*
   Pediatrician | ₹600
   Next: Tomorrow 9:00 AM

3️⃣ *Dr. Anita Desai*
   Gynecologist | ₹700
   Next: Day after 11:00 AM

4️⃣ *Dr. Vikram Singh*
   Orthopedic | ₹800
   Next: Friday 2:00 PM

Reply with doctor number`,
    timestamp: '10:31 AM',
    status: 'delivered',
  },
  {
    id: 'msg-005',
    patientId: 'demo-patient',
    sender: 'patient',
    content: '1',
    timestamp: '10:32 AM',
    status: 'read',
  },
  {
    id: 'msg-006',
    patientId: 'demo-patient',
    sender: 'bot',
    content: `*Dr. Priya Sharma* - General Physician

Available slots for *Tomorrow*:

Morning:
1️⃣ 10:00 AM
2️⃣ 10:30 AM
3️⃣ 11:00 AM
4️⃣ 11:30 AM

Evening:
5️⃣ 5:00 PM
6️⃣ 5:30 PM
7️⃣ 6:00 PM

Reply with slot number
Or type DATE for other dates`,
    timestamp: '10:32 AM',
    status: 'delivered',
  },
  {
    id: 'msg-007',
    patientId: 'demo-patient',
    sender: 'patient',
    content: '2',
    timestamp: '10:33 AM',
    status: 'read',
  },
  {
    id: 'msg-008',
    patientId: 'demo-patient',
    sender: 'bot',
    content: `Great choice! 

Please confirm your booking:

👨‍⚕️ *Dr. Priya Sharma*
📅 Tomorrow (8th Feb 2026)
⏰ 10:30 AM
💰 ₹500

Reply *CONFIRM* to book
Reply *BACK* to change`,
    timestamp: '10:33 AM',
    status: 'delivered',
  },
  {
    id: 'msg-009',
    patientId: 'demo-patient',
    sender: 'patient',
    content: 'CONFIRM',
    timestamp: '10:34 AM',
    status: 'read',
  },
  {
    id: 'msg-010',
    patientId: 'demo-patient',
    sender: 'bot',
    content: `✅ *Appointment Confirmed!*

👨‍⚕️ *Doctor:* Dr. Priya Sharma
📅 *Date:* 8th Feb 2026 (Tomorrow)
⏰ *Time:* 10:30 AM
🎫 *Token:* #12
📍 *Location:* HealthFirst Clinic
   123, MG Road, Sector 18, Noida

Please arrive 15 minutes early.
Carry any previous reports.

Reply CANCEL to cancel
Reply RESCHEDULE to change

See you tomorrow! 🙏`,
    timestamp: '10:34 AM',
    status: 'delivered',
  },
];

export const mockReminderConversation: WhatsAppMessage[] = [
  {
    id: 'rem-001',
    patientId: 'pat-001',
    templateId: 'tpl-002',
    sender: 'clinic',
    content: `⏰ *Appointment Reminder*

Hi Amit,

This is a reminder for your appointment *tomorrow*:
👨‍⚕️ Dr. Priya Sharma
📅 8th Feb 2026 at 10:00 AM
🎫 Token: #1

Please arrive 15 minutes early with any previous reports.

Reply CONFIRM to confirm
Reply RESCHEDULE to change`,
    timestamp: '6:00 PM',
    status: 'delivered',
  },
  {
    id: 'rem-002',
    patientId: 'pat-001',
    sender: 'patient',
    content: 'CONFIRM',
    timestamp: '6:15 PM',
    status: 'read',
  },
  {
    id: 'rem-003',
    patientId: 'pat-001',
    sender: 'bot',
    content: `✅ Thank you for confirming!

We'll see you tomorrow at 10:00 AM.

📍 HealthFirst Clinic, Sector 18, Noida

Have a great day! 🙏`,
    timestamp: '6:15 PM',
    status: 'delivered',
  },
];

export const mockLabResultConversation: WhatsAppMessage[] = [
  {
    id: 'lab-001',
    patientId: 'pat-003',
    templateId: 'tpl-004',
    sender: 'clinic',
    content: `📋 *Lab Results Ready*

Hi Rajesh,

Your lab test results for *Lipid Profile* are now available.

You can:
1. View online at healthfirst.in/reports
2. Collect from the clinic

For any concerns, please consult your doctor.`,
    timestamp: '11:00 AM',
    status: 'delivered',
  },
  {
    id: 'lab-002',
    patientId: 'pat-003',
    sender: 'patient',
    content: 'Can you share the report here?',
    timestamp: '11:30 AM',
    status: 'read',
  },
  {
    id: 'lab-003',
    patientId: 'pat-003',
    sender: 'bot',
    content: `For your privacy and security, detailed reports can only be viewed through our secure patient portal.

🔗 Login at: healthfirst.in/reports
📱 Or download our app

Need help? Reply HELP to connect with our team.`,
    timestamp: '11:30 AM',
    status: 'delivered',
  },
];

// Helper functions
export function getTemplateById(templateId: string): WhatsAppTemplate | undefined {
  return mockWhatsAppTemplates.find((t) => t.id === templateId);
}

export function getTemplatesByCategory(category: WhatsAppTemplate['category']): WhatsAppTemplate[] {
  return mockWhatsAppTemplates.filter((t) => t.category === category && t.isActive);
}

export function getActiveTemplates(): WhatsAppTemplate[] {
  return mockWhatsAppTemplates.filter((t) => t.isActive);
}

export function renderTemplate(
  template: WhatsAppTemplate,
  variables: Record<string, string>,
  language: 'en' | 'hi' = 'en'
): string {
  let content = language === 'hi' ? template.contentHi : template.contentEn;

  for (const [key, value] of Object.entries(variables)) {
    content = content.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }

  return content;
}
