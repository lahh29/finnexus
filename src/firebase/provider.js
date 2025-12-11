'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { initializeFirebase } from './index';
import { AuthProvider } from './auth';

const FirebaseContext = createContext(undefined);

export function FirebaseProvider({ children }) {
  const [firebase, setFirebase] = useState(null);

  useEffect(() => {
    const instances = initializeFirebase();
    setFirebase(instances);
  }, []);

  if (!firebase) {
    // Show a loading indicator or a blank screen
    return <div className="h-screen flex items-center justify-center bg-[#F2F4F7]"><div className="w-10 h-10 border-4 border-[#007AFF] rounded-full animate-spin border-t-transparent"></div></div>;
  }

  return (
    <FirebaseContext.Provider value={firebase}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </FirebaseContext.Provider>
  );
}

export const useFirebase = () => {
    const context = useContext(FirebaseContext);
    if (context === undefined) {
      throw new Error('useFirebase must be used within a FirebaseProvider');
    }
    return context;
};

export const useAuth = () => {
    const context = useContext(FirebaseContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within a FirebaseProvider');
    }
    return { auth: context.auth };
}

export const useFirestore = () => {
    const context = useContext(FirebaseContext);
    if (context === undefined) {
        throw new Error('useFirestore must be used within a FirebaseProvider');
    }
    return { db: context.db };
}
