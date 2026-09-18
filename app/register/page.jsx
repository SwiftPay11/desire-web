'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/hooks/useAuth';

import styles from './register.module.css';

const initialForm = {
  fullName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  acceptTerms: false,
};

function getPasswordStrength(password) {
  let score = 0;

  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (!password) {
    return {
      score: 0,
      label: '',
    };
  }

  if (score <= 2) {
    return {
      score,
      label: 'Weak',
    };
  }

  if (score <= 4) {
    return {
      score,
      label: 'Good',
    };
  }

  return {
    score,
    label: 'Strong',
  };
}

function extractErrorMessage(error) {
  const responseMessage = error?.response?.data?.message;

  if (Array.isArray(responseMessage)) {
    return responseMessage.join(' ');
  }

  if (typeof responseMessage === 'string') {
    return responseMessage;
  }

  if (typeof error?.message === 'string') {
    return error.message;
  }

  return 'Unable to create your account. Please try again.';
}

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [form, setForm] = useState(initialForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const passwordStrength = useMemo(
    () => getPasswordStrength(form.password),
    [form.password],
  );

  const handleChange = (event) => {
    const { name, value, checked, type } =
      event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]:
        type === 'checkbox'
          ? checked
          : value,
    }));

    setFieldErrors((currentErrors) => ({
      ...currentErrors,
      [name]: '',
    }));

    setServerError('');
    setSuccessMessage('');
  };

  const validateForm = () => {
    const errors = {};

    const fullName = form.fullName.trim();
    const email = form.email.trim();
    const phone = form.phone.trim();

    if (!fullName) {
      errors.fullName =
        'Please enter your full name.';
    } else if (fullName.length < 2) {
      errors.fullName =
        'Your full name must contain at least 2 characters.';
    }

    if (!email) {
      errors.email =
        'Please enter your email address.';
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      errors.email =
        'Please enter a valid email address.';
    }

    if (
      phone &&
      !/^[+\d][\d\s()-]{6,20}$/.test(phone)
    ) {
      errors.phone =
        'Please enter a valid phone number.';
    }

    if (!form.password) {
      errors.password =
        'Please create a password.';
    } else if (form.password.length < 8) {
      errors.password =
        'Your password must contain at least 8 characters.';
    }

    if (!form.confirmPassword) {
      errors.confirmPassword =
        'Please confirm your password.';
    } else if (
      form.confirmPassword !== form.password
    ) {
      errors.confirmPassword =
        'The passwords do not match.';
    }

    if (!form.acceptTerms) {
      errors.acceptTerms =
        'You must accept the terms to continue.';
    }

    setFieldErrors(errors);

    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setServerError('');
    setSuccessMessage('');

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        fullName: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
      };

      if (form.phone.trim()) {
        payload.phone = form.phone.trim();
      }

      const data = await register(payload);

      const hasSession =
        Boolean(data?.token) ||
        Boolean(data?.accessToken) ||
        Boolean(data?.access_token);

      if (hasSession) {
        setSuccessMessage(
          'Your DESIRE account has been created.',
        );

        setTimeout(() => {
          router.replace('/account/dashboard');
        }, 900);

        return;
      }

      setSuccessMessage(
        'Your account has been created. Redirecting you to sign in.',
      );

      setForm(initialForm);

      setTimeout(() => {
        router.replace(
          `/login?registered=true&email=${encodeURIComponent(
            payload.email,
          )}`,
        );
      }, 1200);
    } catch (error) {
      setServerError(
        extractErrorMessage(error),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className={styles.page}>
      <section className={styles.editorialPanel}>
        <div className={styles.editorialOverlay} />

        <div className={styles.editorialContent}>
          <Link
            href="/"
            className={styles.editorialLogo}
          >
            DESIRE
          </Link>

          <div className={styles.editorialCopy}>
            <span className={styles.eyebrow}>
              Membership
            </span>

            <h1>
              Enter the world
              <br />
              of DESIRE.
            </h1>

            <p>
              Create an account to enjoy a more
              personal shopping experience, manage
              your orders, save addresses and
              discover new collections.
            </p>
          </div>

          <p className={styles.editorialFooter}>
            Luxury designed with intention.
          </p>
        </div>
      </section>

      <section className={styles.formPanel}>
        <div className={styles.mobileHeader}>
          <Link href="/" className={styles.mobileLogo}>
            DESIRE
          </Link>
        </div>

        <div className={styles.formWrapper}>
          <header className={styles.formHeader}>
            <span className={styles.formEyebrow}>
              Create an account
            </span>

            <h2>Join DESIRE</h2>

            <p>
              Complete the form below to begin your
              DESIRE experience.
            </p>
          </header>

          {serverError && (
            <div
              className={styles.errorBanner}
              role="alert"
            >
              <span
                className={styles.bannerIcon}
                aria-hidden="true"
              >
                !
              </span>

              <p>{serverError}</p>
            </div>
          )}

          {successMessage && (
            <div
              className={styles.successBanner}
              role="status"
            >
              <span
                className={styles.bannerIcon}
                aria-hidden="true"
              >
                ✓
              </span>

              <p>{successMessage}</p>
            </div>
          )}

          <form
            className={styles.form}
            onSubmit={handleSubmit}
            noValidate
          >
            <div className={styles.field}>
              <label htmlFor="fullName">
                Full name
              </label>

              <input
                id="fullName"
                name="fullName"
                type="text"
                value={form.fullName}
                onChange={handleChange}
                placeholder="Enter your full name"
                autoComplete="name"
                aria-invalid={
                  Boolean(fieldErrors.fullName)
                }
                aria-describedby={
                  fieldErrors.fullName
                    ? 'fullName-error'
                    : undefined
                }
              />

              {fieldErrors.fullName && (
                <span
                  id="fullName-error"
                  className={styles.fieldError}
                >
                  {fieldErrors.fullName}
                </span>
              )}
            </div>

            <div className={styles.field}>
              <label htmlFor="email">
                Email address
              </label>

              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                autoComplete="email"
                inputMode="email"
                aria-invalid={
                  Boolean(fieldErrors.email)
                }
                aria-describedby={
                  fieldErrors.email
                    ? 'email-error'
                    : undefined
                }
              />

              {fieldErrors.email && (
                <span
                  id="email-error"
                  className={styles.fieldError}
                >
                  {fieldErrors.email}
                </span>
              )}
            </div>

            <div className={styles.field}>
              <div className={styles.labelRow}>
                <label htmlFor="phone">
                  Phone number
                </label>

                <span>Optional</span>
              </div>

              <input
                id="phone"
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                placeholder="+234 800 000 0000"
                autoComplete="tel"
                inputMode="tel"
                aria-invalid={
                  Boolean(fieldErrors.phone)
                }
                aria-describedby={
                  fieldErrors.phone
                    ? 'phone-error'
                    : 'phone-help'
                }
              />

              {fieldErrors.phone ? (
                <span
                  id="phone-error"
                  className={styles.fieldError}
                >
                  {fieldErrors.phone}
                </span>
              ) : (
                <span
                  id="phone-help"
                  className={styles.helperText}
                >
                  Include your country code.
                </span>
              )}
            </div>

            <div className={styles.field}>
              <label htmlFor="password">
                Password
              </label>

              <div className={styles.passwordField}>
                <input
                  id="password"
                  name="password"
                  type={
                    showPassword
                      ? 'text'
                      : 'password'
                  }
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Create a password"
                  autoComplete="new-password"
                  aria-invalid={
                    Boolean(fieldErrors.password)
                  }
                  aria-describedby={
                    fieldErrors.password
                      ? 'password-error'
                      : 'password-help'
                  }
                />

                <button
                  type="button"
                  className={styles.visibilityButton}
                  onClick={() =>
                    setShowPassword(
                      (current) => !current,
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

              {fieldErrors.password ? (
                <span
                  id="password-error"
                  className={styles.fieldError}
                >
                  {fieldErrors.password}
                </span>
              ) : (
                <span
                  id="password-help"
                  className={styles.helperText}
                >
                  Use at least 8 characters.
                </span>
              )}

              {form.password && (
                <div className={styles.strength}>
                  <div
                    className={
                      styles.strengthBars
                    }
                    aria-hidden="true"
                  >
                    {[1, 2, 3, 4, 5].map(
                      (level) => (
                        <span
                          key={level}
                          className={
                            level <=
                            passwordStrength.score
                              ? styles.strengthBarActive
                              : ''
                          }
                        />
                      ),
                    )}
                  </div>

                  <span>
                    {passwordStrength.label}
                  </span>
                </div>
              )}
            </div>

            <div className={styles.field}>
              <label htmlFor="confirmPassword">
                Confirm password
              </label>

              <div className={styles.passwordField}>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={
                    showConfirmPassword
                      ? 'text'
                      : 'password'
                  }
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Enter your password again"
                  autoComplete="new-password"
                  aria-invalid={Boolean(
                    fieldErrors.confirmPassword,
                  )}
                  aria-describedby={
                    fieldErrors.confirmPassword
                      ? 'confirmPassword-error'
                      : undefined
                  }
                />

                <button
                  type="button"
                  className={styles.visibilityButton}
                  onClick={() =>
                    setShowConfirmPassword(
                      (current) => !current,
                    )
                  }
                  aria-label={
                    showConfirmPassword
                      ? 'Hide confirmed password'
                      : 'Show confirmed password'
                  }
                >
                  {showConfirmPassword
                    ? 'Hide'
                    : 'Show'}
                </button>
              </div>

              {fieldErrors.confirmPassword && (
                <span
                  id="confirmPassword-error"
                  className={styles.fieldError}
                >
                  {fieldErrors.confirmPassword}
                </span>
              )}
            </div>

            <div className={styles.termsGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  name="acceptTerms"
                  type="checkbox"
                  checked={form.acceptTerms}
                  onChange={handleChange}
                />

                <span
                  className={styles.customCheckbox}
                  aria-hidden="true"
                />

                <span>
                  I agree to the{' '}
                  <Link href="/terms">
                    Terms and Conditions
                  </Link>{' '}
                  and acknowledge the{' '}
                  <Link href="/privacy">
                    Privacy Policy
                  </Link>
                  .
                </span>
              </label>

              {fieldErrors.acceptTerms && (
                <span className={styles.fieldError}>
                  {fieldErrors.acceptTerms}
                </span>
              )}
            </div>

            <button
              type="submit"
              className={styles.submitButton}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <span
                    className={styles.spinner}
                    aria-hidden="true"
                  />
                  Creating account
                </>
              ) : (
                'Create account'
              )}
            </button>
          </form>

          <div className={styles.divider}>
            <span />
            <p>Already a member?</p>
            <span />
          </div>

          <Link
            href="/login"
            className={styles.loginButton}
          >
            Sign in to your account
          </Link>

          <div className={styles.securityNote}>
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                d="M7 10V8a5 5 0 0 1 10 0v2m-9 0h8a2 2 0 0 1 2 2v7H6v-7a2 2 0 0 1 2-2Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            <p>
              Your personal information is handled
              securely and used only to provide your
              DESIRE account experience.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}