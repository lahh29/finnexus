import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  // --- PEGAR AQUI TU CONFIGURACIÓN DE FIREBASE ---
  apiKey: "AIzaSyClWupa5JpJCXbQDJz-BwReK9h14sYEQ_k",
  authDomain: "mis-finanzas-41349.firebaseapp.com",
  projectId: "mis-finanzas-41349",
  storageBucket: "mis-finanzas-41349.firebasestorage.app",
  messagingSenderId: "361770231498",
  appId: "1:361770231498:web:1676a717f24117b30fb633"
  // -----------------------------------------------
};

// Singleton para evitar errores de doble inicialización en Next.js
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };