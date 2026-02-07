'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePatientsStore } from '@/stores/patients.store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Search,
  UserPlus,
  Phone,
  Calendar,
  AlertCircle,
  ChevronRight,
  Grid,
  List,
  Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Patient } from '@/lib/mock-data/types';

function PatientCard({ patient, onClick }: { patient: Patient; onClick: () => void }) {
  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            {patient.photoUrl ? (
              <img
                src={patient.photoUrl}
                alt={patient.name}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <span className="text-lg font-medium text-primary">
                {patient.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold truncate">{patient.name}</h3>
              {patient.bookingStatus === 'warning' && (
                <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-700 text-[10px] rounded font-medium">
                  Warning
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" />
                {patient.phone}
              </span>
              <span>•</span>
              <span>
                {patient.age}y, {patient.gender === 'male' ? 'M' : 'F'}
              </span>
            </div>
            {patient.chronicConditions.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {patient.chronicConditions.slice(0, 2).map((condition) => (
                  <span
                    key={condition}
                    className="px-2 py-0.5 bg-red-50 text-red-700 text-xs rounded"
                  >
                    {condition}
                  </span>
                ))}
                {patient.chronicConditions.length > 2 && (
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                    +{patient.chronicConditions.length - 2}
                  </span>
                )}
              </div>
            )}
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Last visit:{' '}
                {patient.lastVisitDate
                  ? new Date(patient.lastVisitDate).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                    })
                  : 'Never'}
              </span>
              <span>•</span>
              <span>{patient.totalVisits} visits</span>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );
}

function PatientRow({ patient, onClick }: { patient: Patient; onClick: () => void }) {
  return (
    <tr className="hover:bg-gray-50 cursor-pointer" onClick={onClick}>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-medium text-primary">
              {patient.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="font-medium">{patient.name}</p>
            <p className="text-sm text-muted-foreground">{patient.phone}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-sm">
        {patient.age}y, {patient.gender === 'male' ? 'M' : 'F'}
      </td>
      <td className="px-4 py-3 text-sm">{patient.bloodGroup || '-'}</td>
      <td className="px-4 py-3">
        {patient.chronicConditions.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {patient.chronicConditions.slice(0, 2).map((c) => (
              <span key={c} className="px-2 py-0.5 bg-red-50 text-red-700 text-xs rounded">
                {c}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        )}
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground">
        {patient.lastVisitDate
          ? new Date(patient.lastVisitDate).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })
          : '-'}
      </td>
      <td className="px-4 py-3 text-sm">{patient.totalVisits}</td>
      <td className="px-4 py-3">
        {patient.abhaNumber ? (
          <span className="px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded">ABHA</span>
        ) : null}
      </td>
    </tr>
  );
}

export default function PatientsPage() {
  const router = useRouter();
  const {
    patients,
    fetchPatients,
    searchPatients,
    searchResults,
    clearSearch,
    isLoading,
    currentPage,
    totalPages,
    totalPatients,
  } = usePatientsStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    fetchPatients(1);
  }, [fetchPatients]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (debouncedSearch) {
      searchPatients(debouncedSearch);
    } else {
      clearSearch();
    }
  }, [debouncedSearch, searchPatients, clearSearch]);

  const displayPatients = searchQuery ? searchResults : patients;

  const handlePatientClick = (patientId: string) => {
    router.push(`/patients/${patientId}`);
  };

  const handlePageChange = (page: number) => {
    fetchPatients(page);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Patients</h1>
          <p className="text-muted-foreground">
            {totalPatients.toLocaleString()} registered patients
          </p>
        </div>
        <Button onClick={() => router.push('/patients/new')}>
          <UserPlus className="h-4 w-4 mr-2" />
          New Patient
        </Button>
      </div>

      {/* Search & Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, phone, or ABHA number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
              <div className="flex border rounded-md">
                <Button
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Patients List */}
      {isLoading ? (
        <div
          className={cn(
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
              : 'space-y-2'
          )}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="animate-pulse flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-full" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : displayPatients.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayPatients.map((patient) => (
              <PatientCard
                key={patient.id}
                patient={patient}
                onClick={() => handlePatientClick(patient.id)}
              />
            ))}
          </div>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Patient
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Age/Gender
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Blood
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Conditions
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Last Visit
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Visits
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      ABHA
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {displayPatients.map((patient) => (
                    <PatientRow
                      key={patient.id}
                      patient={patient}
                      onClick={() => handlePatientClick(patient.id)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-1">No patients found</h3>
            <p className="text-muted-foreground">
              {searchQuery ? 'Try a different search term' : 'Start by adding your first patient'}
            </p>
            {!searchQuery && (
              <Button className="mt-4" onClick={() => router.push('/patients/new')}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Patient
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {!searchQuery && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * 20 + 1} to {Math.min(currentPage * 20, totalPatients)} of{' '}
            {totalPatients}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
