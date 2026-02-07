'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Star,
  Clock,
  MapPin,
  Phone,
  Calendar,
  ChevronRight,
  Check,
  GraduationCap,
  Languages,
  Award,
  MessageCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getDoctorById, generateSlots, formatTime, mockClinic } from '@/lib/mock-data';

interface Props {
  params: { tenant: string; id: string };
}

export default function DoctorPage({ params }: Props) {
  const doctor = getDoctorById(params.id);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [showBookingForm, setShowBookingForm] = useState(false);

  // Generate next 7 days
  const dates = useMemo(() => {
    const result: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      result.push(date);
    }
    return result;
  }, []);

  const slots = useMemo(() => {
    if (!doctor) return { morning: [], evening: [] };
    return generateSlots(selectedDate, doctor.id);
  }, [selectedDate, doctor]);

  if (!doctor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Doctor not found</p>
      </div>
    );
  }

  const handleBookNow = () => {
    if (selectedSlot) {
      setShowBookingForm(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link
              href={`/${params.tenant}`}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="font-semibold text-gray-900">{doctor.name}</h1>
              <p className="text-sm text-gray-500">{doctor.specialization}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Doctor Profile Card */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
          <div className="p-6">
            <div className="flex items-start gap-6">
              {/* Avatar */}
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center flex-shrink-0">
                <span className="text-4xl font-bold text-blue-600">
                  {doctor.name.split(' ')[1]?.charAt(0) || doctor.name.charAt(0)}
                </span>
              </div>

              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900">{doctor.name}</h2>
                <p className="text-blue-600 font-medium">{doctor.specialization}</p>

                {/* Rating */}
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center gap-1 text-amber-500">
                    <Star className="h-5 w-5 fill-current" />
                    <span className="font-semibold">{doctor.rating}</span>
                  </div>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-600">{doctor.reviewCount} reviews</span>
                </div>

                {/* Quick Info */}
                <div className="flex flex-wrap gap-4 mt-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <GraduationCap className="h-4 w-4 text-gray-400" />
                    {doctor.qualification}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Award className="h-4 w-4 text-gray-400" />
                    {doctor.experience} years experience
                  </div>
                </div>

                {/* Languages */}
                <div className="flex items-center gap-2 mt-3">
                  <Languages className="h-4 w-4 text-gray-400" />
                  <div className="flex gap-1">
                    {doctor.languages.map((lang) => (
                      <span
                        key={lang}
                        className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
                      >
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Fee Info */}
          <div className="px-6 py-4 bg-blue-50 border-t flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Consultation Fee</p>
              <p className="text-2xl font-bold text-gray-900">₹{doctor.consultationFee}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Follow-up Fee</p>
              <p className="text-lg font-semibold text-gray-700">₹{doctor.followUpFee}</p>
            </div>
          </div>
        </div>

        {/* Clinic Info */}
        <div className="bg-white rounded-xl p-4 mb-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <MapPin className="h-6 w-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-gray-900">{mockClinic.name}</p>
            <p className="text-sm text-gray-500">{mockClinic.address}</p>
          </div>
          <a
            href={`tel:${mockClinic.phone}`}
            className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            <Phone className="h-5 w-5 text-gray-600" />
          </a>
        </div>

        {/* Date Selection */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Select Date
          </h3>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {dates.map((date) => {
              const isSelected = date.toDateString() === selectedDate.toDateString();
              const isToday = date.toDateString() === new Date().toDateString();
              const dayName = date.toLocaleDateString('en-IN', { weekday: 'short' });
              const dayNum = date.getDate();
              const month = date.toLocaleDateString('en-IN', { month: 'short' });

              return (
                <button
                  key={date.toISOString()}
                  onClick={() => {
                    setSelectedDate(date);
                    setSelectedSlot(null);
                  }}
                  className={cn(
                    'flex flex-col items-center px-4 py-3 rounded-xl min-w-[70px] transition-all',
                    isSelected
                      ? 'bg-blue-600 text-white shadow-lg scale-105'
                      : 'bg-gray-50 hover:bg-gray-100'
                  )}
                >
                  <span className={cn('text-xs', isSelected ? 'text-blue-100' : 'text-gray-500')}>
                    {isToday ? 'Today' : dayName}
                  </span>
                  <span className="text-xl font-bold">{dayNum}</span>
                  <span className={cn('text-xs', isSelected ? 'text-blue-100' : 'text-gray-500')}>
                    {month}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Time Slots */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            Select Time Slot
          </h3>

          {/* Morning Slots */}
          <div className="mb-6">
            <p className="text-sm text-gray-500 mb-3">🌅 Morning</p>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {slots.morning.map((slot) => (
                <button
                  key={slot.time}
                  disabled={!slot.available}
                  onClick={() => setSelectedSlot(slot.time)}
                  className={cn(
                    'py-2 px-3 rounded-lg text-sm font-medium transition-all',
                    !slot.available && 'bg-gray-100 text-gray-300 cursor-not-allowed',
                    slot.available &&
                      selectedSlot !== slot.time &&
                      'bg-green-50 text-green-700 hover:bg-green-100',
                    selectedSlot === slot.time && 'bg-blue-600 text-white shadow-md'
                  )}
                >
                  {formatTime(slot.time)}
                </button>
              ))}
            </div>
          </div>

          {/* Evening Slots */}
          <div>
            <p className="text-sm text-gray-500 mb-3">🌆 Evening</p>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {slots.evening.map((slot) => (
                <button
                  key={slot.time}
                  disabled={!slot.available}
                  onClick={() => setSelectedSlot(slot.time)}
                  className={cn(
                    'py-2 px-3 rounded-lg text-sm font-medium transition-all',
                    !slot.available && 'bg-gray-100 text-gray-300 cursor-not-allowed',
                    slot.available &&
                      selectedSlot !== slot.time &&
                      'bg-green-50 text-green-700 hover:bg-green-100',
                    selectedSlot === slot.time && 'bg-blue-600 text-white shadow-md'
                  )}
                >
                  {formatTime(slot.time)}
                </button>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-6 pt-4 border-t text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-50 border border-green-200 rounded" />
              Available
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-gray-100 rounded" />
              Booked
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-600 rounded" />
              Selected
            </div>
          </div>
        </div>
      </main>

      {/* Sticky Book Button */}
      {selectedSlot && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 z-40">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Selected Slot</p>
              <p className="font-semibold">
                {selectedDate.toLocaleDateString('en-IN', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                })}{' '}
                at {formatTime(selectedSlot)}
              </p>
            </div>
            <button
              onClick={handleBookNow}
              className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              Book Now • ₹{doctor.consultationFee}
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Booking Form Modal */}
      {showBookingForm && (
        <BookingFormModal
          doctor={doctor}
          date={selectedDate}
          time={selectedSlot!}
          tenant={params.tenant}
          onClose={() => setShowBookingForm(false)}
        />
      )}
    </div>
  );
}

// Booking Form Modal Component
function BookingFormModal({
  doctor,
  date,
  time,
  tenant,
  onClose,
}: {
  doctor: NonNullable<ReturnType<typeof getDoctorById>>;
  date: Date;
  time: string;
  tenant: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    abhaNumber: '',
    reason: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifyingAbha, setIsVerifyingAbha] = useState(false);
  const [abhaVerified, setAbhaVerified] = useState(false);

  const handleVerifyAbha = () => {
    if (formData.abhaNumber.length >= 14) {
      setIsVerifyingAbha(true);
      setTimeout(() => {
        setIsVerifyingAbha(false);
        setAbhaVerified(true);
      }, 1500);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      router.push(
        `/${tenant}/booking-confirmed?doctor=${doctor.id}&date=${date.toISOString()}&time=${time}`
      );
    }, 1500);
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h3 className="font-semibold text-lg">Complete Your Booking</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            ✕
          </button>
        </div>

        {/* Booking Summary */}
        <div className="px-6 py-4 bg-blue-50 border-b">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="font-bold text-blue-600">
                {doctor.name.split(' ')[1]?.charAt(0)}
              </span>
            </div>
            <div>
              <p className="font-medium">{doctor.name}</p>
              <p className="text-sm text-gray-600">
                {date.toLocaleDateString('en-IN', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}{' '}
                at {formatTime(time)}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your full name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="10-digit mobile number"
            />
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              <MessageCircle className="h-3 w-3" />
              Confirmation will be sent via WhatsApp
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email (Optional)</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ABHA Number (Optional)
              <span className="ml-2 text-xs text-blue-600">ABDM Verified</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.abhaNumber}
                onChange={(e) => {
                  setFormData({ ...formData, abhaNumber: e.target.value });
                  setAbhaVerified(false);
                }}
                className="flex-1 px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="14-digit ABHA number"
              />
              <button
                type="button"
                onClick={handleVerifyAbha}
                disabled={formData.abhaNumber.length < 14 || isVerifyingAbha || abhaVerified}
                className={cn(
                  'px-4 py-3 rounded-xl font-medium transition-colors',
                  abhaVerified
                    ? 'bg-green-100 text-green-700'
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200 disabled:opacity-50'
                )}
              >
                {isVerifyingAbha ? '...' : abhaVerified ? <Check className="h-5 w-5" /> : 'Verify'}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Visit</label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
              placeholder="Briefly describe your symptoms or reason for consultation"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting || !formData.name || !formData.phone}
            className="w-full py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Booking...
              </>
            ) : (
              <>Confirm Booking • ₹{doctor.consultationFee}</>
            )}
          </button>

          <p className="text-xs text-center text-gray-500">
            By booking, you agree to our Terms of Service and Privacy Policy
          </p>
        </form>
      </div>
    </div>
  );
}
