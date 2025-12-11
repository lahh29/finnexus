// src/hooks/useReports.js
'use client';

import { useMemo, useCallback } from 'react';
import { useFinance } from './useFinance';
import { useCards } from './useCards';
import { useSubscriptions } from './useSubscriptions';

/**
 * Hook para generar reportes y estadísticas financieras
 */
export function useReports() {
  const { transactions, balance, income, expense } = useFinance();
  const { cards, totalDebt, totalLimit } = useCards();
  const { subs, totals: subTotals } = useSubscriptions();

  // Transacciones del mes actual
  const currentMonthTransactions = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    return transactions.filter(t => {
      const date = t.date instanceof Date ? t.date : new Date(t.date);
      return date >= startOfMonth;
    });
  }, [transactions]);

  // Transacciones del mes anterior
  const lastMonthTransactions = useMemo(() => {
    const now = new Date();
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    
    return transactions.filter(t => {
      const date = t.date instanceof Date ? t.date : new Date(t.date);
      return date >= startOfLastMonth && date <= endOfLastMonth;
    });
  }, [transactions]);

  // Gastos por categoría (mes actual)
  const expensesByCategory = useMemo(() => {
    const expenses = currentMonthTransactions.filter(t => t.type === 'expense');
    const grouped = {};
    
    expenses.forEach(t => {
      const cat = t.category || 'other';
      if (!grouped[cat]) {
        grouped[cat] = { amount: 0, count: 0, transactions: [] };
      }
      grouped[cat].amount += t.amount;
      grouped[cat].count += 1;
      grouped[cat].transactions.push(t);
    });

    // Convertir a array y ordenar por monto
    const result = Object.entries(grouped)
      .map(([category, data]) => ({
        category,
        ...data,
        percentage: expense > 0 ? (data.amount / expense) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    return result;
  }, [currentMonthTransactions, expense]);

  // Ingresos por categoría (mes actual)
  const incomeByCategory = useMemo(() => {
    const incomes = currentMonthTransactions.filter(t => t.type === 'income');
    const grouped = {};
    
    incomes.forEach(t => {
      const cat = t.category || 'other';
      if (!grouped[cat]) {
        grouped[cat] = { amount: 0, count: 0 };
      }
      grouped[cat].amount += t.amount;
      grouped[cat].count += 1;
    });

    return Object.entries(grouped)
      .map(([category, data]) => ({
        category,
        ...data,
        percentage: income > 0 ? (data.amount / income) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [currentMonthTransactions, income]);

  // Tendencia diaria del mes actual
  const dailyTrend = useMemo(() => {
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const days = [];

    for (let i = 1; i <= daysInMonth; i++) {
      const dayTransactions = currentMonthTransactions.filter(t => {
        const date = t.date instanceof Date ? t.date : new Date(t.date);
        return date.getDate() === i;
      });

      const dayIncome = dayTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const dayExpense = dayTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      days.push({
        day: i,
        date: new Date(now.getFullYear(), now.getMonth(), i),
        income: dayIncome,
        expense: dayExpense,
        net: dayIncome - dayExpense,
        hasData: dayTransactions.length > 0,
      });
    }

    return days;
  }, [currentMonthTransactions]);

  // Tendencia mensual (últimos 6 meses)
  const monthlyTrend = useMemo(() => {
    const months = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const startOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const endOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

      const monthTransactions = transactions.filter(t => {
        const date = t.date instanceof Date ? t.date : new Date(t.date);
        return date >= startOfMonth && date <= endOfMonth;
      });

      const monthIncome = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const monthExpense = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      months.push({
        month: monthDate.toLocaleDateString('es-MX', { month: 'short' }),
        monthFull: monthDate.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' }),
        year: monthDate.getFullYear(),
        income: monthIncome,
        expense: monthExpense,
        net: monthIncome - monthExpense,
        savingsRate: monthIncome > 0 ? ((monthIncome - monthExpense) / monthIncome) * 100 : 0,
      });
    }

    return months;
  }, [transactions]);

  // Comparación con mes anterior
  const monthComparison = useMemo(() => {
    const currentIncome = currentMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const currentExpense = currentMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const lastIncome = lastMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const lastExpense = lastMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const incomeChange = lastIncome > 0 
      ? ((currentIncome - lastIncome) / lastIncome) * 100 
      : currentIncome > 0 ? 100 : 0;
    
    const expenseChange = lastExpense > 0 
      ? ((currentExpense - lastExpense) / lastExpense) * 100 
      : currentExpense > 0 ? 100 : 0;

    return {
      current: { income: currentIncome, expense: currentExpense, net: currentIncome - currentExpense },
      last: { income: lastIncome, expense: lastExpense, net: lastIncome - lastExpense },
      change: {
        income: incomeChange,
        expense: expenseChange,
        incomeDirection: incomeChange >= 0 ? 'up' : 'down',
        expenseDirection: expenseChange >= 0 ? 'up' : 'down',
      },
    };
  }, [currentMonthTransactions, lastMonthTransactions]);

  // Resumen de tarjetas
  const cardsReport = useMemo(() => {
    const utilizationPercent = totalLimit > 0 ? (totalDebt / totalLimit) * 100 : 0;
    const averageUtilization = cards.length > 0
      ? cards.reduce((sum, c) => sum + (c.limit > 0 ? (c.currentDebt / c.limit) * 100 : 0), 0) / cards.length
      : 0;

    const highUtilizationCards = cards.filter(c => {
      const util = c.limit > 0 ? (c.currentDebt / c.limit) * 100 : 0;
      return util >= 70;
    });

    const upcomingPayments = cards
      .filter(c => c.daysToPayment <= 7)
      .sort((a, b) => a.daysToPayment - b.daysToPayment);

    return {
      totalCards: cards.length,
      totalDebt,
      totalLimit,
      availableCredit: totalLimit - totalDebt,
      utilizationPercent,
      averageUtilization,
      highUtilizationCards,
      upcomingPayments,
      healthStatus: utilizationPercent < 30 ? 'excellent' : utilizationPercent < 50 ? 'good' : utilizationPercent < 70 ? 'fair' : 'poor',
    };
  }, [cards, totalDebt, totalLimit]);

  // Resumen de suscripciones
  const subscriptionsReport = useMemo(() => {
    const byCategoryArray = Object.entries(subTotals.byCategory || {})
      .map(([category, data]) => ({
        category,
        ...data,
        percentage: subTotals.monthlyTotal > 0 ? (data.monthly / subTotals.monthlyTotal) * 100 : 0,
      }))
      .sort((a, b) => b.monthly - a.monthly);

    return {
      ...subTotals,
      byCategory: byCategoryArray,
      subscriptionsCount: subs.length,
      averagePerSubscription: subs.length > 0 ? subTotals.monthlyTotal / subs.length : 0,
    };
  }, [subs, subTotals]);

  // Indicadores de salud financiera
  const financialHealth = useMemo(() => {
    const savingsRate = income > 0 ? ((income - expense) / income) * 100 : 0;
    const fixedExpenseRatio = income > 0 ? (subTotals.monthlyTotal / income) * 100 : 0;
    const debtToIncomeRatio = income > 0 ? (totalDebt / income) * 100 : 0;

    // Puntaje de salud (0-100)
    let healthScore = 100;
    
    // Penalizar por baja tasa de ahorro
    if (savingsRate < 0) healthScore -= 30;
    else if (savingsRate < 10) healthScore -= 20;
    else if (savingsRate < 20) healthScore -= 10;

    // Penalizar por alta utilización de crédito
    const creditUtil = cardsReport.utilizationPercent;
    if (creditUtil > 70) healthScore -= 25;
    else if (creditUtil > 50) healthScore -= 15;
    else if (creditUtil > 30) healthScore -= 5;

    // Penalizar por alta proporción de gastos fijos
    if (fixedExpenseRatio > 50) healthScore -= 20;
    else if (fixedExpenseRatio > 30) healthScore -= 10;

    healthScore = Math.max(0, healthScore);

    let healthStatus = 'excellent';
    if (healthScore < 50) healthStatus = 'poor';
    else if (healthScore < 70) healthStatus = 'fair';
    else if (healthScore < 85) healthStatus = 'good';

    const recommendations = [];
    
    if (savingsRate < 20) {
      recommendations.push({
        type: 'savings',
        priority: 'high',
        message: 'Intenta ahorrar al menos 20% de tus ingresos',
      });
    }
    
    if (creditUtil > 30) {
      recommendations.push({
        type: 'credit',
        priority: creditUtil > 70 ? 'high' : 'medium',
        message: 'Reduce el uso de tus tarjetas de crédito',
      });
    }
    
    if (fixedExpenseRatio > 30) {
      recommendations.push({
        type: 'fixed',
        priority: 'medium',
        message: 'Revisa tus suscripciones y gastos fijos',
      });
    }

    return {
      score: Math.round(healthScore),
      status: healthStatus,
      savingsRate,
      fixedExpenseRatio,
      debtToIncomeRatio,
      recommendations,
    };
  }, [income, expense, subTotals, totalDebt, cardsReport]);

  // Top gastos del mes
  const topExpenses = useMemo(() => {
    return currentMonthTransactions
      .filter(t => t.type === 'expense')
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [currentMonthTransactions]);

  // Promedio diario
  const dailyAverages = useMemo(() => {
    const now = new Date();
    const dayOfMonth = now.getDate();
    
    const avgIncome = income / dayOfMonth;
    const avgExpense = expense / dayOfMonth;
    
    // Proyección a fin de mes
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const projectedIncome = avgIncome * daysInMonth;
    const projectedExpense = avgExpense * daysInMonth;

    return {
      avgDailyIncome: avgIncome,
      avgDailyExpense: avgExpense,
      projectedMonthlyIncome: projectedIncome,
      projectedMonthlyExpense: projectedExpense,
      projectedBalance: projectedIncome - projectedExpense,
    };
  }, [income, expense]);

  return {
    // Datos principales
    balance,
    income,
    expense,
    
    // Por categoría
    expensesByCategory,
    incomeByCategory,
    
    // Tendencias
    dailyTrend,
    monthlyTrend,
    monthComparison,
    
    // Tarjetas y suscripciones
    cardsReport,
    subscriptionsReport,
    
    // Análisis
    financialHealth,
    topExpenses,
    dailyAverages,
    
    // Transacciones
    currentMonthTransactions,
    transactionsCount: transactions.length,
  };
}