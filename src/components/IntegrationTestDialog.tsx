import React, { useState } from 'react';
import { Wifi, WifiOff, Loader2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import type { IntegrationData, TestConnectionResult } from '@/types/integration';

interface IntegrationTestDialogProps {
  open: boolean;
  connection: IntegrationData | null;
  onTest: (conn: IntegrationData) => Promise<TestConnectionResult>;
  onClose: () => void;
}

export default function IntegrationTestDialog({
  open,
  connection,
  onTest,
  onClose,
}: IntegrationTestDialogProps) {
  const [result, setResult] = useState<TestConnectionResult | null>(null);
  const [testing, setTesting] = useState(false);

  React.useEffect(() => {
    if (open && connection) {
      setResult(null);
      setTesting(true);
      onTest(connection).then(r => {
        setResult(r);
        setTesting(false);
      }).catch(() => setTesting(false));
    }
  }, [open, connection, onTest]);

  if (!connection) return null;

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-[calc(100%-1rem)] md:max-w-md p-4 md:p-6" dir="rtl">
        <DialogHeader>
          <DialogTitle className="font-arabic text-right flex items-center gap-2">
            <Wifi className="w-4 h-4 text-primary" />
            اختبار الاتصال
          </DialogTitle>
          <DialogDescription className="font-arabic">
            {connection.name}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          {/* Connection info */}
          <div className="bg-secondary/50 rounded-lg p-3 text-xs space-y-1">
            <div className="flex gap-2 font-arabic">
              <span className="text-muted-foreground">الرابط:</span>
              <code className="text-foreground font-mono break-all">{connection.genKey}</code>
            </div>
            <div className="flex gap-2 font-arabic">
              <span className="text-muted-foreground">الهيدر:</span>
              <code className="text-foreground font-mono">{connection.headerKey}: {connection.headerValue}</code>
            </div>
          </div>

          {/* Result */}
          {testing && (
            <div className="flex items-center justify-center gap-2 py-6">
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
              <span className="text-sm text-muted-foreground font-arabic">جاري اختبار الاتصال...</span>
            </div>
          )}

          {!testing && result && (
            <div className={`rounded-lg border p-4 ${
              result.success
                ? 'border-emerald-400/40 bg-emerald-500/5'
                : 'border-red-400/40 bg-red-500/5'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {result.success ? (
                  <Wifi className="w-5 h-5 text-emerald-400" />
                ) : (
                  <WifiOff className="w-5 h-5 text-red-400" />
                )}
                <span className={`text-sm font-bold font-arabic ${
                  result.success ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {result.message}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-arabic">
                <Clock className="w-3 h-3" />
                <span>زمن الاستجابة: {result.latencyMs}ms</span>
                {result.statusCode > 0 && (
                  <span>• كود الحالة: {result.statusCode}</span>
                )}
              </div>
              {result.details && (
                <pre className="mt-2 text-xs text-muted-foreground bg-black/30 rounded p-2 overflow-x-auto whitespace-pre-wrap break-all ltr text-left max-h-32 overflow-y-auto">
                  {result.details}
                </pre>
              )}
            </div>
          )}

          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose} className="font-arabic">
              إغلاق
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
