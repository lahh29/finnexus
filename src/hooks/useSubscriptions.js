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
  orderBy
} from 'firebase/firestore';
import { useAuth } from '../firebase/auth';

// Constantes
const COLLECTION_NAME = "subscriptions";
const MAX_SUBSCRIPTIONS = 50;

// Categorías de suscripciones
export const SUBSCRIPTION_CATEGORIES = [
  { id: 'streaming', name: 'Streaming', icon: 'play-circle', color: 'purple', examples: 'Netflix, Spotify, Disney+' },
  { id: 'software', name: 'Software', icon: 'code', color: 'blue', examples: 'Adobe, Microsoft 365, Notion' },
  { id: 'gaming', name: 'Gaming', icon: 'gamepad-2', color: 'green', examples: 'Xbox Game Pass, PlayStation Plus' },
  { id: 'cloud', name: 'Almacenamiento', icon: 'cloud', color: 'cyan', examples: 'iCloud, Google One, Dropbox' },
  { id: 'fitness', name: 'Fitness', icon: 'dumbbell', color: 'orange', examples: 'Gym, Peloton, Strava' },
  { id: 'news', name: 'Noticias', icon: 'newspaper', color: 'slate', examples: 'Medium, Substack, NYTimes' },
  { id: 'education', name: 'Educación', icon: 'graduation-cap', color: 'indigo', examples: 'Coursera, Duolingo, Skillshare' },
  { id: 'utilities', name: 'Servicios', icon: 'zap', color: 'yellow', examples: 'Luz, Internet, Teléfono' },
  { id: 'home', name: 'Hogar', icon: 'home', color: 'amber', examples: 'Renta, Seguro, Mantenimiento' },
  { id: 'finance', name: 'Finanzas', icon: 'credit-card', color: 'emerald', examples: 'Banco, Inversiones, Seguros' },
  { id: 'health', name: 'Salud', icon: 'heart-pulse', color: 'red', examples: 'Seguro médico, Farmacia' },
  { id: 'transport', name: 'Transporte', icon: 'car', color: 'blue', examples: 'Seguro auto, Uber Pass' },
  { id: 'other', name: 'Otros', icon: 'more-horizontal', color: 'gray', examples: 'Otros servicios' },
];

// Frecuencias de pago
export const PAYMENT_FREQUENCIES = [
  { id: 'weekly', name: 'Semanal', days: 7, multiplier: 4.33 },
  { id: 'biweekly', name: 'Quincenal', days: 14, multiplier: 2.17 },
  { id: 'monthly', name: 'Mensual', days: 30, multiplier: 1 },
  { id: 'bimonthly', name: 'Bimestral', days: 60, multiplier: 0.5 },
  { id: 'quarterly', name: 'Trimestral', days: 90, multiplier: 0.33 },
  { id: 'semiannual', name: 'Semestral', days: 180, multiplier: 0.167 },
  { id: 'annual', name: 'Anual', days: 365, multiplier: 0.083 },
];

// Estados de suscripción
export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  PAUSED: 'paused',
  CANCELLED: 'cancelled',
  TRIAL: 'trial',
};

/**
 * Hook para gestionar suscripciones y pagos fijos
 */
