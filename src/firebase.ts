import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY?.trim() || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN?.trim() || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID?.trim() || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET?.trim() || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID?.trim() || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID?.trim() || '',
};

export const missingFirebaseEnvVars: string[] = [
  !firebaseConfig.apiKey && 'VITE_FIREBASE_API_KEY',
  !firebaseConfig.authDomain && 'VITE_FIREBASE_AUTH_DOMAIN',
  !firebaseConfig.projectId && 'VITE_FIREBASE_PROJECT_ID',
  !firebaseConfig.storageBucket && 'VITE_FIREBASE_STORAGE_BUCKET',
  !firebaseConfig.messagingSenderId && 'VITE_FIREBASE_MESSAGING_SENDER_ID',
  !firebaseConfig.appId && 'VITE_FIREBASE_APP_ID',
].filter((v): v is string => Boolean(v));

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let googleProvider: GoogleAuthProvider | null = null;

if (isFirebaseConfigured) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  googleProvider = new GoogleAuthProvider();
  googleProvider.setCustomParameters({
    prompt: 'select_account',
  });
}

export { app, auth, db, googleProvider };
