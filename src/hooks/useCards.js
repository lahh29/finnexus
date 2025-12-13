'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useFirestore } from '../firebase/provider';
import { 
  collection, 
  addDoc, 
  query, 
  onSnapshot, 
  deleteDoc, 
  doc,
  updateDoc,
  orderBy,
  limit as firestoreLimit,
  serverTimestamp
} from 'firebase/firestore';
import { useAuth } from '../firebase/auth-provider';

// Constantes
const MAX_CARDS = 10;
const COLLECTION_NAME = "credit_cards";

// Gradientes disponibles
const CARD_GRADIENTS = [
  { id: 'blue', name: 'Azul Clásico', value: 'from-blue-500 to-blue-700' },
  { id: 'purple', name: 'Morado', value: 'from-purple-500 to-indigo-600' },
  { id: 'black', name: 'Negro', value: 'from-slate-700 to-black' },
  { id: 'gold', name: 'Dorado', value: 'from-rose-400 to-orange-400' },
  { id: 'green', name: 'Verde', value: 'from-emerald-500 to-teal-700' },
  { id: 'pink', name: 'Rosa', value: 'from-pink-500 to-rose-500' },
  { id: 'cyan', name: 'Cian', value: 'from-cyan-400 to-blue-500' },
  { id: 'amber', name: 'Ámbar', value: 'from-amber-400 to-orange-500' },
];

/**
 * Hook para gestionar tarjetas de crédito
 * @returns {Object} Estado y funciones para manejar tarjetas
 */
