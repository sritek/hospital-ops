'use client';

import { useState } from 'react';
import { useConsultationStore } from '@/stores/consultation.store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Pill, Plus, X, Search, AlertTriangle, Copy, FileText } from 'lucide-react';
import { searchDrugs, checkDrugInteractions, getDrugById } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import type { Drug, DrugInteraction } from '@/lib/mock-data/types';

// Extended interaction type with drug names for display
interface DisplayInteraction extends DrugInteraction {
  drug1Name: string;
  drug2Name: string;
}

// Prescription templates
const TEMPLATES = [
  {
    name: 'Fever & Body Ache',
    drugs: [
      {
        drugName: 'Paracetamol 500mg',
        dosage: '1 tablet',
        frequency: 'TDS',
        duration: '3',
        durationUnit: 'days' as const,
      },
      {
        drugName: 'Cetirizine 10mg',
        dosage: '1 tablet',
        frequency: 'OD',
        duration: '5',
        durationUnit: 'days' as const,
      },
    ],
  },
  {
    name: 'Cough & Cold',
    drugs: [
      {
        drugName: 'Ambroxol Syrup',
        dosage: '5ml',
        frequency: 'TDS',
        duration: '5',
        durationUnit: 'days' as const,
      },
      {
        drugName: 'Cetirizine 10mg',
        dosage: '1 tablet',
        frequency: 'OD',
        duration: '5',
        durationUnit: 'days' as const,
      },
      {
        drugName: 'Paracetamol 500mg',
        dosage: '1 tablet',
        frequency: 'SOS',
        duration: '3',
        durationUnit: 'days' as const,
      },
    ],
  },
  {
    name: 'Gastritis',
    drugs: [
      {
        drugName: 'Pantoprazole 40mg',
        dosage: '1 tablet',
        frequency: 'OD (before breakfast)',
        duration: '14',
        durationUnit: 'days' as const,
      },
      {
        drugName: 'Domperidone 10mg',
        dosage: '1 tablet',
        frequency: 'TDS (before meals)',
        duration: '7',
        durationUnit: 'days' as const,
      },
    ],
  },
];

const FREQUENCIES = ['OD', 'BD', 'TDS', 'QID', 'SOS', 'HS', 'Stat'];

