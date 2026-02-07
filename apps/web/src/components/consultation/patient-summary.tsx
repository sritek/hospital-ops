'use client';

import { useConsultationStore } from '@/stores/consultation.store';
import { Phone, Calendar, AlertTriangle, Heart, Clock, Shield, Droplet } from 'lucide-react';

export function PatientSummary() {
  const { activePatient, patientHistory } = useConsultationStore();

  if (!activePatient) return null;

  const patient = activePatient;

  return (
    <div className="p-4 space-y-4">
      {/* Patient Header */}
      <div className="text-center pb-4 border-b">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
          {patient.photoUrl ? (
            <img
              src={patient.photoUrl}
              alt={patient.name}
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <span className="text-2xl font-bold text-primary">
              {patient.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <h2 className="font-semibold text-lg">{patient.name}</h2>
        <p className="text-sm text-muted-foreground">
          {patient.age} years • {patient.gender === 'male' ? 'Male' : 'Female'}
        </p>
        <div className="flex items-center justify-center gap-2 mt-2">
          {patient.bloodGroup && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-700 rounded text-xs font-medium">
              <Droplet className="h-3 w-3" />
              {patient.bloodGroup}
            </span>
          )}
          {patient.abhaNumber && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs font-medium">
              <Shield className="h-3 w-3" />
              ABHA
            </span>
          )}
        </div>
      </div>

      {/* Contact */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <Phone className="h-4 w-4 text-muted-foreground" />
          <span>{patient.phone}</span>
        </div>
        {patient.dateOfBirth && (
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>
              DOB:{' '}
              {new Date(patient.dateOfBirth).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </div>
        )}
      </div>

      {/* Allergies - Critical Info */}
      {patient.allergies.length > 0 && (
        <div className="p-3 bg-red-50 rounded-lg border border-red-200">
          <div className="flex items-center gap-2 text-red-700 font-medium text-sm mb-2">
            <AlertTriangle className="h-4 w-4" />
            Allergies
          </div>
          <div className="flex flex-wrap gap-1">
            {patient.allergies.map((allergy) => (
              <span
                key={allergy}
                className="px-2 py-0.5 bg-red-100 text-red-800 rounded text-xs font-medium"
              >
                {allergy}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Chronic Conditions */}
      {patient.chronicConditions.length > 0 && (
        <div className="p-3 bg-pink-50 rounded-lg border border-pink-200">
          <div className="flex items-center gap-2 text-pink-700 font-medium text-sm mb-2">
            <Heart className="h-4 w-4" />
            Chronic Conditions
          </div>
          <div className="flex flex-wrap gap-1">
            {patient.chronicConditions.map((condition) => (
              <span
                key={condition}
                className="px-2 py-0.5 bg-pink-100 text-pink-800 rounded text-xs font-medium"
              >
                {condition}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Visit Stats */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-3 bg-gray-50 rounded-lg text-center">
          <p className="text-xl font-bold text-primary">{patient.totalVisits}</p>
          <p className="text-xs text-muted-foreground">Total Visits</p>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg text-center">
          <p className="text-xl font-bold text-primary">{patient.noShowCount}</p>
          <p className="text-xs text-muted-foreground">No Shows</p>
        </div>
      </div>

      {/* Recent Visits */}
      {patientHistory.length > 0 && (
        <div>
          <h3 className="font-medium text-sm mb-2 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Recent Visits
          </h3>
          <div className="space-y-2">
            {patientHistory.slice(0, 3).map((visit) => (
              <div
                key={visit.id}
                className="p-2 bg-white rounded border text-xs hover:bg-gray-50 cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium">
                    {new Date(visit.date).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                  <span className="text-muted-foreground">{visit.doctorName}</span>
                </div>
                <p className="text-muted-foreground line-clamp-1">{visit.diagnosis}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
