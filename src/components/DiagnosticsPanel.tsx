import React, { useState, useCallback } from 'react';
import { ChevronDown, ChevronUp, Wifi, WifiOff, AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { DiagnosticsState, DiagnosticsLog } from '@/types/types';

interface DiagnosticsPanelProps {
  state: DiagnosticsState;
}

const LOG_ICONS = {
  info:    <Info    className="w-3 h-3 text-sky-400 shrink-0" />,
  warn:    <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />,
  error:   <XCircle className="w-3 h-3 text-red-400 shrink-0" />,
  success: <CheckCircle  className="w-3 h-3 text-emerald-400 shrink-0" />,
};

const LOG_COLORS = {
  info:    'text-sky-300',
  warn:    'text-amber-300',
  error:   'text-red-300',
  success: 'text-emerald-300',
};

function LogLine({ log }: { log: DiagnosticsLog }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="mb-1">
      <div
        className="flex items-start gap-2 cursor-pointer hover:bg-white/5 px-1 rounded"
        onClick={() => log.details && setExpanded(e => !e)}
      >
        <span className="mt-0.5">{LOG_ICONS[log.level]}</span>
        <span className={`terminal-text text-xs flex-1 min-w-0 break-all ${LOG_COLORS[log.level]}`}>
          <span className="text-muted-foreground ml-1">[{log.timestamp}]</span> {log.message}
        </span>
        {log.details && (
          <ChevronDown className={`w-3 h-3 text-muted-foreground shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        )}
      </div>
      {expanded && log.details && (
        <pre className="terminal-text text-xs text-muted-foreground bg-black/30 rounded p-2 mt-1 overflow-x-auto whitespace-pre-wrap break-all ltr text-left">
          {log.details}
        </pre>
      )}
    </div>
  );
}

export default function DiagnosticsPanel({ state }: DiagnosticsPanelProps) {
  const [collapsed, setCollapsed] = useState(false);

  const apiOnline = state.apiStatus === 'online';
  const apiUnknown = state.apiStatus === 'unknown';

  return (
    <div className="card-dark rounded-lg border border-border mb-6 overflow-hidden transition-all">
      {/* Header */}
      <button
        type="button"
        onClick={() => setCollapsed(c => !c)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
        aria-expanded={!collapsed}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {apiUnknown ? (
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse-slow" />
            ) : apiOnline ? (
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            ) : (
              <span className="w-2.5 h-2.5 rounded-full bg-red-400 animate-pulse" />
            )}
            <span className="text-sm font-semibold text-foreground font-arabic">
              لوحة الكشف عن المشاكل
            </span>
          </div>
          {state.warnings.length > 0 && (
            <Badge variant="outline" className="border-amber-400/50 text-amber-400 text-xs">
              {state.warnings.length} تحذير
            </Badge>
          )}
          {state.lastError && (
            <Badge variant="outline" className="border-red-400/50 text-red-400 text-xs">
              خطأ
            </Badge>
          )}
        </div>
        {collapsed
          ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
          : <ChevronUp   className="w-4 h-4 text-muted-foreground" />
        }
      </button>

      {/* Body */}
      {!collapsed && (
        <div className="px-4 pb-4 space-y-4 animate-fade-in">
          {/* Status grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatusCard
              label="حالة الاتصال"
              value={apiUnknown ? 'غير معروف' : apiOnline ? 'متصل' : 'غير متصل'}
              icon={apiUnknown
                ? <Wifi className="w-4 h-4 text-amber-400" />
                : apiOnline
                  ? <Wifi className="w-4 h-4 text-emerald-400" />
                  : <WifiOff className="w-4 h-4 text-red-400" />
              }
              valueClass={apiUnknown ? 'text-amber-400' : apiOnline ? 'text-emerald-400' : 'text-red-400'}
            />
            <StatusCard
              label="الصور المرجعية"
              value={`${state.referenceImageCount} صورة`}
              icon={<Info className="w-4 h-4 text-sky-400" />}
              valueClass="text-sky-400"
            />
            <StatusCard
              label="أحرف البرومبت"
              value={`${state.promptCharCount.toLocaleString('ar')} / 10,000`}
              icon={<Info className="w-4 h-4 text-purple-400" />}
              valueClass="text-purple-400"
            />
            <StatusCard
              label="محاولة التوليد"
              value={`#${state.generationAttempt}`}
              icon={<Info className="w-4 h-4 text-muted-foreground" />}
              valueClass="text-foreground"
            />
          </div>

          {/* Settings row */}
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="bg-secondary px-2 py-1 rounded text-secondary-foreground font-arabic">
              الأبعاد: <span className="text-primary font-mono">{state.selectedDimensions || '—'}</span>
            </span>
            <span className="bg-secondary px-2 py-1 rounded text-secondary-foreground font-arabic">
              الجودة: <span className="text-primary">{state.selectedQuality || '—'}</span>
            </span>
          </div>

          {/* Warnings */}
          {state.warnings.length > 0 && (
            <div className="space-y-1">
              {state.warnings.map((w, i) => (
                <div key={i} className="flex items-start gap-2 text-amber-300 text-xs bg-amber-400/10 px-3 py-2 rounded border border-amber-400/20">
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span className="font-arabic">{w}</span>
                </div>
              ))}
            </div>
          )}

          {/* Last error */}
          {state.lastError && (
            <div className="bg-red-950/40 border border-red-400/30 rounded p-3">
              <div className="flex items-center gap-2 mb-1">
                <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span className="text-red-300 text-sm font-semibold font-arabic">آخر خطأ</span>
              </div>
              <p className="text-red-200 text-sm font-arabic mb-1">{state.lastError}</p>
              {state.lastErrorDetails && (
                <pre className="terminal-text text-xs text-red-400/80 bg-black/30 rounded p-2 overflow-x-auto whitespace-pre-wrap break-all ltr text-left">
                  {state.lastErrorDetails}
                </pre>
              )}
            </div>
          )}

          {/* Console logs */}
          <div>
            <p className="text-xs text-muted-foreground mb-2 font-arabic">سجل النظام:</p>
            <div className="bg-black/40 rounded-md p-3 max-h-40 overflow-y-auto border border-border">
              {state.logs.length === 0 ? (
                <p className="terminal-text text-xs text-muted-foreground">لا توجد سجلات بعد...</p>
              ) : (
                [...state.logs].reverse().map(log => <LogLine key={log.id} log={log} />)
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusCard({
  label, value, icon, valueClass,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  valueClass: string;
}) {
  return (
    <div className="bg-secondary/50 rounded-lg p-3 flex flex-col gap-1">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="text-xs font-arabic">{label}</span>
      </div>
      <span className={`text-sm font-semibold font-arabic ${valueClass}`}>{value}</span>
    </div>
  );
}
