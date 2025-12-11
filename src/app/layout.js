import { FirebaseProvider } from "../firebase/provider";
import { ThemeProvider } from "../components/theme-provider";
import "./globals.css";

export const metadata = {
  title: "Mis Finanzas",
  description: "Control financiero personal",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <FirebaseProvider>
            {children}
          </FirebaseProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
