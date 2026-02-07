'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Search,
  MapPin,
  Phone,
  Mail,
  Star,
  Clock,
  Calendar,
  ChevronRight,
  Stethoscope,
  Baby,
  Heart,
  Bone,
  Sparkles,
  Shield,
  MessageCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { mockClinic, mockDoctors, getSpecializations } from '@/lib/mock-data';

interface Props {
  params: { tenant: string };
}

const SPECIALIZATION_ICONS: Record<string, React.ElementType> = {
  'General Physician': Stethoscope,
  Pediatrician: Baby,
  'Gynecologist & Obstetrician': Heart,
  'Orthopedic Surgeon': Bone,
  Dermatologist: Sparkles,
};

export default function BookingPage({ params }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpec, setSelectedSpec] = useState<string | null>(null);

  const specializations = getSpecializations();

  const filteredDoctors = mockDoctors.filter((doctor) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (
        !doctor.name.toLowerCase().includes(query) &&
        !doctor.specialization.toLowerCase().includes(query)
      ) {
        return false;
      }
    }
    if (selectedSpec && doctor.specialization !== selectedSpec) {
      return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">H</span>
              </div>
              <div>
                <h1 className="font-bold text-lg text-gray-900">{mockClinic.name}</h1>
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {mockClinic.city}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <a
                href={`tel:${mockClinic.phone}`}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600"
              >
                <Phone className="h-4 w-4" />
                <span className="hidden sm:inline">{mockClinic.phone}</span>
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold mb-3">Book Your Appointment Online</h2>
            <p className="text-blue-100 mb-6">
              Skip the queue. Book instantly with our expert doctors and get confirmed appointments
              via WhatsApp.
            </p>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search doctors by name or specialization..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap gap-6 mt-8">
            {[
              { icon: Shield, text: 'ABDM Verified' },
              { icon: MessageCircle, text: 'WhatsApp Confirmation' },
              { icon: Clock, text: 'Instant Booking' },
            ].map((badge) => (
              <div key={badge.text} className="flex items-center gap-2 text-blue-100">
                <badge.icon className="h-5 w-5" />
                <span className="text-sm">{badge.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Specialization Filter */}
        <div className="mb-8">
          <h3 className="text-sm font-medium text-gray-500 mb-3">Filter by Specialization</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedSpec(null)}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium transition-colors',
                !selectedSpec
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              All Doctors
            </button>
            {specializations.map((spec) => {
              const Icon = SPECIALIZATION_ICONS[spec] || Stethoscope;
              return (
                <button
                  key={spec}
                  onClick={() => setSelectedSpec(spec)}
                  className={cn(
                    'px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2',
                    selectedSpec === spec
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {spec}
                </button>
              );
            })}
          </div>
        </div>

        {/* Doctors Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDoctors.map((doctor) => {
            const Icon = SPECIALIZATION_ICONS[doctor.specialization] || Stethoscope;
            return (
              <Link
                key={doctor.id}
                href={`/${params.tenant}/doctor/${doctor.id}`}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow group"
              >
                {/* Doctor Header */}
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl font-bold text-blue-600">
                        {doctor.name.split(' ')[1]?.charAt(0) || doctor.name.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {doctor.name}
                      </h3>
                      <p className="text-sm text-blue-600 flex items-center gap-1 mt-0.5">
                        <Icon className="h-3.5 w-3.5" />
                        {doctor.specialization}
                      </p>
                      <p className="text-xs text-gray-500 mt-1 truncate">{doctor.qualification}</p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 mt-4 text-sm">
                    <div className="flex items-center gap-1 text-amber-500">
                      <Star className="h-4 w-4 fill-current" />
                      <span className="font-medium">{doctor.rating}</span>
                      <span className="text-gray-400">({doctor.reviewCount})</span>
                    </div>
                    <span className="text-gray-300">|</span>
                    <span className="text-gray-600">{doctor.experience} yrs exp</span>
                  </div>

                  {/* Languages */}
                  <div className="flex flex-wrap gap-1 mt-3">
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

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Consultation Fee</p>
                    <p className="font-semibold text-gray-900">₹{doctor.consultationFee}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Next Available</p>
                    <p className="text-sm font-medium text-green-600 flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {doctor.nextAvailable}
                    </p>
                  </div>
                </div>

                {/* Book Button */}
                <div className="px-6 py-3 bg-blue-600 text-white text-center font-medium group-hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                  Book Appointment
                  <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>

        {filteredDoctors.length === 0 && (
          <div className="text-center py-12">
            <Stethoscope className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No doctors found matching your criteria</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="font-semibold">{mockClinic.name}</h4>
              <p className="text-sm text-gray-400">{mockClinic.address}</p>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-400">
              <a
                href={`tel:${mockClinic.phone}`}
                className="flex items-center gap-2 hover:text-white"
              >
                <Phone className="h-4 w-4" />
                {mockClinic.phone}
              </a>
              <a
                href={`mailto:${mockClinic.email}`}
                className="flex items-center gap-2 hover:text-white"
              >
                <Mail className="h-4 w-4" />
                {mockClinic.email}
              </a>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-gray-800 text-center text-sm text-gray-500">
            Powered by Hospital-Ops • ABDM Compliant
          </div>
        </div>
      </footer>
    </div>
  );
}
