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
  setPersistence,
  browserLocalPersistence,
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

// Enforce local persistence so login survives browser / PWA reloads
if (typeof window !== 'undefined') {
  setPersistence(auth, browserLocalPersistence).catch((err) => {
    console.warn('Firebase setPersistence info:', err);
  });
}

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

// Sign in with Google — prioritize signInWithPopup on all modern browsers (including mobile Chrome & Safari).
// Popup keeps user context, avoids third-party redirect cookie loss in PWAs, and returns immediately.
export async function signInWithGoogle(): Promise<User> {
  const isFile =
    typeof window !== 'undefined' &&
    (window.location.protocol === 'file:' || window.location.href.startsWith('file:'));

  if (isFile) {
    const err: any = new Error(
      'ورود با گوگل روی فایل محلی پشتیبانی نمی‌شود. لطفاً با ایمیل و رمز عبور وارد شوید.'
    );
    err.code = 'auth/operation-not-supported-in-this-environment';
    throw err;
  }

  // 1. In standalone WebViews that strictly forbid popups, fallback to redirect
  if (isEmbeddedWebView()) {
    await signInWithRedirect(auth, googleProvider);
    const pending: any = new Error('در حال انتقال به صفحه ورود گوگل…');
    pending.code = 'auth/redirect-pending';
    throw pending;
  }

  // 2. Try standard popup first (works smoothly on Android Chrome, iOS Safari, and Desktop)
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (err: any) {
    console.warn('signInWithPopup failed:', err?.code, err?.message);
    if (err?.code === 'auth/popup-closed-by-user') {
      throw err;
    }
    // If popup was blocked or unavailable, attempt redirect as secondary fallback
    if (
      err?.code === 'auth/popup-blocked' ||
      err?.code === 'auth/cancelled-popup-request' ||
      err?.code === 'auth/operation-not-supported-in-this-environment'
    ) {
      await signInWithRedirect(auth, googleProvider);
      const pending: any = new Error('در حال انتقال به صفحه ورود گوگل…');
      pending.code = 'auth/redirect-pending';
      throw pending;
    }
    throw err;
  }
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

export interface CachedAuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

const CACHED_USER_KEY = 'nativespeak_cached_auth_user_v1';

export function getCachedAuthUser(): CachedAuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CACHED_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

export function saveCachedAuthUser(user: { uid: string; email: string | null; displayName: string | null; photoURL: string | null }) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CACHED_USER_KEY, JSON.stringify({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
    }));
  } catch (e) {}
}

export function clearCachedAuthUser() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(CACHED_USER_KEY);
  } catch (e) {}
}

// Sign out
export async function logOut(): Promise<void> {
  clearCachedAuthUser();
  await signOut(auth);
}

// Auth State Listener
export function subscribeToAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, (user) => {
    if (user) {
      saveCachedAuthUser(user);
    }
    callback(user);
  });
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
  scenarioDrafts?: Record<string, any>;
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
