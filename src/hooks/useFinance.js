'use client';

import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  deleteDoc, 
  doc,
  serverTimestamp 
} from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

export function useFinance() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  
  // Totales calculados
  const [balance, setBalance] = useState(0);
  const [income, setIncome] = useState(0);
  const [expense, setExpense] = useState(0);

  useEffect(() => {
    if (!user) return;

    // Referencia a la colección: users -> UID -> transactions
    const q = query(
      collection(db, "users", user.uid, "transactions"),
      orderBy("date", "desc")
    );

    // Suscripción en tiempo real (Magic de Firebase)
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setTransactions(docs);
      calculateTotals(docs);
      setLoadingData(false);
    });

    return () => unsubscribe();
  }, [user]);

  const calculateTotals = (data) => {
    let inc = 0;
    let exp = 0;
    data.forEach(item => {
      const amount = parseFloat(item.amount);
      if (item.type === 'income') inc += amount;
      else if (item.type === 'expense') exp += amount;
    });
    setIncome(inc);
    setExpense(exp);
    setBalance(inc - exp);
  };

  const addTransaction = async (amount, description, type, category) => {
    if (!user) return;
    await addDoc(collection(db, "users", user.uid, "transactions"), {
      amount: parseFloat(amount),
      description,
      type, // 'income' o 'expense'
      category,
      date: serverTimestamp(), // Fecha del servidor para evitar conflictos
      displayDate: new Date().toISOString() // Fecha local para mostrar inmediatamente
    });
  };

  const deleteTransaction = async (id) => {
    if (!user) return;
    await deleteDoc(doc(db, "users", user.uid, "transactions", id));
  };

  return { 
    transactions, 
    loadingData, 
    balance, 
    income, 
    expense, 
    addTransaction,
    deleteTransaction
  };
}