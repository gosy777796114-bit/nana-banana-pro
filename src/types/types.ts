// Reference image uploaded by user
export interface ReferenceImage {
  id: string;
  index: number;
  file: File;
  name: string;
  sizeBytes: number;
  previewUrl: string; // object URL for display
  base64?: string;    // pure base64 (no data: prefix) for API
  mimeType: string;
  uploadProgress: number; // 0-100
  status: 'uploading' | 'ready' | 'error';
  errorMsg?: string;
}

// Saved prompt entry persisted in localStorage
export interface SavedPrompt {
  id: string;
  name: string;
  text: string;
  createdAt: string; // ISO string
  updatedAt: string;
}

// Dimension preset options
export interface DimensionPreset {
  label: string;       // Arabic display label e.g. "مربع (1:1)"
  value: string;       // key e.g. "square"
  width: number;
  height: number;
}

// Quality option
export interface QualityOption {
  label: string;  // "2K (2048px)"
  value: string;  // "2K"
  px: number;     // 2048
}

// Image settings state
export interface ImageSettings {
  dimensionPreset: string;  // preset value key or 'custom'
  customWidth: number;
  customHeight: number;
  quality: string;          // quality value key
}

// Generation task state
export type GenerationStatus =
  | 'idle'
  | 'submitting'
  | 'pending'
  | 'processing'
  | 'finalizing'
  | 'success'
  | 'failed';

// A single console log entry for diagnostics panel
export interface DiagnosticsLog {
  id: string;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
  timestamp: string;
  details?: string;
}

// Full diagnostics state
export interface DiagnosticsState {
  apiStatus: 'unknown' | 'online' | 'offline';
  referenceImageCount: number;
  promptCharCount: number;
  selectedDimensions: string;
  selectedQuality: string;
  lastError: string | null;
  lastErrorDetails: string | null;
  generationAttempt: number;
  warnings: string[];
  logs: DiagnosticsLog[];
}

// Generation result
export interface GenerationResult {
  imageUrl: string;
  width: number;      // requested width
  height: number;     // requested height
  quality: string;
  generationTimeMs: number;
  fileSizeEstimate?: string;
  actualWidth?: number;   // actual pixel width of received image
  actualHeight?: number;  // actual pixel height of received image
}
