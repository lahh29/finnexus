'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useFirestore } from '../firebase/provider';
import { 
  collection, 
  addDoc, 
  query, 
  onSnapshot, 
  deleteDoc, 
  doc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { useAuth } from '../firebase/auth-provider';

const COLLECTION_NAME = "savingsGoals";

export const GOAL_ICONS = [
  { id: 'vacation', name: 'Vacaciones', icon: 'plane', color: 'blue' },
  { id: 'car', name: 'Auto', icon: 'car', color: 'slate' },
  { id: 'home', name: 'Casa', icon: 'home', color: 'amber' },
  { id: 'education', name: 'Educación', icon: 'graduation-cap', color: 'indigo' },
  { id: 'emergency', name: 'Emergencia', icon: 'shield', color: 'red' },
  { id: 'retirement', name: 'Retiro', icon: 'piggy-bank', color: 'green' },
  { id: 'gadget', name: 'Tecnología', icon: 'smartphone', color: 'purple' },
  { id: 'wedding', name: 'Boda', icon: 'heart', color: 'pink' },
  { id: 'health', name: 'Salud', icon: 'heart-pulse', color: 'rose' },
  { id: 'other', name: 'Otro', icon: 'target', color: 'gray' },
];

export function useSavingsGoals() {
  const { user } = useAuth();
  const { db } = useFirestore();
  
  const [goals, setGoals] = useState([]);
  const [loadingGoals, setLoadingGoals] = useState(true);
  const [error, setError] = useState(null);
  
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Suscripción a metas
  useEffect(() => {
    if (!user || !db) {
      setLoadingGoals(false);
      setGoals([]);
      return;
    }

    setLoadingGoals(true);
    setError(null);

    const goalsRef = collection(db, "users", user.uid, COLLECTION_NAME);
    const q = query(goalsRef);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!isMountedRef.current) return;

        const docs = snapshot.docs.map(docSnapshot => {
          const data = docSnapshot.data();
          const targetAmount = data.targetAmount || 0;
          const currentAmount = data.currentAmount || 0;
          const progress = targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0;
          
          // Calcular días restantes
          let daysLeft = null;
          let isOverdue = false;
          if (data.targetDate) {
            const targetDate = data.targetDate.toDate();
            const today = new Date();
            const diffTime = targetDate - today;
            daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            isOverdue = daysLeft < 0;
          }

          // Calcular ahorro mensual necesario
          let monthlyNeeded = 0;
          if (daysLeft && daysLeft > 0) {
            const remaining = targetAmount - currentAmount;
            const monthsLeft = daysLeft / 30;
            monthlyNeeded = monthsLeft > 0 ? remaining / monthsLeft : remaining;
          }

          return {
            id: docSnapshot.id,
            name: data.name || 'Meta sin nombre',
            targetAmount,
            currentAmount,
            progress: Math.min(progress, 100),
            icon: data.icon || 'other',
            color: data.color || 'gray',
            targetDate: data.targetDate?.toDate() || null,
            daysLeft,
            isOverdue,
            isCompleted: currentAmount >= targetAmount,
            monthlyNeeded,
            createdAt: data.createdAt?.toDate() || new Date(),
          };
        });

        // Ordenar: incompletas primero, luego por progreso descendente
        docs.sort((a, b) => {
          if (a.isCompleted !== b.isCompleted) {
            return a.isCompleted ? 1 : -1;
          }
          return b.progress - a.progress;
        });

        setGoals(docs);
        setLoadingGoals(false);
      },
      (err) => {
        if (!isMountedRef.current) return;
        console.error("Error fetching goals:", err);
        setError(err.message);
        setLoadingGoals(false);
      }
    );

    return () => unsubscribe();
  }, [user, db]);

  // Estadísticas
  const stats = useMemo(() => {
    const activeGoals = goals.filter(g => !g.isCompleted);
    const completedGoals = goals.filter(g => g.isCompleted);
    const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);
    const totalSaved = goals.reduce((sum, g) => sum + g.currentAmount, 0);
    const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

    return {
      totalGoals: goals.length,
      activeGoals: activeGoals.length,
      completedGoals: completedGoals.length,
      totalTarget,
      totalSaved,
      totalRemaining: totalTarget - totalSaved,
      overallProgress,
    };
  }, [goals]);

  // Agregar meta
  const addGoal = useCallback(async (name, targetAmount, icon = 'other', targetDate = null) => {
    if (!user || !db) {
      throw new Error("Usuario no autenticado");
    }

    const trimmedName = name?.trim();
    if (!trimmedName) {
      throw new Error("El nombre es requerido");
    }

    const parsedAmount = parseFloat(targetAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      throw new Error("El monto objetivo debe ser mayor a 0");
    }

    const goalIcon = GOAL_ICONS.find(g => g.id === icon) || GOAL_ICONS.find(g => g.id === 'other');

    const goalData = {
      name: trimmedName,
      targetAmount: parsedAmount,
      currentAmount: 0,
      icon: goalIcon.id,
      color: goalIcon.color,
      targetDate: targetDate ? new Date(targetDate) : null,
      createdAt: serverTimestamp(),
    };

    try {
      const docRef = await addDoc(
        collection(db, "users", user.uid, COLLECTION_NAME),
        goalData
      );
      return docRef.id;
    } catch (err) {
      console.error("Error adding goal:", err);
      throw new Error("Error al crear la meta");
    }
  }, [user, db]);

  // Agregar ahorro a meta
  const addSaving = useCallback(async (goalId, amount) => {
    if (!user || !db) {
      throw new Error("Usuario no autenticado");
    }

    const goal = goals.find(g => g.id === goalId);
    if (!goal) {
      throw new Error("Meta no encontrada");
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      throw new Error("El monto debe ser mayor a 0");
    }

    const newAmount = goal.currentAmount + parsedAmount;

    try {
      await updateDoc(
        doc(db, "users", user.uid, COLLECTION_NAME, goalId),
        { currentAmount: newAmount, updatedAt: serverTimestamp() }
      );
    } catch (err) {
      console.error("Error adding saving:", err);
      throw new Error("Error al agregar ahorro");
    }
  }, [user, db, goals]);

  // Retirar de meta
  const withdrawSaving = useCallback(async (goalId, amount) => {
    if (!user || !db) {
      throw new Error("Usuario no autenticado");
    }

    const goal = goals.find(g => g.id === goalId);
    if (!goal) {
      throw new Error("Meta no encontrada");
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      throw new Error("El monto debe ser mayor a 0");
    }

    const newAmount = Math.max(0, goal.currentAmount - parsedAmount);

    try {
      await updateDoc(
        doc(db, "users", user.uid, COLLECTION_NAME, goalId),
        { currentAmount: newAmount, updatedAt: serverTimestamp() }
      );
    } catch (err) {
      console.error("Error withdrawing:", err);
      throw new Error("Error al retirar");
    }
  }, [user, db, goals]);

  // Actualizar meta
  const updateGoal = useCallback(async (goalId, updates) => {
    if (!user || !db) {
      throw new Error("Usuario no autenticado");
    }

    const sanitizedUpdates = {};

    if (updates.name !== undefined) {
      const trimmed = updates.name?.trim();
      if (trimmed) sanitizedUpdates.name = trimmed;
    }

    if (updates.targetAmount !== undefined) {
      const parsed = parseFloat(updates.targetAmount);
      if (!isNaN(parsed) && parsed > 0) {
        sanitizedUpdates.targetAmount = parsed;
      }
    }

    if (updates.targetDate !== undefined) {
      sanitizedUpdates.targetDate = updates.targetDate ? new Date(updates.targetDate) : null;
    }

    if (updates.icon !== undefined) {
      const goalIcon = GOAL_ICONS.find(g => g.id === updates.icon);
      if (goalIcon) {
        sanitizedUpdates.icon = goalIcon.id;
        sanitizedUpdates.color = goalIcon.color;
      }
    }

    if (Object.keys(sanitizedUpdates).length === 0) {
      throw new Error("No hay cambios válidos");
    }

    sanitizedUpdates.updatedAt = serverTimestamp();

    try {
      await updateDoc(
        doc(db, "users", user.uid, COLLECTION_NAME, goalId),
        sanitizedUpdates
      );
    } catch (err) {
      console.error("Error updating goal:", err);
      throw new Error("Error al actualizar la meta");
    }
  }, [user, db]);

  // Eliminar meta
  const deleteGoal = useCallback(async (goalId) => {
    if (!user || !db) {
      throw new Error("Usuario no autenticado");
    }

    try {
      await deleteDoc(doc(db, "users", user.uid, COLLECTION_NAME, goalId));
    } catch (err) {
      console.error("Error deleting goal:", err);
      throw new Error("Error al eliminar la meta");
    }
  }, [user, db]);

  return {
    goals,
    loadingGoals,
    error,
    stats,
    addGoal,
    addSaving,
    withdrawSaving,
    updateGoal,
    deleteGoal,
    icons: GOAL_ICONS,
  };
}
