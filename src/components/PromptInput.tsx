import React, { useState, useEffect } from 'react';
import { Save, FolderOpen, Search, Download, Edit2, Trash2, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { toast } from 'sonner';
import type { SavedPrompt } from '@/types/types';
import {
  loadSavedPrompts,
  loadSavedPromptsAsync,
  savePrompt,
  updatePrompt,
  deletePrompt,
} from '@/services/promptStorage';

const MAX_CHARS = 10000;

interface PromptInputProps {
  value: string;
  onChange: (v: string) => void;
}

export default function PromptInput({ value, onChange }: PromptInputProps) {
  const [savedPrompts, setSavedPrompts] = useState<SavedPrompt[]>(loadSavedPrompts);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editText, setEditText] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // تحميل البرومبتات من ملف الجهاز عند بدء التطبيق (pywebview)
  useEffect(() => {
    loadSavedPromptsAsync().then(prompts => {
      setSavedPrompts(prompts);
    }).catch(console.error);
  }, []);

  const remaining = MAX_CHARS - value.length;
  const overLimit = value.length > MAX_CHARS;

  const refresh = () => setSavedPrompts(loadSavedPrompts());

  const handleSave = () => {
    if (!saveName.trim()) { toast.error('أدخل اسماً للبرومبت'); return; }
    if (!value.trim()) { toast.error('البرومبت فارغ'); return; }
    savePrompt(saveName.trim(), value);
    refresh();
    setSaveDialogOpen(false);
    setSaveName('');
    toast.success(`تم حفظ البرومبت "${saveName.trim()}"`);
  };

  const handleLoad = (prompt: SavedPrompt) => {
    onChange(prompt.text);
    setDrawerOpen(false);
    toast.success(`تم تحميل البرومبت "${prompt.name}"`);
  };

  const startEdit = (prompt: SavedPrompt) => {
    setEditingId(prompt.id);
    setEditName(prompt.name);
    setEditText(prompt.text);
  };

  const confirmEdit = (id: string) => {
    if (!editName.trim()) { toast.error('الاسم مطلوب'); return; }
    updatePrompt(id, { name: editName.trim(), text: editText });
    refresh();
    setEditingId(null);
    toast.success('تم تحديث البرومبت');
  };

  const confirmDelete = () => {
    if (!deleteId) return;
    const p = savedPrompts.find(x => x.id === deleteId);
    deletePrompt(deleteId);
    refresh();
    setDeleteId(null);
    toast.success(`تم حذف "${p?.name}"`);
  };

  const filtered = savedPrompts.filter(p =>
    !searchQuery ||
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="card-dark rounded-xl p-6 mb-6">
      <h2 className="text-lg font-bold text-foreground mb-4 font-arabic">
        البرومبت
      </h2>

      {/* Textarea */}
      <div className="relative">
        <Textarea
          value={value}
          onChange={e => onChange(e.target.value.slice(0, MAX_CHARS))}
          placeholder="اكتب وصفاً تفصيلياً للصورة التي تريد توليدها..."
          className="min-h-40 resize-none font-arabic text-base leading-relaxed bg-input border-border focus:border-primary transition-colors px-4 py-3 placeholder:text-muted-foreground/60"
          dir="rtl"
        />
        <div className={`absolute bottom-3 left-3 text-xs font-mono ${overLimit ? 'text-destructive' : remaining < 500 ? 'text-amber-400' : 'text-muted-foreground'}`}>
          {value.length.toLocaleString('ar')} / {MAX_CHARS.toLocaleString('ar')} حرف
        </div>
      </div>

      {/* Character warning */}
      {overLimit && (
        <p className="text-xs text-destructive mt-1 font-arabic">تجاوزت الحد الأقصى للأحرف</p>
      )}

      {/* Action buttons */}
      <div className="flex gap-3 mt-4 flex-wrap">
        <Button
          variant="outline"
          className="gap-2 font-arabic border-primary/50 text-primary hover:bg-primary/10 hover:border-primary"
          onClick={() => { setSaveDialogOpen(true); setSaveName(''); }}
          disabled={!value.trim()}
        >
          <Save className="w-4 h-4" />
          حفظ البرومبت
        </Button>
        <Button
          variant="outline"
          className="gap-2 font-arabic border-border hover:bg-secondary/80"
          onClick={() => setDrawerOpen(true)}
        >
          <FolderOpen className="w-4 h-4" />
          البرومبتات المحفوظة
          {savedPrompts.length > 0 && (
            <span className="bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {savedPrompts.length}
            </span>
          )}
        </Button>
      </div>

      {/* Save dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-arabic">حفظ البرومبت</DialogTitle>
            <DialogDescription className="font-arabic">أدخل اسماً لتعريف هذا البرومبت</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <Input
              value={saveName}
              onChange={e => setSaveName(e.target.value)}
              placeholder="اسم البرومبت..."
              className="font-arabic px-3"
              dir="rtl"
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setSaveDialogOpen(false)} className="font-arabic">
                إلغاء
              </Button>
              <Button onClick={handleSave} className="font-arabic gap-2">
                <Save className="w-4 h-4" />
                حفظ
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Saved prompts drawer (right side) */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="right" className="w-full max-w-md bg-sidebar border-sidebar-border p-0 flex flex-col">
          <SheetHeader className="px-5 py-4 border-b border-sidebar-border">
            <SheetTitle className="font-arabic flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-primary" />
              البرومبتات المحفوظة
              <span className="text-sm font-normal text-muted-foreground">({savedPrompts.length})</span>
            </SheetTitle>
          </SheetHeader>

          {/* Search */}
          <div className="px-5 py-3 border-b border-sidebar-border">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="بحث في البرومبتات..."
                className="pr-9 font-arabic bg-input border-border px-3"
                dir="rtl"
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                <FolderOpen className="w-10 h-10 mb-2 opacity-30" />
                <p className="text-sm font-arabic">
                  {searchQuery ? 'لا توجد نتائج' : 'لا توجد برومبتات محفوظة بعد'}
                </p>
              </div>
            ) : (
              filtered.map(prompt => (
                <PromptCard
                  key={prompt.id}
                  prompt={prompt}
                  isEditing={editingId === prompt.id}
                  editName={editName}
                  editText={editText}
                  onEditNameChange={setEditName}
                  onEditTextChange={setEditText}
                  onStartEdit={() => startEdit(prompt)}
                  onConfirmEdit={() => confirmEdit(prompt.id)}
                  onCancelEdit={() => setEditingId(null)}
                  onLoad={() => handleLoad(prompt)}
                  onDelete={() => setDeleteId(prompt.id)}
                />
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-sm bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-arabic">تأكيد الحذف</DialogTitle>
            <DialogDescription className="font-arabic">
              هل أنت متأكد من حذف هذا البرومبت؟ لا يمكن التراجع عن هذا الإجراء.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end mt-4">
            <Button variant="outline" onClick={() => setDeleteId(null)} className="font-arabic">
              إلغاء
            </Button>
            <Button variant="destructive" onClick={confirmDelete} className="font-arabic gap-2">
              <Trash2 className="w-4 h-4" />
              حذف
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PromptCard({
  prompt,
  isEditing, editName, editText,
  onEditNameChange, onEditTextChange,
  onStartEdit, onConfirmEdit, onCancelEdit,
  onLoad, onDelete,
}: {
  prompt: SavedPrompt;
  isEditing: boolean;
  editName: string;
  editText: string;
  onEditNameChange: (v: string) => void;
  onEditTextChange: (v: string) => void;
  onStartEdit: () => void;
  onConfirmEdit: () => void;
  onCancelEdit: () => void;
  onLoad: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-3 animate-fade-in">
      {isEditing ? (
        <>
          <Input
            value={editName}
            onChange={e => onEditNameChange(e.target.value)}
            className="font-arabic text-sm font-semibold bg-input px-3"
            dir="rtl"
            placeholder="اسم البرومبت"
          />
          <Textarea
            value={editText}
            onChange={e => onEditTextChange(e.target.value)}
            className="font-arabic text-sm bg-input resize-none h-24 px-3 py-2"
            dir="rtl"
          />
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="outline" onClick={onCancelEdit} className="gap-1 font-arabic h-8 text-xs">
              <X className="w-3 h-3" /> إلغاء
            </Button>
            <Button size="sm" onClick={onConfirmEdit} className="gap-1 font-arabic h-8 text-xs">
              <Check className="w-3 h-3" /> حفظ
            </Button>
          </div>
        </>
      ) : (
        <>
          <div>
            <h3 className="text-sm font-semibold text-foreground font-arabic truncate">{prompt.name}</h3>
            <p className="text-xs text-muted-foreground font-arabic mt-1 line-clamp-2 leading-relaxed">
              {prompt.text.slice(0, 100)}{prompt.text.length > 100 ? '...' : ''}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              size="sm"
              className="gap-1 font-arabic h-8 text-xs flex-1"
              onClick={onLoad}
            >
              <Download className="w-3 h-3" />
              تحميل
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1 font-arabic h-8 text-xs border-border"
              onClick={onStartEdit}
            >
              <Edit2 className="w-3 h-3" />
              تعديل
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1 font-arabic h-8 text-xs border-destructive/50 text-destructive hover:bg-destructive/10"
              onClick={onDelete}
            >
              <Trash2 className="w-3 h-3" />
              حذف
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
