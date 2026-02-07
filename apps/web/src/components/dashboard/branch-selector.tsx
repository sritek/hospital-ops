'use client';

import { useState } from 'react';
import { ChevronDown, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth.store';
import { cn } from '@/lib/utils';

// This would typically come from an API call
const mockBranches = [
  { id: '1', name: 'Main Branch', code: 'MAIN' },
  { id: '2', name: 'Downtown Clinic', code: 'DT01' },
];

export function BranchSelector() {
  const user = useAuthStore((state) => state.user);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(
    mockBranches[0] ?? { id: '1', name: 'Main Branch', code: 'MAIN' }
  );

  // Only show for users with multiple branches
  if (!user || user.branchIds.length <= 1) {
    return null;
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        className="flex items-center gap-2"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Building2 className="h-4 w-4" />
        <span className="hidden sm:inline">{selectedBranch.name}</span>
        <span className="sm:hidden">{selectedBranch.code}</span>
        <ChevronDown className="h-4 w-4" />
      </Button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-56 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-1">
            <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase">
              Select Branch
            </div>
            {mockBranches.map((branch) => (
              <button
                key={branch.id}
                onClick={() => {
                  setSelectedBranch(branch);
                  setIsOpen(false);
                  // TODO: Update branch context via API
                }}
                className={cn(
                  'flex w-full items-center px-4 py-2 text-sm hover:bg-gray-100',
                  selectedBranch.id === branch.id ? 'bg-primary/10 text-primary' : 'text-gray-700'
                )}
              >
                <Building2 className="mr-3 h-4 w-4" />
                <div className="text-left">
                  <p className="font-medium">{branch.name}</p>
                  <p className="text-xs text-muted-foreground">{branch.code}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
