import React, { useCallback, useRef, useState } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import type { ReferenceImage } from '@/types/types';
import { formatBytes, compressAndEncode, normalizeMimeType } from '@/services/imageGeneration';

interface ReferenceImageUploadProps {
  images: ReferenceImage[];
  onImagesChange: (images: ReferenceImage[]) => void;
  onAddLog: (level: 'info' | 'warn' | 'error' | 'success', message: string, details?: string) => void;
}

export default function ReferenceImageUpload({
  images,
  onImagesChange,
  onAddLog,
}: ReferenceImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const processFiles = useCallback(async (files: FileList | File[]) => {
    const fileArr = Array.from(files);
    if (fileArr.length === 0) return;

    onAddLog('info', `بدء رفع ${fileArr.length} صورة...`);

    const startIndex = images.length;
    const newImages: ReferenceImage[] = fileArr.map((file, i) => ({
      id: `img_${Date.now()}_${i}_${Math.random().toString(36).slice(2)}`,
      index: startIndex + i + 1,
      file,
      name: file.name,
      sizeBytes: file.size,
      previewUrl: URL.createObjectURL(file),
      mimeType: normalizeMimeType(file),
      uploadProgress: 0,
      status: 'uploading' as const,
    }));

    onImagesChange([...images, ...newImages]);

    // Track current merged list locally to avoid stale closure issues
    let currentImages: ReferenceImage[] = [...images, ...newImages];

    const updateImage = (id: string, patch: Partial<ReferenceImage>) => {
      currentImages = currentImages.map(m => m.id === id ? { ...m, ...patch } : m);
      onImagesChange(currentImages);
    };

    // Process each file: simulate progress then read base64
    for (const img of newImages) {
      try {
        // Simulate chunked progress
        for (let p = 10; p <= 90; p += 20) {
          await new Promise(r => setTimeout(r, 60));
          updateImage(img.id, { uploadProgress: p });
        }
        const { base64, mimeType } = await compressAndEncode(img.file);
        // Compressed byte size ≈ base64 length × 0.75
        const compressedBytes = Math.ceil(base64.length * 0.75);
        updateImage(img.id, { base64, mimeType, uploadProgress: 100, status: 'ready' });
        onAddLog(
          'success',
          `تم رفع "${img.name}" — الأصلي: ${formatBytes(img.sizeBytes)} ← مضغوط: ${formatBytes(compressedBytes)}`,
        );
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'خطأ غير معروف';
        updateImage(img.id, { status: 'error', errorMsg: errMsg, uploadProgress: 0 });
        onAddLog('error', `فشل رفع "${img.name}"`, errMsg);
      }
    }
  }, [images, onImagesChange, onAddLog]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }, [processFiles]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => setDragActive(false);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
    e.target.value = '';
  };

  const removeImage = (id: string) => {
    const img = images.find(m => m.id === id);
    if (img) {
      URL.revokeObjectURL(img.previewUrl);
      onAddLog('info', `تم حذف الصورة "${img.name}"`);
    }
    const updated = images
      .filter(m => m.id !== id)
      .map((m, i) => ({ ...m, index: i + 1 }));
    onImagesChange(updated);
  };

  return (
    <div className="card-dark rounded-xl p-6 mb-6">
      <h2 className="text-lg font-bold text-foreground mb-4 font-arabic flex items-center gap-2">
        <ImageIcon className="w-5 h-5 text-primary" />
        الصور المرجعية
        {images.length > 0 && (
          <span className="text-sm font-normal text-muted-foreground">({images.length} صورة)</span>
        )}
      </h2>

      {/* Drop zone */}
      <div
        className={`drag-zone border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
          ${dragActive
            ? 'border-primary bg-primary/5 glow-primary-sm'
            : 'border-border hover:border-primary/50 hover:bg-white/2'
          }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && inputRef.current?.click()}
        aria-label="منطقة رفع الصور"
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,.heic,.heif,.raw,.cr2,.nef,.arw,.dng,.tiff,.tif,.bmp,.svg"
          className="hidden"
          onChange={handleFileInput}
        />
        <Upload className={`w-10 h-10 mx-auto mb-3 transition-colors ${dragActive ? 'text-primary' : 'text-muted-foreground'}`} />
        <p className="text-base font-semibold text-foreground mb-1 font-arabic">
          اسحب وأفلت الصور هنا
        </p>
        <p className="text-sm text-muted-foreground font-arabic mb-3">
          أو انقر لتحديد الصور
        </p>
        <p className="text-xs text-muted-foreground font-arabic">
          يدعم جميع التنسيقات: JPG، PNG، WebP، HEIC، RAW، TIFF، BMP، GIF، SVG وغيرها
        </p>
        <p className="text-xs text-muted-foreground font-arabic mt-1">
          لا يوجد حد لحجم الملف أو عدد الصور
        </p>
      </div>

      {/* Image grid */}
      {images.length > 0 && (
        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map(img => (
            <ImageCard key={img.id} image={img} onRemove={removeImage} />
          ))}
        </div>
      )}
    </div>
  );
}

function ImageCard({ image, onRemove }: { image: ReferenceImage; onRemove: (id: string) => void }) {
  return (
    <div className="relative bg-secondary rounded-xl overflow-hidden border border-border group animate-scale-in">
      {/* Number badge */}
      <div className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
        {image.index}
      </div>

      {/* Delete button */}
      <button
        type="button"
        onClick={() => onRemove(image.id)}
        className="absolute top-2 left-2 z-10 w-6 h-6 rounded-full bg-destructive/80 hover:bg-destructive flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="حذف الصورة"
      >
        <X className="w-3.5 h-3.5 text-white" />
      </button>

      {/* Thumbnail */}
      <div className="aspect-square w-full overflow-hidden bg-muted relative">
        {image.status === 'uploading' ? (
          <div className="w-full h-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : image.status === 'error' ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1 p-2">
            <X className="w-8 h-8 text-destructive" />
            <span className="text-xs text-destructive text-center font-arabic">{image.errorMsg}</span>
          </div>
        ) : (
          <img
            src={image.previewUrl}
            alt={image.name}
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Progress bar while uploading */}
      {image.status === 'uploading' && (
        <div className="px-2 pt-1">
          <Progress value={image.uploadProgress} className="h-1" />
        </div>
      )}

      {/* Info */}
      <div className="p-2">
        <p className="text-xs font-medium text-foreground truncate font-arabic" title={image.name}>
          {image.name}
        </p>
        <p className="text-xs text-muted-foreground font-arabic">{formatBytes(image.sizeBytes)}</p>
        {image.status === 'uploading' && (
          <p className="text-xs text-primary font-arabic">{image.uploadProgress}%</p>
        )}
        {image.status === 'ready' && (
          <p className="text-xs text-emerald-400 font-arabic">جاهز</p>
        )}
      </div>
    </div>
  );
}
