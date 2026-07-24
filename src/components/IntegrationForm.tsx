import React, { useState } from 'react';
import { Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import type { IntegrationData } from '@/types/integration';

interface IntegrationFormProps {
  open: boolean;
  editData: IntegrationData | null;
  onSave: (data: Omit<IntegrationData, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onClose: () => void;
}

const EMPTY: Omit<IntegrationData, 'id' | 'createdAt' | 'updatedAt'> = {
  name: '',
  architectureType: 'direct',
  baseUrl: '',
  appId: '',
  genModel: '',
  visionModel: '',
  genKey: '',
  visionKey: '',
  headerKey: 'X-App-Id',
  headerValue: '',
  submitUrl: '',
  queryUrl: '',
};

export default function IntegrationForm({ open, editData, onSave, onClose }: IntegrationFormProps) {
  const [form, setForm] = useState<Omit<IntegrationData, 'id' | 'createdAt' | 'updatedAt'>>(
    editData ?? EMPTY
  );

  React.useEffect(() => {
    if (open) setForm(editData ?? EMPTY);
  }, [open, editData]);

  const set = (key: string, val: string) => setForm(p => ({ ...p, [key]: val }));

  const handleSave = () => {
    if (!form.name.trim()) { toast.error('اسم الاتصال مطلوب'); return; }
    if (!form.baseUrl.trim()) { toast.error('الرابط الأساسي مطلوب'); return; }
    if (!form.genKey.trim()) { toast.error('مفتاح التوليد مطلوب'); return; }
    if (!form.visionKey.trim()) { toast.error('مفتاح الرؤية مطلوب'); return; }
    onSave(form);
    toast.success(editData ? 'تم تحديث الاتصال' : 'تم إضافة الاتصال');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-[calc(100%-1rem)] md:max-w-2xl max-h-[90dvh] overflow-y-auto p-4 md:p-6" dir="rtl">
        <DialogHeader>
          <DialogTitle className="font-arabic text-right">
            {editData ? 'تعديل الاتصال' : 'إضافة اتصال جديد'}
          </DialogTitle>
          <DialogDescription className="font-arabic">
            أدخل بيانات الاتصال بالـ API
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <Field label="اسم الاتصال" value={form.name} onChange={v => set('name', v)} placeholder="مثال: المساعد الذكي" required />
          <div>
            <Label className="font-arabic text-xs mb-1 block">نوع المعمارية</Label>
            <select
              value={form.architectureType}
              onChange={e => set('architectureType', e.target.value)}
              className="w-full h-9 rounded-md border border-border bg-input px-3 text-sm font-arabic"
            >
              <option value="direct">مباشر (Direct)</option>
              <option value="through-proxy">عبر بروكسي (Through Proxy)</option>
            </select>
          </div>
          <Field label="الرابط الأساسي (Base URL)" value={form.baseUrl} onChange={v => set('baseUrl', v)} placeholder="https://api-integrations.example.com/app-xxx" required full />
          <Field label="معرف التطبيق (App ID)" value={form.appId} onChange={v => set('appId', v)} placeholder="app-xxxxxx" required />
          <Field label="نموذج التوليد (Gen Model)" value={form.genModel} onChange={v => set('genModel', v)} placeholder="api-xxx/v1beta/models/..." required full />
          <Field label="نموذج الرؤية (Vision Model)" value={form.visionModel} onChange={v => set('visionModel', v)} placeholder="api-xxx/v1beta/models/..." required full />
          <Field label="مفتاح التوليد (Gen Key)" value={form.genKey} onChange={v => set('genKey', v)} placeholder="URL كامل للتوليد" required full />
          <Field label="مفتاح الرؤية (Vision Key)" value={form.visionKey} onChange={v => set('visionKey', v)} placeholder="URL كامل للاستعلام" required full />
          <Field label="اسم الهيدر (Header Key)" value={form.headerKey} onChange={v => set('headerKey', v)} placeholder="X-App-Id" required />
          <Field label="قيمة الهيدر (Header Value)" value={form.headerValue} onChange={v => set('headerValue', v)} placeholder="app-xxxxxx" required />
          <Field label="رابط الإرسال البديل (اختياري)" value={form.submitUrl ?? ''} onChange={v => set('submitUrl', v)} placeholder="اتركه فارغاً لاستخدام genKey" full />
          <Field label="رابط الاستعلام البديل (اختياري)" value={form.queryUrl ?? ''} onChange={v => set('queryUrl', v)} placeholder="اتركه فارغاً لاستخدام visionKey" full />
        </div>

        <div className="flex gap-2 justify-end mt-6">
          <Button variant="outline" onClick={onClose} className="font-arabic gap-1">
            <X className="w-4 h-4" /> إلغاء
          </Button>
          <Button onClick={handleSave} className="font-arabic gap-1">
            <Save className="w-4 h-4" /> {editData ? 'تحديث' : 'حفظ'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label, value, onChange, placeholder, required, full,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  full?: boolean;
}) {
  return (
    <div className={full ? 'md:col-span-2' : ''}>
      <Label className="font-arabic text-xs mb-1 block">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <Input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="font-arabic text-sm h-9"
        dir="ltr"
      />
    </div>
  );
}
