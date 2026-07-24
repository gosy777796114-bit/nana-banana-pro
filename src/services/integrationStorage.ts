import type { IntegrationData, TestConnectionResult } from '@/types/integration';

const STORAGE_KEY = 'nano_banana_integrations';
const ACTIVE_KEY = 'nano_banana_active_connection';

function lsLoadList(): IntegrationData[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as IntegrationData[];
  } catch {
    return [];
  }
}

function lsSaveList(list: IntegrationData[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function lsGetActiveId(): string | null {
  return localStorage.getItem(ACTIVE_KEY);
}

function lsSetActiveId(id: string | null): void {
  if (id) {
    localStorage.setItem(ACTIVE_KEY, id);
  } else {
    localStorage.removeItem(ACTIVE_KEY);
  }
}

export function loadIntegrations(): IntegrationData[] {
  return lsLoadList();
}

export function saveIntegrations(list: IntegrationData[]): void {
  lsSaveList(list);
}

export function addIntegration(
  data: Omit<IntegrationData, 'id' | 'createdAt' | 'updatedAt'>
): IntegrationData {
  const list = lsLoadList();
  const now = new Date().toISOString();
  const entry: IntegrationData = {
    ...data,
    id: `int_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: now,
    updatedAt: now,
  };
  list.push(entry);
  lsSaveList(list);
  return entry;
}

export function updateIntegration(
  id: string,
  changes: Partial<IntegrationData>
): IntegrationData | null {
  const list = lsLoadList();
  const idx = list.findIndex(c => c.id === id);
  if (idx === -1) return null;
  list[idx] = { ...list[idx], ...changes, updatedAt: new Date().toISOString() };
  lsSaveList(list);
  return list[idx];
}

export function deleteIntegration(id: string): boolean {
  const list = lsLoadList().filter(c => c.id !== id);
  const changed = list.length < lsLoadList().length;
  if (changed) {
    lsSaveList(list);
    if (lsGetActiveId() === id) {
      lsSetActiveId(list.length > 0 ? list[0].id : null);
    }
  }
  return changed;
}

export function getActiveConnectionId(): string | null {
  return lsGetActiveId();
}

export function setActiveConnectionId(id: string | null): void {
  lsSetActiveId(id);
}

export function getActiveIntegration(): IntegrationData | null {
  const list = lsLoadList();
  const activeId = lsGetActiveId();
  if (!activeId) return list.length > 0 ? list[0] : null;
  return list.find(c => c.id === activeId) ?? (list.length > 0 ? list[0] : null);
}

export function ensureDefaultConnection(
  defaultData: Omit<IntegrationData, 'id' | 'createdAt' | 'updatedAt'>
): IntegrationData {
  const list = lsLoadList();
  if (list.length === 0) {
    const entry = addIntegration(defaultData);
    lsSetActiveId(entry.id);
    return entry;
  }
  if (!lsGetActiveId()) {
    lsSetActiveId(list[0].id);
  }
  return getActiveIntegration()!;
}

export function importFromJSON(jsonStr: string): IntegrationData[] {
  const parsed = JSON.parse(jsonStr);
  const items: unknown[] = Array.isArray(parsed) ? parsed : [parsed];
  const list = lsLoadList();
  const now = new Date().toISOString();
  const imported: IntegrationData[] = [];

  for (const item of items) {
    if (!item || typeof item !== 'object') continue;
    const obj = item as Record<string, unknown>;
    if (!obj.name || !obj.baseUrl || !obj.genKey || !obj.visionKey) continue;
    const entry: IntegrationData = {
      id: `int_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name: String(obj.name || 'اتصال مستورد'),
      architectureType: (obj.architectureType as 'direct' | 'through-proxy') || 'direct',
      baseUrl: String(obj.baseUrl || ''),
      appId: String(obj.appId || ''),
      genModel: String(obj.genModel || ''),
      visionModel: String(obj.visionModel || ''),
      genKey: String(obj.genKey || ''),
      visionKey: String(obj.visionKey || ''),
      headerKey: String(obj.headerKey || 'X-App-Id'),
      headerValue: String(obj.headerValue || ''),
      submitUrl: obj.submitUrl ? String(obj.submitUrl) : undefined,
      queryUrl: obj.queryUrl ? String(obj.queryUrl) : undefined,
      createdAt: now,
      updatedAt: now,
    };
    list.push(entry);
    imported.push(entry);
  }

  lsSaveList(list);
  return imported;
}

export function importFromTXT(txt: string): IntegrationData[] {
  const blocks = txt.split('---').filter(b => b.trim());
  const list = lsLoadList();
  const now = new Date().toISOString();
  const imported: IntegrationData[] = [];

  for (const block of blocks) {
    const lines = block.trim().split('\n').filter(l => l.trim());
    const data: Record<string, string> = {};
    for (const line of lines) {
      const colonIdx = line.indexOf(':');
      if (colonIdx === -1) continue;
      const key = line.slice(0, colonIdx).trim();
      const val = line.slice(colonIdx + 1).trim();
      data[key] = val;
    }
    if (!data['BASE_URL'] && !data['Gen Key']) continue;

    const entry: IntegrationData = {
      id: `int_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name: data['اسم الاتصال'] || 'اتصال مستورد',
      architectureType: (data['نوع المعمارية'] as 'direct' | 'through-proxy') || 'direct',
      baseUrl: data['BASE_URL'] || '',
      appId: data['APP_ID'] || '',
      genModel: data['Gen Model'] || '',
      visionModel: data['Vision Model'] || '',
      genKey: data['Gen Key'] || '',
      visionKey: data['Vision Key'] || '',
      headerKey: data['Header Key'] || 'X-App-Id',
      headerValue: data['Header Value'] || '',
      createdAt: now,
      updatedAt: now,
    };
    list.push(entry);
    imported.push(entry);
  }

  lsSaveList(list);
  return imported;
}

export function exportToTXT(list: IntegrationData[]): string {
  return list.map(conn => {
    return [
      '---',
      `اسم الاتصال: ${conn.name}`,
      `نوع المعمارية: ${conn.architectureType}`,
      `BASE_URL: ${conn.baseUrl}`,
      `APP_ID: ${conn.appId}`,
      `Gen Model: ${conn.genModel}`,
      `Vision Model: ${conn.visionModel}`,
      `Gen Key: ${conn.genKey}`,
      `Vision Key: ${conn.visionKey}`,
      `Header Key: ${conn.headerKey}`,
      `Header Value: ${conn.headerValue}`,
      '---',
    ].join('\n');
  }).join('\n');
}

export function exportToJSON(list: IntegrationData[]): string {
  return JSON.stringify(list, null, 2);
}

export async function testConnection(
  conn: IntegrationData
): Promise<TestConnectionResult> {
  const start = performance.now();
  try {
    const response = await fetch(conn.genKey, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        [conn.headerKey]: conn.headerValue,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'test connection ping' }] }],
      }),
    });
    const latencyMs = Math.round(performance.now() - start);
    const text = await response.text();
    return {
      success: response.ok,
      statusCode: response.status,
      message: response.ok
        ? `تم الاتصال بنجاح (${response.status})`
        : `خطأ HTTP ${response.status}`,
      latencyMs,
      details: text.slice(0, 500),
    };
  } catch (err) {
    const latencyMs = Math.round(performance.now() - start);
    return {
      success: false,
      statusCode: 0,
      message: err instanceof Error ? err.message : 'خطأ غير معروف في الاتصال',
      latencyMs,
    };
  }
}
