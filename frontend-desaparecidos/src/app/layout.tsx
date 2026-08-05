import React from 'react';
import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';
import '@/styles/globals.css';
import Link from 'next/link';

const inter = Inter({ subsets: ['latin'], variable: '--font-body' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-heading' });

export const metadata: Metadata = {
  title: 'Plataforma de Personas Desaparecidas - DMQ',
  description: 'Herramienta de asistencia tecnológica, analítica y de apoyo comunitario para la búsqueda de personas desaparecidas en el Distrito Metropolitano de Quito.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${inter.variable} ${outfit.variable}`}>
      <body>
        <nav className="navbar">
          <Link href="/" className="navbar-brand">
            <span className="brand-icon">🔍</span>
            <span>DMQ Desaparecidos</span>
          </Link>
          <ul className="navbar-nav">
            <li><Link href="/">Inicio</Link></li>
            <li><Link href="/casos">Casos</Link></li>
            <li><Link href="/registro">Reportar</Link></li>
            <li><Link href="/privacidad">Privacidad</Link></li>
            <li><Link href="/login">Ingresar</Link></li>
            <li><Link href="/admin">Admin</Link></li>
          </ul>
        </nav>
        
        <main style={{ paddingTop: '73px' }}>
          {children}
        </main>
        
        <footer style={{ borderTop: '1px solid var(--border-glass)', padding: '24px 32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          <p>© {new Date().getFullYear()} DMQ Ecuador — Sistema de Alerta y Búsqueda Comunitaria.</p>
          <p style={{ marginTop: '8px', fontSize: '0.75rem' }}>
            <Link href="/privacidad" style={{ color: 'var(--text-secondary)', marginRight: '16px' }}>Política de Privacidad (LOPDP)</Link>
            Protección de datos conforme a la Ley Orgánica de Protección de Datos Personales — R.O. 459, 26-may-2021
          </p>
        </footer>
      </body>
    </html>
  );
}
