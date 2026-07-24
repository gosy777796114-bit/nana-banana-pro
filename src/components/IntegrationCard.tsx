import React, { useState } from 'react';
import {
  Wifi, WifiOff, Edit2, Trash2, Zap, AlertTriangle,
  MoreVertical, CheckCircle, Copy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import type { IntegrationData, TestConnectionResult } from '@/types/integration';

interface IntegrationCardProps {
  connection: IntegrationData;
  isActive: boolean;
  onEdit: (conn: IntegrationData) => void;
  onDelete: (id: string) => void;
  onActivate: (id: string) => void;
  onTest: (conn: IntegrationData) => void;
}

export default function IntegrationCard({
  connection: conn,
  isActive,
  onEdit,
  onDelete,
  onActivate,
  onTest,
}: IntegrationCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div
      className={`rounded-xl border-2 p-4 transition-all ${
        isActive
          ? 'border-emerald-400 bg-emerald-500/5'
          : 'border-border bg-card/60 hover:border-primary/40'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0">
          {isActive ? (
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />
          ) : (
            <span className="w-2.5 h-2.5 rounded-full bg-muted-foreground/40 shrink-0" />
          )}
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-foreground font-arabic truncate">{conn.name}</h3>
            <p className="text-xs text-muted-foreground font-arabic truncate">{conn.baseUrl}</p>
          </div>
        </div>

        <DropdownMenu open={showMenu} onOpenChange={setShowMenu}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="w-7 h-7 shrink-0">
              <MoreVertical className="w-3.5 h-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="font-arabic">
            <DropdownMenuItem onClick={() => { onEdit(conn); setShowMenu(false); }}>
              <Edit2 className="w-3.5 h-3.5 ml-2" /> تعديل
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { onTest(conn); setShowMenu(false); }}>
              <Wifi className="w-3.5 h-3.5 ml-2" /> اختبار الاتصال
            </DropdownMenuItem>
            {!isActive && (
              <DropdownMenuItem onClick={() => { onActivate(conn.id); setShowMenu(false); }}>
                <Zap className="w-3.5 h-3.5 ml-2" /> تفعيل
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={() => {
                navigator.clipboard.writeText(JSON.stringify(conn, null, 2));
                toast.success('تم نسخ بيانات الاتصال');
                setShowMenu(false);
              }}
            >
              <Copy className="w-3.5 h-3.5 ml-2" /> نسخ JSON
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => { onDelete(conn.id); setShowMenu(false); }}
            >
              <Trash2 className="w-3.5 h-3.5 ml-2" /> حذف
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-2 gap-2 text-xs mb-3">
        <InfoRow label="النوع" value={conn.architectureType === 'direct' ? 'مباشر' : 'بروكسي'} />
        <InfoRow label="App ID" value={conn.appId} mono />
        <InfoRow label="Gen Model" value={shortModel(conn.genModel)} mono />
        <InfoRow label="Vision Model" value={shortModel(conn.visionModel)} mono />
      </div>

      {/* Headers */}
      <div className="flex items-center gap-2 text-xs mb-3 bg-secondary/50 rounded-lg px-2 py-1.5">
        <span className="text-muted-foreground font-arabic">الهيدر:</span>
        <code className="text-primary font-mono text-xs">{conn.headerKey}</code>
        <span className="text-muted-foreground">:</span>
        <code className="text-foreground font-mono text-xs truncate">{conn.headerValue}</code>
      </div>

      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        {isActive ? (
          <Badge className="text-xs bg-emerald-500/20 text-emerald-400 border-emerald-500/40 font-arabic gap-1">
            <CheckCircle className="w-3 h-3" /> نشط
          </Badge>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="font-arabic text-xs gap-1 h-7 border-emerald-500/40 text-emerald-500 hover:bg-emerald-500/10"
            onClick={() => onActivate(conn.id)}
          >
            <Zap className="w-3 h-3" /> تفعيل
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          className="font-arabic text-xs gap-1 h-7"
          onClick={() => onTest(conn)}
        >
          <Wifi className="w-3 h-3" /> اختبار
        </Button>
      </div>
    </div>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center gap-1.5 min-w-0">
      <span className="text-muted-foreground font-arabic shrink-0">{label}:</span>
      <span className={`text-foreground truncate ${mono ? 'font-mono' : 'font-arabic'}`} title={value}>
        {value || '—'}
      </span>
    </div>
  );
}

function shortModel(model: string): string {
  if (!model) return '—';
  const parts = model.split('/');
  return parts.length > 1 ? parts[parts.length - 1] : model;
}
