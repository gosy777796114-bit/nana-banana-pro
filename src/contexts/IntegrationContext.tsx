import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { IntegrationData, TestConnectionResult } from '@/types/integration';
import { DEFAULT_INTEGRATION } from '@/types/integration';
import * as storage from '@/services/integrationStorage';
import {
  appwriteListDocuments,
  appwriteCreateDocument,
  appwriteUpdateDocument,
  appwriteDeleteDocument,
  appwriteConfig,
} from '@/db/appwrite';

interface IntegrationContextType {
  connections: IntegrationData[];
  activeConnection: IntegrationData | null;
  isLoading: boolean;
  addConnection: (data: Omit<IntegrationData, 'id' | 'createdAt' | 'updatedAt'>) => IntegrationData;
  updateConnection: (id: string, changes: Partial<IntegrationData>) => void;
  deleteConnection: (id: string) => void;
  activateConnection: (id: string) => void;
  testConnection: (conn: IntegrationData) => Promise<TestConnectionResult>;
  importConnections: (data: string, format: 'json' | 'txt') => number;
  exportConnections: (format: 'json' | 'txt') => string;
  refreshConnections: () => void;
}

const IntegrationContext = createContext<IntegrationContextType | null>(null);

export function useIntegration(): IntegrationContextType {
  const ctx = useContext(IntegrationContext);
  if (!ctx) throw new Error('useIntegration must be used within IntegrationProvider');
  return ctx;
}

const useAppwrite = Boolean(appwriteConfig.projectId && appwriteConfig.databaseId && appwriteConfig.collectionId);

export function IntegrationProvider({ children }: { children: React.ReactNode }) {
  const [connections, setConnections] = useState<IntegrationData[]>([]);
  const [activeConnection, setActiveConnection] = useState<IntegrationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(() => {
    const list = storage.loadIntegrations();
    setConnections(list);
    const active = storage.getActiveIntegration();
    setActiveConnection(active);
  }, []);

  useEffect(() => {
    const init = async () => {
      if (useAppwrite) {
        const docs = await appwriteListDocuments();
        if (docs && docs.length > 0) {
          const list: IntegrationData[] = docs.map((d: Record<string, unknown>) => ({
            id: String(d.appwriteId || d.$id || d.id),
            name: String(d.name || ''),
            architectureType: (d.architectureType as 'direct' | 'through-proxy') || 'direct',
            baseUrl: String(d.baseUrl || ''),
            appId: String(d.appId || ''),
            genModel: String(d.genModel || ''),
            visionModel: String(d.visionModel || ''),
            genKey: String(d.genKey || ''),
            visionKey: String(d.visionKey || ''),
            headerKey: String(d.headerKey || 'X-App-Id'),
            headerValue: String(d.headerValue || ''),
            submitUrl: d.submitUrl ? String(d.submitUrl) : undefined,
            queryUrl: d.queryUrl ? String(d.queryUrl) : undefined,
            createdAt: String(d.createdAt || d.$createdAt || ''),
            updatedAt: String(d.updatedAt || d.$updatedAt || ''),
          }));
          storage.saveIntegrations(list);
        }
      }

      if (storage.loadIntegrations().length === 0) {
        storage.ensureDefaultConnection(DEFAULT_INTEGRATION);
      }
      refresh();
      setIsLoading(false);
    };
    init();
  }, [refresh]);

  const addConnection = useCallback(
    async (data: Omit<IntegrationData, 'id' | 'createdAt' | 'updatedAt'>) => {
      const entry = storage.addIntegration(data);
      if (useAppwrite) {
        await appwriteCreateDocument({ ...data, appwriteId: entry.id });
      }
      refresh();
      return entry;
    },
    [refresh]
  );

  const updateConnection = useCallback(
    async (id: string, changes: Partial<IntegrationData>) => {
      storage.updateIntegration(id, changes);
      if (useAppwrite) {
        await appwriteUpdateDocument(id, changes);
      }
      refresh();
    },
    [refresh]
  );

  const deleteConnection = useCallback(
    async (id: string) => {
      storage.deleteIntegration(id);
      if (useAppwrite) {
        await appwriteDeleteDocument(id);
      }
      refresh();
    },
    [refresh]
  );

  const activateConnection = useCallback(
    (id: string) => {
      storage.setActiveConnectionId(id);
      refresh();
    },
    [refresh]
  );

  const testConn = useCallback(
    async (conn: IntegrationData) => storage.testConnection(conn),
    []
  );

  const importConnections = useCallback(
    (data: string, format: 'json' | 'txt') => {
      const imported =
        format === 'json'
          ? storage.importFromJSON(data)
          : storage.importFromTXT(data);
      if (useAppwrite && imported.length > 0) {
        imported.forEach(entry => {
          appwriteCreateDocument({ ...entry, appwriteId: entry.id });
        });
      }
      refresh();
      return imported.length;
    },
    [refresh]
  );

  const exportConnections = useCallback(
    (format: 'json' | 'txt') => {
      const list = storage.loadIntegrations();
      return format === 'json'
        ? storage.exportToJSON(list)
        : storage.exportToTXT(list);
    },
    []
  );

  const value: IntegrationContextType = {
    connections,
    activeConnection,
    isLoading,
    addConnection,
    updateConnection,
    deleteConnection,
    activateConnection,
    testConnection: testConn,
    importConnections,
    exportConnections,
    refreshConnections: refresh,
  };

  return (
    <IntegrationContext.Provider value={value}>
      {children}
    </IntegrationContext.Provider>
  );
}
