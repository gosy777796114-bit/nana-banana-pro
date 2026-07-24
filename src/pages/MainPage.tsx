import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Sparkles, Zap, Layers, Maximize2, Settings, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

import DiagnosticsPanel from '@/components/DiagnosticsPanel';
import ReferenceImageUpload from '@/components/ReferenceImageUpload';
import PromptInput from '@/components/PromptInput';
import ImageSettingsPanel from '@/components/ImageSettingsPanel';
import GenerationProgressBar from '@/components/GenerationProgressBar';
import ResultSection from '@/components/ResultSection';
import FabricZoomTab from '@/pages/FabricZoomTab';
import IntegrationDataTab from '@/components/IntegrationDataTab';
import ConnectionSwitcher from '@/components/ConnectionSwitcher';
import { useIntegration } from '@/contexts/IntegrationContext';

import type {
  ReferenceImage,
  DiagnosticsState,
  DiagnosticsLog,
  GenerationStatus,
  GenerationResult,
  ImageSettings,
} from '@/types/types';

import {
  DEFAULT_SETTINGS,
  DIMENSION_PRESETS,
  QUALITY_OPTIONS,
  resolveDimensions,
  dimensionLabel,
  submitGenerationTask,
  queryGenerationTask,
  formatDurationArabic,
  formatBytes,
  checkPayloadSize,
} from '@/services/imageGeneration';

// Average generation time for estimation (seconds)
const AVG_GENERATION_SEC = 90;
const POLL_INTERVAL_MS = 7000;

