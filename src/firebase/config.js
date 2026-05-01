import { initializeApp } from 'firebase/app';
import { doc, getDoc, getFirestore, serverTimestamp, setDoc } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { browserLocalPersistence, getAuth, setPersistence } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

// Sesión admin sobrevive recargas y cierres de pestaña. En v9+ browser es el
// default, pero lo declaramos para no depender de cambios futuros del SDK.
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn('auth setPersistence failed', err?.code || err);
});

const CONFIG_GENERAL_DEFAULTS = {
  totalRaised: 0,
  totalContributors: 0,
  totalTripCost: 10500,
  heroTitle: '',
  heroSubtitle: '',
};

// Crea config/general con defaults si falta. Idempotente. Solo admin autenticado
// puede ejecutarlo (lo refuerzan las rules); el público lee y la UI tolera null.
export async function ensureConfigGeneral() {
  const ref = doc(db, 'config', 'general');
  try {
    const snap = await getDoc(ref);
    if (snap.exists()) return { created: false };
    await setDoc(ref, { ...CONFIG_GENERAL_DEFAULTS, createdAt: serverTimestamp() });
    return { created: true };
  } catch (err) {
    console.warn('ensureConfigGeneral failed', err?.code || err);
    return { created: false, error: err };
  }
}
