'use client';

import { createContext, useContext, useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { 
  onAuthStateChanged, 
  onIdTokenChanged, 
  getIdToken,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail,
  browserLocalPersistence,
  browserSessionPersistence,
  setPersistence,
} from 'firebase/auth';
import { useFirebaseAuth } from './provider';

// ============================================
// CONTEXT
// ============================================

const AuthContext = createContext(undefined);

// ============================================
// HOOK
// ============================================

/**
 * Hook to access auth context values
 * @returns {AuthContextValue}
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// ============================================
// PROVIDER
// ============================================

export function AuthProvider({ children }) {
  const { auth, isReady: isFirebaseInitialized } = useFirebaseAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!isFirebaseInitialized || !auth) {
      setLoading(true);
      return;
    };

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (!isMountedRef.current) return;
      setUser(formatUser(firebaseUser));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth, isFirebaseInitialized]);

  useEffect(() => {
    if (!isFirebaseInitialized || !auth) return;

    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
      if (!isMountedRef.current) return;
      const newToken = firebaseUser ? await getIdToken(firebaseUser) : null;
      setToken(newToken);
    });

    return () => unsubscribe();
  }, [auth, isFirebaseInitialized]);
  
  // Auth functions
  const loginWithEmail = useCallback(async (email, password, rememberMe = true) => {
    if (!auth) throw new Error('Firebase no está inicializado');
    const trimmedEmail = email?.trim().toLowerCase();
    if (!trimmedEmail || !password || !isValidEmail(trimmedEmail)) throw new Error('Credenciales inválidas');
    
    const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
    try {
      await setPersistence(auth, persistence);
      const userCredential = await signInWithEmailAndPassword(auth, trimmedEmail, password);
      return formatUser(userCredential.user);
    } catch (error) {
      throw new Error(parseAuthError(error));
    }
  }, [auth]);

  const registerWithEmail = useCallback(async (email, password, displayName = '') => {
    if (!auth) throw new Error('Firebase no está inicializado');
    const trimmedEmail = email?.trim().toLowerCase();
    const trimmedName = displayName?.trim();
    if (!trimmedEmail || !isValidPassword(password) || !isValidEmail(trimmedEmail)) throw new Error('Datos de registro inválidos');

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
      if (trimmedName) {
        await updateProfile(userCredential.user, { displayName: trimmedName });
      }
      await sendEmailVerification(userCredential.user).catch(e => console.warn('No se pudo enviar email de verificación', e));
      
      const formattedUser = formatUser({ ...userCredential.user, displayName: trimmedName });
      setUser(formattedUser);
      return formattedUser;
    } catch (error) {
      throw new Error(parseAuthError(error));
    }
  }, [auth]);

  const logout = useCallback(async () => {
    if (!auth) throw new Error('Firebase no está inicializado');
    try {
      await signOut(auth);
      setUser(null);
      setToken(null);
    } catch (error) {
      throw new Error(parseAuthError(error));
    }
  }, [auth]);
  
  const resetPassword = useCallback(async (email) => {
    if (!auth) throw new Error('Firebase no está inicializado');
    const trimmedEmail = email?.trim().toLowerCase();
    if (!trimmedEmail || !isValidEmail(trimmedEmail)) throw new Error('Formato de correo inválido');
    try {
      await sendPasswordResetEmail(auth, trimmedEmail);
    } catch (error) {
      throw new Error(parseAuthError(error));
    }
  }, [auth]);
  
  const contextValue = useMemo(() => ({
    user,
    loading,
    token,
    isAuthenticated: !!user,
    loginWithEmail,
    registerWithEmail,
    logout,
    resetPassword,
  }), [user, loading, token, loginWithEmail, registerWithEmail, logout, resetPassword]);
  
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// ============================================
// UTILITIES
// ============================================

const AUTH_ERRORS = {
  'auth/email-already-in-use': 'Este correo ya está registrado',
  'auth/invalid-email': 'Correo electrónico inválido',
  'auth/operation-not-allowed': 'Operación no permitida',
  'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres',
  'auth/user-disabled': 'Esta cuenta ha sido deshabilitada',
  'auth/user-not-found': 'No existe una cuenta con este correo',
  'auth/wrong-password': 'Contraseña incorrecta',
  'auth/invalid-credential': 'Credenciales inválidas',
  'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde',
  'auth/network-request-failed': 'Error de conexión. Verifica tu internet',
  'auth/popup-closed-by-user': 'Ventana cerrada antes de completar',
  'auth/requires-recent-login': 'Por seguridad, inicia sesión nuevamente',
  'auth/credential-already-in-use': 'Esta credencial ya está en uso',
};

/**
 * Parse Firebase auth error to user-friendly message
 */
export function parseAuthError(error) {
  const code = error?.code;
  return AUTH_ERRORS[code] || error?.message || 'Error de autenticación';
}

/**
 * Validate email format
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 */
export function isValidPassword(password) {
  return password && password.length >= 6;
}

/**
 * Format user object
 */
export function formatUser(firebaseUser) {
  if (!firebaseUser) return null;
  
  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    displayName: firebaseUser.displayName,
    photoURL: firebaseUser.photoURL,
    emailVerified: firebaseUser.emailVerified,
    metadata: {
      creationTime: firebaseUser.metadata?.creationTime,
      lastSignInTime: firebaseUser.metadata?.lastSignInTime,
    },
    // Keep reference to original for operations
    _raw: firebaseUser,
  };
}
