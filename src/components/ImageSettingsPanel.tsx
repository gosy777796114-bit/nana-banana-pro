import React from 'react';
import { Settings2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ImageSettings } from '@/types/types';
import { DIMENSION_PRESETS, QUALITY_OPTIONS } from '@/services/imageGeneration';

interface ImageSettingsProps {
  settings: ImageSettings;
  onSettingsChange: (s: ImageSettings) => void;
}

export default function ImageSettingsPanel({ settings, onSettingsChange }: ImageSettingsProps) {
  const isCustom = settings.dimensionPreset === 'custom';

  return (
    <div className="card-dark rounded-xl p-6 mb-6">
      <h2 className="text-lg font-bold text-foreground mb-5 font-arabic flex items-center gap-2">
        <Settings2 className="w-5 h-5 text-primary" />
        إعدادات الصورة
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Dimension selector */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-foreground font-arabic">الأبعاد</Label>
          <Select
            value={settings.dimensionPreset}
            onValueChange={v => onSettingsChange({ ...settings, dimensionPreset: v })}
          >
            <SelectTrigger className="font-arabic bg-input border-border h-11 px-3">
              <SelectValue placeholder="اختر الأبعاد" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border font-arabic">
              {DIMENSION_PRESETS.map(preset => (
                <SelectItem key={preset.value} value={preset.value} className="font-arabic">
                  {preset.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Custom dimensions */}
          {isCustom && (
            <div className="flex items-center gap-2 mt-3 animate-fade-in">
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground font-arabic mb-1 block">العرض (px)</Label>
                <Input
                  type="number"
                  value={settings.customWidth}
                  onChange={e => onSettingsChange({ ...settings, customWidth: Math.max(64, parseInt(e.target.value) || 64) })}
                  className="bg-input border-border font-mono text-sm px-3 h-10"
                  min={64}
                  max={32768}
                  dir="ltr"
                />
              </div>
              <span className="text-muted-foreground mt-5">×</span>
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground font-arabic mb-1 block">الارتفاع (px)</Label>
                <Input
                  type="number"
                  value={settings.customHeight}
                  onChange={e => onSettingsChange({ ...settings, customHeight: Math.max(64, parseInt(e.target.value) || 64) })}
                  className="bg-input border-border font-mono text-sm px-3 h-10"
                  min={64}
                  max={32768}
                  dir="ltr"
                />
              </div>
            </div>
          )}

          {/* Preview */}
          {!isCustom && (
            <DimensionPreview preset={settings.dimensionPreset} />
          )}
        </div>

        {/* Quality selector */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-foreground font-arabic">الجودة</Label>
          <Select
            value={settings.quality}
            onValueChange={v => onSettingsChange({ ...settings, quality: v })}
          >
            <SelectTrigger className="font-arabic bg-input border-border h-11 px-3">
              <SelectValue placeholder="اختر الجودة" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border font-arabic">
              {QUALITY_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value} className="font-arabic">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Quality description */}
          <QualityDescription quality={settings.quality} />
        </div>
      </div>

      {/* Summary bar */}
      <div className="mt-5 bg-secondary/40 rounded-lg px-4 py-3 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground font-arabic">الأبعاد الفعلية:</span>
          <span className="text-primary font-mono font-semibold">
            {isCustom
              ? `${settings.customWidth}×${settings.customHeight}`
              : (() => {
                  const p = DIMENSION_PRESETS.find(x => x.value === settings.dimensionPreset);
                  return p ? `${p.width}×${p.height}` : '—';
                })()
            }
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground font-arabic">الجودة:</span>
          <span className="text-primary font-semibold">
            {QUALITY_OPTIONS.find(q => q.value === settings.quality)?.label ?? '—'}
          </span>
        </div>
      </div>
    </div>
  );
}

function DimensionPreview({ preset }: { preset: string }) {
  const p = DIMENSION_PRESETS.find(x => x.value === preset);
  if (!p) return null;

  const maxBox = 80;
  const ratio = p.width / p.height;
  let w: number, h: number;
  if (ratio >= 1) { w = maxBox; h = Math.round(maxBox / ratio); }
  else { h = maxBox; w = Math.round(maxBox * ratio); }

  return (
    <div className="flex items-center gap-3 mt-2">
      <div
        className="border-2 border-primary/60 bg-primary/10 rounded flex items-center justify-center"
        style={{ width: w, height: h, minWidth: 20, minHeight: 20 }}
        title={`${p.width}×${p.height}`}
      >
        <span className="text-primary text-xs font-mono" style={{ fontSize: 9 }}>
          {p.width}×{p.height}
        </span>
      </div>
    </div>
  );
}

function QualityDescription({ quality }: { quality: string }) {
  const descriptions: Record<string, string> = {
    '2K':  'جودة عالية مناسبة للشاشات المعيارية',
    '4K':  'جودة ممتازة للشاشات عالية الدقة',
    '8K':  'جودة فائقة للطباعة والعروض الاحترافية',
    '16K': 'أعلى جودة ممكنة، مناسبة للطباعة الكبيرة',
  };
  const desc = descriptions[quality];
  if (!desc) return null;
  return (
    <p className="text-xs text-muted-foreground font-arabic mt-1">{desc}</p>
  );
}
