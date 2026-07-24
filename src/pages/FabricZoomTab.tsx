// FabricZoomTab — زوم الأقمشة
// DEV LOG:
// [1] تبويب زوم الأقمشة — Canvas بدون AI
// [2] زووم حقيقي drawImage crop/scale
// [3] imageSmoothingQuality=high — PNG أصلي
// [4] رفع جماعي 1-8 صور، اختيار رئيسية، زووم مستقل، ترقيم
// [5] منتقي منطقة الزووم اليدوي: رسم مستطيل بالسحب على الصورة
//     لتحديد المنطقة المراد تكبيرها — customCrop مستقل لكل صورة

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Upload, X, RefreshCw, Code2, Bug, Copy, FileText,
  Zap, CheckCircle2, Download, Sparkles, AlertTriangle,
  Info, Star, Crosshair, Trash2, MoveRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { formatBytes } from '@/services/imageGeneration';

// ── Constants ─────────────────────────────────────────────────────
const MAX_IMAGES = 8;
const GAP        = 16;
const LABEL_H    = 36;

// ── RAM / Canvas guards ───────────────────────────────────────────
// Files > HEAVY_FILE_THRESHOLD use createImageBitmap to decode at a
// safe resolution, keeping the full multi-hundred-MB image out of JS heap.
const HEAVY_FILE_THRESHOLD = 50 * 1024 * 1024;   // 50 MB
const FABRIC_HEAVY_MAX_DIM = 4096;                 // px on longest side

// Canvas pixel budget: ~128 MB at 4 bytes/px → 32 MP
const MAX_CANVAS_PIXELS = 32_000_000;

// ── Layout types ──────────────────────────────────────────────────
type LayoutId = 'top-strip' | 'left-right' | 'right-left' | 'center-surround' | 'grid' | 'pyramid';
type DiagramProps = { selected: boolean; mainNum: number; thumbNums: number[] };

// ── Diagram SVGs ──────────────────────────────────────────────────
function DiagramTopStrip({ selected, mainNum, thumbNums }: DiagramProps) {
  const s = selected ? 'stroke-primary' : 'stroke-muted-foreground';
  const f = selected ? 'fill-primary/10' : 'fill-muted/30';
  const tc = selected ? 'fill-primary' : 'fill-muted-foreground';
  return (
    <svg viewBox="0 0 100 80" className="w-full h-full">
      <rect x="5" y="5" width="90" height="46" rx="2" className={`${f} ${s}`} strokeWidth="1.5" />
      <text x="50" y="28" textAnchor="middle" fontSize="6" className={tc}>Main</text>
      <text x="50" y="38" textAnchor="middle" fontSize="9" fontWeight="bold" className={tc}>#{mainNum}</text>
      {thumbNums.slice(0,4).map((n,i)=>(
        <g key={i}><rect x={5+i*24} y="58" width="20" height="17" rx="1" className={`${f} ${s}`} strokeWidth="1"/>
        <text x={5+i*24+10} y="69" textAnchor="middle" fontSize="7" fontWeight="bold" className={tc}>#{n}</text></g>
      ))}
    </svg>
  );
}
function DiagramLeftRight({ selected, mainNum, thumbNums }: DiagramProps) {
  const s = selected ? 'stroke-primary' : 'stroke-muted-foreground';
  const f = selected ? 'fill-primary/10' : 'fill-muted/30';
  const tc = selected ? 'fill-primary' : 'fill-muted-foreground';
  return (
    <svg viewBox="0 0 100 80" className="w-full h-full">
      <rect x="5" y="5" width="58" height="70" rx="2" className={`${f} ${s}`} strokeWidth="1.5"/>
      <text x="34" y="38" textAnchor="middle" fontSize="6" className={tc}>Main</text>
      <text x="34" y="49" textAnchor="middle" fontSize="9" fontWeight="bold" className={tc}>#{mainNum}</text>
      {thumbNums.slice(0,4).map((n,i)=>(
        <g key={i}><rect x="68" y={5+i*18} width="27" height="14" rx="1" className={`${f} ${s}`} strokeWidth="1"/>
        <text x="81" y={5+i*18+9} textAnchor="middle" fontSize="7" fontWeight="bold" className={tc}>#{n}</text></g>
      ))}
    </svg>
  );
}
function DiagramRightLeft({ selected, mainNum, thumbNums }: DiagramProps) {
  const s = selected ? 'stroke-primary' : 'stroke-muted-foreground';
  const f = selected ? 'fill-primary/10' : 'fill-muted/30';
  const tc = selected ? 'fill-primary' : 'fill-muted-foreground';
  return (
    <svg viewBox="0 0 100 80" className="w-full h-full">
      <rect x="37" y="5" width="58" height="70" rx="2" className={`${f} ${s}`} strokeWidth="1.5"/>
      <text x="66" y="38" textAnchor="middle" fontSize="6" className={tc}>Main</text>
      <text x="66" y="49" textAnchor="middle" fontSize="9" fontWeight="bold" className={tc}>#{mainNum}</text>
      {thumbNums.slice(0,4).map((n,i)=>(
        <g key={i}><rect x="5" y={5+i*18} width="27" height="14" rx="1" className={`${f} ${s}`} strokeWidth="1"/>
        <text x="18" y={5+i*18+9} textAnchor="middle" fontSize="7" fontWeight="bold" className={tc}>#{n}</text></g>
      ))}
    </svg>
  );
}
function DiagramCenterSurround({ selected, mainNum, thumbNums }: DiagramProps) {
  const s = selected ? 'stroke-primary' : 'stroke-muted-foreground';
  const f = selected ? 'fill-primary/10' : 'fill-muted/30';
  const tc = selected ? 'fill-primary' : 'fill-muted-foreground';
  return (
    <svg viewBox="0 0 100 80" className="w-full h-full">
      <rect x="22" y="5" width="56" height="44" rx="2" className={`${f} ${s}`} strokeWidth="1.5"/>
      <text x="50" y="24" textAnchor="middle" fontSize="6" className={tc}>Main</text>
      <text x="50" y="36" textAnchor="middle" fontSize="9" fontWeight="bold" className={tc}>#{mainNum}</text>
      {thumbNums.slice(0,4).map((n,i)=>(
        <g key={i}><rect x={4+i*24} y="56" width="19" height="19" rx="1" className={`${f} ${s}`} strokeWidth="1"/>
        <text x={4+i*24+9} y="68" textAnchor="middle" fontSize="7" fontWeight="bold" className={tc}>#{n}</text></g>
      ))}
    </svg>
  );
}
function DiagramGrid({ selected, mainNum, thumbNums }: DiagramProps) {
  const s = selected ? 'stroke-primary' : 'stroke-muted-foreground';
  const f = selected ? 'fill-primary/10' : 'fill-muted/30';
  const tc = selected ? 'fill-primary' : 'fill-muted-foreground';
  return (
    <svg viewBox="0 0 100 80" className="w-full h-full">
      <rect x="5" y="5" width="44" height="35" rx="2" className={`${f} ${s}`} strokeWidth="1.5"/>
      <text x="27" y="20" textAnchor="middle" fontSize="6" className={tc}>Main</text>
      <text x="27" y="32" textAnchor="middle" fontSize="8" fontWeight="bold" className={tc}>#{mainNum}</text>
      {thumbNums.slice(0,1).map((n)=>(
        <g key={0}><rect x="54" y="5" width="41" height="35" rx="1" className={`${f} ${s}`} strokeWidth="1"/>
        <text x="74" y="27" textAnchor="middle" fontSize="7" fontWeight="bold" className={tc}>#{n}</text></g>
      ))}
      {thumbNums.slice(0,3).map((n,i)=>(
        <g key={i+1}><rect x={5+i*32} y="46" width="28" height="29" rx="1" className={`${f} ${s}`} strokeWidth="1"/>
        <text x={5+i*32+14} y="63" textAnchor="middle" fontSize="7" fontWeight="bold" className={tc}>#{n}</text></g>
      ))}
    </svg>
  );
}
function DiagramPyramid({ selected, mainNum, thumbNums }: DiagramProps) {
  const s = selected ? 'stroke-primary' : 'stroke-muted-foreground';
  const f = selected ? 'fill-primary/10' : 'fill-muted/30';
  const tc = selected ? 'fill-primary' : 'fill-muted-foreground';
  return (
    <svg viewBox="0 0 100 80" className="w-full h-full">
      <rect x="22" y="5" width="56" height="36" rx="2" className={`${f} ${s}`} strokeWidth="1.5"/>
      <text x="50" y="20" textAnchor="middle" fontSize="6" className={tc}>Main</text>
      <text x="50" y="32" textAnchor="middle" fontSize="8" fontWeight="bold" className={tc}>#{mainNum}</text>
      {thumbNums.slice(0,3).map((n,i)=>(
        <g key={i}><rect x={5+i*32} y="48" width="27" height="27" rx="1" className={`${f} ${s}`} strokeWidth="1"/>
        <text x={5+i*32+13} y="64" textAnchor="middle" fontSize="7" fontWeight="bold" className={tc}>#{n}</text></g>
      ))}
    </svg>
  );
}

