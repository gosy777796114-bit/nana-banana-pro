import type { DimensionPreset, QualityOption, ImageSettings } from '@/types/types';
import type { IntegrationData } from '@/types/integration';

// ── Dimension presets ──────────────────────────────────────────────
export const DIMENSION_PRESETS: DimensionPreset[] = [
  { label: 'مربع (1:1) - 1024×1024',       value: 'square',    width: 1024, height: 1024 },
  { label: 'أفقي (16:9) - 1920×1080',      value: 'wide_16_9', width: 1920, height: 1080 },
  { label: 'عمودي (9:16) - 1080×1920',     value: 'tall_9_16', width: 1080, height: 1920 },
  { label: 'أفقي (4:3) - 1440×1080',       value: 'wide_4_3',  width: 1440, height: 1080 },
  { label: 'عمودي (3:4) - 1080×1440',      value: 'tall_3_4',  width: 1080, height: 1440 },
  { label: 'بانورامي (21:9) - 2560×1080',  value: 'panoramic', width: 2560, height: 1080 },
  { label: 'مخصص',                          value: 'custom',    width: 1024, height: 1024 },
];

export const QUALITY_OPTIONS: QualityOption[] = [
  { label: '2K (2048px)',  value: '2K',  px: 2048  },
  { label: '4K (4096px)',  value: '4K',  px: 4096  },
  { label: '8K (8192px)',  value: '8K',  px: 8192  },
  { label: '16K (16384px)', value: '16K', px: 16384 },
];

export const DEFAULT_SETTINGS: ImageSettings = {
  dimensionPreset: 'square',
  customWidth: 1024,
  customHeight: 1024,
  quality: '4K',
};

// ── Resolve effective dimensions from settings ─────────────────────
export function resolveDimensions(settings: ImageSettings): { width: number; height: number } {
  if (settings.dimensionPreset === 'custom') {
    return { width: settings.customWidth, height: settings.customHeight };
  }
  const preset = DIMENSION_PRESETS.find(p => p.value === settings.dimensionPreset);
  return preset ? { width: preset.width, height: preset.height } : { width: 1024, height: 1024 };
}

// ── Build a descriptive dimension string ──────────────────────────
export function dimensionLabel(settings: ImageSettings): string {
  const { width, height } = resolveDimensions(settings);
  return `${width}×${height}`;
}

// ── Max size per image sent to API (bytes, base64-decoded) ────────
const MAX_IMAGE_BYTES = 350 * 1024;   // 350 KB per image (decoded)
const MAX_DIMENSION   = 512;          // max px on longest side (normal path)
const JPEG_QUALITY    = 0.80;

// ── Heavy-file path (files > 50 MB) ───────────────────────────────
// Uses createImageBitmap to decode+resize in one step, keeping only
// the downsampled pixels in RAM — the full-resolution bitmap is never
// fully allocated in JS heap.
export const HEAVY_FILE_THRESHOLD = 50 * 1024 * 1024; // 50 MB
const HEAVY_MAX_DIM = 4096; // max px on longest side for heavy files

async function compressHeavyFile(
  file: File,
): Promise<{ base64: string; mimeType: string }> {
  // createImageBitmap with resizeWidth decodes + scales in one pass.
  // Only resizeWidth is specified so the browser maintains aspect ratio.
  const bitmap = await createImageBitmap(file, {
    resizeWidth: HEAVY_MAX_DIM,
    resizeQuality: 'high',
  } as ImageBitmapOptions);

  // Cap height as well — safety guard for portrait images
  const bw = bitmap.width;
  const bh = bitmap.height;
  let tw = bw, th = bh;
  if (th > HEAVY_MAX_DIM) {
    tw = Math.round(bw * (HEAVY_MAX_DIM / bh));
    th = HEAVY_MAX_DIM;
  }

  const canvas = document.createElement('canvas');
  canvas.width  = tw;
  canvas.height = th;
  const ctx = canvas.getContext('2d');
  if (!ctx) { bitmap.close(); throw new Error('Canvas not supported'); }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, 0, 0, tw, th);
  bitmap.close(); // release GPU/CPU memory immediately

  let quality = JPEG_QUALITY;
  let dataUrl  = canvas.toDataURL('image/jpeg', quality);
  while (dataUrl.length * 0.75 > MAX_IMAGE_BYTES && quality > 0.3) {
    quality -= 0.1;
    dataUrl  = canvas.toDataURL('image/jpeg', quality);
  }
  return { base64: dataUrl.split(',')[1], mimeType: 'image/jpeg' };
}

