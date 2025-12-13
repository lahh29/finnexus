'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useFirestore } from '../firebase/provider';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  deleteDoc, 
  doc,
  updateDoc,
  serverTimestamp,
  limit as firestoreLimit,
  where,
  startAfter,
  getDocs,
  Timestamp,
  runTransaction
} from 'firebase/firestore';
import { useAuth } from '../firebase/auth-provider';

// Constantes
const COLLECTION_NAME = "transactions";
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

// Categorías predefinidas
export const EXPENSE_CATEGORIES = [
  { id: 'food', name: 'Comida', icon: 'utensils', color: 'orange' },
  { id: 'transport', name: 'Transporte', icon: 'car', color: 'blue' },
  { id: 'entertainment', name: 'Entretenimiento', icon: 'film', color: 'purple' },
  { id: 'shopping', name: 'Compras', icon: 'shopping-bag', color: 'pink' },
  { id: 'health', name: 'Salud', icon: 'heart', color: 'red' },
  { id: 'education', name: 'Educación', icon: 'book', color: 'indigo' },
  { id: 'bills', name: 'Servicios', icon: 'file-text', color: 'gray' },
  { id: 'home', name: 'Hogar', icon: 'amber', color: 'amber' },
  { id: 'personal', name: 'Personal', icon: 'user', color: 'cyan' },
  { id: 'other', name: 'Otros', icon: 'more-horizontal', color: 'slate' },
];

export const INCOME_CATEGORIES = [
  { id: 'salary', name: 'Salario', icon: 'briefcase', color: 'green' },
  { id: 'freelance', name: 'Freelance', icon: 'laptop', color: 'blue' },
  { id: 'investment', name: 'Inversiones', icon: 'trending-up', color: 'emerald' },
  { id: 'gift', name: 'Regalo', icon: 'gift', color: 'pink' },
  { id: 'refund', name: 'Reembolso', icon: 'rotate-ccw', color: 'orange' },
  { id: 'sale', name: 'Venta', icon: 'tag', color: 'purple' },
  { id: 'other', name: 'Otros', icon: 'more-horizontal', color: 'slate' },
];

/**
 * Períodos de tiempo para filtrar
 */
export const TIME_PERIODS = {
  TODAY: 'today',
  THIS_WEEK: 'this_week',
  THIS_MONTH: 'this_month',
  LAST_MONTH: 'last_month',
  THIS_YEAR: 'this_year',
  ALL_TIME: 'all_time',
  CUSTOM: 'custom',
};

/**
 * Hook principal para gestionar finanzas
 */
