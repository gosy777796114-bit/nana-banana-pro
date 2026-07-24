import { Client, Databases, Query, ID } from 'appwrite';

const APPWRITE_ENDPOINT = import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const APPWRITE_PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID || '';
const APPWRITE_DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID || '';
const APPWRITE_COLLECTION_ID = import.meta.env.VITE_APPWRITE_COLLECTION_ID || '';

const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID);

const databases = new Databases(client);

export const appwriteConfig = {
  endpoint: APPWRITE_ENDPOINT,
  projectId: APPWRITE_PROJECT_ID,
  databaseId: APPWRITE_DATABASE_ID,
  collectionId: APPWRITE_COLLECTION_ID,
};

export async function appwriteListDocuments() {
  if (!APPWRITE_PROJECT_ID || !APPWRITE_DATABASE_ID || !APPWRITE_COLLECTION_ID) {
    return null;
  }
  try {
    const response = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      APPWRITE_COLLECTION_ID,
      [Query.orderDesc('$createdAt')]
    );
    return response.documents;
  } catch {
    return null;
  }
}

export async function appwriteCreateDocument(data: Record<string, unknown>) {
  if (!APPWRITE_PROJECT_ID || !APPWRITE_DATABASE_ID || !APPWRITE_COLLECTION_ID) {
    return null;
  }
  try {
    return await databases.createDocument(
      APPWRITE_DATABASE_ID,
      APPWRITE_COLLECTION_ID,
      ID.unique(),
      data
    );
  } catch {
    return null;
  }
}

export async function appwriteUpdateDocument(documentId: string, data: Record<string, unknown>) {
  if (!APPWRITE_PROJECT_ID || !APPWRITE_DATABASE_ID || !APPWRITE_COLLECTION_ID) {
    return null;
  }
  try {
    return await databases.updateDocument(
      APPWRITE_DATABASE_ID,
      APPWRITE_COLLECTION_ID,
      documentId,
      data
    );
  } catch {
    return null;
  }
}

export async function appwriteDeleteDocument(documentId: string) {
  if (!APPWRITE_PROJECT_ID || !APPWRITE_DATABASE_ID || !APPWRITE_COLLECTION_ID) {
    return false;
  }
  try {
    await databases.deleteDocument(
      APPWRITE_DATABASE_ID,
      APPWRITE_COLLECTION_ID,
      documentId
    );
    return true;
  } catch {
    return false;
  }
}
