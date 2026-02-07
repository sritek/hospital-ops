'use client';

import { useState } from 'react';
import { useConsultationStore } from '@/stores/consultation.store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Activity, ChevronDown, ChevronUp, Check } from 'lucide-react';

export function VitalsEntry() {
  const { vitals, setVitals } = useConsultationStore();
  const [isExpanded, setIsExpanded] = useState(!vitals);
  const [localVitals, setLocalVitals] = useState({
    bloodPressureSystolic: vitals?.bloodPressureSystolic || '',
    bloodPressureDiastolic: vitals?.bloodPressureDiastolic || '',
    pulse: vitals?.pulse || '',
    temperature: vitals?.temperature || '',
    weight: vitals?.weight || '',
    height: vitals?.height || '',
    spo2: vitals?.spo2 || '',
    respiratoryRate: vitals?.respiratoryRate || '',
  });

  const handleChange = (field: string, value: string) => {
    setLocalVitals((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    const parsedVitals = {
      bloodPressureSystolic: localVitals.bloodPressureSystolic
        ? Number(localVitals.bloodPressureSystolic)
        : undefined,
      bloodPressureDiastolic: localVitals.bloodPressureDiastolic
        ? Number(localVitals.bloodPressureDiastolic)
        : undefined,
      pulse: localVitals.pulse ? Number(localVitals.pulse) : undefined,
      temperature: localVitals.temperature ? Number(localVitals.temperature) : undefined,
      weight: localVitals.weight ? Number(localVitals.weight) : undefined,
      height: localVitals.height ? Number(localVitals.height) : undefined,
      spo2: localVitals.spo2 ? Number(localVitals.spo2) : undefined,
      respiratoryRate: localVitals.respiratoryRate
        ? Number(localVitals.respiratoryRate)
        : undefined,
      recordedAt: new Date().toISOString(),
      recordedBy: 'Current User',
    };
    setVitals(parsedVitals);
    setIsExpanded(false);
  };

  const hasVitals = vitals && Object.values(vitals).some((v) => v !== undefined);

  return (
    <Card>
      <CardHeader className="cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Vitals
            {hasVitals && (
              <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full flex items-center gap-1">
                <Check className="h-3 w-3" />
                Recorded
              </span>
            )}
          </CardTitle>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
        {!isExpanded && hasVitals && (
          <div className="flex flex-wrap gap-3 mt-2 text-sm">
            {vitals.bloodPressureSystolic && (
              <span className="px-2 py-1 bg-gray-100 rounded">
                BP: {vitals.bloodPressureSystolic}/{vitals.bloodPressureDiastolic} mmHg
              </span>
            )}
            {vitals.pulse && (
              <span className="px-2 py-1 bg-gray-100 rounded">Pulse: {vitals.pulse} bpm</span>
            )}
            {vitals.temperature && (
              <span className="px-2 py-1 bg-gray-100 rounded">Temp: {vitals.temperature}°F</span>
            )}
            {vitals.spo2 && (
              <span className="px-2 py-1 bg-gray-100 rounded">SpO2: {vitals.spo2}%</span>
            )}
            {vitals.weight && (
              <span className="px-2 py-1 bg-gray-100 rounded">Weight: {vitals.weight} kg</span>
            )}
          </div>
        )}
      </CardHeader>

      {isExpanded && (
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Blood Pressure */}
            <div className="col-span-2 md:col-span-1">
              <Label className="text-xs text-muted-foreground">Blood Pressure (mmHg)</Label>
              <div className="flex items-center gap-1 mt-1">
                <Input
                  type="number"
                  placeholder="Sys"
                  value={localVitals.bloodPressureSystolic}
                  onChange={(e) => handleChange('bloodPressureSystolic', e.target.value)}
                  className="w-20"
                />
                <span>/</span>
                <Input
                  type="number"
                  placeholder="Dia"
                  value={localVitals.bloodPressureDiastolic}
                  onChange={(e) => handleChange('bloodPressureDiastolic', e.target.value)}
                  className="w-20"
                />
              </div>
            </div>

            {/* Pulse */}
            <div>
              <Label className="text-xs text-muted-foreground">Pulse (bpm)</Label>
              <Input
                type="number"
                placeholder="72"
                value={localVitals.pulse}
                onChange={(e) => handleChange('pulse', e.target.value)}
                className="mt-1"
              />
            </div>

            {/* Temperature */}
            <div>
              <Label className="text-xs text-muted-foreground">Temperature (°F)</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="98.6"
                value={localVitals.temperature}
                onChange={(e) => handleChange('temperature', e.target.value)}
                className="mt-1"
              />
            </div>

            {/* SpO2 */}
            <div>
              <Label className="text-xs text-muted-foreground">SpO2 (%)</Label>
              <Input
                type="number"
                placeholder="98"
                value={localVitals.spo2}
                onChange={(e) => handleChange('spo2', e.target.value)}
                className="mt-1"
              />
            </div>

            {/* Weight */}
            <div>
              <Label className="text-xs text-muted-foreground">Weight (kg)</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="70"
                value={localVitals.weight}
                onChange={(e) => handleChange('weight', e.target.value)}
                className="mt-1"
              />
            </div>

            {/* Height */}
            <div>
              <Label className="text-xs text-muted-foreground">Height (cm)</Label>
              <Input
                type="number"
                placeholder="170"
                value={localVitals.height}
                onChange={(e) => handleChange('height', e.target.value)}
                className="mt-1"
              />
            </div>

            {/* Respiratory Rate */}
            <div>
              <Label className="text-xs text-muted-foreground">Resp. Rate (/min)</Label>
              <Input
                type="number"
                placeholder="16"
                value={localVitals.respiratoryRate}
                onChange={(e) => handleChange('respiratoryRate', e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <Button onClick={handleSave}>
              <Check className="h-4 w-4 mr-2" />
              Save Vitals
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