export function useCards() {
  const { user } = useAuth();
  const { db } = useFirestore();
  const [cards, setCards] = useState([]);
  const [loadingCards, setLoadingCards] = useState(true);
  const [error, setError] = useState(null);
  
  // Ref para controlar operaciones async cuando el componente se desmonta
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Suscripción a cambios en tiempo real
  useEffect(() => {
    if (!user || !db) {
      setLoadingCards(false);
      setCards([]);
      return;
    }

    setLoadingCards(true);
    setError(null);

    const cardsRef = collection(db, "users", user.uid, COLLECTION_NAME);
    const q = query(
      cardsRef, 
      orderBy("createdAt", "desc"),
      firestoreLimit(MAX_CARDS)
    );

    const unsubscribe = onSnapshot(
      q, 
      (snapshot) => {
        if (!isMountedRef.current) return;
        
        const docs = snapshot.docs.map(docSnapshot => {
          const data = docSnapshot.data();
          const status = calculateCardStatus(data.cutoffDay, data.paymentDay);
          
          return {
            id: docSnapshot.id,
            name: data.name || 'Sin nombre',
            limit: data.limit || 0,
            currentDebt: data.currentDebt || 0,
            cutoffDay: data.cutoffDay || 1,
            paymentDay: data.paymentDay || 15,
            bgGradient: data.bgGradient || CARD_GRADIENTS[0].value,
            createdAt: data.createdAt?.toDate() || new Date(),
            ...status,
          };
        });
        
        setCards(docs);
        setLoadingCards(false);
      },
      (err) => {
        if (!isMountedRef.current) return;
        
        console.error("Error fetching cards:", err);
        setError(err.message);
        setLoadingCards(false);
      }
    );

    return () => unsubscribe();
  }, [user, db]);

  /**
   * Agregar nueva tarjeta
   */
  const addCard = useCallback(async (name, limit, cutoffDay, paymentDay, currentDebt, gradient = null) => {
    if (!user || !db) {
      throw new Error("Usuario no autenticado");
    }

    // Validaciones
    const trimmedName = name?.trim();
    if (!trimmedName) {
      throw new Error("El nombre es requerido");
    }

    if (cards.length >= MAX_CARDS) {
      throw new Error(`Máximo ${MAX_CARDS} tarjetas permitidas`);
    }

    const parsedLimit = parseFloat(limit);
    const parsedCutoff = parseInt(cutoffDay, 10);
    const parsedPayment = parseInt(paymentDay, 10);
    const parsedDebt = parseFloat(currentDebt) || 0;

    if (isNaN(parsedLimit) || parsedLimit <= 0) {
      throw new Error("Límite de crédito inválido");
    }

    if (isNaN(parsedCutoff) || parsedCutoff < 1 || parsedCutoff > 31) {
      throw new Error("Día de corte debe estar entre 1 y 31");
    }

    if (isNaN(parsedPayment) || parsedPayment < 1 || parsedPayment > 31) {
      throw new Error("Día de pago debe estar entre 1 y 31");
    }

    if (parsedDebt < 0) {
      throw new Error("La deuda no puede ser negativa");
    }

    if (parsedDebt > parsedLimit) {
      throw new Error("La deuda no puede ser mayor al límite");
    }

    const cardData = {
      name: trimmedName,
      limit: parsedLimit,
      cutoffDay: parsedCutoff,
      paymentDay: parsedPayment,
      currentDebt: parsedDebt,
      bgGradient: gradient || getRandomGradient(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      const docRef = await addDoc(
        collection(db, "users", user.uid, COLLECTION_NAME), 
        cardData
      );
      return docRef.id;
    } catch (err) {
      console.error("Error adding card:", err);
      throw new Error("Error al crear la tarjeta. Intenta de nuevo.");
    }
  }, [user, db, cards.length]);

  /**
   * Actualizar tarjeta existente
   */
  const updateCard = useCallback(async (cardId, updates) => {
    if (!user || !db) {
      throw new Error("Usuario no autenticado");
    }

    if (!cardId) {
      throw new Error("ID de tarjeta requerido");
    }

    const allowedFields = ['name', 'limit', 'cutoffDay', 'paymentDay', 'currentDebt', 'bgGradient'];
    const sanitizedUpdates = {};

    for (const [key, value] of Object.entries(updates)) {
      if (!allowedFields.includes(key)) continue;

      switch (key) {
        case 'name':
          if (value?.trim()) {
            sanitizedUpdates.name = value.trim();
          }
          break;
        case 'limit':
          const parsedLimit = parseFloat(value);
          if (!isNaN(parsedLimit) && parsedLimit > 0) {
            sanitizedUpdates.limit = parsedLimit;
          }
          break;
        case 'cutoffDay':
        case 'paymentDay':
          const parsedDay = parseInt(value, 10);
          if (!isNaN(parsedDay) && parsedDay >= 1 && parsedDay <= 31) {
            sanitizedUpdates[key] = parsedDay;
          }
          break;
        case 'currentDebt':
          const parsedDebt = parseFloat(value);
          if (!isNaN(parsedDebt) && parsedDebt >= 0) {
            sanitizedUpdates.currentDebt = parsedDebt;
          }
          break;
        case 'bgGradient':
          if (CARD_GRADIENTS.some(g => g.value === value)) {
            sanitizedUpdates.bgGradient = value;
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
        doc(db, "users", user.uid, COLLECTION_NAME, cardId),
        sanitizedUpdates
      );
    } catch (err) {
      console.error("Error updating card:", err);
      throw new Error("Error al actualizar la tarjeta. Intenta de nuevo.");
    }
  }, [user, db]);

  /**
   * Actualizar deuda de una tarjeta
   */
  const updateDebt = useCallback(async (cardId, newDebt) => {
    return updateCard(cardId, { currentDebt: newDebt });
  }, [updateCard]);

  /**
   * Eliminar tarjeta
   */
  const deleteCard = useCallback(async (cardId) => {
    if (!user || !db) {
      throw new Error("Usuario no autenticado");
    }

    if (!cardId) {
      throw new Error("ID de tarjeta requerido");
    }

    try {
      await deleteDoc(doc(db, "users", user.uid, COLLECTION_NAME, cardId));
    } catch (err) {
      console.error("Error deleting card:", err);
      throw new Error("Error al eliminar la tarjeta. Intenta de nuevo.");
    }
  }, [user, db]);

  /**
   * Obtener estadísticas de tarjetas
   */
  const getStats = useCallback(() => {
    if (cards.length === 0) {
      return {
        totalLimit: 0,
        totalDebt: 0,
        availableCredit: 0,
        utilizationRate: 0,
        cardsCount: 0,
        nextCutoff: null,
        nextPayment: null,
      };
    }

    const totalLimit = cards.reduce((sum, card) => sum + card.limit, 0);
    const totalDebt = cards.reduce((sum, card) => sum + card.currentDebt, 0);
    const availableCredit = totalLimit - totalDebt;
    const utilizationRate = totalLimit > 0 ? (totalDebt / totalLimit) * 100 : 0;

    // Encontrar próximo corte y pago
    const sortedByCutoff = [...cards].sort((a, b) => a.daysToCutoff - b.daysToCutoff);
    const sortedByPayment = [...cards].sort((a, b) => a.daysToPayment - b.daysToPayment);

    return {
      totalLimit,
      totalDebt,
      availableCredit,
      utilizationRate: Math.round(utilizationRate * 100) / 100,
      cardsCount: cards.length,
      nextCutoff: sortedByCutoff[0] || null,
      nextPayment: sortedByPayment[0] || null,
    };
  }, [cards]);

  return { 
    cards, 
    loadingCards, 
    error,
    addCard, 
    updateCard,
    updateDebt,
    deleteCard,
    getStats,
    canAddMore: cards.length < MAX_CARDS,
    maxCards: MAX_CARDS,
    availableGradients: CARD_GRADIENTS,
  };
}

/**
 * Calcula el estado de una tarjeta (días hasta corte y pago)
 * @param {number} cutoffDay - Día de corte (1-31)
 * @param {number} paymentDay - Día de pago (1-31)
 * @returns {Object} Estado calculado
 */
function calculateCardStatus(cutoffDay, paymentDay) {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const currentDay = today.getDate();

  // Función helper para calcular días hasta una fecha
  const getDaysUntil = (targetDay) => {
    // Intentar con el mes actual
    let targetDate = new Date(currentYear, currentMonth, targetDay);
    
    // Si el día no existe en el mes (ej: 31 en febrero), ajustar
    if (targetDate.getDate() !== targetDay) {
      // Usar el último día del mes
      targetDate = new Date(currentYear, currentMonth + 1, 0);
    }
    
    // Si ya pasó este mes, usar el siguiente
    if (targetDate <= today) {
      targetDate = new Date(currentYear, currentMonth + 1, targetDay);
      // Verificar si el día existe en el siguiente mes
      if (targetDate.getDate() !== targetDay) {
        targetDate = new Date(currentYear, currentMonth + 2, 0);
      }
    }
    
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  };

  const daysToCutoff = getDaysUntil(cutoffDay || 1);
  const daysToPayment = getDaysUntil(paymentDay || 15);

  // Determinar el estado de urgencia
  let status = 'normal';
  if (daysToCutoff === 0 || daysToPayment === 0) {
    status = 'today';
  } else if (daysToCutoff <= 3 || daysToPayment <= 3) {
    status = 'urgent';
  } else if (daysToCutoff <= 7 || daysToPayment <= 7) {
    status = 'warning';
  }

  // Calcular fecha de próximo corte
  const getNextDate = (day) => {
    let date = new Date(currentYear, currentMonth, day);
    if (date.getDate() !== day) {
      date = new Date(currentYear, currentMonth + 1, 0);
    }
    if (date <= today) {
      date = new Date(currentYear, currentMonth + 1, day);
      if (date.getDate() !== day) {
        date = new Date(currentYear, currentMonth + 2, 0);
      }
    }
    return date;
  };

  return {
    daysToCutoff,
    daysToPayment,
    status,
    nextCutoffDate: getNextDate(cutoffDay || 1),
    nextPaymentDate: getNextDate(paymentDay || 15),
    isPaymentDue: daysToPayment <= 3,
    isCutoffNear: daysToCutoff <= 3,
  };
}

/**
 * Obtiene un gradiente aleatorio
 * @returns {string} Clase CSS del gradiente
 */
function getRandomGradient() {
  return CARD_GRADIENTS[Math.floor(Math.random() * CARD_GRADIENTS.length)].value;
}

/**
 * Hook para obtener un gradiente específico por ID
 */
export function useCardGradient(gradientId) {
  return CARD_GRADIENTS.find(g => g.id === gradientId) || CARD_GRADIENTS[0];
}

/**
 * Exportar constantes útiles
 */
export { CARD_GRADIENTS, MAX_CARDS };
