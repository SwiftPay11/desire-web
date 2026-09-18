'use client';

import {
  useEffect,
  useState,
} from 'react';

import {
  usePathname,
  useRouter,
} from 'next/navigation';

import authService from '@/services/auth.service';

export default function AdminGuard({
  children,
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [authorized, setAuthorized] =
    useState(false);

  const [checking, setChecking] =
    useState(true);

  useEffect(() => {
    let active = true;

    async function verifyAdmin() {
      /*
       * The admin login page itself
       * must remain public.
       */
      if (pathname === '/admin/login') {
        if (active) {
          setAuthorized(true);
          setChecking(false);
        }

        return;
      }

      try {
        const token =
          authService.getStoredToken();

        const storedUser =
          authService.getStoredUser();

        if (
          !token ||
          !storedUser?.isAdmin
        ) {
          throw new Error(
            'Administrator authentication required.',
          );
        }

        /*
         * Do not trust localStorage alone.
         * Confirm the admin session
         * against the backend.
         */
        await authService.checkAdmin();

        if (active) {
          setAuthorized(true);
        }
      } catch (error) {
        console.error(
          'Admin authorization failed:',
          error,
        );

        authService.logout();

        if (active) {
          setAuthorized(false);
        }

        router.replace(
          '/admin/login',
        );
      } finally {
        if (active) {
          setChecking(false);
        }
      }
    }

    verifyAdmin();

    return () => {
      active = false;
    };
  }, [
    pathname,
    router,
  ]);

  if (
    pathname === '/admin/login'
  ) {
    return children;
  }

  if (checking) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f7f7f4',
          color: '#111111',
        }}
      >
        <div
          style={{
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontFamily:
                "'Playfair Display', Georgia, serif",
              fontSize: '28px',
              marginBottom: '10px',
            }}
          >
            DESIRE
          </div>

          <div
            style={{
              fontSize: '8px',
              fontWeight: '700',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: '#858580',
            }}
          >
            Verifying administrator
          </div>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  return children;
}