// ── Normalize mime type for API (only png/jpeg/webp allowed) ──────
export function normalizeMimeType(file: File): string {
  const t = file.type.toLowerCase();
  if (t === 'image/png') return 'image/png';
  if (t === 'image/webp') return 'image/webp';
  // Everything else (jpg, heic, tiff, bmp, gif, svg, raw…) → jpeg
  return 'image/jpeg';
}

// ── Compress image via canvas and return pure base64 ─────────────
// For files > HEAVY_FILE_THRESHOLD: uses createImageBitmap (safe RAM).
// For smaller files: classic Image → Canvas → JPEG path.
export async function compressAndEncode(
  file: File,
): Promise<{ base64: string; mimeType: string }> {
  // Heavy-file path: avoid loading full multi-hundred-MB image into heap
  if (file.size > HEAVY_FILE_THRESHOLD && typeof createImageBitmap !== 'undefined') {
    try {
      return await compressHeavyFile(file);
    } catch {
      // Fall through to classic path on browser limitation
    }
  }

  // Classic path (files ≤ 50 MB or createImageBitmap unavailable)
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width >= height) {
          height = Math.round((height / width) * MAX_DIMENSION);
          width  = MAX_DIMENSION;
        } else {
          width  = Math.round((width / height) * MAX_DIMENSION);
          height = MAX_DIMENSION;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width  = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas not supported')); return; }

      ctx.drawImage(img, 0, 0, width, height);

      let quality = JPEG_QUALITY;
      let dataUrl  = canvas.toDataURL('image/jpeg', quality);
      while (dataUrl.length * 0.75 > MAX_IMAGE_BYTES && quality > 0.3) {
        quality -= 0.1;
        dataUrl  = canvas.toDataURL('image/jpeg', quality);
      }

      resolve({ base64: dataUrl.split(',')[1], mimeType: 'image/jpeg' });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      // Guard: skip raw FileReader if file is too large (> 5 MB unsupported format)
      if (file.size > 5 * 1024 * 1024) {
        reject(new Error(`صيغة ${file.name.split('.').pop()?.toUpperCase() ?? 'غير معروفة'} غير مدعومة ولا يمكن ضغطها. يرجى تحويلها إلى JPG أو PNG.`));
        return;
      }
      // Fallback: read raw bytes for small SVG / exotic formats
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve({ base64: result.split(',')[1], mimeType: normalizeMimeType(file) });
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    };

    img.src = objectUrl;
  });
}

// ── Convert File → pure base64 (no data: prefix) — kept for compat
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

// ── Total payload size check (base64 chars → ~bytes) ─────────────
// Returns null if OK, or an Arabic warning string if too large.
// Threshold is 4 MB — safe margin under the ~6 MB Edge Function body limit.
export function checkPayloadSize(
  parts: ContentPart[],
): string | null {
  const MAX_TOTAL = 4 * 1024 * 1024; // 4 MB (edge function limit ~6 MB)
  let total = 0;
  for (const p of parts) {
    if (p.inline_data?.data) {
      // base64 length × 0.75 ≈ decoded byte count
      total += Math.ceil(p.inline_data.data.length * 0.75);
    }
    if (p.text) total += p.text.length;
  }
  if (total > MAX_TOTAL) {
    return `حجم الطلب الإجمالي (${formatBytes(total)}) يتجاوز الحد المسموح (4 ميجابايت). يرجى تقليل عدد الصور المرجعية.`;
  }
  return null;
}

// ── Format bytes to human readable ────────────────────────────────
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 بايت';
  const units = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / 1024 ** i).toFixed(1)} ${units[i]}`;
}

// ── Format seconds to MM:SS ────────────────────────────────────────
export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ── Format ms to Arabic duration string ───────────────────────────
export function formatDurationArabic(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds} ثانية`;
  if (seconds === 0) return `${minutes} دقيقة`;
  return `${minutes} دقيقة و ${seconds} ثانية`;
}

