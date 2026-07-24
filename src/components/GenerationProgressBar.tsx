import React from 'react';
import { Loader2, Clock } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import type { GenerationStatus } from '@/types/types';
import { formatTime } from '@/services/imageGeneration';

interface GenerationProgressBarProps {
  status: GenerationStatus;
  elapsedMs: number;
  estimatedTotalMs: number;
  progressPercent: number;
}

const STATUS_LABELS: Record<GenerationStatus, string> = {
  idle:        '',
  submitting:  'جاري إرسال الصور المرجعية...',
  pending:     'جاري التوليد...',
  processing:  'جاري التوليد...',
  finalizing:  'جاري المعالجة النهائية...',
  success:     'اكتمل التوليد',
  failed:      'فشل التوليد',
};

export default function GenerationProgressBar({
  status,
  elapsedMs,
  estimatedTotalMs,
  progressPercent,
}: GenerationProgressBarProps) {
  if (status === 'idle' || status === 'success' || status === 'failed') return null;

  const elapsedSec = elapsedMs / 1000;
  const remainingSec = Math.max(0, (estimatedTotalMs - elapsedMs) / 1000);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 border-t border-border backdrop-blur-sm px-4 py-4 animate-fade-in">
      <div className="max-w-4xl mx-auto space-y-3">
        {/* Status row */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-foreground font-arabic">
            <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0" />
            <span>{STATUS_LABELS[status]}</span>
          </div>
          <span className="text-sm font-bold text-primary">{Math.round(progressPercent)}%</span>
        </div>

        {/* Progress bar */}
        <div className="relative h-2.5 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full progress-shimmer rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Time row */}
        <div className="flex items-center justify-between text-xs text-muted-foreground font-arabic">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 shrink-0" />
            <span>الوقت المنقضي: <span className="font-mono text-foreground">{formatTime(elapsedSec)}</span></span>
          </div>
          {estimatedTotalMs > 0 && (
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span>الوقت المتبقي: <span className="font-mono text-foreground">~{formatTime(remainingSec)}</span></span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
