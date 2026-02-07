'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { useAppointmentsStore } from '@/stores/appointments.store';
import { usePatientsStore } from '@/stores/patients.store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Clock,
  Search,
  UserPlus,
  CheckCircle,
  XCircle,
  Play,
  AlertTriangle,
  Star,
  Sparkles,
  Phone,
  Globe,
  MessageCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getPatientById, getDoctorById } from '@/lib/mock-data';
import type { Appointment, AppointmentStatus } from '@/lib/mock-data/types';

// Status configuration
const STATUS_CONFIG: Record<AppointmentStatus, { label: string; color: string; bgColor: string }> =
  {
    scheduled: { label: 'Scheduled', color: 'text-blue-700', bgColor: 'bg-blue-100' },
    'checked-in': { label: 'Waiting', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
    'in-consultation': {
      label: 'In Consultation',
      color: 'text-green-700',
      bgColor: 'bg-green-100',
    },
    completed: { label: 'Completed', color: 'text-gray-600', bgColor: 'bg-gray-100' },
    'no-show': { label: 'No Show', color: 'text-red-700', bgColor: 'bg-red-100' },
    cancelled: { label: 'Cancelled', color: 'text-gray-500', bgColor: 'bg-gray-100' },
  };

// Source icons
const SOURCE_ICONS = {
  online: Globe,
  phone: Phone,
  whatsapp: MessageCircle,
  'walk-in': UserPlus,
};

function StatusBadge({ status }: { status: AppointmentStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={cn('px-2.5 py-1 rounded-full text-xs font-medium', config.bgColor, config.color)}
    >
      {config.label}
    </span>
  );
}

function AppointmentCard({
  appointment,
  onCheckIn,
  onStartConsultation,
  onMarkNoShow,
  onViewPatient,
  isDoctor,
}: {
  appointment: Appointment;
  onCheckIn: () => void;
  onStartConsultation: () => void;
  onMarkNoShow: () => void;
  onViewPatient: () => void;
  isDoctor: boolean;
}) {
  const patient = getPatientById(appointment.patientId);
  const doctor = getDoctorById(appointment.doctorId);
  const SourceIcon = SOURCE_ICONS[appointment.source];

  // Calculate wait time if checked in
  const waitTime = appointment.checkedInAt
    ? Math.round((Date.now() - new Date(appointment.checkedInAt).getTime()) / 60000)
    : null;

  return (
    <Card
      className={cn(
        'transition-all hover:shadow-md',
        appointment.status === 'in-consultation' && 'ring-2 ring-green-500',
        appointment.status === 'checked-in' && waitTime && waitTime > 30 && 'ring-2 ring-yellow-500'
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          {/* Left: Token & Patient Info */}
          <div className="flex items-start gap-3">
            <div
              className={cn(
                'flex items-center justify-center w-12 h-12 rounded-xl font-bold text-lg',
                appointment.status === 'in-consultation'
                  ? 'bg-green-100 text-green-700'
                  : appointment.status === 'checked-in'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-primary/10 text-primary'
              )}
            >
              #{appointment.tokenNumber}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={onViewPatient}
                  className="font-semibold text-base hover:text-primary transition-colors"
                >
                  {patient?.name || 'Unknown Patient'}
                </button>
                {appointment.isFirstVisit && (
                  <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-[10px] rounded font-medium flex items-center gap-0.5">
                    <Sparkles className="h-2.5 w-2.5" />
                    First Visit
                  </span>
                )}
                {appointment.isVip && (
                  <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] rounded font-medium flex items-center gap-0.5">
                    <Star className="h-2.5 w-2.5" />
                    VIP
                  </span>
                )}
                {appointment.noShowRisk === 'high' && (
                  <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-[10px] rounded font-medium flex items-center gap-0.5">
                    <AlertTriangle className="h-2.5 w-2.5" />
                    High Risk
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {appointment.time}
                </span>
                <span>•</span>
                <span>{doctor?.name}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <SourceIcon className="h-3.5 w-3.5" />
                  {appointment.source}
                </span>
              </div>
              {appointment.reason && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                  {appointment.reason}
                </p>
              )}
              {waitTime !== null && appointment.status === 'checked-in' && (
                <p
                  className={cn(
                    'text-xs mt-1',
                    waitTime > 30 ? 'text-yellow-600 font-medium' : 'text-muted-foreground'
                  )}
                >
                  Waiting: {waitTime} min
                </p>
              )}
            </div>
          </div>

          {/* Right: Status & Actions */}
          <div className="flex flex-col items-end gap-2">
            <StatusBadge status={appointment.status} />

            <div className="flex gap-2 mt-2">
              {appointment.status === 'scheduled' && !isDoctor && (
                <>
                  <Button size="sm" onClick={onCheckIn}>
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Check In
                  </Button>
                  <Button size="sm" variant="outline" onClick={onMarkNoShow}>
                    <XCircle className="h-4 w-4 mr-1" />
                    No Show
                  </Button>
                </>
              )}
              {appointment.status === 'checked-in' && isDoctor && (
                <Button size="sm" onClick={onStartConsultation}>
                  <Play className="h-4 w-4 mr-1" />
                  Start
                </Button>
              )}
              {appointment.status === 'checked-in' && !isDoctor && (
                <Button size="sm" variant="outline" onClick={onMarkNoShow}>
                  <XCircle className="h-4 w-4 mr-1" />
                  No Show
                </Button>
              )}
              {appointment.status === 'in-consultation' && isDoctor && (
                <Button size="sm" variant="outline" onClick={onStartConsultation}>
                  Continue
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Stats card component
function StatsCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className={cn('flex items-center gap-3 p-4 rounded-lg', color)}>
      <Icon className="h-8 w-8 opacity-80" />
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm opacity-80">{label}</p>
      </div>
    </div>
  );
}

export default function AppointmentsPage() {
  const router = useRouter();
  const { user, selectedBranchId } = useAuthStore();
  const {
    todayAppointments,
    fetchTodayAppointments,
    checkIn,
    startConsultation,
    markNoShow,
    isLoading,
  } = useAppointmentsStore();
  const { selectPatient } = usePatientsStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | 'all'>('all');
  const [doctorFilter, setDoctorFilter] = useState<string>('all');

  const isDoctor = user?.role === 'doctor';

  useEffect(() => {
    fetchTodayAppointments(selectedBranchId || undefined);
  }, [selectedBranchId, fetchTodayAppointments]);

  // Filter appointments
  let filteredAppointments = [...todayAppointments];

  // For doctors, show only their appointments
  if (isDoctor) {
    filteredAppointments = filteredAppointments.filter(
      (a) => a.doctorId === user.id.replace('user', 'doc')
    );
  }

  // Apply status filter
  if (statusFilter !== 'all') {
    filteredAppointments = filteredAppointments.filter((a) => a.status === statusFilter);
  }

  // Apply doctor filter (for non-doctors)
  if (!isDoctor && doctorFilter !== 'all') {
    filteredAppointments = filteredAppointments.filter((a) => a.doctorId === doctorFilter);
  }

  // Apply search
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filteredAppointments = filteredAppointments.filter((a) => {
      const patient = getPatientById(a.patientId);
      return (
        patient?.name.toLowerCase().includes(query) ||
        patient?.phone.includes(query) ||
        a.tokenNumber.toString().includes(query)
      );
    });
  }

  // Sort by time
  filteredAppointments.sort((a, b) => a.time.localeCompare(b.time));

  // Calculate stats
  const stats = {
    total: todayAppointments.length,
    waiting: todayAppointments.filter((a) => a.status === 'checked-in').length,
    inConsultation: todayAppointments.filter((a) => a.status === 'in-consultation').length,
    completed: todayAppointments.filter((a) => a.status === 'completed').length,
  };

  // Get unique doctors for filter
  const doctors = Array.from(new Set(todayAppointments.map((a) => a.doctorId)))
    .map((id) => getDoctorById(id))
    .filter(Boolean);

  const handleCheckIn = async (appointmentId: string) => {
    await checkIn(appointmentId);
  };

  const handleStartConsultation = async (appointment: Appointment) => {
    if (appointment.status === 'checked-in') {
      await startConsultation(appointment.id);
    }
    router.push(`/consultation/${appointment.id}`);
  };

  const handleMarkNoShow = async (appointmentId: string) => {
    if (confirm('Mark this appointment as No Show?')) {
      await markNoShow(appointmentId);
    }
  };

  const handleViewPatient = (patientId: string) => {
    selectPatient(patientId);
    router.push(`/patients/${patientId}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{isDoctor ? 'My Queue' : "Today's Appointments"}</h1>
          <p className="text-muted-foreground">
            {new Date().toLocaleDateString('en-IN', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </p>
        </div>
        {!isDoctor && (
          <Button onClick={() => router.push('/appointments/walk-in')}>
            <UserPlus className="h-4 w-4 mr-2" />
            Walk-in Patient
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard
          label="Total"
          value={stats.total}
          icon={Clock}
          color="bg-blue-50 text-blue-700"
        />
        <StatsCard
          label="Waiting"
          value={stats.waiting}
          icon={Clock}
          color="bg-yellow-50 text-yellow-700"
        />
        <StatsCard
          label="In Consultation"
          value={stats.inConsultation}
          icon={Play}
          color="bg-green-50 text-green-700"
        />
        <StatsCard
          label="Completed"
          value={stats.completed}
          icon={CheckCircle}
          color="bg-gray-50 text-gray-700"
        />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, phone, or token..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as AppointmentStatus | 'all')}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="all">All Status</option>
                <option value="scheduled">Scheduled</option>
                <option value="checked-in">Waiting</option>
                <option value="in-consultation">In Consultation</option>
                <option value="completed">Completed</option>
                <option value="no-show">No Show</option>
              </select>
              {!isDoctor && (
                <select
                  value={doctorFilter}
                  onChange={(e) => setDoctorFilter(e.target.value)}
                  className="px-3 py-2 border rounded-md text-sm"
                >
                  <option value="all">All Doctors</option>
                  {doctors.map((doc) => (
                    <option key={doc!.id} value={doc!.id}>
                      {doc!.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appointments List */}
      <div className="space-y-3">
        {isLoading ? (
          // Loading skeleton
          Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="animate-pulse flex items-start gap-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-xl" />
                  <div className="flex-1">
                    <div className="h-5 bg-gray-200 rounded w-1/3 mb-2" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                  </div>
                  <div className="h-6 bg-gray-200 rounded w-20" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : filteredAppointments.length > 0 ? (
          filteredAppointments.map((appointment) => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              onCheckIn={() => handleCheckIn(appointment.id)}
              onStartConsultation={() => handleStartConsultation(appointment)}
              onMarkNoShow={() => handleMarkNoShow(appointment.id)}
              onViewPatient={() => handleViewPatient(appointment.patientId)}
              isDoctor={isDoctor}
            />
          ))
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-1">No appointments found</h3>
              <p className="text-muted-foreground">
                {searchQuery || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'No appointments scheduled for today'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