const LAYOUT_DEFS = [
  { id: 'top-strip'       as LayoutId, nameAr: 'الكبيرة أعلى + شريط الصور أسفل',       Diagram: DiagramTopStrip },
  { id: 'left-right'      as LayoutId, nameAr: 'الكبيرة يسار + الصور يمين عمودياً',    Diagram: DiagramLeftRight },
  { id: 'right-left'      as LayoutId, nameAr: 'الكبيرة يمين + الصور يسار عمودياً',    Diagram: DiagramRightLeft },
  { id: 'center-surround' as LayoutId, nameAr: 'الكبيرة في المنتصف + الصور حولها',     Diagram: DiagramCenterSurround },
  { id: 'grid'            as LayoutId, nameAr: 'شبكة (Grid)',                            Diagram: DiagramGrid },
  { id: 'pyramid'         as LayoutId, nameAr: 'هرمي (Pyramid)',                         Diagram: DiagramPyramid },
];

// ── Types ─────────────────────────────────────────────────────────
interface CropRect { sx: number; sy: number; sw: number; sh: number; }

interface FabricFile {
  id: number;
  file: File;
  previewUrl: string;
  imgEl: HTMLImageElement;
  sizeBytes: number;
  zoom: number;
  customCrop: CropRect | null; // null = auto zone distribution
}

interface ZoomError { message: string; detail: string; time: string; fn?: string; }
function nowStr() {
  return new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// ── Canvas helpers ────────────────────────────────────────────────

/**
 * Returns [scaledW, scaledH] ensuring width×height ≤ MAX_CANVAS_PIXELS.
 * Preserves aspect ratio. Used as a hard safety net before canvas allocation.
 */
function safeCanvasDims(w: number, h: number): [number, number] {
  const px = w * h;
  if (px <= MAX_CANVAS_PIXELS) return [w, h];
  const scale = Math.sqrt(MAX_CANVAS_PIXELS / px);
  return [Math.max(1, Math.round(w * scale)), Math.max(1, Math.round(h * scale))];
}

function getAutoCrop(iw: number, ih: number, zoom: number, zoneIdx: number, totalZones: number): CropRect {
  const factor = Math.max(zoom / 100, 1);
  const sw = Math.max(4, Math.round(iw / factor));
  const sh = Math.max(4, Math.round(ih / factor));
  if (factor <= 1.01 || totalZones <= 1) {
    return { sx: Math.max(0, Math.round((iw-sw)/2)), sy: Math.max(0, Math.round((ih-sh)/2)), sw: Math.min(sw, iw), sh: Math.min(sh, ih) };
  }
  const cols = Math.ceil(Math.sqrt(totalZones));
  const rows = Math.ceil(totalZones / cols);
  const cx = (iw/cols)*(zoneIdx%cols) + (iw/cols)/2;
  const cy = (ih/rows)*Math.floor(zoneIdx/cols) + (ih/rows)/2;
  const sx = Math.max(0, Math.min(iw-sw, Math.round(cx-sw/2)));
  const sy = Math.max(0, Math.min(ih-sh, Math.round(cy-sh/2)));
  return { sx, sy, sw: Math.min(sw, iw-sx), sh: Math.min(sh, ih-sy) };
}

function drawPanel(
  ctx: CanvasRenderingContext2D,
  imgEl: HTMLImageElement,
  crop: CropRect,
  dx: number, dy: number, dw: number, dh: number,
  label: string,
) {
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(imgEl, crop.sx, crop.sy, crop.sw, crop.sh, dx, dy, dw, dh - LABEL_H);
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.80)';
  ctx.fillRect(dx, dy + dh - LABEL_H, dw, LABEL_H);
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${Math.max(13, Math.round(dw/11))}px Arial, sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(label, dx + dw/2, dy + dh - LABEL_H/2);
  ctx.restore();
}

