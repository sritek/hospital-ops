'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { usePatientsStore } from '@/stores/patients.store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Heart,
  AlertTriangle,
  FileText,
  Clock,
  Shield,
  Edit,
} from 'lucide-react';
import { getDoctorById } from '@/lib/mock-data';

export default function PatientProfilePage() {
  const router = useRouter();
  const params = useParams();
  const patientId = params.id as string;

  const { selectedPatient, visitHistory, selectPatient, clearSelectedPatient, isLoading } =
    usePatientsStore();

  useEffect(() => {
    selectPatient(patientId);
    return () => clearSelectedPatient();
  }, [patientId, selectPatient, clearSelectedPatient]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4" />
          <div className="h-4 bg-gray-200 rounded w-1/3" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto" />
                  <div className="h-6 bg-gray-200 rounded w-1/2 mx-auto" />
                  <div className="h-4 bg-gray-200 rounded w-1/3 mx-auto" />
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-2 space-y-6">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="animate-pulse space-y-3">
                    <div className="h-5 bg-gray-200 rounded w-1/4" />
                    <div className="h-4 bg-gray-200 rounded w-full" />
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!selectedPatient) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-2">Patient not found</h2>
        <p className="text-muted-foreground mb-4">The patient you're looking for doesn't exist.</p>
        <Button onClick={() => router.push('/patients')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Patients
        </Button>
      </div>
    );
  }

  const patient = selectedPatient;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{patient.name}</h1>
            <p className="text-muted-foreground">Patient Profile</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button>
            <Calendar className="h-4 w-4 mr-2" />
            Book Appointment
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          {/* Basic Info Card */}
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  {patient.photoUrl ? (
                    <img
                      src={patient.photoUrl}
                      alt={patient.name}
                      className="w-24 h-24 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl font-bold text-primary">
                      {patient.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-semibold">{patient.name}</h2>
                <p className="text-muted-foreground">
                  {patient.age} years • {patient.gender === 'male' ? 'Male' : 'Female'}
                </p>
                {patient.bloodGroup && (
                  <span className="inline-block mt-2 px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm font-medium">
                    {patient.bloodGroup}
                  </span>
                )}
              </div>

              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{patient.phone}</span>
                </div>
                {patient.email && (
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{patient.email}</span>
                  </div>
                )}
                <div className="flex items-start gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span>
                    {patient.address}, {patient.city}, {patient.pincode}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    DOB:{' '}
                    {new Date(patient.dateOfBirth).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              {/* ABHA Info */}
              {patient.abhaNumber && (
                <div className="mt-6 p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 text-green-700">
                    <Shield className="h-4 w-4" />
                    <span className="text-sm font-medium">ABHA Verified</span>
                  </div>
                  <p className="text-sm text-green-600 mt-1">{patient.abhaNumber}</p>
                </div>
              )}

              {/* Emergency Contact */}
              {patient.emergencyContact && (
                <div className="mt-6 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-muted-foreground uppercase font-medium mb-2">
                    Emergency Contact
                  </p>
                  <p className="text-sm font-medium">{patient.emergencyContact.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {patient.emergencyContact.relation} • {patient.emergencyContact.phone}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stats Card */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-primary">{patient.totalVisits}</p>
                  <p className="text-xs text-muted-foreground">Total Visits</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-primary">{patient.noShowCount}</p>
                  <p className="text-xs text-muted-foreground">No Shows</p>
                </div>
              </div>
              <div className="mt-4 text-center">
                <p className="text-xs text-muted-foreground">
                  First visit:{' '}
                  {new Date(patient.firstVisitDate).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Allergies & Conditions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Allergies */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  Allergies
                </CardTitle>
              </CardHeader>
              <CardContent>
                {patient.allergies.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {patient.allergies.map((allergy) => (
                      <span
                        key={allergy}
                        className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm"
                      >
                        {allergy}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No known allergies</p>
                )}
              </CardContent>
            </Card>

            {/* Chronic Conditions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Heart className="h-4 w-4 text-pink-500" />
                  Chronic Conditions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {patient.chronicConditions.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {patient.chronicConditions.map((condition) => (
                      <span
                        key={condition}
                        className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm"
                      >
                        {condition}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No chronic conditions</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Visit History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Visit History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {visitHistory.length > 0 ? (
                <div className="space-y-4">
                  {visitHistory.map((visit) => {
                    const doctor = getDoctorById(visit.doctorId);
                    return (
                      <div
                        key={visit.id}
                        className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">
                                {new Date(visit.date).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric',
                                })}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {doctor?.name} • {doctor?.specialization}
                            </p>
                          </div>
                          <Button variant="ghost" size="sm">
                            View Details
                          </Button>
                        </div>
                        <div className="mt-3">
                          <p className="text-sm">
                            <span className="font-medium">Chief Complaint:</span>{' '}
                            {visit.chiefComplaint}
                          </p>
                          <p className="text-sm mt-1">
                            <span className="font-medium">Diagnosis:</span> {visit.diagnosis}
                            {visit.diagnosisCode && (
                              <span className="text-muted-foreground">
                                {' '}
                                ({visit.diagnosisCode})
                              </span>
                            )}
                          </p>
                        </div>
                        {visit.vitals && (
                          <div className="mt-3 flex flex-wrap gap-3 text-xs">
                            {visit.vitals.bloodPressureSystolic && (
                              <span className="px-2 py-1 bg-gray-100 rounded">
                                BP: {visit.vitals.bloodPressureSystolic}/
                                {visit.vitals.bloodPressureDiastolic}
                              </span>
                            )}
                            {visit.vitals.pulse && (
                              <span className="px-2 py-1 bg-gray-100 rounded">
                                Pulse: {visit.vitals.pulse}
                              </span>
                            )}
                            {visit.vitals.weight && (
                              <span className="px-2 py-1 bg-gray-100 rounded">
                                Weight: {visit.vitals.weight} kg
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">No visit history available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
