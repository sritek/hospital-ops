'use client';

import { useState } from 'react';
import { useDemoStore } from '@/stores/demo.store';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Beaker, RotateCcw, Info } from 'lucide-react';

export function DemoBadge() {
  const { isDemo, resetDemo } = useDemoStore();
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showInfoTooltip, setShowInfoTooltip] = useState(false);

  if (!isDemo) return null;

  return (
    <>
      <div className="relative">
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium cursor-help"
          onMouseEnter={() => setShowInfoTooltip(true)}
          onMouseLeave={() => setShowInfoTooltip(false)}
        >
          <Beaker className="h-3 w-3" />
          <span>Demo Mode</span>
          <button
            onClick={() => setShowResetDialog(true)}
            className="ml-1 p-0.5 hover:bg-amber-200 rounded"
            title="Reset Demo"
          >
            <RotateCcw className="h-3 w-3" />
          </button>
        </div>

        {/* Info Tooltip */}
        {showInfoTooltip && (
          <div className="absolute top-full left-0 mt-2 w-64 p-3 bg-white rounded-lg shadow-lg border z-50">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-gray-600">
                <p className="font-medium text-gray-900 mb-1">Demo Mode Active</p>
                <p>
                  You&apos;re viewing a demo with sample data. Changes are stored locally and
                  won&apos;t affect real data.
                </p>
                <p className="mt-2 text-amber-600">
                  Click the reset icon to restore original demo data.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Reset Confirmation Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Demo?</AlertDialogTitle>
            <AlertDialogDescription>
              This will reset all demo data to its original state. Any changes you&apos;ve made
              (check-ins, appointments, etc.) will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                resetDemo();
                setShowResetDialog(false);
              }}
              className="bg-amber-600 hover:bg-amber-700"
            >
              Reset Demo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