async function buildComposite(fabrics: FabricFile[], mainIdx: number, layout: LayoutId): Promise<string> {
  const main   = fabrics[mainIdx];
  const thumbs = fabrics.filter((_, i) => i !== mainIdx);
  const iw = main.imgEl.naturalWidth, ih = main.imgEl.naturalHeight;
  const thumbW = Math.max(400, Math.min(800, Math.round(iw/3)));
  const thumbH = Math.round(ih * (thumbW/iw));
  const canvas = document.createElement('canvas');
  const ctx    = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  const bg = '#111111';
  const n = thumbs.length;

  // resolve crop — custom beats auto
  const resolveCrop = (f: FabricFile, zoneIdx: number, total: number): CropRect =>
    f.customCrop ?? getAutoCrop(f.imgEl.naturalWidth, f.imgEl.naturalHeight, f.zoom, zoneIdx, total);

  const mainCrop  = resolveCrop(main, 0, 1);
  const mainLabel = main.customCrop
    ? `#${main.id} (يدوي)`
    : main.zoom <= 100 ? `#${main.id} (الأصل)` : `#${main.id} Zoom ${main.zoom}%`;

  const dm = (dx:number, dy:number, dw:number, dh:number) => drawPanel(ctx, main.imgEl, mainCrop, dx, dy, dw, dh, mainLabel);
  const dt = (t: FabricFile, zi: number, total: number, dx:number, dy:number, dw:number, dh:number) => {
    const crop = resolveCrop(t, zi, total);
    const lbl  = t.customCrop ? `#${t.id} (يدوي)` : t.zoom<=100 ? `#${t.id}` : `#${t.id} Zoom ${t.zoom}%`;
    drawPanel(ctx, t.imgEl, crop, dx, dy, dw, dh, lbl);
  };

  // ── Compute raw canvas dimensions per layout ──────────────────
  let rawW: number, rawH: number;

  if (layout === 'top-strip') {
    rawW = iw; rawH = ih + GAP + thumbH;
  } else if (layout === 'left-right') {
    rawW = iw + GAP + thumbW; rawH = Math.max(ih, n * thumbH + Math.max(0, n-1) * GAP);
  } else if (layout === 'right-left') {
    rawW = thumbW + GAP + iw; rawH = Math.max(ih, n * thumbH + Math.max(0, n-1) * GAP);
  } else if (layout === 'center-surround') {
    rawW = Math.max(iw, n * thumbW + Math.max(0, n-1) * GAP); rawH = ih + GAP + thumbH;
  } else if (layout === 'grid') {
    const total = fabrics.length, cols = Math.ceil(Math.sqrt(total)), rows = Math.ceil(total/cols);
    rawW = cols * Math.round(iw/cols) + GAP*(cols-1);
    rawH = rows * Math.round(ih/rows) + GAP*(rows-1);
  } else {
    rawW = iw; rawH = ih + (n > 0 ? GAP + thumbH : 0);
  }

  // ── Apply RAM guard: scale down if over MAX_CANVAS_PIXELS ─────
  const [cw, ch] = safeCanvasDims(rawW, rawH);
  const CS = cw / rawW; // canvas scale (≤1.0)

  // Scale all dimension constants by CS
  const siw   = Math.round(iw   * CS), sih   = Math.round(ih   * CS);
  const sTW   = Math.round(thumbW * CS), sTH = Math.round(thumbH * CS);
  const sGAP  = Math.max(1, Math.round(GAP * CS));

  canvas.width = cw; canvas.height = ch;
  ctx.fillStyle = bg; ctx.fillRect(0, 0, cw, ch);

  // ── Draw layout using scaled dimensions ───────────────────────
  // Wrappers that compensate for the scale factor
  const dm2 = (dx:number, dy:number, dw:number, dh:number) =>
    drawPanel(ctx, main.imgEl, mainCrop, Math.round(dx*CS), Math.round(dy*CS), Math.round(dw*CS), Math.round(dh*CS), mainLabel);
  const dt2 = (t: FabricFile, zi: number, total: number, dx:number, dy:number, dw:number, dh:number) => {
    const crop = resolveCrop(t, zi, total);
    const lbl  = t.customCrop ? `#${t.id} (يدوي)` : t.zoom<=100 ? `#${t.id}` : `#${t.id} Zoom ${t.zoom}%`;
    drawPanel(ctx, t.imgEl, crop, Math.round(dx*CS), Math.round(dy*CS), Math.round(dw*CS), Math.round(dh*CS), lbl);
  };

  if (layout === 'top-strip') {
    dm2(0, 0, iw, ih);
    if (n>0) { const tw=Math.floor((iw-GAP*(n-1))/n); thumbs.forEach((t,i)=>dt2(t,i,n,i*(tw+GAP),ih+GAP,tw,thumbH)); }
  } else if (layout === 'left-right') {
    dm2(0, 0, iw, ih);
    if (n>0) { const rh = Math.max(ih, n*thumbH+Math.max(0,n-1)*GAP); const th=Math.floor((rh-GAP*(n-1))/n); thumbs.forEach((t,i)=>dt2(t,i,n,iw+GAP,i*(th+GAP),thumbW,th)); }
  } else if (layout === 'right-left') {
    dm2(thumbW+GAP, 0, iw, ih);
    if (n>0) { const rh = Math.max(ih, n*thumbH+Math.max(0,n-1)*GAP); const th=Math.floor((rh-GAP*(n-1))/n); thumbs.forEach((t,i)=>dt2(t,i,n,0,i*(th+GAP),thumbW,th)); }
  } else if (layout === 'center-surround') {
    const totalW=Math.max(iw, n*thumbW+Math.max(0,n-1)*GAP);
    dm2(Math.round((totalW-iw)/2), 0, iw, ih);
    if (n>0) { const tw=Math.floor((totalW-GAP*(n-1))/n); thumbs.forEach((t,i)=>dt2(t,i,n,i*(tw+GAP),ih+GAP,tw,thumbH)); }
  } else if (layout === 'grid') {
    const total=fabrics.length, cols=Math.ceil(Math.sqrt(total)), rows=Math.ceil(total/cols);
    const cellW=Math.round(iw/cols), cellH=Math.round(ih/rows);
    dm2(0, 0, cellW, cellH);
    Array.from({length:cols*rows},(_,ci)=>({col:ci%cols,row:Math.floor(ci/cols)}))
      .slice(1, 1+thumbs.length)
      .forEach(({col,row},i)=>dt2(thumbs[i],i,thumbs.length,col*(cellW+GAP),row*(cellH+GAP),cellW,cellH));
  } else {
    const tw=n>0?Math.floor((iw-GAP*(n-1))/n):iw;
    dm2(0, 0, iw, ih);
    if (n>0) thumbs.forEach((t,i)=>dt2(t,i,n,i*(tw+GAP),ih+GAP,tw,thumbH));
  }

  // Suppress TS warnings for unused computed vars when CS=1
  void siw; void sih; void sTW; void sTH; void sGAP;
  void dm; void dt; // original unscaled helpers replaced by dm2/dt2

  return canvas.toDataURL('image/png');
}

