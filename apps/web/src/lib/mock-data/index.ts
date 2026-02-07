/**
 * Mock Data Index
 * Central export for all mock data
 */

// Types
export * from './types';

// Data
export { mockClinic, mockBranches, getBranchById, getActiveBranches } from './clinic';
export {
  mockDoctors,
  getDoctorById,
  getDoctorsByBranch,
  getDoctorsBySpecialization,
  getActiveDoctors,
  getSpecializations,
} from './doctors';
export {
  mockPatients,
  mockVisitHistory,
  getPatientById,
  searchPatients,
  getPatientVisitHistory,
  getRecentPatients,
  getPatientsWithCondition,
} from './patients';
export {
  mockAppointments,
  getAppointmentById,
  getTodayAppointments,
  getAppointmentsByDate,
  getAppointmentsByPatient,
  getAppointmentsByDoctor,
  getUpcomingAppointments,
  getQueuePosition,
  getNextTokenNumber,
} from './appointments';
export {
  mockDrugs,
  mockDrugInteractions,
  mockLabTests,
  mockICD10Codes,
  searchDrugs,
  getDrugById,
  checkDrugInteractions,
  searchLabTests,
  searchICD10,
  getCommonDiagnoses,
  getCommonLabTests,
} from './drugs';
export {
  mockWhatsAppTemplates,
  mockBookingConversation,
  mockReminderConversation,
  mockLabResultConversation,
  getTemplateById,
  getTemplatesByCategory,
  getActiveTemplates,
  renderTemplate,
} from './whatsapp-templates';