export function useSubscriptions() {
  const { user } = useAuth();
  const { db } = useFirestore();
  
  const [subs, setSubs] = useState([]);
  const [loadingSubs, setLoadingSubs] = useState(true);
  const [error, setError] = useState(null);
  
  const isMountedRef = useRef(true);

  // Cleanup
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Suscripción a cambios
  useEffect(() => {
    if (!user || !db) {
      setLoadingSubs(false);
      setSubs([]);
      return;
    }

    setLoadingSubs(true);
    setError(null);

    const subsRef = collection(db, "users", user.uid, COLLECTION_NAME);
    const q = query(subsRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!isMountedRef.current) return;

        const docs = snapshot.docs.map(docSnapshot => {
          const data = docSnapshot.data();
          const paymentInfo = calculatePaymentInfo(
            data.paymentDay,
            data.frequency || 'monthly',
            data.startDate?.toDate()
          );

          return {
            id: docSnapshot.id,
            name: data.name || 'Sin nombre',
            amount: data.amount || 0,
            paymentDay: data.paymentDay || 1,
            category: data.category || 'other',
            frequency: data.frequency || 'monthly',
            status: data.status || SUBSCRIPTION_STATUS.ACTIVE,
            notes: data.notes || '',
            url: data.url || '',
            startDate: data.startDate?.toDate() || null,
            createdAt: data.createdAt?.toDate() || new Date(),
            lastPaidDate: data.lastPaidDate?.toDate() || null,
            ...paymentInfo,
          };
        });

        // Ordenar: urgentes primero, luego por días restantes
        docs.sort((a, b) => {
          // Pausadas y canceladas al final
          if (a.status !== SUBSCRIPTION_STATUS.ACTIVE && b.status === SUBSCRIPTION_STATUS.ACTIVE) return 1;
          if (a.status === SUBSCRIPTION_STATUS.ACTIVE && b.status !== SUBSCRIPTION_STATUS.ACTIVE) return -1;
          
          // Por urgencia
          if (a.isOverdue && !b.isOverdue) return -1;
          if (!a.isOverdue && b.isOverdue) return 1;
          
          // Por días restantes
          return a.daysLeft - b.daysLeft;
        });

        setSubs(docs);
        setLoadingSubs(false);
      },
      (err) => {
        if (!isMountedRef.current) return;
        
        console.error("Error fetching subscriptions:", err);
        setError(err.message);
        setLoadingSubs(false);
      }
    );

    return () => unsubscribe();
  }, [user, db]);

  // Totales calculados
  const totals = useMemo(() => {
    const activeSubs = subs.filter(s => s.status === SUBSCRIPTION_STATUS.ACTIVE);
    
    // Total mensual (normalizado)
    const monthlyTotal = activeSubs.reduce((sum, sub) => {
      const frequency = PAYMENT_FREQUENCIES.find(f => f.id === sub.frequency) 
        || PAYMENT_FREQUENCIES.find(f => f.id === 'monthly');
      return sum + (sub.amount * frequency.multiplier);
    }, 0);

    // Total anual
    const annualTotal = monthlyTotal * 12;

    // Total de este mes (pagos que vencen este mes)
    const now = new Date();
    const thisMonthTotal = activeSubs
      .filter(sub => {
        const nextDate = sub.nextPaymentDate;
        return nextDate && 
          nextDate.getMonth() === now.getMonth() && 
          nextDate.getFullYear() === now.getFullYear();
      })
      .reduce((sum, sub) => sum + sub.amount, 0);

    // Próximos 7 días
    const next7DaysTotal = activeSubs
      .filter(sub => sub.daysLeft <= 7 && sub.daysLeft >= 0)
      .reduce((sum, sub) => sum + sub.amount, 0);

    // Por categoría
    const byCategory = {};
    activeSubs.forEach(sub => {
      const cat = sub.category || 'other';
      if (!byCategory[cat]) {
        byCategory[cat] = { count: 0, monthly: 0, annual: 0 };
      }
      const frequency = PAYMENT_FREQUENCIES.find(f => f.id === sub.frequency) 
        || PAYMENT_FREQUENCIES.find(f => f.id === 'monthly');
      const monthlyAmount = sub.amount * frequency.multiplier;
      
      byCategory[cat].count++;
      byCategory[cat].monthly += monthlyAmount;
      byCategory[cat].annual += monthlyAmount * 12;
    });

    return {
      totalFixed: monthlyTotal,
      monthlyTotal,
      annualTotal,
      thisMonthTotal,
      next7DaysTotal,
      activeCount: activeSubs.length,
      totalCount: subs.length,
      byCategory,
    };
  }, [subs]);

  // Suscripciones que necesitan atención
  const alerts = useMemo(() => {
    const activeSubs = subs.filter(s => s.status === SUBSCRIPTION_STATUS.ACTIVE);
    
    return {
      overdue: activeSubs.filter(s => s.isOverdue),
      dueToday: activeSubs.filter(s => s.daysLeft === 0 && !s.isOverdue),
      dueSoon: activeSubs.filter(s => s.daysLeft > 0 && s.daysLeft <= 3),
      thisWeek: activeSubs.filter(s => s.daysLeft > 3 && s.daysLeft <= 7),
    };
  }, [subs]);

  // Agregar suscripción
  const addSubscription = useCallback(async (name, amount, paymentDay, category, options = {}) => {
    if (!user || !db) {
      throw new Error("Usuario no autenticado");
    }

    // Validaciones
    const trimmedName = name?.trim();
    if (!trimmedName) {
      throw new Error("El nombre es requerido");
    }

    if (trimmedName.length > 100) {
      throw new Error("El nombre es muy largo (máximo 100 caracteres)");
    }

    if (subs.length >= MAX_SUBSCRIPTIONS) {
      throw new Error(`Máximo ${MAX_SUBSCRIPTIONS} suscripciones permitidas`);
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      throw new Error("El monto debe ser mayor a 0");
    }

    if (parsedAmount > 999999) {
      throw new Error("El monto es demasiado grande");
    }

    const parsedDay = parseInt(paymentDay, 10);
    if (isNaN(parsedDay) || parsedDay < 1 || parsedDay > 31) {
      throw new Error("El día de pago debe estar entre 1 y 31");
    }

    // Validar categoría
    const isValidCategory = SUBSCRIPTION_CATEGORIES.some(c => c.id === category);
    const finalCategory = isValidCategory ? category : 'other';

    // Validar frecuencia
    const frequency = options.frequency || 'monthly';
    const isValidFrequency = PAYMENT_FREQUENCIES.some(f => f.id === frequency);
    const finalFrequency = isValidFrequency ? frequency : 'monthly';

    // Validar URL si se proporciona
    let finalUrl = '';
    if (options.url) {
      try {
        new URL(options.url);
        finalUrl = options.url;
      } catch {
        // URL inválida, ignorar
      }
    }

    const subscriptionData = {
      name: trimmedName,
      amount: parsedAmount,
      paymentDay: parsedDay,
      category: finalCategory,
      frequency: finalFrequency,
      status: options.status || SUBSCRIPTION_STATUS.ACTIVE,
      notes: options.notes?.trim()?.slice(0, 500) || '',
      url: finalUrl,
      startDate: options.startDate ? serverTimestamp() : null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      const docRef = await addDoc(
        collection(db, "users", user.uid, COLLECTION_NAME),
        subscriptionData
      );
      return docRef.id;
    } catch (err) {
      console.error("Error adding subscription:", err);
      throw new Error("Error al crear la suscripción. Intenta de nuevo.");
    }
  }, [user, db, subs.length]);

  // Actualizar suscripción
  const updateSubscription = useCallback(async (subscriptionId, updates) => {
    if (!user || !db) {
      throw new Error("Usuario no autenticado");
    }

    if (!subscriptionId) {
      throw new Error("ID de suscripción requerido");
    }

    const allowedFields = [
      'name', 'amount', 'paymentDay', 'category', 
      'frequency', 'status', 'notes', 'url', 'lastPaidDate'
    ];
    const sanitizedUpdates = {};

    for (const [key, value] of Object.entries(updates)) {
      if (!allowedFields.includes(key)) continue;

      switch (key) {
        case 'name':
          const trimmedName = value?.trim();
          if (trimmedName && trimmedName.length <= 100) {
            sanitizedUpdates.name = trimmedName;
          }
          break;

        case 'amount':
          const parsedAmount = parseFloat(value);
          if (!isNaN(parsedAmount) && parsedAmount > 0 && parsedAmount <= 999999) {
            sanitizedUpdates.amount = parsedAmount;
          }
          break;

        case 'paymentDay':
          const parsedDay = parseInt(value, 10);
          if (!isNaN(parsedDay) && parsedDay >= 1 && parsedDay <= 31) {
            sanitizedUpdates.paymentDay = parsedDay;
          }
          break;

        case 'category':
          if (SUBSCRIPTION_CATEGORIES.some(c => c.id === value)) {
            sanitizedUpdates.category = value;
          }
          break;

        case 'frequency':
          if (PAYMENT_FREQUENCIES.some(f => f.id === value)) {
            sanitizedUpdates.frequency = value;
          }
          break;

        case 'status':
          if (Object.values(SUBSCRIPTION_STATUS).includes(value)) {
            sanitizedUpdates.status = value;
          }
          break;

        case 'notes':
          sanitizedUpdates.notes = value?.trim()?.slice(0, 500) || '';
          break;

        case 'url':
          if (value) {
            try {
              new URL(value);
              sanitizedUpdates.url = value;
            } catch {
              sanitizedUpdates.url = '';
            }
          } else {
            sanitizedUpdates.url = '';
          }
          break;

        case 'lastPaidDate':
          if (value instanceof Date && !isNaN(value)) {
            sanitizedUpdates.lastPaidDate = value;
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
        doc(db, "users", user.uid, COLLECTION_NAME, subscriptionId),
        sanitizedUpdates
      );
    } catch (err) {
      console.error("Error updating subscription:", err);
      throw new Error("Error al actualizar la suscripción. Intenta de nuevo.");
    }
  }, [user, db]);

  // Marcar como pagado
  const markAsPaid = useCallback(async (subscriptionId) => {
    return updateSubscription(subscriptionId, {
      lastPaidDate: new Date(),
    });
  }, [updateSubscription]);

  // Pausar/Reanudar suscripción
  const togglePause = useCallback(async (subscriptionId) => {
    const sub = subs.find(s => s.id === subscriptionId);
    if (!sub) {
      throw new Error("Suscripción no encontrada");
    }

    const newStatus = sub.status === SUBSCRIPTION_STATUS.ACTIVE 
      ? SUBSCRIPTION_STATUS.PAUSED 
      : SUBSCRIPTION_STATUS.ACTIVE;

    return updateSubscription(subscriptionId, { status: newStatus });
  }, [subs, updateSubscription]);

  // Cancelar suscripción (soft delete)
  const cancelSubscription = useCallback(async (subscriptionId) => {
    return updateSubscription(subscriptionId, { 
      status: SUBSCRIPTION_STATUS.CANCELLED 
    });
  }, [updateSubscription]);

  // Eliminar suscripción (hard delete)
  const deleteSubscription = useCallback(async (subscriptionId) => {
    if (!user || !db) {
      throw new Error("Usuario no autenticado");
    }

    if (!subscriptionId) {
      throw new Error("ID de suscripción requerido");
    }

    try {
      await deleteDoc(doc(db, "users", user.uid, COLLECTION_NAME, subscriptionId));
    } catch (err) {
      console.error("Error deleting subscription:", err);
      throw new Error("Error al eliminar la suscripción. Intenta de nuevo.");
    }
  }, [user, db]);

  // Duplicar suscripción
  const duplicateSubscription = useCallback(async (subscriptionId) => {
    const sub = subs.find(s => s.id === subscriptionId);
    if (!sub) {
      throw new Error("Suscripción no encontrada");
    }

    return addSubscription(
      `${sub.name} (copia)`,
      sub.amount,
      sub.paymentDay,
      sub.category,
      {
        frequency: sub.frequency,
        notes: sub.notes,
        url: sub.url,
      }
    );
  }, [subs, addSubscription]);

  return { 
    // Datos
    subs,
    
    // Estados
    loadingSubs,
    error,
    
    // Totales (retrocompatibilidad + nuevos)
    totalFixed: totals.monthlyTotal,
    totals,
    
    // Alertas
    alerts,
    
    // Acciones CRUD
    addSubscription,
    updateSubscription,
    deleteSubscription,
    
    // Acciones especiales
    markAsPaid,
    togglePause,
    cancelSubscription,
    duplicateSubscription,
    
    // Utilidades
    canAddMore: subs.length < MAX_SUBSCRIPTIONS,
    maxSubscriptions: MAX_SUBSCRIPTIONS,
    
    // Constantes
    categories: SUBSCRIPTION_CATEGORIES,
    frequencies: PAYMENT_FREQUENCIES,
    statuses: SUBSCRIPTION_STATUS,
  };
}