// ── Submit task via direct Gateway call ──────────────────────────
export interface ContentPart {
  text?: string;
  inline_data?: { mime_type: string; data: string };
}

function extractImageFromParts(parts: Array<Record<string, unknown>>): { mimeType: string; data: string } | null {
  for (const part of parts) {
    // Case A: inlineData (camelCase) — standard Gemini SDK
    if ((part.inlineData as Record<string, unknown>)?.data) {
      const d = part.inlineData as Record<string, string>;
      return { mimeType: d.mimeType || 'image/png', data: String(d.data) };
    }
    // Case B: inline_data (snake_case) — raw API response
    if ((part.inline_data as Record<string, unknown>)?.data) {
      const d = part.inline_data as Record<string, string>;
      return { mimeType: d.mime_type || 'image/png', data: String(d.data) };
    }
    // Case C: data is a direct property with mime_type nearby
    if (part.data && part.mime_type) {
      return { mimeType: String(part.mime_type), data: String(part.data) };
    }
    // Case D: image property
    if (part.image) {
      const img = part.image as Record<string, string>;
      return { mimeType: img.mimeType || img.mime_type || 'image/png', data: String(img.data || img.base64) };
    }
  }
  return null;
}

export async function submitGenerationTask(
  contents: { parts: ContentPart[] }[],
  connection: IntegrationData
): Promise<{ taskId: string; estimatedTime?: number; synchronous?: boolean; imageUrl?: string }> {
  const url = connection.submitUrl || connection.genKey;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (connection.headerKey && connection.headerValue) {
    headers[connection.headerKey] = connection.headerValue;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ contents }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`API error ${response.status}: ${text || response.statusText}`);
  }

  const data = await response.json();

  // ── Debug: log full response structure ──
  console.log('[API] Response keys:', Object.keys(data || {}));
  console.log('[API] Full response:', JSON.stringify(data, (k, v) => {
    if (typeof v === 'string' && v.length > 200) return v.substring(0, 100) + '...[truncated]';
    return v;
  }, 2));

  // ── Check for error status codes ──
  if (data?.status !== 0 && data?.status !== undefined) {
    throw new Error(`API error: ${data?.message || 'Unknown error'}`);
  }

  // ── Case 1: Wrapped format { data: { taskId, estimatedTime } } ──
  if (data?.data?.taskId) {
    return { taskId: data.data.taskId, estimatedTime: data.data.estimatedTime };
  }

  // ── Case 2: Async operation format { name: "operations/..." } ──
  if (data?.name && data.name.startsWith('operations/')) {
    return { taskId: data.name, estimatedTime: 90 };
  }

  // ── Case 3: Direct Gemini format { candidates: [{ content: { parts: [...] } }] } ──
  if (data?.candidates?.[0]?.content?.parts) {
    const parts = data.candidates[0].content.parts;
    const img = extractImageFromParts(parts);
    if (img) {
      return { taskId: '__sync__', synchronous: true, imageUrl: `data:${img.mimeType};base64,${img.data}` };
    }
    // Maybe the model returned text only
    const textParts = parts.filter((p: Record<string, unknown>) => p.text);
    if (textParts.length > 0) {
      const textContent = textParts.map((p: Record<string, unknown>) => p.text).join('\n');
      throw new Error(`النموذج أرجع نصاً بدلاً من صورة: "${textContent.substring(0, 200)}"`);
    }
    console.error('[API] candidates found but no image in parts:', JSON.stringify(parts.map((p: Record<string, unknown>) => Object.keys(p))));
    throw new Error('لم يتم استلام بيانات الصورة من الـ API. تأكد من أن النموذج يدعم توليد الصور.');
  }

  // ── Case 3b: candidates with promptFeedback (blocked) ──
  if (data?.candidates?.[0]?.finishReason === 'SAFETY') {
    throw new Error('تم حظر الطلب بسبب سياسات الأمان. يرجى تعديل البرومبت.');
  }

  // ── Case 3c: candidates empty ──
  if (data?.candidates && data.candidates.length === 0) {
    const reason = data?.promptFeedback?.blockReason || 'غير معروف';
    throw new Error(`لم يتم إرجاع نتائج. السبب: ${reason}`);
  }

  // ── Case 4: Proxy-wrapped format with result/output field ──
  const output = data?.result || data?.output;
  if (output) {
    if (output.imageUrl || output.image_url || output.url) {
      return { taskId: '__sync__', synchronous: true, imageUrl: output.imageUrl || output.image_url || output.url };
    }
    // Try extracting from output parts
    if (output.candidates?.[0]?.content?.parts) {
      const img = extractImageFromParts(output.candidates[0].content.parts);
      if (img) {
        return { taskId: '__sync__', synchronous: true, imageUrl: `data:${img.mimeType};base64,${img.data}` };
      }
    }
  }

  // ── Case 5: Base64 in image/imageData field ──
  const imgData = data?.image || data?.imageData || data?.image_data;
  if (imgData) {
    const raw = imgData.data || imgData.base64;
    if (raw) {
      const mime = imgData.mimeType || imgData.mime_type || 'image/png';
      return { taskId: '__sync__', synchronous: true, imageUrl: `data:${mime};base64,${raw}` };
    }
  }

  // ── Fallback: dump response for debugging ──
  console.error('[API] Unexpected response format:', JSON.stringify(data, null, 2));
  throw new Error(`صيغة استجابة الـ API غير متوقعة. تحقق من إعدادات الاتصال. راجع Console للتفاصيل.`);
}

