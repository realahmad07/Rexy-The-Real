import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { initializeFirestore, doc, setDoc, getDoc, collection, query, where, onSnapshot, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Use initializeFirestore with settings optimized for the preview environment
const databaseId = (firebaseConfig as any).firestoreDatabaseId || '(default)';
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, databaseId);

// Validate Connection to Firestore
async function testConnection() {
  try {
    // Only run if we are in a browser environment
    if (typeof window === 'undefined') return;

    console.log(`[Firebase] Initializing connection to database: ${databaseId}`);
    
    // Attempt a real server request to verify connectivity
    // We use a dummy doc path
    const testDoc = doc(db, '_connection_test', 'once');
    await getDocFromServer(testDoc).catch(() => {
      // If server fetch fails, it might be first boot or offline
      // We don't throw here to avoid blocking the app, but we log it
      console.warn("[Firebase] Initial server connection test failed. Firestore may be in offline mode.");
    });
    
    console.log("[Firebase] Firestore initialization complete.");
  } catch (error: any) {
    console.error("[Firebase] Connection test error:", error);
  }
}

// Only run on client
if (typeof window !== 'undefined') {
  testConnection();
}

export const googleProvider = new GoogleAuthProvider();