function makeLogId() {
  return `log_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function nowTime() {
  return new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function MainPage() {
  const [activeTab, setActiveTab] = useState<'generate' | 'fabric-zoom' | 'integration'>('generate');
  const { activeConnection } = useIntegration();

  // ── Reference images ──────────────────────────────────────────
  const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>([]);

  // ── Prompt ────────────────────────────────────────────────────
  const [prompt, setPrompt] = useState('');

  // ── Image settings ────────────────────────────────────────────
  const [settings, setSettings] = useState<ImageSettings>(DEFAULT_SETTINGS);

  // ── Generation state ──────────────────────────────────────────
  const [genStatus, setGenStatus] = useState<GenerationStatus>('idle');
  const [elapsedMs, setElapsedMs] = useState(0);
  const [progressPercent, setProgressPercent] = useState(0);
  const [result, setResult] = useState<GenerationResult | null>(null);

  // ── Diagnostics ───────────────────────────────────────────────
  const [diagnostics, setDiagnostics] = useState<DiagnosticsState>({
    apiStatus: 'unknown',
    referenceImageCount: 0,
    promptCharCount: 0,
    selectedDimensions: dimensionLabel(DEFAULT_SETTINGS),
    selectedQuality: DEFAULT_SETTINGS.quality,
    lastError: null,
    lastErrorDetails: null,
    generationAttempt: 0,
    warnings: [],
    logs: [],
  });

  // ── Refs for timers ───────────────────────────────────────────
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  // ── Keep diagnostics synced ────────────────────────────────────
  useEffect(() => {
    const { width, height } = resolveDimensions(settings);
    const preset = settings.dimensionPreset === 'custom'
      ? `${settings.customWidth}×${settings.customHeight}`
      : (() => {
          const p = DIMENSION_PRESETS.find(x => x.value === settings.dimensionPreset);
          return p ? `${p.width}×${p.height}` : '—';
        })();

    const qualityLabel = QUALITY_OPTIONS.find(q => q.value === settings.quality)?.label ?? settings.quality;

    // Build warnings
    const warnings: string[] = [];
    const readyImages = referenceImages.filter(i => i.status === 'ready');
    const largeSizeImages = readyImages.filter(i => i.sizeBytes > 5 * 1024 * 1024);
    if (largeSizeImages.length > 0) {
      warnings.push(`${largeSizeImages.length} صورة أكبر من 5MB — قد تُضغط تلقائياً`);
    }
    if (readyImages.length > 10) {
      warnings.push('عدد كبير من الصور المرجعية قد يزيد وقت المعالجة');
    }

    setDiagnostics(prev => ({
      ...prev,
      referenceImageCount: referenceImages.length,
      promptCharCount: prompt.length,
      selectedDimensions: `${width}×${height}`,
      selectedQuality: qualityLabel,
      warnings,
    }));
  }, [referenceImages, prompt, settings]);

  // ── Add log entry ─────────────────────────────────────────────
  const addLog = useCallback((
    level: DiagnosticsLog['level'],
    message: string,
    details?: string
  ) => {
    const entry: DiagnosticsLog = {
      id: makeLogId(),
      level,
      message,
      details,
      timestamp: nowTime(),
    };
    setDiagnostics(prev => ({
      ...prev,
      logs: [...prev.logs.slice(-49), entry], // keep last 50
    }));
  }, []);

  // ── Start elapsed timer ───────────────────────────────────────
  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now();
    setElapsedMs(0);
    timerRef.current = setInterval(() => {
      setElapsedMs(Date.now() - startTimeRef.current);
    }, 500);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // ── Generate ──────────────────────────────────────────────────
  const generate = useCallback(async () => {
    if (!activeConnection) {
      toast.error('يرجى تفعيل اتصال API أولاً من تبويب "بيانات التكامل"');
      addLog('error', 'لا يوجد اتصال API نشط');
      return;
    }

    if (!prompt.trim()) {
      toast.error('يرجى إدخال نص البرومبت أولاً');
      addLog('warn', 'محاولة توليد بدون برومبت');
      return;
    }

    const readyImages = referenceImages.filter(i => i.status === 'ready');
    const pendingImages = referenceImages.filter(i => i.status === 'uploading');
    if (pendingImages.length > 0) {
      toast.error('يرجى الانتظار حتى اكتمال رفع جميع الصور');
      return;
    }

    setResult(null);
    setGenStatus('submitting');
    setProgressPercent(5);
    startTimer();

    setDiagnostics(prev => ({
      ...prev,
      apiStatus: 'unknown',
      lastError: null,
      lastErrorDetails: null,
      generationAttempt: prev.generationAttempt + 1,
    }));

    addLog('info', `بدء التوليد — المحاولة #${diagnostics.generationAttempt + 1}`);
    addLog('info', `الأبعاد: ${dimensionLabel(settings)} — الجودة: ${settings.quality}`);
    addLog('info', `عدد الصور المرجعية: ${readyImages.length}`);

    try {
      // Build contents array for the API
      const parts: { text?: string; inline_data?: { mime_type: string; data: string } }[] = [];

      // Add reference images
      if (readyImages.length > 0) {
        setGenStatus('submitting');
        addLog('info', 'جاري إرسال الصور المرجعية...');
        for (const img of readyImages) {
          if (img.base64) {
            parts.push({ inline_data: { mime_type: img.mimeType, data: img.base64 } });
          }
        }
        setProgressPercent(15);
      }

      // Build enhanced prompt with dimension/quality instructions
      const { width, height } = resolveDimensions(settings);
      const qualityPx = QUALITY_OPTIONS.find(q => q.value === settings.quality)?.px ?? 4096;
      const enhancedPrompt = `${prompt.trim()}\n\n[Generate at exactly ${width}x${height} pixels, quality target: ${qualityPx}px, high detail, professional quality]`;

      parts.push({ text: enhancedPrompt });

      // ── Payload size guard ─────────────────────────────────────
      const sizeWarning = checkPayloadSize(parts);
      if (sizeWarning) {
        throw new Error(sizeWarning);
      }
      // Log total payload size for diagnostics
      const totalBytes = parts.reduce((sum, p) => {
        if (p.inline_data?.data) return sum + Math.ceil(p.inline_data.data.length * 0.75);
        if (p.text) return sum + p.text.length;
        return sum;
      }, 0);
      addLog('info', `حجم الطلب الإجمالي: ${formatBytes(totalBytes)} — جاهز للإرسال`);

      const contents = [{ parts }];

      // Submit task
      addLog('info', 'جاري إرسال طلب التوليد إلى الخادم...');
      const { taskId, estimatedTime, synchronous, imageUrl: syncImageUrl } = await submitGenerationTask(contents, activeConnection);

      // ── Synchronous result: image returned directly ──
      if (synchronous && syncImageUrl) {
        stopTimer();
        setProgressPercent(100);
        setGenStatus('success');
        setDiagnostics(prev => ({ ...prev, apiStatus: 'online' }));

        const totalMs = Date.now() - startTimeRef.current;
        const { width: w, height: h } = resolveDimensions(settings);
        const qualityLabel = QUALITY_OPTIONS.find(q => q.value === settings.quality)?.label ?? settings.quality;

        setResult({
          imageUrl: syncImageUrl,
          width: w,
          height: h,
          quality: qualityLabel,
          generationTimeMs: totalMs,
        });

        addLog('success', `اكتمل التوليد في ${formatDurationArabic(totalMs)} (استجابة مباشرة)`);
        toast.success('تم توليد الصورة بنجاح!');
        return;
      }

      const estimatedMs = (estimatedTime ?? AVG_GENERATION_SEC) * 1000;

      setDiagnostics(prev => ({ ...prev, apiStatus: 'online' }));
      addLog('success', `تم إرسال الطلب بنجاح — معرف المهمة: ${taskId}`);
      addLog('info', `الوقت المقدر: ${formatDurationArabic(estimatedMs)}`);

      setGenStatus('pending');
      setProgressPercent(20);

      // Poll for result
      const deadline = Date.now() + 10 * 60 * 1000;
      let pollCount = 0;

      while (Date.now() < deadline) {
        await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));
        pollCount++;

        const elapsed = Date.now() - startTimeRef.current;
        const dynamicProgress = Math.min(20 + (elapsed / estimatedMs) * 70, 90);
        setProgressPercent(dynamicProgress);

        if (pollCount % 3 === 0) {
          addLog('info', `جاري الاستعلام عن حالة المهمة... (${pollCount} مرة)`);
        }

        setGenStatus(elapsed > estimatedMs * 0.8 ? 'finalizing' : 'processing');

        const queryResult = await queryGenerationTask(taskId, activeConnection);

        if (queryResult.status === 'SUCCESS') {
          setProgressPercent(100);
          setGenStatus('success');
          stopTimer();

          const totalMs = Date.now() - startTimeRef.current;
          const imageUrl = queryResult.imageUrl ?? '';

          const { width: w, height: h } = resolveDimensions(settings);
          const qualityLabel = QUALITY_OPTIONS.find(q => q.value === settings.quality)?.label ?? settings.quality;

          // Set result immediately so user sees the image
          setResult({
            imageUrl,
            width: w,
            height: h,
            quality: qualityLabel,
            generationTimeMs: totalMs,
          });

          setDiagnostics(prev => ({ ...prev, apiStatus: 'online' }));
          addLog('success', `اكتمل التوليد في ${formatDurationArabic(totalMs)}`);
          toast.success('تم توليد الصورة بنجاح!');

          // ── Detect actual dimensions by loading the image ──────
          // Done async after render so it never blocks the result display.
          const probe = new Image();
          probe.onload = () => {
            const aw = probe.naturalWidth;
            const ah = probe.naturalHeight;
            setResult(prev => prev ? { ...prev, actualWidth: aw, actualHeight: ah } : prev);
            if (aw && ah) {
              const matched = aw === w && ah === h;
              addLog(
                matched ? 'success' : 'warn',
                `الأبعاد الفعلية: ${aw}×${ah}px` +
                  (matched
                    ? ' ✓ مطابقة للمطلوب'
                    : ` ⚠ المطلوب: ${w}×${h}px`),
                `الأبعاد المطلوبة: ${w}×${h}  |  الأبعاد الفعلية: ${aw}×${ah}`
              );
            }
          };
          probe.onerror = () => addLog('warn', 'لم يتمكن من قراءة أبعاد الصورة الناتجة');
          probe.src = imageUrl;

          return;
        }

        if (queryResult.status === 'FAILED') {
          throw new Error(queryResult.error?.message ?? 'فشل التوليد بدون سبب محدد');
        }

        if (queryResult.status === 'TIMEOUT') {
          throw new Error('انتهت مهلة المهمة على الخادم');
        }
        // PENDING → continue polling
      }

      throw new Error('انتهت مهلة الانتظار بعد 10 دقائق');

    } catch (err) {
      stopTimer();
      setGenStatus('failed');
      setProgressPercent(0);

      const errMsg = err instanceof Error ? err.message : 'خطأ غير معروف';
      const errDetails = err instanceof Error ? err.stack ?? '' : JSON.stringify(err);

      setDiagnostics(prev => ({
        ...prev,
        apiStatus: 'offline',
        lastError: errMsg,
        lastErrorDetails: errDetails,
      }));

      addLog('error', `فشل التوليد: ${errMsg}`, errDetails);
      toast.error(`فشل التوليد: ${errMsg}`);

      // Reset to idle after short delay
      setTimeout(() => setGenStatus('idle'), 2000);
    }
  }, [prompt, referenceImages, settings, diagnostics.generationAttempt, addLog, startTimer, stopTimer, activeConnection]);

  // ── Re-generate with same settings ──────────────────────────
  const handleRegenerate = useCallback(() => {
    setResult(null);
    setGenStatus('idle');
    addLog('info', 'إعادة التوليد بنفس الإعدادات...');
    setTimeout(generate, 100);
  }, [generate, addLog]);

  // ── Reset everything ──────────────────────────────────────────
  const handleReset = useCallback(() => {
    stopTimer();
    // Revoke all object URLs
    referenceImages.forEach(img => URL.revokeObjectURL(img.previewUrl));
    setReferenceImages([]);
    setPrompt('');
    setSettings(DEFAULT_SETTINGS);
    setResult(null);
    setGenStatus('idle');
    setElapsedMs(0);
    setProgressPercent(0);
    setDiagnostics(prev => ({
      ...prev,
      apiStatus: 'unknown',
      lastError: null,
      lastErrorDetails: null,
      warnings: [],
    }));
    addLog('info', 'تم إعادة ضبط التطبيق');
    toast.success('تم مسح جميع البيانات');
  }, [referenceImages, stopTimer, addLog]);

  const isGenerating = ['submitting', 'pending', 'processing', 'finalizing'].includes(genStatus);

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* ── App Header ── */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3">
          {/* Title row */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center glow-primary-sm shrink-0">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-base md:text-lg font-extrabold gradient-text font-arabic leading-tight">
                تطبيق نانه وبنانه برو
              </h1>
              <p className="text-xs text-muted-foreground font-arabic">ابو القيس — توليد الصور بالذكاء الاصطناعي</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <ConnectionSwitcher />
              <Button
                variant="outline"
                size="sm"
                className="font-arabic text-xs gap-1 hidden sm:flex"
                onClick={() => {
                  const shareUrl = 'https://nana-banana-pro.vercel.app';
                  navigator.clipboard.writeText(shareUrl).then(() => {
                    toast.success('تم نسخ رابط التطبيق');
                  });
                }}
              >
                <Share2 className="w-3 h-3" /> مشاركة
              </Button>
            </div>
          </div>
          {/* Tab switcher */}
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('generate')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold font-arabic transition-colors ${
                activeTab === 'generate'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              توليد الصور
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('fabric-zoom')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold font-arabic transition-colors ${
                activeTab === 'fabric-zoom'
                  ? 'bg-amber-500 text-white'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <Maximize2 className="w-3.5 h-3.5" />
              زوم الأقمشة
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('integration')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold font-arabic transition-colors ${
                activeTab === 'integration'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              بيانات التكامل
            </button>
          </div>
        </div>
      </header>

      {/* ── Tab: توليد الصور ── */}
      {activeTab === 'generate' && (
        <main className="max-w-4xl mx-auto px-4 py-6 pb-32">
          <DiagnosticsPanel state={diagnostics} />
          <ReferenceImageUpload
            images={referenceImages}
            onImagesChange={setReferenceImages}
            onAddLog={addLog}
          />
          <PromptInput value={prompt} onChange={setPrompt} />
          <ImageSettingsPanel settings={settings} onSettingsChange={setSettings} />

          {!result && (
            <div className="mb-6">
              <Button
                size="lg"
                className="w-full h-14 text-base font-bold font-arabic gap-3 glow-primary"
                onClick={generate}
                disabled={isGenerating || !prompt.trim()}
              >
                {isGenerating ? (
                  <>
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    جاري التوليد...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    توليد الصورة
                  </>
                )}
              </Button>
              {!prompt.trim() && (
                <p className="text-center text-xs text-muted-foreground mt-2 font-arabic">
                  يرجى إدخال نص البرومبت لبدء التوليد
                </p>
              )}
            </div>
          )}

          {result && genStatus === 'success' && (
            <ResultSection
              result={result}
              onRegenerate={handleRegenerate}
              onReset={handleReset}
            />
          )}
        </main>
      )}

      {/* ── Tab: زوم الأقمشة ── */}
      {activeTab === 'fabric-zoom' && (
        <main className="max-w-4xl mx-auto px-4 py-6 pb-16">
          <FabricZoomTab />
        </main>
      )}

      {/* ── Tab: بيانات التكامل ── */}
      {activeTab === 'integration' && (
        <main className="max-w-4xl mx-auto px-4 py-6 pb-16">
          <IntegrationDataTab />
        </main>
      )}

      {/* Generation progress bar — fixed bottom (generate tab only) */}
      {activeTab === 'generate' && (
        <GenerationProgressBar
          status={genStatus}
          elapsedMs={elapsedMs}
          estimatedTotalMs={AVG_GENERATION_SEC * 1000}
          progressPercent={progressPercent}
        />
      )}
    </div>
  );
}
