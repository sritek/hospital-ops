'use client';

import { useState } from 'react';
import { useConsultationStore } from '@/stores/consultation.store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Stethoscope, Plus, X, Search, Star } from 'lucide-react';
import { searchICD10 } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

// Common diagnoses for quick selection
const COMMON_DIAGNOSES = [
  { code: 'J06.9', description: 'Acute upper respiratory infection' },
  { code: 'R50.9', description: 'Fever, unspecified' },
  { code: 'J20.9', description: 'Acute bronchitis' },
  { code: 'K30', description: 'Functional dyspepsia' },
  { code: 'M54.5', description: 'Low back pain' },
  { code: 'E11.9', description: 'Type 2 diabetes mellitus' },
  { code: 'I10', description: 'Essential hypertension' },
  { code: 'J45.9', description: 'Asthma, unspecified' },
];

export function DiagnosisSection() {
  const { diagnoses, addDiagnosis, removeDiagnosis, updateDiagnosis } = useConsultationStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ code: string; description: string }[]>([]);
  const [showSearch, setShowSearch] = useState(false);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.length >= 2) {
      const results = searchICD10(query);
      setSearchResults(results.slice(0, 8));
    } else {
      setSearchResults([]);
    }
  };

  const handleAddDiagnosis = (code: string, description: string) => {
    // Check if already added
    if (diagnoses.some((d) => d.code === code)) return;

    addDiagnosis({
      code,
      description,
      type: diagnoses.length === 0 ? 'primary' : 'secondary',
    });
    setSearchQuery('');
    setSearchResults([]);
    setShowSearch(false);
  };

  const handleRemove = (id: string) => {
    removeDiagnosis(id);
  };

  const handleSetPrimary = (id: string) => {
    diagnoses.forEach((d) => {
      if (d.id === id) {
        updateDiagnosis(d.id, { type: 'primary' });
      } else if (d.type === 'primary') {
        updateDiagnosis(d.id, { type: 'secondary' });
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-primary" />
            Diagnosis
            {diagnoses.length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
                {diagnoses.length}
              </span>
            )}
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => setShowSearch(!showSearch)}>
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search / Add Section */}
        {showSearch && (
          <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search ICD-10 codes or diagnosis..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-9"
                autoFocus
              />
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="border rounded-lg bg-white divide-y max-h-48 overflow-y-auto">
                {searchResults.map((result) => (
                  <button
                    key={result.code}
                    onClick={() => handleAddDiagnosis(result.code, result.description)}
                    className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-mono text-xs text-primary mr-2">{result.code}</span>
                      <span className="text-sm">{result.description}</span>
                    </div>
                    <Plus className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            )}

            {/* Common Diagnoses */}
            {!searchQuery && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Common Diagnoses</p>
                <div className="flex flex-wrap gap-2">
                  {COMMON_DIAGNOSES.map((diag) => (
                    <button
                      key={diag.code}
                      onClick={() => handleAddDiagnosis(diag.code, diag.description)}
                      disabled={diagnoses.some((d) => d.code === diag.code)}
                      className={cn(
                        'px-2 py-1 text-xs rounded-full border transition-colors',
                        diagnoses.some((d) => d.code === diag.code)
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'hover:bg-primary/10 hover:border-primary/30'
                      )}
                    >
                      {diag.description}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Added Diagnoses */}
        {diagnoses.length > 0 ? (
          <div className="space-y-2">
            {diagnoses.map((diagnosis) => (
              <div
                key={diagnosis.id}
                className={cn(
                  'flex items-center justify-between p-3 rounded-lg border',
                  diagnosis.type === 'primary' ? 'bg-primary/5 border-primary/20' : 'bg-white'
                )}
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleSetPrimary(diagnosis.id)}
                    className={cn(
                      'p-1 rounded',
                      diagnosis.type === 'primary'
                        ? 'text-primary'
                        : 'text-gray-300 hover:text-gray-400'
                    )}
                    title={diagnosis.type === 'primary' ? 'Primary diagnosis' : 'Set as primary'}
                  >
                    <Star
                      className="h-4 w-4"
                      fill={diagnosis.type === 'primary' ? 'currentColor' : 'none'}
                    />
                  </button>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                        {diagnosis.code}
                      </span>
                      {diagnosis.type === 'primary' && (
                        <span className="text-[10px] text-primary font-medium">PRIMARY</span>
                      )}
                    </div>
                    <p className="text-sm mt-0.5">{diagnosis.description}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemove(diagnosis.id)}
                  className="text-muted-foreground hover:text-red-500"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <Stethoscope className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No diagnosis added yet</p>
            <p className="text-xs">Click "Add" to search and add diagnoses</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
