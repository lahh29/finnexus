'use client';

import { useState, useEffect } from 'react';
import { useFirestore } from '../firebase/provider';
import { collection, addDoc, query, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { useAuth } from '../firebase/auth';

export function useCards() {
  const { user } = useAuth();
  const { db } = useFirestore();
  const [cards, setCards] = useState([]);
  const [loadingCards, setLoadingCards] = useState(true);

  useEffect(() => {
    if (!user || !db) return;

    const q = query(collection(db, "users", user.uid, "credit_cards"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          ...calculateStatus(data.cutoffDay, data.paymentDay)
        };
      });
      setCards(docs);
      setLoadingCards(false);
    });

    return () => unsubscribe();
  }, [user, db]);

  // Lógica para calcular fechas
  const calculateStatus = (cutoffDay, paymentDay) => {
    const today = new Date();
    const currentDay = today.getDate();
    
    // Calcular próximos días
    let daysToCutoff = cutoffDay - currentDay;
    if (daysToCutoff < 0) daysToCutoff += 30; // Aproximación simple

    return { daysToCutoff };
  };

  const addCard = async (name, limit, cutoffDay, paymentDay, currentDebt) => {
    if (!user) return;
    await addDoc(collection(db, "users", user.uid, "credit_cards"), {
      name,
      limit: parseFloat(limit),
      cutoffDay: parseInt(cutoffDay),
      paymentDay: parseInt(paymentDay),
      currentDebt: parseFloat(currentDebt) || 0,
      bgGradient: getRandomGradient() // Asignamos un color al azar
    });
  };

  const deleteCard = async (id) => {
    if (!user) return;
    await deleteDoc(doc(db, "users", user.uid, "credit_cards", id));
  };

  return { cards, loadingCards, addCard, deleteCard };
}

// Utilidad para colores estilo iOS
function getRandomGradient() {
  const gradients = [
    'from-blue-500 to-blue-700', // Azul Clásico
    'from-purple-500 to-indigo-600', // Nubank style
    'from-slate-700 to-black', // Black Card
    'from-rose-400 to-orange-400', // Gold/Sunset
    'from-emerald-500 to-teal-700' // Green
  ];
  return gradients[Math.floor(Math.random() * gradients.length)];
}
