'use client';

import {
  useState,
} from 'react';

import {
  useRouter,
} from 'next/navigation';

import authService from '@/services/auth.service';

import styles from './admin-login.module.css';

function LockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <rect
        x="5"
        y="10"
        width="14"
        height="10"
        rx="1"
      />

      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="1"
      />

      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />

      <circle
        cx="12"
        cy="12"
        r="2.5"
      />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M3 3l18 18" />

      <path d="M10.6 6.2A10.8 10.8 0 0 1 12 6c6.5 0 10 6 10 6a17.6 17.6 0 0 1-3.1 3.8" />

      <path d="M6.2 6.2C3.5 8 2 12 2 12s3.5 6 10 6a10 10 0 0 0 3-.4" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      <path d="m14 7 5 5-5 5" />
    </svg>
  );
}

export default function AdminLoginPage() {
  const router =
    useRouter();

  const [form, setForm] =
    useState({
      email: '',
      password: '',
    });

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState('');

  function updateField(
    field,
    value,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setError('');
  }

  async function handleSubmit(
    event,
  ) {
    event.preventDefault();

    if (
      !form.email.trim() ||
      !form.password
    ) {
      setError(
        'Enter your admin email and password.',
      );

      return;
    }

    try {
      setLoading(true);
      setError('');

      const response =
        await authService.login({
          email:
            form.email.trim(),
          password:
            form.password,
        });

      if (!response?.user?.isAdmin) {
        authService.logout();

        throw new Error(
          'This account does not have administrator access.',
        );
      }

      /*
       * Extra backend verification.
       * This confirms the JWT is valid
       * and the server recognizes the
       * account as an admin.
       */
      await authService.checkAdmin();

      router.replace(
        '/admin',
      );
    } catch (loginError) {
      console.error(
        'Admin login failed:',
        loginError,
      );

      authService.logout();

      setError(
        loginError?.message ||
          'Unable to sign in to the admin portal.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.page}>
      <section
        className={
          styles.brandPanel
        }
      >
        <div
          className={
            styles.brandContent
          }
        >
          <span
            className={
              styles.brandMark
            }
          >
            DESIRE
          </span>

          <h1>
            Administration
          </h1>

          <p>
            Secure access for DESIRE
            operations, orders, customers,
            products and credit management.
          </p>
        </div>

        <span
          className={
            styles.brandFooter
          }
        >
          DESIRE ADMINISTRATION
        </span>
      </section>

      <section
        className={
          styles.loginPanel
        }
      >
        <div
          className={
            styles.loginCard
          }
        >
          <span
            className={
              styles.eyebrow
            }
          >
            Admin portal
          </span>

          <h2>
            Welcome back
          </h2>

          <p
            className={
              styles.intro
            }
          >
            Sign in with an administrator
            account to continue.
          </p>

          {error && (
            <div
              className={
                styles.errorBanner
              }
              role="alert"
            >
              {error}
            </div>
          )}

          <form
            onSubmit={
              handleSubmit
            }
            className={
              styles.form
            }
          >
            <label>
              <span>
                Email address
              </span>

              <div
                className={
                  styles.inputWrapper
                }
              >
                <MailIcon />

                <input
                  type="email"
                  value={
                    form.email
                  }
                  onChange={(event) =>
                    updateField(
                      'email',
                      event.target.value,
                    )
                  }
                  autoComplete="email"
                  placeholder="admin@desire.com"
                  required
                />
              </div>
            </label>

            <label>
              <span>
                Password
              </span>

              <div
                className={
                  styles.inputWrapper
                }
              >
                <LockIcon />

                <input
                  type={
                    showPassword
                      ? 'text'
                      : 'password'
                  }
                  value={
                    form.password
                  }
                  onChange={(event) =>
                    updateField(
                      'password',
                      event.target.value,
                    )
                  }
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  className={
                    styles.eyeButton
                  }
                  onClick={() =>
                    setShowPassword(
                      (current) =>
                        !current,
                    )
                  }
                  aria-label={
                    showPassword
                      ? 'Hide password'
                      : 'Show password'
                  }
                >
                  {showPassword ? (
                    <EyeOffIcon />
                  ) : (
                    <EyeIcon />
                  )}
                </button>
              </div>
            </label>

            <button
              type="submit"
              disabled={loading}
              className={
                styles.submitButton
              }
            >
              <span>
                {loading
                  ? 'Signing in...'
                  : 'Enter admin'}
              </span>

              <ArrowIcon />
            </button>
          </form>

          <div
            className={
              styles.securityNotice
            }
          >
            <LockIcon />

            <p>
              Access is restricted to
              authorized DESIRE
              administrators.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}