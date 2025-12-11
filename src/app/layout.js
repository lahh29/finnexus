import { AuthProvider } from "../context/AuthContext";
import "./globals.css";

export const metadata = {
  title: "Mis Finanzas",
  description: "Control financiero personal",
};

// Esta función DEBE tener 'export default'
export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}