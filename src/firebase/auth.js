'use client';

import { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  updateEmail,
  updatePassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  reauthenticateWithCredential,
  EmailAuthProvider,
  deleteUser,
  browserLocalPersistence,
  browserSessionPersistence,
  setPersistence,
  getIdToken,
  onIdTokenChanged
} from 'firebase/auth';
import { useFirebase } from './provider';

// ============================================
// TYPES & CONSTANTS
// ============================================

/**
 * @typedef {Object} AuthUser
 * @property {string} uid - User ID
 * @property {string|null} email - User email
 * @property {string|null} displayName - Display name
 * @property {string|null} photoURL - Profile photo URL
 * @property {boolean} emailVerified - Email verification status
 * @property {Object} metadata - User metadata
 */

/**
 * @typedef {Object} AuthContextValue
 * @property {AuthUser|null} user - Current user
 * @property {boolean} loading - Initial loading state
 * @property {boolean} isAuthenticated - Whether user is logged in
 * @property {Function} loginWithEmail - Login with email/password
 * @property {Function} registerWithEmail - Register with email/password
 * @property {Function} logout - Sign out
 * @property {Function} resetPassword - Send password reset email
 * @property {Function} updateUserProfile - Update display name and photo
 * @property {Function} updateUserEmail - Update email (requires reauth)
 * @property {Function} updateUserPassword - Update password (requires reauth)
 * @property {Function} sendVerificationEmail - Send email verification
 * @property {Function} deleteAccount - Delete user account (requires reauth)
 * @property {Function} reauthenticate - Reauthenticate user
 * @property {Function} getToken - Get current ID token
 */

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
  'auth/invalid-verification-code': 'Código de verificación inválido',
  'auth/invalid-verification-id': 'ID de verificación inválido',
  'auth/missing-verification-code': 'Falta el código de verificación',
  'auth/missing-verification-id': 'Falta el ID de verificación',
};

// ============================================
// CONTEXT
// ============================================

const AuthContext = createContext(undefined);

/**
 * Hook to access auth context
 * @returns {AuthContextValue}
 */
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  
  return context;
}

// ============================================
// UTILITIES
// ============================================

/**
 * Parse Firebase auth error to user-friendly message
 */
function parseAuthError(error) {
  const code = error?.code;
  return AUTH_ERRORS[code] || error?.message || 'Error de autenticación';
}

/**
 * Validate email format
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 */
function isValidPassword(password) {
  return password && password.length >= 6;
}

/**
 * Format user object
 */