export function PrescriptionSection() {
  const { prescriptions, addPrescription, removePrescription } = useConsultationStore();

  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Drug[]>([]);
  const [selectedDrug, setSelectedDrug] = useState<Drug | null>(null);
  const [interactions, setInteractions] = useState<DisplayInteraction[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    dosage: '',
    frequency: 'TDS',
    duration: '',
    durationUnit: 'days' as 'days' | 'weeks' | 'months',
    instructions: '',
  });

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.length >= 2) {
      const results = searchDrugs(query);
      setSearchResults(results.slice(0, 8));
    } else {
      setSearchResults([]);
    }
  };

  const handleSelectDrug = (drug: Drug) => {
    setSelectedDrug(drug);
    setSearchQuery(drug.name);
    setSearchResults([]);
    setFormData((prev) => ({
      ...prev,
      dosage: drug.strengths[0] ? `1 ${drug.forms[0] || 'tablet'}` : '',
      frequency: 'TDS',
    }));

    // Check for interactions
    const existingDrugIds = prescriptions.map((p) => p.drugId);
    if (existingDrugIds.length > 0) {
      const allDrugIds = [...existingDrugIds, drug.id];
      const foundInteractions = checkDrugInteractions(allDrugIds);
      // Enrich with drug names
      const displayInteractions: DisplayInteraction[] = foundInteractions.map((interaction) => ({
        ...interaction,
        drug1Name: getDrugById(interaction.drug1Id)?.name || interaction.drug1Id,
        drug2Name: getDrugById(interaction.drug2Id)?.name || interaction.drug2Id,
      }));
      setInteractions(displayInteractions);
    }
  };

  const handleAddPrescription = () => {
    if (!selectedDrug) return;

    addPrescription({
      drugId: selectedDrug.id,
      drugName: selectedDrug.name,
      genericName: selectedDrug.genericName,
      dosage: formData.dosage,
      frequency: formData.frequency,
      duration: formData.duration,
      durationUnit: formData.durationUnit,
      instructions: formData.instructions,
    });

    // Reset form
    setSelectedDrug(null);
    setSearchQuery('');
    setFormData({
      dosage: '',
      frequency: 'TDS',
      duration: '',
      durationUnit: 'days',
      instructions: '',
    });
    setInteractions([]);
    setShowAddForm(false);
  };

  const handleApplyTemplate = (template: (typeof TEMPLATES)[0]) => {
    template.drugs.forEach((drug) => {
      addPrescription({
        drugId: `template-${Date.now()}-${Math.random()}`,
        drugName: drug.drugName,
        dosage: drug.dosage,
        frequency: drug.frequency,
        duration: drug.duration,
        durationUnit: drug.durationUnit,
      });
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Pill className="h-5 w-5 text-primary" />
            Prescription
          </h2>
          <p className="text-sm text-muted-foreground">
            {prescriptions.length} medication{prescriptions.length !== 1 ? 's' : ''} added
          </p>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Medication
        </Button>
      </div>

      {/* Drug Interaction Warning */}
      {interactions.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-800">Drug Interaction Alert</h4>
                {interactions.map((interaction, i) => (
                  <div key={i} className="mt-2 text-sm text-red-700">
                    <p className="font-medium">
                      {interaction.drug1Name} + {interaction.drug2Name}
                    </p>
                    <p>{interaction.description}</p>
                    <p className="text-xs mt-1">
                      Severity:{' '}
                      <span
                        className={cn(
                          'font-medium',
                          interaction.severity === 'severe'
                            ? 'text-red-800'
                            : interaction.severity === 'moderate'
                              ? 'text-orange-700'
                              : 'text-yellow-700'
                        )}
                      >
                        {interaction.severity.toUpperCase()}
                      </span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Templates */}
      {prescriptions.length === 0 && !showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Quick Templates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {TEMPLATES.map((template) => (
                <Button
                  key={template.name}
                  variant="outline"
                  size="sm"
                  onClick={() => handleApplyTemplate(template)}
                >
                  <Copy className="h-3 w-3 mr-1" />
                  {template.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Add Medication</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Drug Search */}
            <div>
              <Label>Medication</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search medication..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              {searchResults.length > 0 && (
                <div className="mt-1 border rounded-lg bg-white divide-y max-h-48 overflow-y-auto">
                  {searchResults.map((drug) => (
                    <button
                      key={drug.id}
                      onClick={() => handleSelectDrug(drug)}
                      className="w-full px-3 py-2 text-left hover:bg-gray-50"
                    >
                      <p className="font-medium text-sm">{drug.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {drug.genericName} • {drug.category}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedDrug && (
              <>
                {/* Dosage & Frequency */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Dosage</Label>
                    <Input
                      placeholder="e.g., 1 tablet"
                      value={formData.dosage}
                      onChange={(e) => setFormData((prev) => ({ ...prev, dosage: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Frequency</Label>
                    <select
                      value={formData.frequency}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, frequency: e.target.value }))
                      }
                      className="mt-1 w-full h-10 px-3 border rounded-md text-sm"
                    >
                      {FREQUENCIES.map((freq) => (
                        <option key={freq} value={freq}>
                          {freq}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Duration */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Duration</Label>
                    <Input
                      type="number"
                      placeholder="e.g., 5"
                      value={formData.duration}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, duration: e.target.value }))
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Unit</Label>
                    <select
                      value={formData.durationUnit}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          durationUnit: e.target.value as 'days' | 'weeks' | 'months',
                        }))
                      }
                      className="mt-1 w-full h-10 px-3 border rounded-md text-sm"
                    >
                      <option value="days">Days</option>
                      <option value="weeks">Weeks</option>
                      <option value="months">Months</option>
                    </select>
                  </div>
                </div>

                {/* Instructions */}
                <div>
                  <Label>Special Instructions (optional)</Label>
                  <Input
                    placeholder="e.g., Take after meals"
                    value={formData.instructions}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, instructions: e.target.value }))
                    }
                    className="mt-1"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={handleAddPrescription}
                    disabled={!formData.dosage || !formData.duration}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add to Prescription
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddForm(false)}>
                    Cancel
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Prescription List */}
      {prescriptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Medications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {prescriptions.map((rx, index) => (
                <div
                  key={rx.id}
                  className="flex items-start justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium flex items-center justify-center">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium">{rx.drugName}</p>
                      {rx.genericName && (
                        <p className="text-xs text-muted-foreground">{rx.genericName}</p>
                      )}
                      <p className="text-sm mt-1">
                        {rx.dosage} • {rx.frequency} • {rx.duration} {rx.durationUnit}
                      </p>
                      {rx.instructions && (
                        <p className="text-xs text-muted-foreground mt-1">{rx.instructions}</p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removePrescription(rx.id)}
                    className="text-muted-foreground hover:text-red-500"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
