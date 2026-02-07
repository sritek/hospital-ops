/**
 * Mock data for booking portal - simplified version of web app mock data
 */

export interface Doctor {
  id: string;
  name: string;
  photoUrl: string;
  specialization: string;
  qualification: string;
  experience: number;
  languages: string[];
  consultationFee: number;
  followUpFee: number;
  slotDuration: number;
  nextAvailable: string;
  rating: number;
  reviewCount: number;
}

export interface Clinic {
  id: string;
  name: string;
  slug: string;
  logoUrl: string;
  address: string;
  city: string;
  phone: string;
  email: string;
}

export interface TimeSlot {
  time: string;
  available: boolean;
}

export const mockClinic: Clinic = {
  id: 'tenant-001',
  name: 'HealthFirst Multi-Specialty Clinic',
  slug: 'healthfirst',
  logoUrl: '/images/clinic-logo.png',
  address: '123, MG Road, Sector 18, Noida',
  city: 'Noida',
  phone: '0120-4567890',
  email: 'contact@healthfirst.in',
};

export const mockDoctors: Doctor[] = [
  {
    id: 'doc-001',
    name: 'Dr. Priya Sharma',
    photoUrl: '',
    specialization: 'General Physician',
    qualification: 'MBBS, MD (Internal Medicine)',
    experience: 12,
    languages: ['English', 'Hindi'],
    consultationFee: 500,
    followUpFee: 300,
    slotDuration: 15,
    nextAvailable: 'Today, 5:00 PM',
    rating: 4.8,
    reviewCount: 234,
  },
  {
    id: 'doc-002',
    name: 'Dr. Rajesh Kumar',
    photoUrl: '',
    specialization: 'Pediatrician',
    qualification: 'MBBS, DCH, DNB (Pediatrics)',
    experience: 15,
    languages: ['English', 'Hindi', 'Punjabi'],
    consultationFee: 600,
    followUpFee: 400,
    slotDuration: 20,
    nextAvailable: 'Tomorrow, 9:00 AM',
    rating: 4.9,
    reviewCount: 312,
  },
  {
    id: 'doc-003',
    name: 'Dr. Anita Desai',
    photoUrl: '',
    specialization: 'Gynecologist & Obstetrician',
    qualification: 'MBBS, MS (OBG), DNB',
    experience: 18,
    languages: ['English', 'Hindi', 'Gujarati'],
    consultationFee: 700,
    followUpFee: 500,
    slotDuration: 20,
    nextAvailable: 'Tomorrow, 11:00 AM',
    rating: 4.7,
    reviewCount: 189,
  },
  {
    id: 'doc-004',
    name: 'Dr. Vikram Singh',
    photoUrl: '',
    specialization: 'Orthopedic Surgeon',
    qualification: 'MBBS, MS (Ortho), Fellowship in Joint Replacement',
    experience: 20,
    languages: ['English', 'Hindi'],
    consultationFee: 800,
    followUpFee: 500,
    slotDuration: 15,
    nextAvailable: 'Friday, 2:00 PM',
    rating: 4.9,
    reviewCount: 276,
  },
  {
    id: 'doc-005',
    name: 'Dr. Meera Patel',
    photoUrl: '',
    specialization: 'Dermatologist',
    qualification: 'MBBS, MD (Dermatology)',
    experience: 10,
    languages: ['English', 'Hindi', 'Gujarati'],
    consultationFee: 600,
    followUpFee: 400,
    slotDuration: 15,
    nextAvailable: 'Thursday, 10:00 AM',
    rating: 4.6,
    reviewCount: 156,
  },
];

// Generate slots for a given date
export function generateSlots(
  date: Date,
  _doctorId: string
): { morning: TimeSlot[]; evening: TimeSlot[] } {
  const isToday = date.toDateString() === new Date().toDateString();
  const currentHour = new Date().getHours();

  const morningSlots: TimeSlot[] = [];
  const eveningSlots: TimeSlot[] = [];

  // Morning slots: 9 AM - 1 PM
  for (let hour = 9; hour < 13; hour++) {
    for (let min = 0; min < 60; min += 30) {
      const time = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
      const available =
        !isToday || hour > currentHour || (hour === currentHour && min > new Date().getMinutes());
      // Randomly make some slots unavailable
      morningSlots.push({ time, available: available && Math.random() > 0.3 });
    }
  }

  // Evening slots: 5 PM - 8 PM
  for (let hour = 17; hour < 20; hour++) {
    for (let min = 0; min < 60; min += 30) {
      const time = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
      const available =
        !isToday || hour > currentHour || (hour === currentHour && min > new Date().getMinutes());
      eveningSlots.push({ time, available: available && Math.random() > 0.25 });
    }
  }

  return { morning: morningSlots, evening: eveningSlots };
}

export function getDoctorById(id: string): Doctor | undefined {
  return mockDoctors.find((d) => d.id === id);
}

export function getSpecializations(): string[] {
  return [...new Set(mockDoctors.map((d) => d.specialization))];
}

export function formatTime(time: string): string {
  const parts = time.split(':').map(Number);
  const hours = parts[0] ?? 0;
  const minutes = parts[1] ?? 0;
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}
