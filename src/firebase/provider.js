'use client';

import { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { initializeFirebase } from './index';
import { AuthProvider } from './auth';

// ============================================
// TYPES & CONSTANTS
// ============================================

/**
 * @typedef {Object} FirebaseInstances
 * @property {import('firebase/app').FirebaseApp} app - Firebase app instance
 * @property {import('firebase/auth').Auth} auth - Firebase auth instance
 * @property {import('firebase/firestore').Firestore} db - Firestore instance
 * @property {import('firebase/analytics').Analytics|null} analytics - Analytics instance (null in SSR)
 * @property {import('firebase/storage').FirebaseStorage|null} storage - Storage instance
 */

/**
 * @typedef {Object} FirebaseContextValue
 * @property {FirebaseInstances|null} firebase - Firebase instances
 * @property {boolean} isInitialized - Whether Firebase is initialized
 * @property {boolean} isInitializing - Whether Firebase is initializing
 * @property {string|null} error - Initialization error message
 * @property {Function} retry - Function to retry initialization
 */

const INIT_TIMEOUT = 10000; // 10 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// ============================================
// CONTEXT
// ============================================

const FirebaseContext = createContext(undefined);

// ============================================
// PROVIDER
// ============================================

/**
 * Firebase Provider Component
 * Initializes Firebase and provides context to children
 */
export function FirebaseProvider({ 
  children,
  loadingComponent = null,
  errorComponent = null,
  onInitialized = null,
  onError = null,
}) {
  const [firebase, setFirebase] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  
  const isMountedRef = useRef(true);
  const initAttemptRef = useRef(0);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Initialize Firebase
  const initializeFirebaseWithTimeout = useCallback(async () => {
    if (!isMountedRef.current) return;

    setIsInitializing(true);
    setError(null);
    initAttemptRef.current += 1;
    const currentAttempt = initAttemptRef.current;

    try {
      // Create a promise that rejects after timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Tiempo de espera agotado al inicializar Firebase'));
        }, INIT_TIMEOUT);
      });

      // Race between initialization and timeout
      const instances = await Promise.race([
        Promise.resolve(initializeFirebase()),
        timeoutPromise,
      ]);

      // Check if component is still mounted and this is the latest attempt
      if (!isMountedRef.current || currentAttempt !== initAttemptRef.current) {
        return;
      }

      // Validate instances
      if (!instances || !instances.app || !instances.auth || !instances.db) {
        throw new Error('Firebase no se inicializó correctamente');
      }

      setFirebase(instances);
      setIsInitializing(false);
      setError(null);
      
      // Call success callback
      if (onInitialized) {
        onInitialized(instances);
      }
    } catch (err) {
      if (!isMountedRef.current || currentAttempt !== initAttemptRef.current) {
        return;
      }

      const errorMessage = err?.message || 'Error desconocido al inicializar Firebase';
      console.error('Firebase initialization error:', err);
      
      setError(errorMessage);
      setIsInitializing(false);
      
      // Call error callback
      if (onError) {
        onError(err);
      }
    }
  }, [onInitialized, onError]);

  // Initial initialization
  useEffect(() => {
    initializeFirebaseWithTimeout();
  }, [initializeFirebaseWithTimeout]);

  // Retry function
  const retry = useCallback(() => {
    if (retryCount >= MAX_RETRIES) {
      setError(`Máximo de reintentos alcanzado (${MAX_RETRIES}). Recarga la página.`);
      return;
    }

    setRetryCount(prev => prev + 1);
    
    // Add delay before retry
    setTimeout(() => {
      if (isMountedRef.current) {
        initializeFirebaseWithTimeout();
      }
    }, RETRY_DELAY * (retryCount + 1)); // Exponential backoff
  }, [retryCount, initializeFirebaseWithTimeout]);

  // Context value
  const contextValue = useMemo(() => ({
    // Firebase instances (spread for convenience)
    ...(firebase || {}),
    
    // State
    isInitialized: !!firebase,
    isInitializing,
    error,
    
    // Actions
    retry,
    retryCount,
    maxRetries: MAX_RETRIES,
  }), [firebase, isInitializing, error, retry, retryCount]);

  // Show loading state
  if (isInitializing) {
    if (loadingComponent) {
      return loadingComponent;
    }
    
    return <LoadingScreen message="Inicializando..." />;
  }

  // Show error state
  if (error && !firebase) {
    if (errorComponent) {
      return errorComponent;
    }
    
    return (
      <ErrorScreen 
        message={error} 
        onRetry={retryCount < MAX_RETRIES ? retry : null}
        retryCount={retryCount}
        maxRetries={MAX_RETRIES}
      />
    );
  }

  // Firebase initialized successfully
  return (
    <FirebaseContext.Provider value={contextValue}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </FirebaseContext.Provider>
  );
}

// ============================================
// LOADING & ERROR SCREENS
// ============================================

