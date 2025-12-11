// src/firebase/index.js
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAnalytics, isSupported as isAnalyticsSupported } from 'firebase/analytics';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Validate config
function validateConfig(config) {
  const requiredFields = ['apiKey', 'authDomain', 'projectId'];
  const missingFields = requiredFields.filter(field => !config[field]);
  
  if (missingFields.length > 0) {
    throw new Error(`Missing Firebase config: ${missingFields.join(', ')}`);
  }
  
  return true;
}

// Singleton instances
let firebaseInstances = null;

/**
 * Initialize Firebase and return instances
 * @returns {{ app: FirebaseApp, auth: Auth, db: Firestore, analytics: Analytics | null, storage: FirebaseStorage | null }}
 */
export function initializeFirebase() {
  // Return cached instances if already initialized
  if (firebaseInstances) {
    return firebaseInstances;
  }

  try {
    // Validate configuration
    validateConfig(firebaseConfig);

    // Initialize or get existing app
    const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

    // Initialize Auth
    const auth = getAuth(app);

    // Initialize Firestore
    const db = getFirestore(app);

    // Initialize Storage (optional)
    let storage = null;
    try {
      if (firebaseConfig.storageBucket) {
        storage = getStorage(app);
      }
    } catch (storageError) {
      console.warn('Firebase Storage initialization failed:', storageError);
    }

    // Initialize Analytics (client-side only)
    let analytics = null;
    if (typeof window !== 'undefined') {
      isAnalyticsSupported()
        .then(supported => {
          if (supported && firebaseConfig.measurementId) {
            analytics = getAnalytics(app);
          }
        })
        .catch(err => {
          console.warn('Firebase Analytics not supported:', err);
        });
    }

    // Connect to emulators in development
    if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_EMULATORS === 'true') {
      try {
        connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
        connectFirestoreEmulator(db, 'localhost', 8080);
        if (storage) {
          connectStorageEmulator(storage, 'localhost', 9199);
        }
        console.log('Connected to Firebase emulators');
      } catch (emulatorError) {
        console.warn('Failed to connect to emulators:', emulatorError);
      }
    }

    // Cache instances
    firebaseInstances = {
      app,
      auth,
      db,
      analytics,
      storage,
    };

    return firebaseInstances;
  } catch (error) {
    console.error('Firebase initialization error:', error);
    throw error;
  }
}

/**
 * Get Firebase instances (throws if not initialized)
 */
export function getFirebaseInstances() {
  if (!firebaseInstances) {
    throw new Error('Firebase not initialized. Call initializeFirebase() first.');
  }
  return firebaseInstances;
}

/**
 * Check if Firebase is initialized
 */
export function isFirebaseInitialized() {
  return !!firebaseInstances;
}

// Export config for reference (without sensitive data logging)
export function getFirebaseConfig() {
  return {
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain,
  };
}