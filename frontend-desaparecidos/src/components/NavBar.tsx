'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { isAuthenticated, isAdmin, logout, getUser } from '@/lib/auth';

export default function NavBar() {
  const [isLogged, setIsLogged] = useState<boolean>(false);
  const [isAdminUser, setIsAdminUser] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<string>('');

  useEffect(() => {
    // Check auth state on mount
    const checkAuth = () => {
      const logged = isAuthenticated();
      setIsLogged(logged);
      if (logged) {
        setIsAdminUser(isAdmin());
        const user = getUser();
        if (user && user.rol) {
          setUserRole(user.rol);
        }
      }
    };
    checkAuth();
  }, []);

  const handleLogout = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    logout();
    window.location.href = '/';
  };

  return (
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
        {!isLogged ? (
          <li><Link href="/login">Ingresar</Link></li>
        ) : (
          <>
            {userRole && (
              <li>
                <span style={{
                  padding: '4px 8px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--surface-overlay)',
                  border: '1px solid var(--border-glass)',
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)',
                  textTransform: 'capitalize'
                }}>
                  {userRole}
                </span>
              </li>
            )}
            {isAdminUser && <li><Link href="/admin">Admin</Link></li>}
            <li>
              <button 
                onClick={handleLogout}
                style={{
                  background: 'transparent',
                  border: '1px solid #ef4444',
                  color: '#ef4444',
                  padding: '4px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                Cerrar Sesión
              </button>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
}
