'use client';

import {
  useState,
} from 'react';

import {
  changePassword,
} from '@/services/security.service';

import styles from './security.module.css';

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3 5 6v5c0 4.5 2.8 8 7 10 4.2-2 7-5.5 7-10V6l-7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
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

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 3l18 18" />
      <path d="M10.6 6.2A10.8 10.8 0 0 1 12 6c6.5 0 10 6 10 6a17.6 17.6 0 0 1-3.1 3.8" />
      <path d="M6.2 6.2C3.5 8 2 12 2 12s3.5 6 10 6a10 10 0 0 0 3-.4" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

export default function SecurityPage() {
  const [form, setForm] =
    useState({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });

  const [showCurrent, setShowCurrent] =
    useState(false);

  const [showNew, setShowNew] =
    useState(false);

  const [showConfirm, setShowConfirm] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState('');

  const [
    successMessage,
    setSuccessMessage,
  ] = useState('');

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

  function validateForm() {
    if (!form.currentPassword) {
      return 'Enter your current password.';
    }

    if (
      form.newPassword.length < 6
    ) {
      return 'New password must be at least 6 characters.';
    }

    if (
      form.newPassword !==
      form.confirmPassword
    ) {
      return 'New passwords do not match.';
    }

    if (
      form.currentPassword ===
      form.newPassword
    ) {
      return 'Choose a new password different from your current password.';
    }

    return '';
  }

  async function handleSubmit(
    event,
  ) {
    event.preventDefault();

    const validationError =
      validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccessMessage('');

      const response =
        await changePassword({
          currentPassword:
            form.currentPassword,

          newPassword:
            form.newPassword,
        });

      setForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

      setSuccessMessage(
        response?.message ||
          'Password changed successfully.',
      );
    } catch (saveError) {
      console.error(
        'Unable to change password:',
        saveError,
      );

      setError(
        saveError?.message ||
          'We could not change your password.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className={styles.page}>
      {successMessage && (
        <div
          className={styles.toast}
          role="status"
        >
          <CheckIcon />
          {successMessage}
        </div>
      )}

      <section className={styles.hero}>
        <span className={styles.eyebrow}>
          My account
        </span>

        <h1>Security</h1>

        <p>
          Keep your DESIRE account protected
          by using a strong password and
          updating it whenever necessary.
        </p>
      </section>

      {error && (
        <div
          className={styles.errorBanner}
          role="alert"
        >
          <p>{error}</p>

          <button
            type="button"
            onClick={() =>
              setError('')
            }
          >
            Dismiss
          </button>
        </div>
      )}

      <section className={styles.securityLayout}>
        <div className={styles.mainColumn}>
          <article className={styles.securityCard}>
            <div className={styles.cardHeader}>
              <div
                className={
                  styles.headerIcon
                }
              >
                <LockIcon />
              </div>

              <div>
                <span
                  className={
                    styles.eyebrow
                  }
                >
                  Password
                </span>

                <h2>
                  Change your password
                </h2>

                <p>
                  Enter your current password
                  before choosing a new one.
                </p>
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className={styles.form}
            >
              <label>
                <span>
                  Current password
                </span>

                <div
                  className={
                    styles.passwordInput
                  }
                >
                  <LockIcon />

                  <input
                    type={
                      showCurrent
                        ? 'text'
                        : 'password'
                    }
                    value={
                      form.currentPassword
                    }
                    onChange={(event) =>
                      updateField(
                        'currentPassword',
                        event.target.value,
                      )
                    }
                    autoComplete="current-password"
                    required
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowCurrent(
                        (current) =>
                          !current,
                      )
                    }
                    aria-label={
                      showCurrent
                        ? 'Hide current password'
                        : 'Show current password'
                    }
                  >
                    {showCurrent ? (
                      <EyeOffIcon />
                    ) : (
                      <EyeIcon />
                    )}
                  </button>
                </div>
              </label>

              <label>
                <span>
                  New password
                </span>

                <div
                  className={
                    styles.passwordInput
                  }
                >
                  <LockIcon />

                  <input
                    type={
                      showNew
                        ? 'text'
                        : 'password'
                    }
                    value={
                      form.newPassword
                    }
                    onChange={(event) =>
                      updateField(
                        'newPassword',
                        event.target.value,
                      )
                    }
                    autoComplete="new-password"
                    required
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowNew(
                        (current) =>
                          !current,
                      )
                    }
                    aria-label={
                      showNew
                        ? 'Hide new password'
                        : 'Show new password'
                    }
                  >
                    {showNew ? (
                      <EyeOffIcon />
                    ) : (
                      <EyeIcon />
                    )}
                  </button>
                </div>

                <small>
                  Use at least 6 characters.
                </small>
              </label>

              <label>
                <span>
                  Confirm new password
                </span>

                <div
                  className={
                    styles.passwordInput
                  }
                >
                  <LockIcon />

                  <input
                    type={
                      showConfirm
                        ? 'text'
                        : 'password'
                    }
                    value={
                      form.confirmPassword
                    }
                    onChange={(event) =>
                      updateField(
                        'confirmPassword',
                        event.target.value,
                      )
                    }
                    autoComplete="new-password"
                    required
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirm(
                        (current) =>
                          !current,
                      )
                    }
                    aria-label={
                      showConfirm
                        ? 'Hide confirmed password'
                        : 'Show confirmed password'
                    }
                  >
                    {showConfirm ? (
                      <EyeOffIcon />
                    ) : (
                      <EyeIcon />
                    )}
                  </button>
                </div>
              </label>

              <button
                type="submit"
                disabled={saving}
                className={
                  styles.saveButton
                }
              >
                {saving
                  ? 'Updating password...'
                  : 'Update password'}
              </button>
            </form>
          </article>
        </div>

        <aside className={styles.sideColumn}>
          <article className={styles.protectionCard}>
            <ShieldIcon />

            <span className={styles.eyebrow}>
              Account protection
            </span>

            <h3>
              Protect your DESIRE account
            </h3>

            <p>
              Your password is securely
              hashed and is never displayed
              inside your account.
            </p>
          </article>

          <article className={styles.tipsCard}>
            <span className={styles.eyebrow}>
              Password guidance
            </span>

            <h3>
              Keep it difficult to guess
            </h3>

            <div className={styles.tipList}>
              <div>
                <CheckIcon />
                <span>
                  Avoid using your name or
                  email address.
                </span>
              </div>

              <div>
                <CheckIcon />
                <span>
                  Use a password you do not
                  reuse on other websites.
                </span>
              </div>

              <div>
                <CheckIcon />
                <span>
                  Never share your password
                  with anyone claiming to be
                  DESIRE support.
                </span>
              </div>
            </div>
          </article>
        </aside>
      </section>
    </main>
  );
}