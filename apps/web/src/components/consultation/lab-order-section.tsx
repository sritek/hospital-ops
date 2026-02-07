'use client';

import { useState } from 'react';
import { useConsultationStore } from '@/stores/consultation.store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FlaskConical, Plus, X, Search, AlertCircle } from 'lucide-react';
import { searchLabTests, mockLabTests } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import type { LabTest } from '@/lib/mock-data/types';

// Common panels for quick selection
const COMMON_PANELS = [
  { code: 'CBC', name: 'Complete Blood Count' },
  { code: 'LFT', name: 'Liver Function Test' },
  { code: 'KFT', name: 'Kidney Function Test' },
  { code: 'LIPID', name: 'Lipid Profile' },
  { code: 'TFT', name: 'Thyroid Function Test' },
  { code: 'HBA1C', name: 'HbA1c' },
  { code: 'FBS', name: 'Fasting Blood Sugar' },
  { code: 'URINE', name: 'Urine Routine' },
];

export function LabOrderSection() {
  const { labOrders, addLabOrder, removeLabOrder } = useConsultationStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LabTest[]>([]);
  const [showSearch, setShowSearch] = useState(false);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.length >= 2) {
      const results = searchLabTests(query);
      setSearchResults(results.slice(0, 8));
    } else {
      setSearchResults([]);
    }
  };

  const handleAddTest = (test: LabTest, urgent: boolean = false) => {
    // Check if already added
    if (labOrders.some((o) => o.testCode === test.code)) return;

    addLabOrder({
      testId: test.id,
      testName: test.name,
      testCode: test.code,
      urgent,
    });
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleQuickAdd = (code: string) => {
    const test = mockLabTests.find((t) => t.code === code);
    if (test) {
      handleAddTest(test);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-primary" />
            Lab Orders
          </h2>
          <p className="text-sm text-muted-foreground">
            {labOrders.length} test{labOrders.length !== 1 ? 's' : ''} ordered
          </p>
        </div>
        <Button onClick={() => setShowSearch(!showSearch)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Test
        </Button>
      </div>

      {/* Quick Panels */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Common Panels</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {COMMON_PANELS.map((panel) => {
              const isAdded = labOrders.some((o) => o.testCode === panel.code);
              return (
                <Button
                  key={panel.code}
                  variant={isAdded ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={() => handleQuickAdd(panel.code)}
                  disabled={isAdded}
                  className={cn(isAdded && 'opacity-50')}
                >
                  {isAdded && <span className="mr-1">✓</span>}
                  {panel.name}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      {showSearch && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Search Tests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search lab tests..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-9"
                autoFocus
              />
            </div>
            {searchResults.length > 0 && (
              <div className="mt-2 border rounded-lg bg-white divide-y max-h-64 overflow-y-auto">
                {searchResults.map((test) => {
                  const isAdded = labOrders.some((o) => o.testCode === test.code);
                  return (
                    <div
                      key={test.id}
                      className={cn(
                        'px-3 py-2 flex items-center justify-between',
                        isAdded ? 'bg-gray-50' : 'hover:bg-gray-50'
                      )}
                    >
                      <div>
                        <p className="font-medium text-sm">{test.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {test.code} • {test.category} • ₹{test.price}
                        </p>
                      </div>
                      {isAdded ? (
                        <span className="text-xs text-green-600 font-medium">Added</span>
                      ) : (
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => handleAddTest(test)}>
                            Add
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600"
                            onClick={() => handleAddTest(test, true)}
                          >
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Urgent
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Ordered Tests */}
      {labOrders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ordered Tests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {labOrders.map((order) => (
                <div
                  key={order.id}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-lg border',
                    order.urgent ? 'bg-red-50 border-red-200' : 'bg-gray-50'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <FlaskConical
                      className={cn('h-5 w-5', order.urgent ? 'text-red-600' : 'text-primary')}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{order.testName}</p>
                        {order.urgent && (
                          <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-[10px] rounded font-medium">
                            URGENT
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{order.testCode}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeLabOrder(order.id)}
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

      {/* Empty State */}
      {labOrders.length === 0 && !showSearch && (
        <Card>
          <CardContent className="py-8 text-center">
            <FlaskConical className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No lab tests ordered</p>
            <p className="text-sm text-muted-foreground">
              Use quick panels above or click "Add Test" to search
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
