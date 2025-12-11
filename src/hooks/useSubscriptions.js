'use client';

import { useState, useEffect } from 'react';
import { useFirestore } from '../firebase/provider';
import { collection, addDoc, query, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { useAuth } from '../firebase/auth';

export function useSubscriptions() {
  const { user } = useAuth();
  const { db } = useFirestore();
  const [subs, setSubs] = useState([]);
  const [loadingSubs, setLoadingSubs] = useState(true);
  const [totalFixed, setTotalFixed] = useState(0);

  useEffect(() => {
    if (!user || !db) return;

    const q = query(collection(db, "users", user.uid, "subscriptions"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let total = 0;
      const docs = snapshot.docs.map(doc => {
        const data = doc.data();
        total += parseFloat(data.amount);
        return {
          id: doc.id,
          ...data,
          ...calculateNextPayment(data.paymentDay)
        };
      });

      // Ordenar por: los que vencen más pronto primero
      docs.sort((a, b) => a.daysLeft - b.daysLeft);

      setSubs(docs);
      setTotalFixed(total);
      setLoadingSubs(false);
    });

    return () => unsubscribe();
  }, [user, db]);

  // Lógica inteligente de fechas
  const calculateNextPayment = (day) => {
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    let nextDate = new Date(currentYear, currentMonth, day);

    // Si el día ya pasó este mes, el pago es el siguiente mes
    if (currentDay > day) {
      nextDate.setMonth(currentMonth + 1);
    }

    // Diferencia en días
    const diffTime = Math.abs(nextDate - today);
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

    return { daysLeft, nextDate };
  };

  const addSubscription = async (name, amount, paymentDay, category) => {
    if (!user) return;
    await addDoc(collection(db, "users", user.uid, "subscriptions"), {
      name,
      amount: parseFloat(amount),
      paymentDay: parseInt(paymentDay),
      category // 'home', 'entertainment', 'service'
    });
  };

  const deleteSubscription = async (id) => {
    if (!user) return;
    await deleteDoc(doc(db, "users", user.uid, "subscriptions", id));
  };

  return { subs, loadingSubs, totalFixed, addSubscription, deleteSubscription };
}