export function useFinance(options = {}) {
  const { 
    initialLimit = DEFAULT_LIMIT,
    period = TIME_PERIODS.THIS_MONTH,
  } = options;

  const { user } = useAuth();
  const { db } = useFirestore();
  
  const [transactions, setTransactions] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  
  const lastDocRef = useRef(null);
  const isMountedRef = useRef(true);

  // Cleanup en desmontaje
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Obtener rango de fechas según el período
  const getDateRange = useCallback((periodType, customRange = null) => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (periodType) {
      case TIME_PERIODS.TODAY:
        return {
          start: startOfDay,
          end: new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1),
        };
      
      case TIME_PERIODS.THIS_WEEK: {
        const dayOfWeek = now.getDay();
        const startOfWeek = new Date(startOfDay);
        startOfWeek.setDate(startOfDay.getDate() - dayOfWeek);
        return {
          start: startOfWeek,
          end: now,
        };
      }
      
      case TIME_PERIODS.THIS_MONTH:
        return {
          start: new Date(now.getFullYear(), now.getMonth(), 1),
          end: now,
        };
      
      case TIME_PERIODS.LAST_MONTH:
        return {
          start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
          end: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59),
        };
      
      case TIME_PERIODS.THIS_YEAR:
        return {
          start: new Date(now.getFullYear(), 0, 1),
          end: now,
        };
      
      case TIME_PERIODS.CUSTOM:
        if (customRange?.start && customRange?.end) {
          return customRange;
        }
        // Fallback a todo el tiempo
        return { start: null, end: null };
      
      case TIME_PERIODS.ALL_TIME:
      default:
        return { start: null, end: null };
    }
  }, []);

  // Suscripción a transacciones
  useEffect(() => {
    if (!user || !db) {
      setLoadingData(false);
      setTransactions([]);
      return;
    }

    setLoadingData(true);
    setError(null);
    lastDocRef.current = null;

    const transactionsRef = collection(db, "users", user.uid, COLLECTION_NAME);
    const dateRange = getDateRange(period);
    
    // Construir query
    let constraints = [orderBy("date", "desc"), firestoreLimit(initialLimit)];
    
    if (dateRange.start) {
      constraints.unshift(where("date", ">=", Timestamp.fromDate(dateRange.start)));
    }
    if (dateRange.end) {
      constraints.unshift(where("date", "<=", Timestamp.fromDate(dateRange.end)));
    }

    const q = query(transactionsRef, ...constraints);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!isMountedRef.current) return;

        const docs = snapshot.docs.map(docSnapshot => 
          formatTransaction(docSnapshot)
        );

        // Guardar último documento para paginación
        if (snapshot.docs.length > 0) {
          lastDocRef.current = snapshot.docs[snapshot.docs.length - 1];
        }

        setTransactions(docs);
        setHasMore(snapshot.docs.length >= initialLimit);
        setLoadingData(false);
      },
      (err) => {
        if (!isMountedRef.current) return;
        
        console.error("Error fetching transactions:", err);
        setError(err.message);
        setLoadingData(false);
      }
    );

    return () => unsubscribe();
  }, [user, db, period, initialLimit, getDateRange]);

  // Totales calculados con useMemo
  const { balance, income, expense } = useMemo(() => {
    let inc = 0;
    let exp = 0;

    for (const transaction of transactions) {
      const amount = transaction.amount || 0;
      if (transaction.type === 'income') {
        inc += amount;
      } else if (transaction.type === 'expense') {
        exp += amount;
      }
    }

    return {
      income: inc,
      expense: exp,
      balance: inc - exp,
    };
  }, [transactions]);

  // Estadísticas adicionales
  const stats = useMemo(() => {
    if (transactions.length === 0) {
      return {
        transactionCount: 0,
        averageExpense: 0,
        averageIncome: 0,
        largestExpense: null,
        largestIncome: null,
        expensesByCategory: {},
        incomesByCategory: {},
        dailyAverage: 0,
      };
    }

    const expenses = transactions.filter(t => t.type === 'expense');
    const incomes = transactions.filter(t => t.type === 'income');

    // Gastos por categoría
    const expensesByCategory = {};
    expenses.forEach(t => {
      const cat = t.category || 'other';
      expensesByCategory[cat] = (expensesByCategory[cat] || 0) + t.amount;
    });

    // Ingresos por categoría
    const incomesByCategory = {};
    incomes.forEach(t => {
      const cat = t.category || 'other';
      incomesByCategory[cat] = (incomesByCategory[cat] || 0) + t.amount;
    });

    // Encontrar transacciones más grandes
    const largestExpense = expenses.length > 0 
      ? expenses.reduce((max, t) => t.amount > max.amount ? t : max, expenses[0])
      : null;
    
    const largestIncome = incomes.length > 0
      ? incomes.reduce((max, t) => t.amount > max.amount ? t : max, incomes[0])
      : null;

    // Calcular promedio diario
    let dailyAverage = 0;
    if (transactions.length > 0) {
      const dates = transactions
        .map(t => t.date?.getTime())
        .filter(Boolean);
      
      if (dates.length > 1) {
        const minDate = Math.min(...dates);
        const maxDate = Math.max(...dates);
        const daysDiff = Math.max(1, Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24)));
        dailyAverage = expense / daysDiff;
      }
    }

    return {
      transactionCount: transactions.length,
      averageExpense: expenses.length > 0 ? expense / expenses.length : 0,
      averageIncome: incomes.length > 0 ? income / incomes.length : 0,
      largestExpense,
      largestIncome,
      expensesByCategory,
      incomesByCategory,
      dailyAverage,
    };
  }, [transactions, expense, income]);

  // Transacciones agrupadas por fecha
  const groupedTransactions = useMemo(() => {
    const groups = {};
    
    for (const transaction of transactions) {
      const dateKey = transaction.date 
        ? formatDateKey(transaction.date) 
        : 'Sin fecha';
      
      if (!groups[dateKey]) {
        groups[dateKey] = {
          date: transaction.date,
          dateLabel: formatDateLabel(transaction.date),
          transactions: [],
          totalIncome: 0,
          totalExpense: 0,
        };
      }
      
      groups[dateKey].transactions.push(transaction);
      
      if (transaction.type === 'income') {
        groups[dateKey].totalIncome += transaction.amount;
      } else {
        groups[dateKey].totalExpense += transaction.amount;
      }
    }

    // Convertir a array ordenado
    return Object.values(groups).sort((a, b) => 
      (b.date?.getTime() || 0) - (a.date?.getTime() || 0)
    );
  }, [transactions]);

  // Cargar más transacciones (paginación)
  const loadMore = useCallback(async () => {
    if (!user || !db || !hasMore || loadingMore || !lastDocRef.current) return;

    setLoadingMore(true);

    try {
      const transactionsRef = collection(db, "users", user.uid, COLLECTION_NAME);
      const dateRange = getDateRange(period);
      
      let constraints = [
        orderBy("date", "desc"),
        startAfter(lastDocRef.current),
        firestoreLimit(initialLimit),
      ];

      if (dateRange.start) {
        constraints.unshift(where("date", ">=", Timestamp.fromDate(dateRange.start)));
      }
      if (dateRange.end) {
        constraints.unshift(where("date", "<=", Timestamp.fromDate(dateRange.end)));
      }

      const q = query(transactionsRef, ...constraints);
      const snapshot = await getDocs(q);

      if (!isMountedRef.current) return;

      const newDocs = snapshot.docs.map(docSnapshot => 
        formatTransaction(docSnapshot)
      );

      if (snapshot.docs.length > 0) {
        lastDocRef.current = snapshot.docs[snapshot.docs.length - 1];
      }

      setTransactions(prev => [...prev, ...newDocs]);
      setHasMore(snapshot.docs.length >= initialLimit);
    } catch (err) {
      console.error("Error loading more transactions:", err);
      setError(err.message);
    } finally {
      setLoadingMore(false);
    }
  }, [user, db, hasMore, loadingMore, period, initialLimit, getDateRange]);

  // Agregar transacción y actualizar presupuesto
  const addTransaction = useCallback(async (
    amount, 
    description, 
    type, 
    category,
    date = null
  ) => {
    if (!user || !db) {
      throw new Error("Usuario no autenticado");
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      throw new Error("El monto debe ser mayor a 0");
    }
    // ... (otras validaciones)

    try {
      await runTransaction(db, async (transaction) => {
        // 1. Agregar la nueva transacción
        const transactionData = {
          amount: parsedAmount,
          description: description?.trim() || (type === 'income' ? 'Ingreso' : 'Gasto'),
          type,
          category,
          date: date ? Timestamp.fromDate(new Date(date)) : serverTimestamp(),
          createdAt: serverTimestamp(),
        };
        transaction.set(doc(collection(db, "users", user.uid, "transactions")), transactionData);
        
        // 2. Si es un gasto, actualizar el presupuesto correspondiente
        if (type === 'expense') {
          const budgetsRef = collection(db, "users", user.uid, "budgets");
          const budgetQuery = query(budgetsRef, where("category", "==", category), firestoreLimit(1));
          const budgetSnapshot = await getDocs(budgetQuery);

          if (!budgetSnapshot.empty) {
            const budgetDoc = budgetSnapshot.docs[0];
            const budgetData = budgetDoc.data();
            const newSpent = (budgetData.spent || 0) + parsedAmount;
            transaction.update(budgetDoc.ref, { spent: newSpent });
          }
        }
      });
    } catch (err) {
      console.error("Transaction failed: ", err);
      throw new Error("Error al guardar la transacción.");
    }
  }, [user, db]);


  // Actualizar transacción
  const updateTransaction = useCallback(async (transactionId, updates) => {
    if (!user || !db) {
      throw new Error("Usuario no autenticado");
    }

    if (!transactionId) {
      throw new Error("ID de transacción requerido");
    }

    const allowedFields = ['amount', 'description', 'type', 'category', 'date'];
    const sanitizedUpdates = {};

    for (const [key, value] of Object.entries(updates)) {
      if (!allowedFields.includes(key)) continue;

      switch (key) {
        case 'amount':
          const parsedAmount = parseFloat(value);
          if (!isNaN(parsedAmount) && parsedAmount > 0 && parsedAmount <= 999999999) {
            sanitizedUpdates.amount = parsedAmount;
          }
          break;
        
        case 'description':
          const trimmed = value?.trim();
          if (trimmed && trimmed.length <= 200) {
            sanitizedUpdates.description = trimmed;
          }
          break;
        
        case 'type':
          if (['income', 'expense'].includes(value)) {
            sanitizedUpdates.type = value;
          }
          break;
        
        case 'category':
          sanitizedUpdates.category = value || 'other';
          break;
        
        case 'date':
          if (value instanceof Date && !isNaN(value)) {
            sanitizedUpdates.date = Timestamp.fromDate(value);
          }
          break;
      }
    }

    if (Object.keys(sanitizedUpdates).length === 0) {
      throw new Error("No hay cambios válidos para actualizar");
    }

    sanitizedUpdates.updatedAt = serverTimestamp();

    try {
      await updateDoc(
        doc(db, "users", user.uid, COLLECTION_NAME, transactionId),
        sanitizedUpdates
      );
    } catch (err) {
      console.error("Error updating transaction:", err);
      throw new Error("Error al actualizar la transacción. Intenta de nuevo.");
    }
  }, [user, db]);

  // Eliminar transacción y actualizar presupuesto
  const deleteTransaction = useCallback(async (transactionId) => {
    if (!user || !db) {
      throw new Error("Usuario no autenticado");
    }
    if (!transactionId) {
      throw new Error("ID de transacción requerido");
    }

    try {
      const transactionRef = doc(db, "users", user.uid, "transactions", transactionId);
      
      await runTransaction(db, async (transaction) => {
        const transactionDoc = await transaction.get(transactionRef);
        if (!transactionDoc.exists()) {
          throw new Error("La transacción no existe.");
        }
        
        const { amount, category, type } = transactionDoc.data();
        
        // 1. Eliminar la transacción
        transaction.delete(transactionRef);

        // 2. Si fue un gasto, revertir el monto en el presupuesto
        if (type === 'expense') {
          const budgetsRef = collection(db, "users", user.uid, "budgets");
          const budgetQuery = query(budgetsRef, where("category", "==", category), firestoreLimit(1));
          const budgetSnapshot = await getDocs(budgetQuery);

          if (!budgetSnapshot.empty) {
            const budgetDoc = budgetSnapshot.docs[0];
            const budgetData = budgetDoc.data();
            const newSpent = Math.max(0, (budgetData.spent || 0) - amount);
            transaction.update(budgetDoc.ref, { spent: newSpent });
          }
        }
      });
    } catch (err) {
      console.error("Error deleting transaction:", err);
      throw new Error("Error al eliminar la transacción.");
    }
  }, [user, db]);

  // Buscar transacciones
  const searchTransactions = useCallback((searchTerm) => {
    if (!searchTerm?.trim()) return transactions;

    const term = searchTerm.toLowerCase().trim();
    
    return transactions.filter(t => 
      t.description?.toLowerCase().includes(term) ||
      t.category?.toLowerCase().includes(term) ||
      t.amount?.toString().includes(term)
    );
  }, [transactions]);

  // Filtrar por tipo
  const filterByType = useCallback((type) => {
    if (!type || type === 'all') return transactions;
    return transactions.filter(t => t.type === type);
  }, [transactions]);

  // Filtrar por categoría
  const filterByCategory = useCallback((category) => {
    if (!category || category === 'all') return transactions;
    return transactions.filter(t => t.category === category);
  }, [transactions]);

  return { 
    // Datos
    transactions,
    groupedTransactions,
    
    // Estados
    loadingData,
    loadingMore,
    error,
    hasMore,
    
    // Totales
    balance,
    income,
    expense,
    
    // Estadísticas
    stats,
    
    // Acciones
    addTransaction,
    updateTransaction,
    deleteTransaction,
    loadMore,
    
    // Utilidades
    searchTransactions,
    filterByType,
    filterByCategory,
    
    // Categorías
    expenseCategories: EXPENSE_CATEGORIES,
    incomeCategories: INCOME_CATEGORIES,
  };
}