function formatUser(firebaseUser) {
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

// ============================================
// PROVIDER
// ============================================

export function AuthProvider({ children, persistSession = true }) {
  const { auth } = useFirebase();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);
  
  const isMountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Set persistence type
  useEffect(() => {
    if (!auth) return;

    const persistence = persistSession 
      ? browserLocalPersistence 
      : browserSessionPersistence;

    setPersistence(auth, persistence).catch(console.error);
  }, [auth, persistSession]);

  // Listen to auth state changes
  useEffect(() => {
    if (!auth) return;

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (!isMountedRef.current) return;
      
      setUser(formatUser(firebaseUser));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  // Listen to token changes (useful for keeping token fresh)
  useEffect(() => {
    if (!auth) return;

    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
      if (!isMountedRef.current) return;
      
      if (firebaseUser) {
        const newToken = await getIdToken(firebaseUser);
        setToken(newToken);
      } else {
        setToken(null);
      }
    });

    return () => unsubscribe();
  }, [auth]);

  /**
   * Login with email and password
   */
  const loginWithEmail = useCallback(async (email, password, rememberMe = true) => {
    if (!auth) {
      throw new Error('Firebase no está inicializado');
    }

    // Validate inputs
    const trimmedEmail = email?.trim().toLowerCase();
    
    if (!trimmedEmail) {
      throw new Error('El correo es requerido');
    }
    
    if (!isValidEmail(trimmedEmail)) {
      throw new Error('Formato de correo inválido');
    }
    
    if (!password) {
      throw new Error('La contraseña es requerida');
    }

    // Set persistence based on remember me
    const persistence = rememberMe 
      ? browserLocalPersistence 
      : browserSessionPersistence;
    
    try {
      await setPersistence(auth, persistence);
      const userCredential = await signInWithEmailAndPassword(auth, trimmedEmail, password);
      return formatUser(userCredential.user);
    } catch (error) {
      throw new Error(parseAuthError(error));
    }
  }, [auth]);

  /**
   * Register with email and password
   */
  const registerWithEmail = useCallback(async (email, password, displayName = '') => {
    if (!auth) {
      throw new Error('Firebase no está inicializado');
    }

    // Validate inputs
    const trimmedEmail = email?.trim().toLowerCase();
    const trimmedName = displayName?.trim();
    
    if (!trimmedEmail) {
      throw new Error('El correo es requerido');
    }
    
    if (!isValidEmail(trimmedEmail)) {
      throw new Error('Formato de correo inválido');
    }
    
    if (!isValidPassword(password)) {
      throw new Error('La contraseña debe tener al menos 6 caracteres');
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
      
      // Update profile with display name if provided
      if (trimmedName) {
        await updateProfile(userCredential.user, { displayName: trimmedName });
      }

      // Send verification email
      try {
        await sendEmailVerification(userCredential.user);
      } catch (verificationError) {
        // Don't fail registration if verification email fails
        console.warn('Could not send verification email:', verificationError);
      }

      // Update local state immediately
      const formattedUser = formatUser({
        ...userCredential.user,
        displayName: trimmedName || userCredential.user.displayName,
      });
      
      setUser(formattedUser);
      
      return formattedUser;
    } catch (error) {
      throw new Error(parseAuthError(error));
    }
  }, [auth]);

  /**
   * Sign out
   */
  const logout = useCallback(async () => {
    if (!auth) {
      throw new Error('Firebase no está inicializado');
    }

    try {
      await signOut(auth);
      setUser(null);
      setToken(null);
    } catch (error) {
      throw new Error(parseAuthError(error));
    }
  }, [auth]);

  /**
   * Send password reset email
   */
  const resetPassword = useCallback(async (email) => {
    if (!auth) {
      throw new Error('Firebase no está inicializado');
    }

    const trimmedEmail = email?.trim().toLowerCase();
    
    if (!trimmedEmail) {
      throw new Error('El correo es requerido');
    }
    
    if (!isValidEmail(trimmedEmail)) {
      throw new Error('Formato de correo inválido');
    }

    try {
      await sendPasswordResetEmail(auth, trimmedEmail);
    } catch (error) {
      throw new Error(parseAuthError(error));
    }
  }, [auth]);

  /**
   * Update user profile (display name and/or photo URL)
   */
  const updateUserProfile = useCallback(async (updates) => {
    if (!auth?.currentUser) {
      throw new Error('No hay sesión activa');
    }

    const validUpdates = {};
    
    if (updates.displayName !== undefined) {
      validUpdates.displayName = updates.displayName?.trim() || null;
    }
    
    if (updates.photoURL !== undefined) {
      validUpdates.photoURL = updates.photoURL?.trim() || null;
    }

    if (Object.keys(validUpdates).length === 0) {
      throw new Error('No hay cambios para actualizar');
    }

    try {
      await updateProfile(auth.currentUser, validUpdates);
      
      // Update local state
      setUser(prev => prev ? { ...prev, ...validUpdates } : null);
    } catch (error) {
      throw new Error(parseAuthError(error));
    }
  }, [auth]);

  /**
   * Update user email (requires recent authentication)
   */
  const updateUserEmail = useCallback(async (newEmail, currentPassword) => {
    if (!auth?.currentUser) {
      throw new Error('No hay sesión activa');
    }

    const trimmedEmail = newEmail?.trim().toLowerCase();
    
    if (!trimmedEmail) {
      throw new Error('El nuevo correo es requerido');
    }
    
    if (!isValidEmail(trimmedEmail)) {
      throw new Error('Formato de correo inválido');
    }

    if (!currentPassword) {
      throw new Error('La contraseña actual es requerida');
    }

    try {
      // Reauthenticate first
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email,
        currentPassword
      );
      await reauthenticateWithCredential(auth.currentUser, credential);
      
      // Update email
      await updateEmail(auth.currentUser, trimmedEmail);
      
      // Send verification to new email
      await sendEmailVerification(auth.currentUser);
      
      // Update local state
      setUser(prev => prev ? { ...prev, email: trimmedEmail, emailVerified: false } : null);
    } catch (error) {
      throw new Error(parseAuthError(error));
    }
  }, [auth]);

  /**
   * Update user password (requires recent authentication)
   */
  const updateUserPassword = useCallback(async (currentPassword, newPassword) => {
    if (!auth?.currentUser) {
      throw new Error('No hay sesión activa');
    }

    if (!currentPassword) {
      throw new Error('La contraseña actual es requerida');
    }

    if (!isValidPassword(newPassword)) {
      throw new Error('La nueva contraseña debe tener al menos 6 caracteres');
    }

    if (currentPassword === newPassword) {
      throw new Error('La nueva contraseña debe ser diferente');
    }

    try {
      // Reauthenticate first
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email,
        currentPassword
      );
      await reauthenticateWithCredential(auth.currentUser, credential);
      
      // Update password
      await updatePassword(auth.currentUser, newPassword);
    } catch (error) {
      throw new Error(parseAuthError(error));
    }
  }, [auth]);

  /**
   * Send email verification
   */
  const sendVerificationEmail = useCallback(async () => {
    if (!auth?.currentUser) {
      throw new Error('No hay sesión activa');
    }

    if (auth.currentUser.emailVerified) {
      throw new Error('El correo ya está verificado');
    }

    try {
      await sendEmailVerification(auth.currentUser);
    } catch (error) {
      throw new Error(parseAuthError(error));
    }
  }, [auth]);

  /**
   * Reauthenticate user (for sensitive operations)
   */
  const reauthenticate = useCallback(async (password) => {
    if (!auth?.currentUser) {
      throw new Error('No hay sesión activa');
    }

    if (!password) {
      throw new Error('La contraseña es requerida');
    }

    try {
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email,
        password
      );
      await reauthenticateWithCredential(auth.currentUser, credential);
      return true;
    } catch (error) {
      throw new Error(parseAuthError(error));
    }
  }, [auth]);

  /**
   * Delete user account (requires recent authentication)
   */
  const deleteAccount = useCallback(async (password) => {
    if (!auth?.currentUser) {
      throw new Error('No hay sesión activa');
    }

    if (!password) {
      throw new Error('La contraseña es requerida para eliminar la cuenta');
    }

    try {
      // Reauthenticate first
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email,
        password
      );
      await reauthenticateWithCredential(auth.currentUser, credential);
      
      // Delete user
      await deleteUser(auth.currentUser);
      
      setUser(null);
      setToken(null);
    } catch (error) {
      throw new Error(parseAuthError(error));
    }
  }, [auth]);

  /**
   * Get current ID token (useful for API calls)
   */
  const getToken = useCallback(async (forceRefresh = false) => {
    if (!auth?.currentUser) {
      return null;
    }

    try {
      return await getIdToken(auth.currentUser, forceRefresh);
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  }, [auth]);

  /**
   * Refresh user data from Firebase
   */
  const refreshUser = useCallback(async () => {
    if (!auth?.currentUser) {
      return null;
    }

    try {
      await auth.currentUser.reload();
      const refreshedUser = formatUser(auth.currentUser);
      setUser(refreshedUser);
      return refreshedUser;
    } catch (error) {
      throw new Error(parseAuthError(error));
    }
  }, [auth]);

  // Memoize context value
  const value = useMemo(() => ({
    // State
    user,
    loading,
    token,
    isAuthenticated: !!user,
    isEmailVerified: user?.emailVerified ?? false,
    
    // Auth methods
    loginWithEmail,
    registerWithEmail,
    logout,
    resetPassword,
    
    // Profile methods
    updateUserProfile,
    updateUserEmail,
    updateUserPassword,
    
    // Verification
    sendVerificationEmail,
    
    // Security
    reauthenticate,
    deleteAccount,
    
    // Utilities
    getToken,
    refreshUser,
  }), [
    user,
    loading,
    token,
    loginWithEmail,
    registerWithEmail,
    logout,
    resetPassword,
    updateUserProfile,
    updateUserEmail,
    updateUserPassword,
    sendVerificationEmail,
    reauthenticate,
    deleteAccount,
    getToken,
    refreshUser,
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ============================================
// HOOKS ADICIONALES
// ============================================

/**
 * Hook para verificar si el usuario está autenticado
 * Útil para proteger rutas
 */
export function useRequireAuth(redirectTo = '/login') {
  const { user, loading } = useAuth();
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      setShouldRedirect(true);
    }
  }, [user, loading]);

  return {
    user,
    loading,
    shouldRedirect,
    redirectTo,
  };
}

/**
 * Hook para verificar si el usuario tiene email verificado
 */
export function useRequireEmailVerified() {
  const { user, isEmailVerified, sendVerificationEmail } = useAuth();
  
  return {
    isVerified: isEmailVerified,
    canResend: user && !isEmailVerified,
    sendVerification: sendVerificationEmail,
  };
}

/**
 * Hook para manejar estados de operaciones de auth
 */
export function useAuthOperation() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const execute = useCallback(async (operation) => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await operation();
      setSuccess(true);
      return result;
    } catch (err) {
      setError(err.message || 'Error desconocido');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
    setSuccess(false);
  }, []);

  return {
    isLoading,
    error,
    success,
    execute,
    reset,
  };
}