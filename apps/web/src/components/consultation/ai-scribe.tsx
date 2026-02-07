'use client';

import { useState, useEffect, useRef } from 'react';
import { useConsultationStore } from '@/stores/consultation.store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Mic,
  MicOff,
  Sparkles,
  Loader2,
  Check,
  RotateCcw,
  Wand2,
  Volume2,
  ChevronDown,
  ChevronUp,
  Copy,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Mock transcripts for demo
const MOCK_TRANSCRIPTS = [
  'Patient is a 45-year-old male presenting with fever for the past 3 days. Temperature has been ranging between 100 to 102 degrees Fahrenheit. Associated symptoms include body ache, headache, and mild fatigue. No cough, cold, or sore throat. Appetite is reduced. Patient has been taking paracetamol at home with temporary relief. No history of recent travel. No sick contacts at home.',
  'Patient complains of persistent cough for the past one week. Cough is productive with whitish sputum. Associated with mild sore throat and nasal congestion. No fever, no breathlessness, no chest pain. Patient is a non-smoker. No history of asthma or allergies. Has tried over-the-counter cough syrup with minimal relief.',
  'This is a follow-up visit for diabetes management. Patient is a known case of Type 2 Diabetes for the past 5 years. Currently on Metformin 500mg twice daily. Blood sugar levels have been well controlled. No complaints of polyuria, polydipsia, or weight loss. Compliance to medication is good. Diet and exercise being followed as advised.',
  'Patient presents with joint pain affecting both knees for the past 2 weeks. Pain is worse in the morning and improves with activity. No history of trauma or injury. No swelling or redness. Patient is overweight. Pain is affecting daily activities and sleep. Has been using pain balm locally with some relief.',
];

