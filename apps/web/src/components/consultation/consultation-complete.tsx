'use client';

import { useEffect, useState } from 'react';
import { useConsultationStore } from '@/stores/consultation.store';
import { Button } from '@/components/ui/button';
import { CheckCircle, Printer, MessageCircle, Calendar, ArrowRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConsultationCompleteProps {
  onClose: () => void;
}

export function ConsultationComplete({ onClose }: ConsultationCompleteProps) {
  const { activePatient, prescriptions, labOrders, followUpDays, diagnoses } =
    useConsultationStore();
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    // Hide confetti after animation
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      {/* Confetti Animation */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-10px',
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            >
              <div
                className={cn(
                  'w-3 h-3 rounded-sm',
                  ['bg-primary', 'bg-green-500', 'bg-yellow-500', 'bg-pink-500', 'bg-blue-500'][
                    Math.floor(Math.random() * 5)
                  ]
                )}
                style={{
                  transform: `rotate(${Math.random() * 360}deg)`,
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 p-8 text-center text-white">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
            <CheckCircle className="h-12 w-12" />
          </div>
          <h2 className="text-2xl font-bold">Consultation Complete!</h2>
          <p className="text-green-100 mt-1">
            {activePatient?.name}&apos;s visit has been recorded
          </p>
        </div>

        {/* Summary */}
        <div className="p-6 space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-primary">{diagnoses.length}</p>
              <p className="text-xs text-muted-foreground">Diagnosis</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-primary">{prescriptions.length}</p>
              <p className="text-xs text-muted-foreground">Medications</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-primary">{labOrders.length}</p>
              <p className="text-xs text-muted-foreground">Lab Tests</p>
            </div>
          </div>

          {/* Follow-up */}
          {followUpDays && (
            <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
              <Calendar className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Follow-up scheduled</p>
                <p className="text-xs text-muted-foreground">In {followUpDays} days</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2 pt-2">
            <Button className="w-full" variant="outline">
              <Printer className="h-4 w-4 mr-2" />
              Print Prescription
            </Button>
            <Button className="w-full" variant="outline">
              <MessageCircle className="h-4 w-4 mr-2" />
              Send via WhatsApp
            </Button>
          </div>

          {/* AI Badge */}
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-2">
            <Sparkles className="h-3 w-3" />
            <span>Powered by AI Ambient Scribe</span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          <Button onClick={onClose} className="w-full">
            Next Patient
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>

      {/* CSS for confetti animation */}
      <style jsx>{`
        @keyframes confetti {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti linear forwards;
        }
      `}</style>
    </div>
  );
}
