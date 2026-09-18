'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/hooks/useAuth';

import styles from './login.module.css';

const REMEMBERED_EMAIL_KEY = 'desire_remembered_email';

const getUserRole = (user) => {
  return String(
    user?.role ??
      user?.userRole ??
      user?.accountType ??
      '',
  ).toUpperCase();
};

export default function LoginPage() {
  const router = useRouter();

  const {
    user,
    loading: authLoading,
    login,
  } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [rememberMe, setRememberMe] =
    useState(false);

  const [showPassword, setShowPassword] =
    useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] = useState('');

  const [fieldErrors, setFieldErrors] = useState({
    email: '',
    password: '',
  });

  useEffect(() => {
    const rememberedEmail =
      window.localStorage.getItem(
        REMEMBERED_EMAIL_KEY,
      );

    if (rememberedEmail) {
      setFormData((currentFormData) => ({
        ...currentFormData,
        email: rememberedEmail,
      }));

      setRememberMe(true);
    }
  }, []);

  useEffect(() => {
    if (authLoading || !user) {
      return;
    }

    const role = getUserRole(user);

    if (role === 'ADMIN') {
      router.replace('/admin');
      return;
    }

    router.replace('/account/dashboard');
  }, [authLoading, router, user]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((currentFormData) => ({
      ...currentFormData,
      [name]: value,
    }));

    setFieldErrors((currentErrors) => ({
      ...currentErrors,
      [name]: '',
    }));

    if (error) {
      setError('');
    }
  };

  const validateForm = () => {
    const nextErrors = {
      email: '',
      password: '',
    };

    const trimmedEmail = formData.email.trim();

    if (!trimmedEmail) {
      nextErrors.email = 'Email address is required.';
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        trimmedEmail,
      )
    ) {
      nextErrors.email =
        'Enter a valid email address.';
    }

    if (!formData.password) {
      nextErrors.password = 'Password is required.';
    }

    setFieldErrors(nextErrors);

    return !nextErrors.email && !nextErrors.password;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError('');

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const normalizedEmail =
        formData.email.trim().toLowerCase();

      if (rememberMe) {
        window.localStorage.setItem(
          REMEMBERED_EMAIL_KEY,
          normalizedEmail,
        );
      } else {
        window.localStorage.removeItem(
          REMEMBERED_EMAIL_KEY,
        );
      }

      const authenticatedUser = await login({
        email: normalizedEmail,
        password: formData.password,
      });

      const role = getUserRole(authenticatedUser);

      if (role === 'ADMIN') {
        router.replace('/admin');
        return;
      }

      router.replace('/account/dashboard');
    } catch (loginError) {
      setError(
        loginError?.message ||
          'Unable to sign in. Please check your details and try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <main className={styles.initialLoading}>
        <span className={styles.loadingSpinner} />

        <p>Preparing your account</p>
      </main>
    );
  }

  return (
    <main className={styles.loginPage}>
      <section
        className={styles.editorialPanel}
        aria-label="DESIRE editorial"
      >
        <div className={styles.editorialOverlay} />

        <div className={styles.editorialContent}>
          <p className={styles.editorialEyebrow}>
            The DESIRE experience
          </p>

          <h1>
            Created for
            <span> distinction.</span>
          </h1>

          <p className={styles.editorialDescription}>
            Sign in to manage your orders, saved
            addresses, payments and DESIRE CREDIT
            account.
          </p>
        </div>

        <p className={styles.editorialCaption}>
          DESIRE · Modern luxury
        </p>
      </section>

      <section className={styles.formPanel}>
        <div className={styles.formContainer}>
          <div className={styles.heading}>
            <p className={styles.eyebrow}>
              Your DESIRE account
            </p>

            <h2>Welcome back</h2>

            <p>
              Enter your account details to continue.
            </p>
          </div>

          <form
            className={styles.form}
            onSubmit={handleSubmit}
            noValidate
          >
            {error && (
              <div
                className={styles.errorMessage}
                role="alert"
              >
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="9"
                  />

                  <path d="M12 7.5V13" />
                  <path d="M12 16.5H12.01" />
                </svg>

                <span>{error}</span>
              </div>
            )}

            <div className={styles.field}>
              <label htmlFor="email">
                Email address
              </label>

              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="name@example.com"
                autoComplete="email"
                inputMode="email"
                aria-invalid={Boolean(
                  fieldErrors.email,
                )}
                aria-describedby={
                  fieldErrors.email
                    ? 'email-error'
                    : undefined
                }
              />

              {fieldErrors.email && (
                <p
                  id="email-error"
                  className={styles.fieldError}
                >
                  {fieldErrors.email}
                </p>
              )}
            </div>

            <div className={styles.field}>
              <div className={styles.labelRow}>
                <label htmlFor="password">
                  Password
                </label>

                <Link
                  href="/forgot-password"
                  className={styles.forgotLink}
                >
                  Forgot password?
                </Link>
              </div>

              <div
                className={styles.passwordWrapper}
              >
                <input
                  id="password"
                  name="password"
                  type={
                    showPassword
                      ? 'text'
                      : 'password'
                  }
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  aria-invalid={Boolean(
                    fieldErrors.password,
                  )}
                  aria-describedby={
                    fieldErrors.password
                      ? 'password-error'
                      : undefined
                  }
                />

                <button
                  type="button"
                  className={styles.passwordToggle}
                  onClick={() =>
                    setShowPassword(
                      (currentValue) =>
                        !currentValue,
                    )
                  }
                  aria-label={
                    showPassword
                      ? 'Hide password'
                      : 'Show password'
                  }
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>

              {fieldErrors.password && (
                <p
                  id="password-error"
                  className={styles.fieldError}
                >
                  {fieldErrors.password}
                </p>
              )}
            </div>

            <label
              className={styles.rememberOption}
            >
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) =>
                  setRememberMe(
                    event.target.checked,
                  )
                }
              />

              <span
                className={styles.customCheckbox}
                aria-hidden="true"
              >
                <svg viewBox="0 0 16 16">
                  <path d="M3 8L6.4 11.2L13 4.5" />
                </svg>
              </span>

              <span>Remember my email address</span>
            </label>

            <button
              type="submit"
              className={styles.submitButton}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <span
                    className={
                      styles.buttonSpinner
                    }
                  />

                  Signing in
                </>
              ) : (
                <>
                  Sign in

                  <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M5 12H19" />
                    <path d="M14 7L19 12L14 17" />
                  </svg>
                </>
              )}
            </button>
          </form>

          <div className={styles.registerSection}>
            <span>New to DESIRE?</span>

            <Link href="/register">
              Create an account
            </Link>
          </div>

          <div className={styles.securityNote}>
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

              <path d="M8 10V7.5C8 5.3 9.8 3.5 12 3.5C14.2 3.5 16 5.3 16 7.5V10" />
            </svg>

            <span>
              Your account information is securely
              protected.
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}