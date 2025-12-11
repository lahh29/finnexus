import { FirebaseProvider } from "../firebase/provider";
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
        <FirebaseProvider>
          {children}
        </FirebaseProvider>
      </body>
    </html>
  );
}
