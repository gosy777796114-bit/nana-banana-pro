export interface IntegrationData {
  id: string;
  name: string;
  architectureType: 'direct' | 'through-proxy';
  baseUrl: string;
  appId: string;
  genModel: string;
  visionModel: string;
  genKey: string;
  visionKey: string;
  headerKey: string;
  headerValue: string;
  submitUrl?: string;
  queryUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TestConnectionResult {
  success: boolean;
  statusCode: number;
  message: string;
  latencyMs: number;
  details?: string;
}

export const DEFAULT_INTEGRATION: Omit<IntegrationData, 'id' | 'createdAt' | 'updatedAt'> = {
  name: 'بنانه برو',
  architectureType: 'direct',
  baseUrl: 'https://api-integrations.appmedo.com/app-8actmiuaw4ch',
  appId: 'app-8actmiuaw4ch',
  genModel: 'api-Xa6JZ58oPMEa/v1beta/models/gemini-3-pro-image-preview:generateContent',
  visionModel: 'api-rLob8RdzAOl9/v1beta/models/gemini-2.5-flash:generateContent',
  genKey: 'https://api-integrations.appmedo.com/app-8actmiuaw4ch/api-Xa6JZ58oPMEa/v1beta/models/gemini-3-pro-image-preview:generateContent',
  visionKey: 'https://api-integrations.appmedo.com/app-8actmiuaw4ch/api-rLob8RdzAOl9/v1beta/models/gemini-2.5-flash:generateContent',
  headerKey: 'X-App-Id',
  headerValue: 'app-8actmiuaw4ch',
  submitUrl: '',
  queryUrl: '',
};
