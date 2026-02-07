'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Users,
  Calendar,
  IndianRupee,
  Clock,
  Activity,
  UserPlus,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Mock analytics data
const METRICS = [
  {
    label: 'Total Revenue',
    value: '₹4,52,800',
    change: 12.5,
    trend: 'up',
    icon: IndianRupee,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  {
    label: 'Appointments',
    value: '847',
    change: 8.2,
    trend: 'up',
    icon: Calendar,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    label: 'New Patients',
    value: '156',
    change: 23.1,
    trend: 'up',
    icon: UserPlus,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  {
    label: 'Avg Wait Time',
    value: '12 min',
    change: -15.3,
    trend: 'down',
    icon: Clock,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
  },
];

const REVENUE_BY_SERVICE = [
  { service: 'Consultations', amount: 245000, percentage: 54 },
  { service: 'Lab Tests', amount: 98500, percentage: 22 },
  { service: 'Pharmacy', amount: 67300, percentage: 15 },
  { service: 'Procedures', amount: 42000, percentage: 9 },
];

const REVENUE_BY_DOCTOR = [
  { name: 'Dr. Priya Sharma', amount: 125000, patients: 234 },
  { name: 'Dr. Rajesh Kumar', amount: 98000, patients: 156 },
  { name: 'Dr. Anita Desai', amount: 87000, patients: 112 },
  { name: 'Dr. Vikram Singh', amount: 76000, patients: 98 },
  { name: 'Dr. Meera Patel', amount: 66800, patients: 89 },
];

const DAILY_APPOINTMENTS = [
  { day: 'Mon', count: 45, noShow: 3 },
  { day: 'Tue', count: 52, noShow: 4 },
  { day: 'Wed', count: 48, noShow: 2 },
  { day: 'Thu', count: 56, noShow: 5 },
  { day: 'Fri', count: 61, noShow: 4 },
  { day: 'Sat', count: 38, noShow: 2 },
  { day: 'Sun', count: 12, noShow: 1 },
];

const PEAK_HOURS = [
  { hour: '9 AM', value: 65 },
  { hour: '10 AM', value: 85 },
  { hour: '11 AM', value: 95 },
  { hour: '12 PM', value: 70 },
  { hour: '1 PM', value: 30 },
  { hour: '2 PM', value: 45 },
  { hour: '3 PM', value: 55 },
  { hour: '4 PM', value: 75 },
  { hour: '5 PM', value: 90 },
  { hour: '6 PM', value: 80 },
  { hour: '7 PM', value: 60 },
  { hour: '8 PM', value: 35 },
];

const PATIENT_DEMOGRAPHICS = {
  gender: [
    { label: 'Male', value: 45, color: 'bg-blue-500' },
    { label: 'Female', value: 52, color: 'bg-pink-500' },
    { label: 'Other', value: 3, color: 'bg-purple-500' },
  ],
  age: [
    { label: '0-18', value: 15 },
    { label: '19-35', value: 28 },
    { label: '36-50', value: 32 },
    { label: '51-65', value: 18 },
    { label: '65+', value: 7 },
  ],
};

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState('30d');
  const maxAppointments = Math.max(...DAILY_APPOINTMENTS.map((d) => d.count));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">Track your clinic performance</p>
        </div>
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
          {['7d', '30d', '90d', '1y'].map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={cn(
                'px-3 py-1.5 text-sm rounded-md transition-colors',
                dateRange === range
                  ? 'bg-white shadow-sm font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {METRICS.map((metric) => (
          <Card key={metric.label} className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className={cn('p-3 rounded-xl', metric.bgColor)}>
                  <metric.icon className={cn('h-6 w-6', metric.color)} />
                </div>
                <div
                  className={cn(
                    'flex items-center text-sm font-medium',
                    metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  )}
                >
                  {metric.trend === 'up' ? (
                    <ArrowUpRight className="h-4 w-4" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4" />
                  )}
                  {Math.abs(metric.change)}%
                </div>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold">{metric.value}</p>
                <p className="text-sm text-muted-foreground">{metric.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Service */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Revenue by Service</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {REVENUE_BY_SERVICE.map((item) => (
                <div key={item.service}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{item.service}</span>
                    <span className="text-sm text-muted-foreground">
                      ₹{item.amount.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-500"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Revenue by Doctor */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Top Performing Doctors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {REVENUE_BY_DOCTOR.map((doctor, idx) => (
                <div
                  key={doctor.name}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-medium text-blue-600">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{doctor.name}</p>
                    <p className="text-xs text-muted-foreground">{doctor.patients} patients</p>
                  </div>
                  <p className="font-semibold">₹{doctor.amount.toLocaleString('en-IN')}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Appointments Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Appointments */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Weekly Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-end gap-3">
              {DAILY_APPOINTMENTS.map((day) => (
                <div key={day.day} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex flex-col gap-0.5">
                    <div
                      className="w-full bg-blue-500 rounded-t transition-all"
                      style={{ height: `${(day.count / maxAppointments) * 140}px` }}
                    />
                    <div
                      className="w-full bg-red-400 rounded-b transition-all"
                      style={{ height: `${(day.noShow / maxAppointments) * 140}px` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">{day.day}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded" />
                <span className="text-xs text-muted-foreground">Completed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-400 rounded" />
                <span className="text-xs text-muted-foreground">No-show</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Peak Hours Heatmap */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Peak Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-6 gap-2">
              {PEAK_HOURS.map((hour) => (
                <div key={hour.hour} className="text-center">
                  <div
                    className={cn(
                      'w-full aspect-square rounded-lg flex items-center justify-center text-xs font-medium transition-colors',
                      hour.value >= 90
                        ? 'bg-red-500 text-white'
                        : hour.value >= 70
                          ? 'bg-orange-400 text-white'
                          : hour.value >= 50
                            ? 'bg-yellow-400 text-gray-900'
                            : 'bg-green-200 text-gray-700'
                    )}
                  >
                    {hour.value}%
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-1 block">{hour.hour}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-200 rounded" />
                Low
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-yellow-400 rounded" />
                Medium
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-orange-400 rounded" />
                High
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-500 rounded" />
                Peak
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Patient Demographics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Patient Demographics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Gender Distribution */}
            <div>
              <h4 className="text-sm font-medium mb-4">Gender Distribution</h4>
              <div className="flex items-center gap-4">
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    {
                      PATIENT_DEMOGRAPHICS.gender.reduce(
                        (acc, item) => {
                          const startAngle = acc.offset;
                          const angle = (item.value / 100) * 360;
                          const endAngle = startAngle + angle;
                          const largeArc = angle > 180 ? 1 : 0;
                          const startX = 50 + 40 * Math.cos((startAngle * Math.PI) / 180);
                          const startY = 50 + 40 * Math.sin((startAngle * Math.PI) / 180);
                          const endX = 50 + 40 * Math.cos((endAngle * Math.PI) / 180);
                          const endY = 50 + 40 * Math.sin((endAngle * Math.PI) / 180);

                          acc.paths.push(
                            <path
                              key={item.label}
                              d={`M 50 50 L ${startX} ${startY} A 40 40 0 ${largeArc} 1 ${endX} ${endY} Z`}
                              className={item.color}
                            />
                          );
                          acc.offset = endAngle;
                          return acc;
                        },
                        { paths: [] as React.ReactNode[], offset: 0 }
                      ).paths
                    }
                  </svg>
                </div>
                <div className="space-y-2">
                  {PATIENT_DEMOGRAPHICS.gender.map((item) => (
                    <div key={item.label} className="flex items-center gap-2">
                      <div className={cn('w-3 h-3 rounded', item.color)} />
                      <span className="text-sm">{item.label}</span>
                      <span className="text-sm font-medium">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Age Distribution */}
            <div>
              <h4 className="text-sm font-medium mb-4">Age Distribution</h4>
              <div className="space-y-3">
                {PATIENT_DEMOGRAPHICS.age.map((item) => (
                  <div key={item.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm">{item.label} years</span>
                      <span className="text-sm font-medium">{item.value}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-500 rounded-full transition-all duration-500"
                        style={{ width: `${item.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Avg. Consultation Time', value: '18 min', icon: Clock },
          { label: 'Patient Satisfaction', value: '4.8/5', icon: Activity },
          { label: 'Repeat Patients', value: '67%', icon: Users },
          { label: 'Online Bookings', value: '42%', icon: Calendar },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <stat.icon className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-lg font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
