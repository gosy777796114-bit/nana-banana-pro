import type { SavedPrompt } from '@/types/types';

const STORAGE_KEY = 'nano_banana_saved_prompts';

// ── Helpers for pywebview API ──────────────────────────────────────
function isDesktop(): boolean {
  return !!(window as any).pywebview?.api;
}

async function desktopSave(prompts: SavedPrompt[]): Promise<void> {
  try {
    await (window as any).pywebview.api.save_data(
      STORAGE_KEY,
      JSON.stringify(prompts)
    );
  } catch (e) {
    console.error('Desktop save failed', e);
  }
}

async function desktopLoad(): Promise<SavedPrompt[] | null> {
  try {
    const raw: string = await (window as any).pywebview.api.load_data(STORAGE_KEY);
    if (!raw || raw === 'null') return null;
    return JSON.parse(raw) as SavedPrompt[];
  } catch (e) {
    console.error('Desktop load failed', e);
    return null;
  }
}

// ── localStorage fallback ──────────────────────────────────────────
function lsLoad(): SavedPrompt[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedPrompt[];
  } catch {
    return [];
  }
}

function lsSave(prompts: SavedPrompt[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prompts));
}

// ── Public API ────────────────────────────────────────────────────

/**
 * Load prompts — prefers desktop file storage when running in pywebview.
 * Falls back to localStorage in browser mode.
 */
export async function loadSavedPromptsAsync(): Promise<SavedPrompt[]> {
  if (isDesktop()) {
    const result = await desktopLoad();
    if (result !== null) return result;
  }
  return lsLoad();
}

/**
 * Synchronous load — only reads localStorage (used as initial state).
 * Async load happens after mount.
 */
export function loadSavedPrompts(): SavedPrompt[] {
  return lsLoad();
}

export function persistPrompts(prompts: SavedPrompt[]): void {
  // Always write localStorage as fallback/cache
  lsSave(prompts);
  // Also write to file if running as desktop app
  if (isDesktop()) {
    desktopSave(prompts).catch(console.error);
  }
}

export function savePrompt(name: string, text: string): SavedPrompt {
  const prompts = lsLoad();
  const now = new Date().toISOString();
  const newPrompt: SavedPrompt = {
    id: `prompt_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    name,
    text,
    createdAt: now,
    updatedAt: now,
  };
  prompts.unshift(newPrompt);
  persistPrompts(prompts);
  return newPrompt;
}

export function updatePrompt(id: string, changes: Partial<Pick<SavedPrompt, 'name' | 'text'>>): void {
  const prompts = lsLoad();
  const idx = prompts.findIndex(p => p.id === id);
  if (idx === -1) return;
  prompts[idx] = { ...prompts[idx], ...changes, updatedAt: new Date().toISOString() };
  persistPrompts(prompts);
}

export function deletePrompt(id: string): void {
  const prompts = lsLoad().filter(p => p.id !== id);
  persistPrompts(prompts);
}