/**
 * Formatea un documento de Firestore a objeto de transacción
 */
function formatTransaction(docSnapshot) {
  const data = docSnapshot.data();
  
  // Convertir Timestamp a Date
  let date = null;
  if (data.date) {
    if (data.date.toDate) {
      date = data.date.toDate();
    } else if (data.date instanceof Date) {
      date = data.date;
    }
  }

  return {
    id: docSnapshot.id,
    amount: data.amount || 0,
    description: data.description || '',
    type: data.type || 'expense',
    category: data.category || 'other',
    date,
    createdAt: data.createdAt?.toDate() || date || new Date(),
  };
}

/**
 * Formatea fecha para usar como key de agrupación
 */
function formatDateKey(date) {
  if (!date) return 'unknown';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/**
 * Formatea fecha para mostrar en UI
 */
function formatDateLabel(date) {
  if (!date) return 'Sin fecha';

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const transactionDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (transactionDate.getTime() === today.getTime()) {
    return 'Hoy';
  }
  
  if (transactionDate.getTime() === yesterday.getTime()) {
    return 'Ayer';
  }

  // Si es de este año, no mostrar el año
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString('es-MX', { 
      weekday: 'long',
      day: 'numeric', 
      month: 'long',
    });
  }

  return date.toLocaleDateString('es-MX', { 
    weekday: 'long',
    day: 'numeric', 
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Hook para obtener una categoría por ID
 */
export function useCategory(categoryId, type = 'expense') {
  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  return categories.find(c => c.id === categoryId) || categories.find(c => c.id === 'other');
}

/**
 * Exportar utilidades
 */
export { formatDateLabel, formatDateKey };