/**
 * Calcula información del próximo pago
 */
function calculatePaymentInfo(paymentDay, frequency = 'monthly', startDate = null) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const currentDay = today.getDate();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  // Obtener frecuencia
  const freq = PAYMENT_FREQUENCIES.find(f => f.id === frequency) 
    || PAYMENT_FREQUENCIES.find(f => f.id === 'monthly');

  let nextPaymentDate;
  let daysLeft;

  if (frequency === 'weekly') {
    const dayOfWeek = paymentDay % 7;
    const currentDayOfWeek = today.getDay();
    let daysUntil = dayOfWeek - currentDayOfWeek;
    if (daysUntil <= 0) daysUntil += 7;
    nextPaymentDate = new Date(today);
    nextPaymentDate.setDate(today.getDate() + daysUntil);
    daysLeft = daysUntil;
  } else if (frequency === 'biweekly') {
    const day1 = Math.min(paymentDay, 15);
    const day2 = Math.min(paymentDay + 15, 28);
    
    if (currentDay <= day1) {
      nextPaymentDate = new Date(currentYear, currentMonth, day1);
    } else if (currentDay <= day2) {
      nextPaymentDate = new Date(currentYear, currentMonth, day2);
    } else {
      nextPaymentDate = new Date(currentYear, currentMonth + 1, day1);
    }
    daysLeft = Math.ceil((nextPaymentDate - today) / (1000 * 60 * 60 * 24));
  } else {
    nextPaymentDate = getNextPaymentDate(paymentDay, currentYear, currentMonth, currentDay, freq.days);
    daysLeft = Math.ceil((nextPaymentDate - today) / (1000 * 60 * 60 * 24));
  }

  const isOverdue = daysLeft < 0;
  
  let urgency = 'normal';
  if (isOverdue) {
    urgency = 'overdue';
  } else if (daysLeft === 0) {
    urgency = 'today';
  } else if (daysLeft <= 3) {
    urgency = 'urgent';
  } else if (daysLeft <= 7) {
    urgency = 'soon';
  }

  const formattedDate = formatPaymentDate(nextPaymentDate);

  return {
    nextPaymentDate,
    daysLeft: Math.max(0, daysLeft),
    actualDaysLeft: daysLeft,
    isOverdue,
    urgency,
    formattedDate,
    isPaidThisPeriod: false,
  };
}

