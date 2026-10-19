import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

function isEmbeddedWebView(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const isFile =
    typeof window !== 'undefined' &&
    (window.location.protocol === 'file:' || window.location.href.startsWith('file:'));
  // Android WebView / in-app browsers — popup OAuth usually fails
  return isFile || /; wv\)/i.test(ua);
}

/** Complete Google redirect flow after app reload (call once on boot). */
export async function completeGoogleRedirectIfAny(): Promise<User | null> {
  try {
    const result = await getRedirectResult(auth);
    return result?.user || null;
  } catch (e) {
    console.warn('getRedirectResult failed:', e);
    return null;
  }
}

// Sign in with Google — popup on desktop browsers; redirect inside WebView/https
export async function signInWithGoogle(): Promise<User> {
  const isFile =
    typeof window !== 'undefined' &&
    (window.location.protocol === 'file:' || window.location.href.startsWith('file:'));

  if (isFile) {
    const err: any = new Error(
      'ورود با گوگل روی فایل محلی APK پشتیبانی نمی‌شود. لطفاً با ایمیل و رمز عبور وارد شوید، یا اپ را از نسخه آنلاین باز کنید.'
    );
    err.code = 'auth/operation-not-supported-in-this-environment';
    throw err;
  }

  if (isEmbeddedWebView() || /Android|iPhone|iPad/i.test(navigator.userAgent || '')) {
    await signInWithRedirect(auth, googleProvider);
    // Redirect leaves the page — caller should not expect an immediate user
    const pending: any = new Error('در حال انتقال به صفحه ورود گوگل…');
    pending.code = 'auth/redirect-pending';
    throw pending;
  }

  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

// Register with Email and Password
export async function registerWithEmail(
  email: string,
  pass: string,
  displayName?: string
): Promise<User> {
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
  if (displayName && cred.user) {
    try {
      await updateProfile(cred.user, { displayName });
    } catch (e) {
      console.warn('Could not update profile display name:', e);
    }
  }
  return cred.user;
}

// Sign in with Email and Password
export async function signInWithEmail(email: string, pass: string): Promise<User> {
  const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
  return cred.user;
}

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
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
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
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
}

// Sign out
export async function logOut(): Promise<void> {
  await signOut(auth);
}

// Auth State Listener
export function subscribeToAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

// User Firestore Data Container
export interface UserCloudData {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  assessment?: any;
  calendar?: any[];
  weaknesses?: any[];
  c2ChecklistState?: any;
  leitnerWords?: any[];
  practiceItems?: any[];
  progress?: any;
  activeScenarioId?: string;
  updatedAt?: any;
}

// Load User Data from Firestore
export async function loadUserCloudData(uid: string): Promise<UserCloudData | null> {
  const path = `users/${uid}`;
  try {
    const userDocRef = doc(db, 'users', uid);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      return snap.data() as UserCloudData;
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
    return null;
  }
}

// Save User Data to Firestore
export async function saveUserCloudData(
  uid: string,
  data: Partial<UserCloudData>
): Promise<void> {
  const path = `users/${uid}`;
  try {
    const userDocRef = doc(db, 'users', uid);
    await setDoc(
      userDocRef,
      {
        ...data,
        uid,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}