// ── Query task status via direct Gateway call ────────────────────
export interface QueryResult {
  taskId: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'TIMEOUT';
  imageUrl?: string;
  error?: { code: string; message: string };
}

export async function queryGenerationTask(
  taskId: string,
  connection: IntegrationData
): Promise<QueryResult> {
  // ── Synchronous result: no polling needed ──
  if (taskId === '__sync__') {
    throw new Error('Synchronous result handled by submit caller');
  }

  const url = connection.queryUrl || connection.visionKey;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (connection.headerKey && connection.headerValue) {
    headers[connection.headerKey] = connection.headerValue;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ taskId }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`API error ${response.status}: ${text || response.statusText}`);
  }

  const data = await response.json();

  // ── Case 1: Wrapped format ──
  if (data?.data) {
    const d = data.data;
    if (d.status === 'SUCCESS' || d.status === 'success' || d.status === 0) {
      return { taskId, status: 'SUCCESS', imageUrl: d.imageUrl || d.image_url || d.url };
    }
    if (d.status === 'FAILED' || d.status === 'failed' || d.status === 2) {
      return { taskId, status: 'FAILED', error: d.error };
    }
    return { taskId, status: 'PENDING' };
  }

  // ── Case 2: Direct Gemini format ──
  if (data?.candidates?.[0]?.content?.parts) {
    const parts = data.candidates[0].content.parts;
    for (const part of parts) {
      if (part.inlineData?.data) {
        const mimeType = part.inlineData.mimeType || 'image/png';
        return { taskId, status: 'SUCCESS', imageUrl: `data:${mimeType};base64,${part.inlineData.data}` };
      }
    }
    return { taskId, status: 'FAILED', error: { code: 'NO_IMAGE', message: 'No image data in response' } };
  }

  // ── Case 3: Operation still pending ──
  if (data?.done === false || data?.status === 'PENDING' || data?.status === 'pending') {
    return { taskId, status: 'PENDING' };
  }

  // ── Case 4: Operation complete ──
  if (data?.done === true) {
    const result = data.result || data.response || data;
    const imageUrl = result?.imageUrl || result?.image_url || result?.url;
    if (imageUrl) {
      return { taskId, status: 'SUCCESS', imageUrl };
    }
    return { taskId, status: 'FAILED', error: { code: 'NO_IMAGE', message: 'Operation complete but no image URL' } };
  }

  // ── Fallback ──
  console.error('Unexpected query response format:', JSON.stringify(data, null, 2));
  return { taskId, status: 'PENDING' };
}