/**
 * Obtiene la próxima fecha de pago
 */
function getNextPaymentDate(targetDay, year, month, currentDay, intervalDays) {
  const getValidDay = (y, m, d) => {
    const lastDayOfMonth = new Date(y, m + 1, 0).getDate();
    return Math.min(d, lastDayOfMonth);
  };

  let nextDate;
  
  if (intervalDays <= 31) {
    const validDay = getValidDay(year, month, targetDay);
    nextDate = new Date(year, month, validDay);
    
    if (currentDay >= targetDay || nextDate <= new Date()) {
      const nextMonth = month + 1;
      const nextYear = nextMonth > 11 ? year + 1 : year;
      const adjustedMonth = nextMonth > 11 ? 0 : nextMonth;
      const validNextDay = getValidDay(nextYear, adjustedMonth, targetDay);
      nextDate = new Date(nextYear, adjustedMonth, validNextDay);
    }
  } else if (intervalDays <= 92) {
    let monthsToAdd = 3 - (month % 3);
    if (monthsToAdd === 0 && currentDay >= targetDay) monthsToAdd = 3;
    const nextMonth = month + monthsToAdd;
    const nextYear = year + Math.floor(nextMonth / 12);
    const adjustedMonth = nextMonth % 12;
    const validDay = getValidDay(nextYear, adjustedMonth, targetDay);
    nextDate = new Date(nextYear, adjustedMonth, validDay);
  } else if (intervalDays <= 183) {
    let monthsToAdd = month < 6 ? 6 - month : 12 - month;
    if (monthsToAdd === 0 && currentDay >= targetDay) monthsToAdd = 6;
    const nextMonth = month + monthsToAdd;
    const nextYear = year + Math.floor(nextMonth / 12);
    const adjustedMonth = nextMonth % 12;
    const validDay = getValidDay(nextYear, adjustedMonth, targetDay);
    nextDate = new Date(nextYear, adjustedMonth, validDay);
  } else {
    const validDay = getValidDay(year, month, targetDay);
    nextDate = new Date(year, month, validDay);
    if (nextDate <= new Date()) {
      const validNextDay = getValidDay(year + 1, month, targetDay);
      nextDate = new Date(year + 1, month, validNextDay);
    }
  }

  return nextDate;
}

