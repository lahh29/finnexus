// src/components/theme-provider.jsx
'use client';

import { ThemeProvider as NextThemesProvider, useTheme } from 'next-themes';
import { useState, useEffect } from 'react';

export function ThemeProvider({ children, ...props }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange={false}
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}

// Hook personalizado que maneja el estado de montaje
export function useThemeMounted() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return {
    theme: mounted ? theme : undefined,
    setTheme,
    resolvedTheme: mounted ? resolvedTheme : undefined,
    mounted,
    isDark: mounted ? resolvedTheme === 'dark' : false,
    isLight: mounted ? resolvedTheme === 'light' : false,
    toggleTheme: () => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark'),
  };
}

export { useTheme };