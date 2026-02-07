'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { useAppointmentsStore } from '@/stores/appointments.store';
import { analyticsApi } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  Users,
  Activity,
  IndianRupee,
  Clock,
  UserPlus,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Stethoscope,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getPatientById, getDoctorById } from '@/lib/mock-data';
import type { Appointment } from '@/lib/mock-data/types';

// Animated counter component
function AnimatedNumber({
  value,
  prefix = '',
  suffix = '',
}: {
  value: number;
  prefix?: string;
  suffix?: string;
}) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 1000;
    const steps = 30;
    const increment = value / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <span>
      {prefix}
      {displayValue.toLocaleString('en-IN')}
      {suffix}
    </span>
  );
}

// Status badge component
function StatusBadge({ status }: { status: Appointment['status'] }) {
  const config = {
    scheduled: { label: 'Scheduled', className: 'bg-blue-100 text-blue-700' },
    'checked-in': { label: 'Waiting', className: 'bg-yellow-100 text-yellow-700' },
    'in-consultation': { label: 'In Consultation', className: 'bg-green-100 text-green-700' },
    completed: { label: 'Completed', className: 'bg-gray-100 text-gray-600' },
    'no-show': { label: 'No Show', className: 'bg-red-100 text-red-700' },
    cancelled: { label: 'Cancelled', className: 'bg-gray-100 text-gray-500' },
  };

  const { label, className } = config[status] || config.scheduled;

  return (
    <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', className)}>{label}</span>
  );
}

// Appointment row component
function AppointmentRow({
  appointment,
  onClick,
}: {
  appointment: Appointment;
  onClick: () => void;
}) {
  const patient = getPatientById(appointment.patientId);
  const doctor = getDoctorById(appointment.doctorId);

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors text-left"
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-medium text-sm">
          #{appointment.tokenNumber}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium text-sm">{patient?.name || 'Unknown'}</p>
            {appointment.isFirstVisit && (
              <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-[10px] rounded font-medium">
                NEW
              </span>
            )}
            {appointment.noShowRisk === 'high' && (
              <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-[10px] rounded font-medium flex items-center gap-0.5">
                <AlertTriangle className="h-2.5 w-2.5" />
                Risk
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {appointment.time} • {doctor?.name}
          </p>
        </div>
      </div>
      <StatusBadge status={appointment.status} />
    </button>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, selectedBranchId } = useAuthStore();
  const { todayAppointments, fetchTodayAppointments, isLoading } = useAppointmentsStore();
  const [metrics, setMetrics] = useState({
    todayAppointments: { total: 0, completed: 0 },
    todayRevenue: 0,
    totalPatients: 0,
    activeStaff: 0,
  });

  useEffect(() => {
    // Fetch today's appointments
    fetchTodayAppointments(selectedBranchId || undefined);

    // Fetch dashboard metrics
    analyticsApi.getDashboardMetrics().then((response) => {
      if (response.success) {
        setMetrics(response.data);
      }
    });
  }, [selectedBranchId, fetchTodayAppointments]);

  // Filter appointments for current user if doctor
  const relevantAppointments =
    user?.role === 'doctor'
      ? todayAppointments.filter((a) => a.doctorId === user.id.replace('user', 'doc'))
      : todayAppointments;

  // Get upcoming appointments (not completed/cancelled)
  const upcomingAppointments = relevantAppointments
    .filter((a) => ['scheduled', 'checked-in', 'in-consultation'].includes(a.status))
    .slice(0, 5);

  // Get waiting count
  const waitingCount = relevantAppointments.filter((a) => a.status === 'checked-in').length;
  const inConsultationCount = relevantAppointments.filter(
    (a) => a.status === 'in-consultation'
  ).length;

  // Recent activity (completed appointments)
  const recentActivity = relevantAppointments.filter((a) => a.status === 'completed').slice(0, 4);

  const handleAppointmentClick = (appointment: Appointment) => {
    if (user?.role === 'doctor' && ['checked-in', 'in-consultation'].includes(appointment.status)) {
      router.push(`/consultation/${appointment.id}`);
    } else {
      router.push('/appointments');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {getGreeting()}, {user?.name?.split(' ')[0]}
          </h1>
          <p className="text-muted-foreground">
            {new Date().toLocaleDateString('en-IN', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/appointments')}>
            <Calendar className="h-4 w-4 mr-2" />
            View Queue
          </Button>
          {user?.role !== 'doctor' && (
            <Button onClick={() => router.push('/patients/new')}>
              <UserPlus className="h-4 w-4 mr-2" />
              Walk-in
            </Button>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <AnimatedNumber value={metrics.todayAppointments.total} />
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.todayAppointments.completed} completed
            </p>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-100">
              <div
                className="h-full bg-primary transition-all duration-1000"
                style={{
                  width: `${
                    metrics.todayAppointments.total > 0
                      ? (metrics.todayAppointments.completed / metrics.todayAppointments.total) *
                        100
                      : 0
                  }%`,
                }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Waiting Now</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              <AnimatedNumber value={waitingCount} />
            </div>
            <p className="text-xs text-muted-foreground">{inConsultationCount} in consultation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <AnimatedNumber value={metrics.totalPatients} />
            </div>
            <p className="text-xs text-muted-foreground">+12 this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Revenue</CardTitle>
            <IndianRupee className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              <AnimatedNumber value={metrics.todayRevenue} prefix="₹" />
            </div>
            <p className="text-xs text-muted-foreground">+20% from yesterday</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming Appointments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5" />
              {user?.role === 'doctor' ? 'Your Queue' : 'Upcoming Appointments'}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => router.push('/appointments')}>
              View All
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse flex items-center gap-3 p-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full" />
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : upcomingAppointments.length > 0 ? (
              <div className="space-y-1">
                {upcomingAppointments.map((appointment) => (
                  <AppointmentRow
                    key={appointment.id}
                    appointment={appointment}
                    onClick={() => handleAppointmentClick(appointment)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p>No upcoming appointments</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((appointment) => {
                  const patient = getPatientById(appointment.patientId);
                  const doctor = getDoctorById(appointment.doctorId);
                  return (
                    <div key={appointment.id} className="flex items-start gap-3">
                      <div className="mt-0.5">
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {patient?.name} - Consultation completed
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {doctor?.name} •{' '}
                          {appointment.completedAt
                            ? new Date(appointment.completedAt).toLocaleTimeString('en-IN', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : appointment.time}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p>No recent activity</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions for Receptionist */}
      {user?.role === 'receptionist' && (
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button
                variant="outline"
                className="h-auto py-4 flex-col"
                onClick={() => router.push('/appointments')}
              >
                <Calendar className="h-6 w-6 mb-2" />
                <span>Appointments</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex-col"
                onClick={() => router.push('/patients')}
              >
                <Users className="h-6 w-6 mb-2" />
                <span>Patients</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex-col"
                onClick={() => router.push('/patients/new')}
              >
                <UserPlus className="h-6 w-6 mb-2" />
                <span>New Patient</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex-col"
                onClick={() => router.push('/billing')}
              >
                <IndianRupee className="h-6 w-6 mb-2" />
                <span>Billing</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}
