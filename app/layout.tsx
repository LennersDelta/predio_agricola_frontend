// app/layout.tsx
import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import './globals.css';

export const metadata: Metadata = {
  title: 'SIGPA — Predio Agrícola | Carabineros de Chile',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@300;400;600;700;800&family=Barlow:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Toaster
          position="top-right"
          richColors
          toastOptions={{
            style: {
              fontFamily: 'monospace',
              fontSize: '.78rem',
            },
          }}
        />
        {children}
      </body>
    </html>
  );
}