/**
 * Formatea fecha de pago para mostrar
 */
function formatPaymentDate(date) {
  if (!date) return 'Sin fecha';

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const dateOnly = new Date(date);
  dateOnly.setHours(0, 0, 0, 0);

  if (dateOnly.getTime() === today.getTime()) {
    return 'Hoy';
  }
  
  if (dateOnly.getTime() === tomorrow.getTime()) {
    return 'Mañana';
  }

  const diffDays = Math.ceil((dateOnly - today) / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return `Hace ${Math.abs(diffDays)} día${Math.abs(diffDays) !== 1 ? 's' : ''}`;
  }
  
  if (diffDays <= 7) {
    return `En ${diffDays} día${diffDays !== 1 ? 's' : ''}`;
  }

  return date.toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
  });
}

/**
 * Hook para obtener categoría por ID
 */
export function useSubscriptionCategory(categoryId) {
  return SUBSCRIPTION_CATEGORIES.find(c => c.id === categoryId) 
    || SUBSCRIPTION_CATEGORIES.find(c => c.id === 'other');
}

/**
 * Hook para obtener frecuencia por ID
 */
export function usePaymentFrequency(frequencyId) {
  return PAYMENT_FREQUENCIES.find(f => f.id === frequencyId)
    || PAYMENT_FREQUENCIES.find(f => f.id === 'monthly');
}

export { formatPaymentDate };