function LoadingScreen({ message = 'Cargando...' }) {
  return (
    <div 
      className="min-h-screen min-h-[100dvh] w-full flex flex-col items-center justify-center bg-background"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex flex-col items-center gap-4">
        {/* Spinner */}
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-2 border-muted" />
          <div className="absolute inset-0 w-12 h-12 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
        
        {/* Message */}
        <p className="text-sm text-muted-foreground animate-pulse">
          {message}
        </p>
      </div>
      
      {/* Screen reader text */}
      <span className="sr-only">Cargando aplicación, por favor espera</span>
    </div>
  );
}

function ErrorScreen({ message, onRetry, retryCount, maxRetries }) {
  return (
    <div 
      className="min-h-screen min-h-[100dvh] w-full flex flex-col items-center justify-center bg-background p-6"
      role="alert"
      aria-live="assertive"
    >
      <div className="flex flex-col items-center gap-6 max-w-sm text-center">
        {/* Error Icon */}
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <svg 
            className="w-8 h-8 text-destructive" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
            aria-hidden="true"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
            />
          </svg>
        </div>
        
        {/* Title */}
        <div>
          <h1 className="text-xl font-bold text-foreground mb-2">
            Error de conexión
          </h1>
          <p className="text-sm text-muted-foreground">
            {message}
          </p>
        </div>
        
        {/* Retry Button */}
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 active:scale-[0.98] transition-all"
          >
            Reintentar ({retryCount}/{maxRetries})
          </button>
        )}
        
        {/* Reload hint */}
        {!onRetry && (
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-secondary text-foreground rounded-xl font-medium hover:bg-secondary/80 active:scale-[0.98] transition-all"
          >
            Recargar página
          </button>
        )}
        
        {/* Help text */}
        <p className="text-xs text-muted-foreground">
          Si el problema persiste, verifica tu conexión a internet.
        </p>
      </div>
    </div>
  );
}

// ============================================
// HOOKS
// ============================================

/**
 * Hook to access full Firebase context
 * @returns {FirebaseContextValue}
 */
export function useFirebase() {
  const context = useContext(FirebaseContext);
  
  if (context === undefined) {
    throw new Error('useFirebase debe usarse dentro de un FirebaseProvider');
  }
  
  return context;
}

/**
 * Hook to access Firestore instance
 * @returns {{ db: import('firebase/firestore').Firestore, isReady: boolean }}
 */
export function useFirestore() {
  const context = useContext(FirebaseContext);
  
  if (context === undefined) {
    throw new Error('useFirestore debe usarse dentro de un FirebaseProvider');
  }
  
  return {
    db: context.db,
    isReady: !!context.db,
  };
}

/**
 * Hook to access Firebase Auth instance
 * @returns {{ auth: import('firebase/auth').Auth, isReady: boolean }}
 */
export function useFirebaseAuth() {
  const context = useContext(FirebaseContext);
  
  if (context === undefined) {
    throw new Error('useFirebaseAuth debe usarse dentro de un FirebaseProvider');
  }
  
  return {
    auth: context.auth,
    isReady: !!context.auth,
  };
}

/**
 * Hook to access Firebase Storage instance
 * @returns {{ storage: import('firebase/storage').FirebaseStorage | null, isReady: boolean }}
 */
export function useStorage() {
  const context = useContext(FirebaseContext);
  
  if (context === undefined) {
    throw new Error('useStorage debe usarse dentro de un FirebaseProvider');
  }
  
  return {
    storage: context.storage || null,
    isReady: !!context.storage,
  };
}

/**
 * Hook to access Firebase Analytics instance
 * @returns {{ analytics: import('firebase/analytics').Analytics | null, isReady: boolean }}
 */
export function useAnalytics() {
  const context = useContext(FirebaseContext);
  
  if (context === undefined) {
    throw new Error('useAnalytics debe usarse dentro de un FirebaseProvider');
  }
  
  return {
    analytics: context.analytics || null,
    isReady: !!context.analytics,
  };
}

/**
 * Hook to check Firebase connection status
 * @returns {{ isOnline: boolean, isInitialized: boolean, error: string | null }}
 */
export function useFirebaseStatus() {
  const context = useContext(FirebaseContext);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    // Set initial state
    setIsOnline(navigator.onLine);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (context === undefined) {
    return {
      isOnline,
      isInitialized: false,
      error: 'FirebaseProvider no encontrado',
    };
  }

  return {
    isOnline,
    isInitialized: context.isInitialized,
    isInitializing: context.isInitializing,
    error: context.error,
  };
}

/**
 * Hook for Firebase initialization with callback
 * Useful for analytics events or other side effects
 */
export function useFirebaseInit(callback) {
  const { isInitialized, error } = useFirebase();
  const callbackRef = useRef(callback);
  const hasCalledRef = useRef(false);

  // Update callback ref
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Call callback when initialized
  useEffect(() => {
    if (isInitialized && !hasCalledRef.current && callbackRef.current) {
      hasCalledRef.current = true;
      callbackRef.current({ success: true });
    }
    
    if (error && !hasCalledRef.current && callbackRef.current) {
      hasCalledRef.current = true;
      callbackRef.current({ success: false, error });
    }
  }, [isInitialized, error]);
}