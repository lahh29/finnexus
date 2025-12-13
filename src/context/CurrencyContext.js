'use client';

import { createContext, useContext, useState, useMemo, useCallback } from 'react';

const SUPPORTED_CURRENCIES = [
  { code: 'MXN', name: 'Peso Mexicano', symbol: '$' },
  { code: 'USD', name: 'Dólar Americano', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'COP', name: 'Peso Colombiano', symbol: '$' },
  { code: 'VES', name: 'Bolívar Venezolano', symbol: 'Bs.' },
  { code: 'ARS', name: 'Peso Argentino', symbol: '$' },
  { code: 'BRL', name: 'Real Brasileño', symbol: 'R$' },
  { code: 'CLP', name: 'Peso Chileno', symbol: '$' },
];

const CurrencyContext = createContext(undefined);

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}

export function CurrencyProvider({ children }) {
  const [currency, setCurrency] = useState('MXN');

  const formatCurrency = useCallback((amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0);
  }, [currency]);

  const value = useMemo(() => ({
    currency,
    setCurrency,
    formatCurrency,
    supportedCurrencies: SUPPORTED_CURRENCIES,
  }), [currency, formatCurrency]);

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}
