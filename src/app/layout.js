// src/app/layout.js
import { Inter } from 'next/font/google';
import { FirebaseProvider } from '../firebase/provider';
import { ThemeProvider } from '../components/theme-provider';
import './globals.css';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata = {
  title: 'FinNexus - Gestión Financiera Inteligente',
  description: 'Administra tus finanzas personales, tarjetas de crédito y suscripciones de forma inteligente.',
  keywords: ['finanzas', 'presupuesto', 'tarjetas', 'suscripciones', 'gastos'],
  authors: [{ name: 'FinNexus' }],
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'FinNexus',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider>
          <FirebaseProvider>
            {children}
          </FirebaseProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}