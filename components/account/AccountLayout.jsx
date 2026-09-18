'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/hooks/useAuth';
import LoadingScreen from '@/components/layout/LoadingScreen';

import AccountHeader from './AccountHeader';
import AccountSidebar from './AccountSidebar';

import styles from './account.module.css';

export default function AccountLayout({ children }) {
  const router = useRouter();

  const {
    user,
    loading,
    isAuthenticated,
    logout,
  } = useAuth();

  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/login?redirect=/account/dashboard');
    }
  }, [
    loading,
    isAuthenticated,
    router,
  ]);

  useEffect(() => {
    document.body.style.overflow =
      menuOpen ? 'hidden' : '';

    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    router.replace('/login');
  };

  if (loading) {
    return (
      <LoadingScreen text="Loading your account..." />
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <LoadingScreen text="Redirecting to sign in..." />
    );
  }

  return (
    <div className={styles.accountPage}>
      <AccountHeader
        user={user}
        menuOpen={menuOpen}
        onMenuToggle={() =>
          setMenuOpen((current) => !current)
        }
      />

      <div className={styles.accountShell}>
        <AccountSidebar
          user={user}
          menuOpen={menuOpen}
          onClose={() => setMenuOpen(false)}
          onLogout={handleLogout}
        />

        <button
          type="button"
          className={`${styles.mobileBackdrop} ${
            menuOpen
              ? styles.mobileBackdropVisible
              : ''
          }`}
          onClick={() => setMenuOpen(false)}
          aria-label="Close account menu"
          tabIndex={menuOpen ? 0 : -1}
        />

        <section className={styles.accountContent}>
          {children}
        </section>
      </div>
    </div>
  );
}