import React, { useState, useRef } from 'react';
import {
  Plus, Download, Upload, Share2, Settings, AlertTriangle,
  Search, Link as LinkIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useIntegration } from '@/contexts/IntegrationContext';
import IntegrationCard from '@/components/IntegrationCard';
import IntegrationForm from '@/components/IntegrationForm';
import IntegrationTestDialog from '@/components/IntegrationTestDialog';
import type { IntegrationData } from '@/types/integration';

export default function IntegrationDataTab() {
  const {
    connections,
    activeConnection,
    addConnection,
    updateConnection,
    deleteConnection,
    activateConnection,
    testConnection,
    importConnections,
    exportConnections,
  } = useIntegration();

  const [formOpen, setFormOpen] = useState(false);
  const [editData, setEditData] = useState<IntegrationData | null>(null);
  const [testTarget, setTestTarget] = useState<IntegrationData | null>(null);
  const [testOpen, setTestOpen] = useState(false);
  const [search, setSearch] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = connections.filter(c =>
    !search ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.baseUrl.toLowerCase().includes(search.toLowerCase()) ||
    c.appId.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = () => {
    setEditData(null);
    setFormOpen(true);
  };

  const handleEdit = (conn: IntegrationData) => {
    setEditData(conn);
    setFormOpen(true);
  };

  const handleSave = (data: Omit<IntegrationData, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editData) {
      updateConnection(editData.id, data);
    } else {
      addConnection(data);
    }
  };

  const handleDelete = (id: string) => {
    const conn = connections.find(c => c.id === id);
    if (confirm(`هل أنت متأكد من حذف "${conn?.name}"؟`)) {
      deleteConnection(id);
      toast.success('تم حذف الاتصال');
    }
  };

  const handleTest = (conn: IntegrationData) => {
    setTestTarget(conn);
    setTestOpen(true);
  };

  const handleExport = () => {
    const txt = exportConnections('txt');
    const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `integrations-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('تم تصدير جميع الاتصالات');
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const isJSON = file.name.endsWith('.json') || text.trim().startsWith('[') || text.trim().startsWith('{');
      const format: 'json' | 'txt' = isJSON ? 'json' : 'txt';
      try {
        const count = importConnections(text, format);
        toast.success(`تم استيراد ${count} اتصال(ات)`);
      } catch {
        toast.error('فشل الاستيراد — تأكد من صيغة الملف');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      toast.success('تم نسخ رابط التطبيق');
    });
  };

  return (
    <div className="min-h-full" dir="rtl">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-2 mb-6 p-4 rounded-xl border border-border bg-card/60">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center shrink-0">
            <Settings className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-foreground font-arabic">بيانات التكامل</h2>
            <p className="text-xs text-muted-foreground font-arabic">
              إدارة اتصالات API — {connections.length} اتصال
              {activeConnection && (
                <span className="text-emerald-400"> • النشط: {activeConnection.name}</span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" className="font-arabic text-xs gap-1" onClick={handleShare}>
            <Share2 className="w-3 h-3" /> مشاركة التطبيق
          </Button>
          <Button variant="outline" size="sm" className="font-arabic text-xs gap-1" onClick={handleExport}>
            <Download className="w-3 h-3" /> تصدير الكل
          </Button>
          <Button variant="outline" size="sm" className="font-arabic text-xs gap-1" onClick={() => fileInputRef.current?.click()}>
            <Upload className="w-3 h-3" /> استيراد
          </Button>
          <input ref={fileInputRef} type="file" accept=".json,.txt" className="hidden" onChange={handleImportFile} />
          <Button size="sm" className="font-arabic text-xs gap-1" onClick={handleAdd}>
            <Plus className="w-3 h-3" /> إضافة اتصال
          </Button>
        </div>
      </div>

      {/* Warning if no active connection */}
      {!activeConnection && connections.length > 0 && (
        <div className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-amber-400/10 border border-amber-400/30">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="text-xs text-amber-300 font-arabic">
            لا يوجد اتصال نشط — يرجى تفعيل اتصال واحد على الأقل لتشغيل عمليات التوليد
          </span>
        </div>
      )}

      {/* Search */}
      {connections.length > 3 && (
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="بحث في الاتصالات..."
              className="pr-9 font-arabic"
              dir="rtl"
            />
          </div>
        </div>
      )}

      {/* Connection list */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <LinkIcon className="w-12 h-12 mb-3 opacity-20" />
          <p className="text-sm font-arabic mb-1">
            {search ? 'لا توجد نتائج' : 'لا توجد اتصالات بعد'}
          </p>
          <p className="text-xs font-arabic">
            {search ? 'غيّر كلمات البحث' : 'اضغط "إضافة اتصال" لبدء الإعداد'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(conn => (
            <IntegrationCard
              key={conn.id}
              connection={conn}
              isActive={activeConnection?.id === conn.id}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onActivate={activateConnection}
              onTest={handleTest}
            />
          ))}
        </div>
      )}

      {/* Limits info */}
      {connections.length > 0 && (
        <p className="text-xs text-muted-foreground font-arabic mt-4 text-center">
          {connections.length} / 1000 اتصال
        </p>
      )}

      {/* Form dialog */}
      <IntegrationForm
        open={formOpen}
        editData={editData}
        onSave={handleSave}
        onClose={() => setFormOpen(false)}
      />

      {/* Test dialog */}
      <IntegrationTestDialog
        open={testOpen}
        connection={testTarget}
        onTest={testConnection}
        onClose={() => setTestOpen(false)}
      />
    </div>
  );
}
