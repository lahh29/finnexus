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
  serverTimestamp,
  where
} from 'firebase/firestore';
import { useAuth } from '../firebase/auth-provider';
import { EXPENSE_CATEGORIES } from './useFinance';

const COLLECTION_NAME = "budgets";

export const BUDGET_PERIODS = [
  { id: 'weekly', name: 'Semanal', days: 7 },
  { id: 'biweekly', name: 'Quincenal', days: 14 },
  { id: 'monthly', name: 'Mensual', days: 30 },
  { id: 'yearly', name: 'Anual', days: 365 },
];

export function useBudgets() {
  const { user } = useAuth();
  const { db } = useFirestore();
  
  const [budgets, setBudgets] = useState([]);
  const [loadingBudgets, setLoadingBudgets] = useState(true);
  const [error, setError] = useState(null);
  
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Suscripción a presupuestos
  useEffect(() => {
    if (!user || !db) {
      setLoadingBudgets(false);
      setBudgets([]);
      return;
    }

    setLoadingBudgets(true);
    setError(null);

    const budgetsRef = collection(db, "users", user.uid, COLLECTION_NAME);
    const q = query(budgetsRef);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!isMountedRef.current) return;

        const docs = snapshot.docs.map(docSnapshot => {
          const data = docSnapshot.data();
          return {
            id: docSnapshot.id,
            name: data.name || 'Sin nombre',
            amount: data.amount || 0,
            spent: data.spent || 0,
            category: data.category || 'other',
            period: data.period || 'monthly',
            startDate: data.startDate?.toDate() || new Date(),
            createdAt: data.createdAt?.toDate() || new Date(),
          };
        });

        setBudgets(docs);
        setLoadingBudgets(false);
      },
      (err) => {
        if (!isMountedRef.current) return;
        console.error("Error fetching budgets:", err);
        setError(err.message);
        setLoadingBudgets(false);
      }
    );

    return () => unsubscribe();
  }, [user, db]);

  // Calcular estadísticas
  const stats = useMemo(() => {
    const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
    const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
    const remaining = totalBudget - totalSpent;
    const percentUsed = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

    const overBudget = budgets.filter(b => b.spent > b.amount);
    const nearLimit = budgets.filter(b => {
      const percent = b.amount > 0 ? (b.spent / b.amount) * 100 : 0;
      return percent >= 80 && percent < 100;
    });

    return {
      totalBudget,
      totalSpent,
      remaining,
      percentUsed,
      overBudgetCount: overBudget.length,
      nearLimitCount: nearLimit.length,
      budgetsWithIssues: [...overBudget, ...nearLimit],
    };
  }, [budgets]);

  // Agregar presupuesto
  const addBudget = useCallback(async (name, amount, category, period = 'monthly') => {
    if (!user || !db) {
      throw new Error("Usuario no autenticado");
    }

    const trimmedName = name?.trim();
    if (!trimmedName) {
      throw new Error("El nombre es requerido");
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      throw new Error("El monto debe ser mayor a 0");
    }

    const budgetData = {
      name: trimmedName,
      amount: parsedAmount,
      spent: 0,
      category: category || 'other',
      period: period,
      startDate: serverTimestamp(),
      createdAt: serverTimestamp(),
    };

    try {
      const docRef = await addDoc(
        collection(db, "users", user.uid, COLLECTION_NAME),
        budgetData
      );
      return docRef.id;
    } catch (err) {
      console.error("Error adding budget:", err);
      throw new Error("Error al crear el presupuesto");
    }
  }, [user, db]);

  // Actualizar gasto en presupuesto
  const updateSpent = useCallback(async (budgetId, newSpent) => {
    if (!user || !db) {
      throw new Error("Usuario no autenticado");
    }

    try {
      await updateDoc(
        doc(db, "users", user.uid, COLLECTION_NAME, budgetId),
        { spent: parseFloat(newSpent), updatedAt: serverTimestamp() }
      );
    } catch (err) {
      console.error("Error updating budget:", err);
      throw new Error("Error al actualizar el presupuesto");
    }
  }, [user, db]);

  // Agregar gasto a presupuesto
  const addSpending = useCallback(async (budgetId, amount) => {
    const budget = budgets.find(b => b.id === budgetId);
    if (!budget) {
      throw new Error("Presupuesto no encontrado");
    }

    const newSpent = budget.spent + parseFloat(amount);
    return updateSpent(budgetId, newSpent);
  }, [budgets, updateSpent]);

  // Eliminar presupuesto
  const deleteBudget = useCallback(async (budgetId) => {
    if (!user || !db) {
      throw new Error("Usuario no autenticado");
    }

    try {
      await deleteDoc(doc(db, "users", user.uid, COLLECTION_NAME, budgetId));
    } catch (err) {
      console.error("Error deleting budget:", err);
      throw new Error("Error al eliminar el presupuesto");
    }
  }, [user, db]);

  // Reiniciar presupuesto
  const resetBudget = useCallback(async (budgetId) => {
    return updateSpent(budgetId, 0);
  }, [updateSpent]);

  // Obtener presupuesto por categoría
  const getBudgetByCategory = useCallback((category) => {
    return budgets.find(b => b.category === category);
  }, [budgets]);

  return {
    budgets,
    loadingBudgets,
    error,
    stats,
    addBudget,
    updateSpent,
    addSpending,
    deleteBudget,
    resetBudget,
    getBudgetByCategory,
    categories: EXPENSE_CATEGORIES,
    periods: BUDGET_PERIODS,
  };
}