// ── Crop Picker Dialog ────────────────────────────────────────────
// Shows the image; user drags to draw a selection rectangle.
// Returns the rectangle in IMAGE pixel coordinates.
interface DragState { startX: number; startY: number; endX: number; endY: number; dragging: boolean; }

interface CropPickerDialogProps {
  open: boolean;
  fabric: FabricFile | null;
  onSave: (crop: CropRect | null) => void;
  onClose: () => void;
}

function CropPickerDialog({ open, fabric, onSave, onClose }: CropPickerDialogProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<DragState>({ startX:0, startY:0, endX:0, endY:0, dragging:false });
  const [hasSel, setHasSel] = useState(false);

  // Reset on open
  useEffect(() => { if (open) { setDrag({ startX:0, startY:0, endX:0, endY:0, dragging:false }); setHasSel(false); } }, [open]);

  if (!fabric) return null;

  // Convert mouse event position to container-relative coords (clamped 0-1)
  const toRel = (e: React.MouseEvent): { rx: number; ry: number } => {
    const rect = containerRef.current!.getBoundingClientRect();
    return {
      rx: Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)),
      ry: Math.max(0, Math.min(1, (e.clientY - rect.top)  / rect.height)),
    };
  };

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const { rx, ry } = toRel(e);
    setDrag({ startX: rx, startY: ry, endX: rx, endY: ry, dragging: true });
    setHasSel(false);
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!drag.dragging) return;
    const { rx, ry } = toRel(e);
    setDrag(d => ({ ...d, endX: rx, endY: ry }));
  };
  const onMouseUp = (e: React.MouseEvent) => {
    if (!drag.dragging) return;
    const { rx, ry } = toRel(e);
    setDrag(d => ({ ...d, endX: rx, endY: ry, dragging: false }));
    setHasSel(true);
  };

  // Touch support
  const toRelTouch = (touch: React.Touch): { rx: number; ry: number } => {
    const rect = containerRef.current!.getBoundingClientRect();
    return {
      rx: Math.max(0, Math.min(1, (touch.clientX - rect.left) / rect.width)),
      ry: Math.max(0, Math.min(1, (touch.clientY - rect.top)  / rect.height)),
    };
  };
  const onTouchStart = (e: React.TouchEvent) => {
    const { rx, ry } = toRelTouch(e.touches[0]);
    setDrag({ startX: rx, startY: ry, endX: rx, endY: ry, dragging: true });
    setHasSel(false);
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (!drag.dragging) return;
    const { rx, ry } = toRelTouch(e.touches[0]);
    setDrag(d => ({ ...d, endX: rx, endY: ry }));
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const { rx, ry } = toRelTouch(e.changedTouches[0]);
    setDrag(d => ({ ...d, endX: rx, endY: ry, dragging: false }));
    setHasSel(true);
  };

  // Compute display rect (normalized, top-left origin)
  const minX = Math.min(drag.startX, drag.endX);
  const minY = Math.min(drag.startY, drag.endY);
  const maxX = Math.max(drag.startX, drag.endX);
  const maxY = Math.max(drag.startY, drag.endY);
  const selW = maxX - minX;
  const selH = maxY - minY;
  const validSel = hasSel && selW > 0.01 && selH > 0.01;

  const handleSave = () => {
    if (!validSel) { toast.error('ارسم منطقة تحديد أولاً'); return; }
    const iw = fabric.imgEl.naturalWidth, ih = fabric.imgEl.naturalHeight;

    // The container uses object-fit:contain — need to compute actual image bounds within the container
    // The image is displayed via <img object-contain> so we measure it directly
    const imgEl = containerRef.current?.querySelector('img') as HTMLImageElement | null;
    let cropBox = { minX, minY, maxX, maxY };

    if (imgEl) {
      const imgRect  = imgEl.getBoundingClientRect();
      const contRect = containerRef.current!.getBoundingClientRect();
      // image offset within container (as fraction of container)
      const imgLeft  = (imgRect.left  - contRect.left)  / contRect.width;
      const imgTop   = (imgRect.top   - contRect.top)   / contRect.height;
      const imgRight = (imgRect.right - contRect.left)  / contRect.width;
      const imgBot   = (imgRect.bottom- contRect.top)   / contRect.height;
      const imgW     = imgRight - imgLeft;
      const imgH     = imgBot   - imgTop;
      // Convert container-relative selection to image-relative
      const nx1 = (minX - imgLeft) / imgW;
      const ny1 = (minY - imgTop)  / imgH;
      const nx2 = (maxX - imgLeft) / imgW;
      const ny2 = (maxY - imgTop)  / imgH;
      cropBox = {
        minX: Math.max(0, nx1), minY: Math.max(0, ny1),
        maxX: Math.min(1, nx2), maxY: Math.min(1, ny2),
      };
    }

    const sx = Math.round(cropBox.minX * iw);
    const sy = Math.round(cropBox.minY * ih);
    const sw = Math.max(4, Math.round((cropBox.maxX - cropBox.minX) * iw));
    const sh = Math.max(4, Math.round((cropBox.maxY - cropBox.minY) * ih));
    onSave({ sx, sy, sw: Math.min(sw, iw-sx), sh: Math.min(sh, ih-sy) });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-[calc(100%-1rem)] md:max-w-3xl max-h-[90dvh] overflow-y-auto p-4" dir="rtl">
        <DialogHeader>
          <DialogTitle className="font-arabic text-right flex items-center gap-2 text-sm">
            <Crosshair className="w-4 h-4 text-primary" />
            تحديد منطقة الزووم — صورة #{fabric.id}
          </DialogTitle>
        </DialogHeader>

        <p className="text-xs text-muted-foreground font-arabic mb-3 flex items-start gap-1.5">
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-primary" />
          اسحب بالماوس أو الإصبع على الصورة لتحديد المنطقة التي تريد تكبيرها. المنطقة المحددة ستظهر بدقة كاملة في اللقطة النهائية.
        </p>

        {/* Image + selection overlay */}
        <div
          ref={containerRef}
          className="relative w-full rounded-lg overflow-hidden border-2 border-dashed border-primary/40 bg-black select-none"
          style={{ cursor: 'crosshair', touchAction: 'none' }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={e => { if (drag.dragging) onMouseUp(e); }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <img
            src={fabric.previewUrl}
            alt={`صورة ${fabric.id}`}
            className="w-full h-auto max-h-[55vh] object-contain pointer-events-none"
            draggable={false}
          />

          {/* Dark overlay with selection cut-out */}
          {(drag.dragging || hasSel) && selW > 0.005 && selH > 0.005 && (
            <div className="absolute inset-0 pointer-events-none">
              {/* Semi-dark overlay */}
              <div className="absolute inset-0 bg-black/40" />
              {/* Selection box — bright border, clear interior */}
              <div
                className="absolute border-2 border-primary shadow-[0_0_0_9999px_rgba(0,0,0,0.4)] box-content"
                style={{
                  left:   `${minX * 100}%`,
                  top:    `${minY * 100}%`,
                  width:  `${selW * 100}%`,
                  height: `${selH * 100}%`,
                  backgroundColor: 'transparent',
                  boxShadow: '0 0 0 9999px rgba(0,0,0,0.45)',
                }}
              />
              {/* Corner handles */}
              {[
                { l:`${minX*100}%`, t:`${minY*100}%`, origin:'top right'    },
                { l:`${maxX*100}%`, t:`${minY*100}%`, origin:'top left'     },
                { l:`${minX*100}%`, t:`${maxY*100}%`, origin:'bottom right' },
                { l:`${maxX*100}%`, t:`${maxY*100}%`, origin:'bottom left'  },
              ].map((h, i) => (
                <div key={i} className="absolute w-3 h-3 bg-primary rounded-sm -translate-x-1/2 -translate-y-1/2"
                  style={{ left: h.l, top: h.t }} />
              ))}
              {/* Size hint */}
              {validSel && (
                <div
                  className="absolute bg-black/80 text-white text-xs px-1.5 py-0.5 rounded font-mono pointer-events-none"
                  style={{ left: `${minX*100}%`, top: `calc(${minY*100}% - 22px)` }}
                >
                  {Math.round((maxX-minX)*fabric.imgEl.naturalWidth)} × {Math.round((maxY-minY)*fabric.imgEl.naturalHeight)} px
                </div>
              )}
            </div>
          )}
        </div>

        {/* Existing crop indicator */}
        {fabric.customCrop && (
          <div className="mt-2 flex items-center gap-2 p-2 rounded-lg bg-primary/10 border border-primary/20">
            <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="text-xs text-primary font-arabic">
              منطقة محفوظة مسبقاً: {fabric.customCrop.sw}×{fabric.customCrop.sh}px من ({fabric.customCrop.sx},{fabric.customCrop.sy})
            </span>
          </div>
        )}

        <div className="flex gap-2 flex-wrap mt-3">
          <Button className="flex-1 font-arabic gap-2 min-w-28" onClick={handleSave} disabled={!validSel}>
            <CheckCircle2 className="w-4 h-4" /> حفظ المنطقة
          </Button>
          <Button variant="outline" className="font-arabic gap-2" onClick={() => { onSave(null); onClose(); }}>
            <Trash2 className="w-4 h-4" /> مسح التحديد (تلقائي)
          </Button>
          <Button variant="ghost" className="font-arabic gap-2 text-muted-foreground" onClick={onClose}>
            إلغاء
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Dev log ───────────────────────────────────────────────────────
const DEV_LOG = [
  { label: 'رسالة 1', content: 'تبويب زوم الأقمشة — Canvas بدون AI.' },
  { label: 'رسالة 2', content: 'زووم حقيقي: drawImage(src, cropX, cropY, cropW, cropH, dstX, dstY, dstW, dstH).' },
  { label: 'رسالة 3', content: 'imageSmoothingQuality=high، تصدير PNG لا تتأثر بضغط JPEG.' },
  { label: 'رسالة 4', content: 'رفع جماعي 1-8 صور، أي حجم، اختيار رئيسية، زووم مستقل، ترقيم الإطارات.' },
  { label: 'رسالة 5', content: 'منتقي منطقة الزووم اليدوي:\n- زر "تحديد المنطقة" لكل صورة يفتح Dialog\n- المستخدم يسحب مستطيل على الصورة\n- الإحداثيات تُحوَّل لبكسل في الصورة الأصلية\n- customCrop يُخزَّن مستقلاً عن zoom\n- عند البناء: customCrop > autoCrop' },
];

// ── Main Component ────────────────────────────────────────────────
export default function FabricZoomTab() {
  const [fabrics, setFabrics]               = useState<FabricFile[]>([]);
  const [mainIdx, setMainIdx]               = useState(0);
  const [selectedLayout, setSelectedLayout] = useState<LayoutId | null>(null);
  const [dragActive, setDragActive]         = useState(false);
  const [isProcessing, setIsProcessing]     = useState(false);
  const [resultDataUrl, setResultDataUrl]   = useState<string | null>(null);
  const [errors, setErrors]                 = useState<ZoomError[]>([]);
  const [showDevLog, setShowDevLog]         = useState(false);
  const [showBugger, setShowBugger]         = useState(false);
  const [showPrompt, setShowPrompt]         = useState(false);
  const [prompt, setPrompt]                 = useState('');
  const [cropPickerIdx, setCropPickerIdx]   = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addError = useCallback((msg: string, detail: string, fn?: string) => {
    setErrors(p => [...p, { message: msg, detail, time: nowStr(), fn }]);
  }, []);

  // ── Load files ───────────────────────────────────────────────
  const loadFile = useCallback((file: File, id: number): Promise<FabricFile | null> => {
    const isHeavy = file.size > HEAVY_FILE_THRESHOLD && typeof createImageBitmap !== 'undefined';

    if (isHeavy) {
      // Heavy path: createImageBitmap decodes + resizes in one step,
      // keeping the original full-res image out of JS heap.
      return createImageBitmap(file, {
        resizeWidth: FABRIC_HEAVY_MAX_DIM,
        resizeQuality: 'high',
      } as ImageBitmapOptions)
        .then(bitmap => {
          // Cap height for portrait images
          let tw = bitmap.width, th = bitmap.height;
          if (th > FABRIC_HEAVY_MAX_DIM) {
            tw = Math.round(tw * (FABRIC_HEAVY_MAX_DIM / th));
            th = FABRIC_HEAVY_MAX_DIM;
          }
          const offCanvas = document.createElement('canvas');
          offCanvas.width = tw; offCanvas.height = th;
          const ctx = offCanvas.getContext('2d');
          if (!ctx) { bitmap.close(); return null; }
          ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(bitmap, 0, 0, tw, th);
          bitmap.close();

          return new Promise<FabricFile | null>(resolve => {
            offCanvas.toBlob(blob => {
              if (!blob) { resolve(null); return; }
              const previewUrl = URL.createObjectURL(blob);
              const imgEl = new Image();
              imgEl.onload  = () => resolve({ id, file, previewUrl, imgEl, sizeBytes: file.size, zoom: 100, customCrop: null });
              imgEl.onerror = () => { URL.revokeObjectURL(previewUrl); resolve(null); };
              imgEl.src = previewUrl;
            }, 'image/jpeg', 0.85);
          });
        })
        .catch(() => {
          // createImageBitmap failed (old browser) → fall through to classic path
          return loadFileClassic(file, id);
        });
    }

    return loadFileClassic(file, id);
  }, []);

  function loadFileClassic(file: File, id: number): Promise<FabricFile | null> {
    return new Promise(resolve => {
      if (!file.type.startsWith('image/')) { resolve(null); return; }
      const previewUrl = URL.createObjectURL(file);
      const imgEl = new Image();
      imgEl.onload  = () => resolve({ id, file, previewUrl, imgEl, sizeBytes: file.size, zoom: 100, customCrop: null });
      imgEl.onerror = () => { URL.revokeObjectURL(previewUrl); resolve(null); };
      imgEl.src = previewUrl;
    });
  }

  const processFiles = useCallback(async (files: FileList | File[]) => {
    const arr = Array.from(files).slice(0, MAX_IMAGES - fabrics.length);
    if (arr.length === 0) { toast.error(`الحد الأقصى ${MAX_IMAGES} صور`); return; }
    const results = await Promise.all(arr.map((f, i) => loadFile(f, fabrics.length + i + 1)));
    const valid = results.filter(Boolean) as FabricFile[];
    if (!valid.length) { toast.error('لم يُتعرَّف على أي صورة'); return; }
    setFabrics(prev => [...prev, ...valid]);
    setResultDataUrl(null);
    toast.success(`تم تحميل ${valid.length} صورة`);
  }, [fabrics.length, loadFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragActive(false);
    processFiles(e.dataTransfer.files);
  }, [processFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) processFiles(e.target.files); e.target.value = '';
  }, [processFiles]);

  const removeImage = (idx: number) => {
    URL.revokeObjectURL(fabrics[idx].previewUrl);
    const next = fabrics.filter((_,i) => i !== idx).map((f,i) => ({ ...f, id: i+1 }));
    setFabrics(next);
    setMainIdx(prev => prev >= next.length ? Math.max(0, next.length-1) : prev > idx ? prev-1 : prev);
    setResultDataUrl(null);
  };

  const updateZoom = (idx: number, val: number) =>
    setFabrics(p => p.map((f,i) => i===idx ? { ...f, zoom: val } : f));

  const saveCrop = (idx: number, crop: CropRect | null) => {
    setFabrics(p => p.map((f,i) => i===idx ? { ...f, customCrop: crop } : f));
    setResultDataUrl(null);
    toast.success(crop ? `تم حفظ منطقة الزووم لصورة #${fabrics[idx].id}` : 'تمت إعادة الزووم للوضع التلقائي');
  };

  const mainNum   = fabrics[mainIdx]?.id ?? 1;
  const thumbNums = fabrics.filter((_,i) => i !== mainIdx).map(f => f.id);

  // ── Generate ──────────────────────────────────────────────────
  const handleGenerate = useCallback(async () => {
    if (!fabrics.length)  { toast.error('يرجى رفع صورة واحدة على الأقل'); return; }
    if (!selectedLayout)  { toast.error('يرجى اختيار قالب تخطيط'); return; }
    setIsProcessing(true); setResultDataUrl(null);
    await new Promise(r => setTimeout(r, 40));
    try {
      const dataUrl = await buildComposite(fabrics, mainIdx, selectedLayout);
      setResultDataUrl(dataUrl);
      toast.success('تم إنشاء الصورة المركبة!');
    } catch(e) {
      const msg = e instanceof Error ? e.message : 'خطأ في Canvas';
      addError(msg, e instanceof Error ? (e.stack ?? '') : '', 'handleGenerate');
      toast.error(`فشل: ${msg}`);
    } finally { setIsProcessing(false); }
  }, [fabrics, mainIdx, selectedLayout, addError]);

  // ── Prompt ───────────────────────────────────────────────────
  const buildPrompt = useCallback(() => {
    if (!fabrics.length || !selectedLayout) return '';
    const def = LAYOUT_DEFS.find(l => l.id === selectedLayout)!;
    const thumbs = fabrics.filter((_,i) => i !== mainIdx);
    const mainF = fabrics[mainIdx];
    return `FABRIC ZOOM COMPOSITE — PIXEL-FAITHFUL
LAYOUT: ${def.nameAr}
MAIN: #${mainF.id}${mainF.customCrop ? ' (custom crop region)' : mainF.zoom>100 ? ` Zoom ${mainF.zoom}%` : ' full'}
PANELS (${thumbs.length}):
${thumbs.map(t=>`  #${t.id}: ${t.customCrop?'custom crop region':t.zoom>100?`Zoom ${t.zoom}%`:'full'}`).join('\n')}
RULES: No AI modification. Pixel-accurate crop. All panels numbered. Output: PNG 2048px+.`;
  }, [fabrics, mainIdx, selectedLayout]);

  const openPrompt = () => {
    if (!fabrics.length || !selectedLayout) { toast.error('يرجى رفع الصور واختيار القالب'); return; }
    setPrompt(buildPrompt()); setShowPrompt(true);
  };

  const handleDownload = async () => {
    if (!resultDataUrl) return;
    const filename = `fabric-zoom-${Date.now()}.png`;
    
    // Check if running in pywebview Desktop App
    // @ts-ignore
    if (window.pywebview && window.pywebview.api) {
      // @ts-ignore
      await window.pywebview.api.download_image(resultDataUrl, filename);
      return;
    }

    const a = document.createElement('a'); a.href = resultDataUrl;
    a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const handleReset = () => {
    fabrics.forEach(f => URL.revokeObjectURL(f.previewUrl));
    setFabrics([]); setMainIdx(0); setSelectedLayout(null);
    setResultDataUrl(null); setIsProcessing(false);
    toast.success('تم مسح جميع البيانات');
  };

  const copyDevLog = () => navigator.clipboard.writeText(DEV_LOG.map(e=>`=== ${e.label} ===\n${e.content}`).join('\n\n')).then(()=>toast.success('تم النسخ'));
  const exportPDF  = () => {
    const html = DEV_LOG.map(e=>`<h2>${e.label}</h2><pre>${e.content}</pre>`).join('<hr/>');
    const w = window.open('','_blank'); if(!w) return;
    w.document.write(`<html dir="rtl"><head><title>سجل التطوير</title><style>body{font-family:Arial;margin:2rem;direction:rtl}pre{background:#f4f4f4;padding:1rem;white-space:pre-wrap}</style></head><body><h1>سجل زوم الأقمشة</h1>${html}</body></html>`);
    w.document.close(); w.print();
  };

  const cropPickerFabric = cropPickerIdx !== null ? fabrics[cropPickerIdx] ?? null : null;

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="min-h-full" dir="rtl">

      {/* Header */}
      <div className="flex flex-wrap items-center gap-2 mb-6 p-4 rounded-xl border border-border bg-card/60">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-foreground font-arabic">زوم الأقمشة — كانفاس محلي</h2>
            <p className="text-xs text-muted-foreground font-arabic">حتى {MAX_IMAGES} صور — أي حجم — زووم حقيقي + تحديد منطقة يدوي</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" className="font-arabic text-xs gap-1" onClick={handleReset}>
            <RefreshCw className="w-3 h-3" /> بدء من جديد
          </Button>
          <Button variant="outline" size="sm" className="font-arabic text-xs gap-1" onClick={()=>setShowDevLog(true)}>
            <Code2 className="w-3 h-3" /> المبرمج
          </Button>
          <Button variant="outline" size="sm"
            className={`font-arabic text-xs gap-1 ${errors.length>0?'border-destructive text-destructive':''}`}
            onClick={()=>setShowBugger(true)}>
            <Bug className="w-3 h-3" /> الأخطاء
            {errors.length>0 && <Badge variant="destructive" className="text-xs px-1 py-0 h-4 min-w-4">{errors.length}</Badge>}
          </Button>
        </div>
      </div>

      {/* 1. Upload */}
      <section className="mb-6">
        <h3 className="text-sm font-semibold text-foreground font-arabic mb-3 flex items-center gap-2">
          <Upload className="w-4 h-4 text-primary" /> ١. رفع الصور ({fabrics.length}/{MAX_IMAGES})
        </h3>
        {fabrics.length < MAX_IMAGES && (
          <div
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors mb-4 ${dragActive?'border-primary bg-primary/5':'border-border hover:border-primary/50 hover:bg-primary/5'}`}
            onDrop={handleDrop}
            onDragOver={e=>{e.preventDefault();setDragActive(true);}}
            onDragLeave={()=>setDragActive(false)}
            onClick={()=>fileInputRef.current?.click()}
          >
            <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-foreground font-arabic font-medium mb-1">اسحب وأفلت الصور هنا أو انقر للاختيار</p>
            <p className="text-xs text-muted-foreground font-arabic">1 – {MAX_IMAGES} صور — أي حجم مقبول (JPEG / PNG / WEBP)</p>
            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileInput} />
          </div>
        )}

        {fabrics.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {fabrics.map((f, idx) => {
              const isMain = idx === mainIdx;
              return (
                <div key={f.id} className={`rounded-xl border-2 p-3 transition-all ${isMain?'border-amber-400 bg-amber-500/5':'border-border bg-card/60'}`}>
                  <div className="flex gap-3 mb-3">
                    <div className="relative w-20 h-20 shrink-0 rounded-lg overflow-hidden border border-border">
                      <img src={f.previewUrl} alt={`صورة ${f.id}`} className="w-full h-full object-cover" />
                      <div className="absolute top-1 left-1 w-6 h-6 rounded-full bg-black/70 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">#{f.id}</span>
                      </div>
                      {isMain && <div className="absolute top-1 right-1"><Star className="w-4 h-4 text-amber-400 fill-amber-400" /></div>}
                      {f.customCrop && (
                        <div className="absolute bottom-1 right-1">
                          <div className="w-4 h-4 rounded bg-primary flex items-center justify-center">
                            <Crosshair className="w-2.5 h-2.5 text-primary-foreground" />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground font-arabic truncate mb-1">{f.file.name}</p>
                      <p className="text-xs text-muted-foreground font-arabic">{f.imgEl.naturalWidth}×{f.imgEl.naturalHeight}px — {formatBytes(f.sizeBytes)}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {isMain && <Badge className="text-xs bg-amber-500/20 text-amber-400 border-amber-500/40 font-arabic"><Star className="w-2.5 h-2.5 fill-amber-400 ml-1"/>رئيسية</Badge>}
                        {f.customCrop && <Badge variant="outline" className="text-xs text-primary border-primary/50 font-arabic"><Crosshair className="w-2.5 h-2.5 ml-1"/>منطقة يدوية</Badge>}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="shrink-0 w-7 h-7 text-muted-foreground hover:text-destructive" onClick={()=>removeImage(idx)}>
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>

                  {/* Controls */}
                  <div className="flex flex-wrap gap-2 items-center">
                    {!isMain && (
                      <Button variant="outline" size="sm"
                        className="font-arabic text-xs gap-1 h-7 border-amber-500/40 text-amber-500 hover:bg-amber-500/10"
                        onClick={()=>{setMainIdx(idx);setResultDataUrl(null);}}>
                        <Star className="w-3 h-3" /> تعيين رئيسية
                      </Button>
                    )}

                    {/* Manual crop region button */}
                    <Button variant="outline" size="sm"
                      className={`font-arabic text-xs gap-1 h-7 ${f.customCrop?'border-primary text-primary':'border-border text-muted-foreground hover:text-primary hover:border-primary'}`}
                      onClick={()=>setCropPickerIdx(idx)}>
                      <Crosshair className="w-3 h-3" />
                      {f.customCrop ? 'تعديل المنطقة' : 'تحديد منطقة الزووم'}
                    </Button>

                    {/* Zoom fallback input (used only when no customCrop) */}
                    {!f.customCrop && (
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <span className="text-xs text-muted-foreground font-arabic shrink-0">زووم تلقائي:</span>
                        <Input type="number" min={10} max={3000} value={f.zoom}
                          onChange={e=>updateZoom(idx, Number(e.target.value))}
                          className="h-7 text-center text-xs px-1 w-20 shrink-0" />
                        <span className="text-xs text-muted-foreground shrink-0">%</span>
                        {(f.zoom<10||f.zoom>3000) && <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0"/>}
                      </div>
                    )}
                  </div>

                  {/* Custom crop summary */}
                  {f.customCrop && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 text-xs text-primary font-arabic flex items-center gap-1">
                        <MoveRight className="w-3 h-3 shrink-0"/>
                        منطقة محددة يدوياً: {f.customCrop.sw}×{f.customCrop.sh}px من ({f.customCrop.sx},{f.customCrop.sy})
                      </div>
                      <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive font-arabic gap-1"
                        onClick={()=>saveCrop(idx, null)}>
                        <Trash2 className="w-3 h-3"/>مسح
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {fabrics.length > 0 && (
          <div className="mt-3 p-3 rounded-lg bg-muted/30 border border-border">
            <p className="text-xs text-muted-foreground font-arabic flex items-center gap-1">
              <Info className="w-3.5 h-3.5 shrink-0 text-primary"/>
              زر <strong>تحديد منطقة الزووم</strong> على كل صورة يتيح رسم مستطيل بالضبط على المنطقة التي تريد تكبيرها. إذا لم تحدد، يتوزع الزووم تلقائياً.
            </p>
          </div>
        )}
      </section>

      {/* 2. Layout */}
      <section className="mb-6">
        <h3 className="text-sm font-semibold text-foreground font-arabic mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary"/> ٢. ترتيب الصورة المركبة
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {LAYOUT_DEFS.map(layout => {
            const isSel = selectedLayout === layout.id;
            return (
              <button key={layout.id} type="button" onClick={()=>setSelectedLayout(layout.id)}
                className={`p-3 rounded-xl border-2 transition-all text-right flex flex-col gap-2 ${isSel?'border-primary bg-primary/10':'border-border bg-card/60 hover:border-primary/40 hover:bg-primary/5'}`}>
                <div className="w-full aspect-[5/4]">
                  <layout.Diagram selected={isSel} mainNum={mainNum} thumbNums={thumbNums}/>
                </div>
                <p className={`text-xs font-arabic font-medium leading-snug text-balance ${isSel?'text-primary':'text-foreground'}`}>{layout.nameAr}</p>
              </button>
            );
          })}
        </div>
        {!selectedLayout && (
          <p className="text-xs text-amber-500 font-arabic mt-2 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 shrink-0"/> يرجى اختيار ترتيب
          </p>
        )}
      </section>

      {/* Actions */}
      {!resultDataUrl && (
        <div className="flex gap-3 mb-6 flex-wrap">
          <Button size="lg" className="flex-1 h-12 text-sm font-bold font-arabic gap-2 glow-primary min-w-40"
            onClick={handleGenerate} disabled={isProcessing||!fabrics.length||!selectedLayout}>
            {isProcessing
              ? <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>جاري المعالجة...</>
              : <><Zap className="w-4 h-4"/>إنشاء الصورة المركبة</>}
          </Button>
          <Button size="lg" variant="outline" className="h-12 text-sm font-arabic gap-2 min-w-44"
            onClick={openPrompt} disabled={isProcessing}>
            <Copy className="w-4 h-4"/> إنشاء برومبت نصي
          </Button>
        </div>
      )}

      {/* Result */}
      {resultDataUrl && (
        <div className="mb-6 p-5 rounded-xl border border-primary/30 bg-card/60">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-5 h-5 text-primary"/>
            <h3 className="text-sm font-bold text-foreground font-arabic">الصورة المركبة النهائية</h3>
            <Badge variant="outline" className="text-primary border-primary text-xs">Canvas PNG</Badge>
          </div>
          <div className="rounded-lg overflow-hidden border border-border mb-4">
            <img src={resultDataUrl} alt="الصورة المركبة" className="w-full object-contain"/>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Button className="font-arabic gap-2 flex-1" onClick={handleDownload}><Download className="w-4 h-4"/> تحميل PNG</Button>
            <Button variant="outline" className="font-arabic gap-2" onClick={()=>setResultDataUrl(null)}><RefreshCw className="w-4 h-4"/> تعديل</Button>
            <Button variant="ghost" className="font-arabic gap-2 text-muted-foreground" onClick={handleReset}>بدء من جديد</Button>
          </div>
        </div>
      )}

      {/* ── Crop Picker ── */}
      <CropPickerDialog
        open={cropPickerIdx !== null}
        fabric={cropPickerFabric}
        onSave={crop => { if (cropPickerIdx !== null) saveCrop(cropPickerIdx, crop); }}
        onClose={() => setCropPickerIdx(null)}
      />

      {/* Dev Log */}
      <Dialog open={showDevLog} onOpenChange={setShowDevLog}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-2xl max-h-[90dvh] overflow-y-auto" dir="rtl">
          <DialogHeader><DialogTitle className="font-arabic text-right flex items-center gap-2"><Code2 className="w-4 h-4 text-primary"/>سجل التطوير</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {DEV_LOG.map((e,i)=>(
              <div key={i} className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-xs font-semibold text-primary font-arabic mb-2">{e.label}</p>
                <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed">{e.content}</pre>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-2">
            <Button variant="outline" size="sm" className="font-arabic gap-1" onClick={copyDevLog}><Copy className="w-3 h-3"/>نسخ</Button>
            <Button variant="outline" size="sm" className="font-arabic gap-1" onClick={exportPDF}><FileText className="w-3 h-3"/>PDF</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bug Tracker */}
      <Dialog open={showBugger} onOpenChange={setShowBugger}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-2xl max-h-[90dvh] overflow-y-auto" dir="rtl">
          <DialogHeader><DialogTitle className="font-arabic text-right flex items-center gap-2"><Bug className="w-4 h-4 text-destructive"/>كاشف الأخطاء</DialogTitle></DialogHeader>
          {errors.length===0
            ? <div className="text-center py-8"><CheckCircle2 className="w-8 h-8 text-primary mx-auto mb-2"/><p className="text-sm text-muted-foreground font-arabic">لا توجد أخطاء</p></div>
            : <div className="space-y-3">
                {errors.map((err,i)=>(
                  <div key={i} className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                    <p className="text-xs font-semibold text-destructive font-arabic mb-1">{err.message}</p>
                    <p className="text-xs text-muted-foreground font-arabic">{err.time}{err.fn?` | ${err.fn}`:''}</p>
                    {err.detail && <pre className="text-xs text-muted-foreground bg-muted/40 rounded p-2 whitespace-pre-wrap font-mono mt-2 overflow-x-auto">{err.detail}</pre>}
                    <Button variant="outline" size="sm" className="font-arabic text-xs gap-1 mt-2"
                      onClick={()=>{navigator.clipboard.writeText(`${err.time}\n${err.fn??''}\n${err.message}\n${err.detail}`);toast.success('تم النسخ');}}>
                      <Copy className="w-3 h-3"/>نسخ
                    </Button>
                  </div>
                ))}
                <Button variant="ghost" size="sm" className="font-arabic text-xs text-muted-foreground" onClick={()=>setErrors([])}>مسح الأخطاء</Button>
              </div>}
        </DialogContent>
      </Dialog>

      {/* Prompt */}
      <Dialog open={showPrompt} onOpenChange={setShowPrompt}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-2xl max-h-[90dvh] overflow-y-auto" dir="rtl">
          <DialogHeader><DialogTitle className="font-arabic text-right flex items-center gap-2"><Copy className="w-4 h-4 text-primary"/>البرومبت النصي</DialogTitle></DialogHeader>
          <div className="rounded-lg border border-border bg-muted/30 p-3 mb-3">
            <pre className="text-xs text-foreground whitespace-pre-wrap font-mono leading-relaxed overflow-x-auto">{prompt}</pre>
          </div>
          <Button className="font-arabic gap-2 w-full" onClick={()=>{navigator.clipboard.writeText(prompt);toast.success('تم النسخ');}}>
            <Copy className="w-4 h-4"/>نسخ البرومبت
          </Button>
        </DialogContent>
      </Dialog>

    </div>
  );
}
