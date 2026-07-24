import React from 'react';
import { Download, RefreshCw, PlusCircle, Clock, CheckCircle2, AlertTriangle, Ruler } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useState } from 'react';
import type { GenerationResult } from '@/types/types';
import { formatDurationArabic } from '@/services/imageGeneration';

interface ResultSectionProps {
  result: GenerationResult;
  onRegenerate: () => void;
  onReset: () => void;
}

export default function ResultSection({ result, onRegenerate, onReset }: ResultSectionProps) {
  const [confirmReset, setConfirmReset] = useState(false);

  const handleDownload = async () => {
    try {
      const filename = `nano-banana-${Date.now()}.jpg`;
      // Check if running in pywebview Desktop App
      // @ts-ignore
      if (window.pywebview && window.pywebview.api) {
        // @ts-ignore
        await window.pywebview.api.download_image(result.imageUrl, filename);
        return;
      }

      // Fetch the image as a blob so the browser treats it as same-origin,
      // which allows the `download` attribute to actually save the file
      // instead of navigating to the URL (cross-origin browser restriction).
      const response = await fetch(result.imageUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Release the blob URL after a short delay
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10_000);
    } catch {
      // Fallback: open in new tab if fetch fails
      window.open(result.imageUrl, '_blank');
    }
  };

  return (
    <div className="card-dark rounded-xl p-6 mb-24 animate-scale-in">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
        <h2 className="text-lg font-bold text-foreground font-arabic">نتيجة التوليد</h2>
      </div>

      {/* Generation time */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-5 font-arabic">
        <Clock className="w-4 h-4 shrink-0" />
        <span>استغرق التوليد: <span className="text-foreground font-medium">{formatDurationArabic(result.generationTimeMs)}</span></span>
      </div>

      {/* Image display */}
      <div className="rounded-xl overflow-hidden border border-border mb-5 bg-black/30">
        <img
          src={result.imageUrl}
          alt="الصورة المولدة"
          className="w-full h-auto max-h-[70vh] object-contain"
        />
      </div>

      {/* Image details */}
      <div className="flex flex-wrap gap-3 mb-6">
        <DetailBadge label="الأبعاد المطلوبة" value={`${result.width}×${result.height}`} />
        {result.actualWidth && result.actualHeight && (
          <ActualDimBadge
            requested={{ w: result.width, h: result.height }}
            actual={{ w: result.actualWidth, h: result.actualHeight }}
          />
        )}
        <DetailBadge label="الجودة" value={result.quality} />
        {result.fileSizeEstimate && (
          <DetailBadge label="الحجم التقريبي" value={result.fileSizeEstimate} />
        )}
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        <Button
          className="gap-2 font-arabic flex-1 min-w-fit"
          onClick={handleDownload}
        >
          <Download className="w-4 h-4" />
          تنزيل الصورة
        </Button>
        <Button
          variant="outline"
          className="gap-2 font-arabic flex-1 min-w-fit border-border hover:bg-secondary/80"
          onClick={onRegenerate}
        >
          <RefreshCw className="w-4 h-4" />
          إعادة التوليد
        </Button>
        <Button
          variant="outline"
          className="gap-2 font-arabic border-border hover:bg-secondary/80"
          onClick={() => setConfirmReset(true)}
        >
          <PlusCircle className="w-4 h-4" />
          البدء من جديد
        </Button>
      </div>

      {/* Reset confirmation */}
      <Dialog open={confirmReset} onOpenChange={setConfirmReset}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-sm bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-arabic">البدء من جديد</DialogTitle>
            <DialogDescription className="font-arabic">
              سيتم مسح جميع الصور المرفوعة والبرومبت والإعدادات والنتيجة الحالية. هل أنت متأكد؟
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end mt-4">
            <Button variant="outline" onClick={() => setConfirmReset(false)} className="font-arabic">
              إلغاء
            </Button>
            <Button
              variant="destructive"
              className="font-arabic gap-2"
              onClick={() => { setConfirmReset(false); onReset(); }}
            >
              <PlusCircle className="w-4 h-4" />
              نعم، ابدأ من جديد
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DetailBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-secondary/60 rounded-lg px-3 py-2 text-sm font-arabic">
      <span className="text-muted-foreground ml-1">{label}:</span>
      <span className="text-foreground font-medium">{value}</span>
    </div>
  );
}

function ActualDimBadge({
  requested,
  actual,
}: {
  requested: { w: number; h: number };
  actual: { w: number; h: number };
}) {
  const matched = actual.w === requested.w && actual.h === requested.h;
  return (
    <div
      className={`rounded-lg px-3 py-2 text-sm font-arabic flex items-center gap-1.5 ${
        matched
          ? 'bg-emerald-500/10 border border-emerald-500/30'
          : 'bg-amber-500/10 border border-amber-500/30'
      }`}
    >
      <Ruler className={`w-3.5 h-3.5 shrink-0 ${matched ? 'text-emerald-400' : 'text-amber-400'}`} />
      <span className="text-muted-foreground ml-0.5">الأبعاد الفعلية:</span>
      <span className={`font-medium font-mono ${matched ? 'text-emerald-400' : 'text-amber-400'}`}>
        {actual.w}×{actual.h}
      </span>
      {matched ? (
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
      ) : (
        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
      )}
    </div>
  );
}
