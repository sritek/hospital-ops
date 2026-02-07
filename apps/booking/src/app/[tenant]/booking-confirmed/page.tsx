'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  CheckCircle,
  Calendar,
  Clock,
  MapPin,
  Phone,
  MessageCircle,
  Download,
  Share2,
  Home,
  Sparkles,
} from 'lucide-react';
import { getDoctorById, formatTime, mockClinic } from '@/lib/mock-data';

interface Props {
  params: { tenant: string };
}

// Confetti component
function Confetti() {
  const [particles, setParticles] = useState<
    Array<{ id: number; x: number; color: string; delay: number }>
  >([]);

  useEffect(() => {
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
    const newParticles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)] || '#3B82F6',
      delay: Math.random() * 0.5,
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute w-3 h-3 rounded-sm animate-confetti"
          style={{
            left: `${particle.x}%`,
            backgroundColor: particle.color,
            animationDelay: `${particle.delay}s`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes confetti {
          0% {
            transform: translateY(-10vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti 3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

export default function BookingConfirmedPage({ params }: Props) {
  const searchParams = useSearchParams();
  const doctorId = searchParams.get('doctor');
  const dateStr = searchParams.get('date');
  const time = searchParams.get('time');

  const doctor = doctorId ? getDoctorById(doctorId) : null;
  const date = dateStr ? new Date(dateStr) : new Date();

  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  // Generate a random token number
  const tokenNumber = Math.floor(Math.random() * 20) + 1;

  if (!doctor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Booking information not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {showConfetti && <Confetti />}

      <main className="max-w-lg mx-auto px-4 py-8">
        {/* Success Animation */}
        <div className="text-center mb-8">
          <div className="relative inline-block">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto animate-bounce-slow">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <div className="absolute -top-2 -right-2">
              <Sparkles className="h-8 w-8 text-yellow-500 animate-pulse" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mt-6">Booking Confirmed!</h1>
          <p className="text-gray-600 mt-2">Your appointment has been successfully booked</p>
        </div>

        {/* Booking Details Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
          {/* Token Number */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 text-center">
            <p className="text-blue-100 text-sm">Your Token Number</p>
            <p className="text-5xl font-bold mt-1">#{tokenNumber}</p>
          </div>

          {/* Doctor Info */}
          <div className="p-6 border-b">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-xl font-bold text-blue-600">
                  {doctor.name.split(' ')[1]?.charAt(0)}
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{doctor.name}</h3>
                <p className="text-sm text-blue-600">{doctor.specialization}</p>
              </div>
            </div>
          </div>

          {/* Appointment Details */}
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Date</p>
                <p className="font-medium">
                  {date.toLocaleDateString('en-IN', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Time</p>
                <p className="font-medium">{time ? formatTime(time) : 'N/A'}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                <MapPin className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Location</p>
                <p className="font-medium">{mockClinic.name}</p>
                <p className="text-sm text-gray-500">{mockClinic.address}</p>
              </div>
            </div>
          </div>

          {/* Fee */}
          <div className="px-6 py-4 bg-gray-50 border-t flex items-center justify-between">
            <span className="text-gray-600">Consultation Fee</span>
            <span className="text-xl font-bold text-gray-900">₹{doctor.consultationFee}</span>
          </div>
        </div>

        {/* WhatsApp Confirmation */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
              <MessageCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-medium text-green-800">WhatsApp Confirmation Sent!</p>
              <p className="text-sm text-green-700 mt-1">
                We've sent the appointment details to your WhatsApp. You'll also receive a reminder
                24 hours before your appointment.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button className="w-full py-3 bg-white border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
            <Download className="h-5 w-5" />
            Add to Calendar
          </button>

          <button className="w-full py-3 bg-white border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Details
          </button>

          <Link
            href={`/${params.tenant}`}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <Home className="h-5 w-5" />
            Back to Home
          </Link>
        </div>

        {/* Contact Info */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">Need help?</p>
          <a
            href={`tel:${mockClinic.phone}`}
            className="text-blue-600 font-medium flex items-center justify-center gap-2 mt-1"
          >
            <Phone className="h-4 w-4" />
            {mockClinic.phone}
          </a>
        </div>
      </main>

      <style jsx global>{`
        @keyframes bounce-slow {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