export function AIScribe() {
  const {
    aiScribe,
    startRecording,
    stopRecording,
    setTranscript,
    generateSOAPNotes,
    applyGeneratedNotes,
    clearAIScribe,
  } = useConsultationStore();

  const [isExpanded, setIsExpanded] = useState(true);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showWaveform, setShowWaveform] = useState(false);
  const [typingIndex, setTypingIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const typingRef = useRef<NodeJS.Timeout | null>(null);

  // Recording timer
  useEffect(() => {
    if (aiScribe.isRecording) {
      setShowWaveform(true);
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      setShowWaveform(false);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [aiScribe.isRecording]);

  // Typing effect for transcript
  useEffect(() => {
    if (isTyping && typingIndex < aiScribe.transcript.length) {
      typingRef.current = setTimeout(() => {
        setTypingIndex((prev) => Math.min(prev + 3, aiScribe.transcript.length));
      }, 20);
    } else if (typingIndex >= aiScribe.transcript.length && isTyping) {
      setIsTyping(false);
    }

    return () => {
      if (typingRef.current) {
        clearTimeout(typingRef.current);
      }
    };
  }, [isTyping, typingIndex, aiScribe.transcript]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartRecording = () => {
    setRecordingTime(0);
    setTypingIndex(0);
    startRecording();
  };

  const handleStopRecording = () => {
    stopRecording();

    // Simulate transcription with mock data
    const randomTranscript =
      MOCK_TRANSCRIPTS[Math.floor(Math.random() * MOCK_TRANSCRIPTS.length)] ?? MOCK_TRANSCRIPTS[0];
    setTranscript(randomTranscript ?? '');
    setIsTyping(true);
    setTypingIndex(0);
  };

  const handleGenerateNotes = async () => {
    await generateSOAPNotes();
  };

  const handleApplyNotes = () => {
    applyGeneratedNotes();
  };

  const handleReset = () => {
    clearAIScribe();
    setRecordingTime(0);
    setTypingIndex(0);
    setIsTyping(false);
  };

  const displayedTranscript = isTyping
    ? aiScribe.transcript.substring(0, typingIndex)
    : aiScribe.transcript;

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 rounded-lg">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <span>AI Ambient Scribe</span>
            <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full font-normal">
              Beta
            </span>
          </CardTitle>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
        {!isExpanded && aiScribe.generatedNotes && (
          <p className="text-sm text-muted-foreground mt-1">
            ✓ SOAP notes generated - click to view
          </p>
        )}
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Recording Section */}
          <div className="flex flex-col items-center py-6">
            {/* Microphone Button */}
            <div className="relative">
              {/* Pulsing rings when recording */}
              {aiScribe.isRecording && (
                <>
                  <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping" />
                  <div
                    className="absolute inset-[-8px] rounded-full bg-red-500/10 animate-pulse"
                    style={{ animationDelay: '0.2s' }}
                  />
                </>
              )}

              <button
                onClick={aiScribe.isRecording ? handleStopRecording : handleStartRecording}
                disabled={aiScribe.isProcessing}
                className={cn(
                  'relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300',
                  aiScribe.isRecording
                    ? 'bg-red-500 hover:bg-red-600 text-white scale-110'
                    : 'bg-primary hover:bg-primary/90 text-white',
                  aiScribe.isProcessing && 'opacity-50 cursor-not-allowed'
                )}
              >
                {aiScribe.isRecording ? (
                  <MicOff className="h-8 w-8" />
                ) : (
                  <Mic className="h-8 w-8" />
                )}
              </button>
            </div>

            {/* Recording Status */}
            <div className="mt-4 text-center">
              {aiScribe.isRecording ? (
                <>
                  <p className="text-lg font-semibold text-red-600 flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    Recording...
                  </p>
                  <p className="text-2xl font-mono mt-1">{formatTime(recordingTime)}</p>
                </>
              ) : aiScribe.isProcessing ? (
                <p className="text-lg font-semibold text-primary flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Generating SOAP notes...
                </p>
              ) : (
                <p className="text-muted-foreground">
                  {aiScribe.transcript
                    ? 'Recording complete'
                    : 'Click to start recording consultation'}
                </p>
              )}
            </div>

            {/* Waveform Animation */}
            {showWaveform && (
              <div className="flex items-center gap-1 mt-4 h-8">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-1 bg-red-500 rounded-full animate-pulse"
                    style={{
                      height: `${Math.random() * 24 + 8}px`,
                      animationDelay: `${i * 0.05}s`,
                      animationDuration: '0.5s',
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Transcript */}
          {aiScribe.transcript && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <Volume2 className="h-4 w-4" />
                  Transcript
                </h4>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigator.clipboard.writeText(aiScribe.transcript)}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleReset}>
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Reset
                  </Button>
                </div>
              </div>
              <div className="p-4 bg-white rounded-lg border text-sm leading-relaxed">
                {displayedTranscript}
                {isTyping && <span className="animate-pulse">|</span>}
              </div>

              {/* Generate Notes Button */}
              {!aiScribe.generatedNotes && !aiScribe.isProcessing && !isTyping && (
                <Button onClick={handleGenerateNotes} className="w-full">
                  <Wand2 className="h-4 w-4 mr-2" />
                  Generate SOAP Notes
                </Button>
              )}
            </div>
          )}

          {/* Generated SOAP Notes */}
          {aiScribe.generatedNotes && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  AI Generated SOAP Notes
                  <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] rounded">
                    AI Generated
                  </span>
                </h4>
              </div>

              <div className="space-y-3">
                {/* Subjective */}
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <h5 className="font-medium text-blue-800 text-xs uppercase mb-1">
                    S - Subjective
                  </h5>
                  <p className="text-sm text-blue-900">{aiScribe.generatedNotes.subjective}</p>
                </div>

                {/* Objective */}
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <h5 className="font-medium text-green-800 text-xs uppercase mb-1">
                    O - Objective
                  </h5>
                  <p className="text-sm text-green-900">{aiScribe.generatedNotes.objective}</p>
                </div>

                {/* Assessment */}
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <h5 className="font-medium text-amber-800 text-xs uppercase mb-1">
                    A - Assessment
                  </h5>
                  <p className="text-sm text-amber-900">{aiScribe.generatedNotes.assessment}</p>
                </div>

                {/* Plan */}
                <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <h5 className="font-medium text-purple-800 text-xs uppercase mb-1">P - Plan</h5>
                  <p className="text-sm text-purple-900 whitespace-pre-line">
                    {aiScribe.generatedNotes.plan}
                  </p>
                </div>
              </div>

              {/* Apply Notes Button */}
              <div className="flex gap-2">
                <Button onClick={handleApplyNotes} className="flex-1">
                  <Check className="h-4 w-4 mr-2" />
                  Apply to Clinical Notes
                </Button>
                <Button variant="outline" onClick={handleReset}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Start Over
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                AI-generated notes are suggestions only. Please review and edit as needed.
              </p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
