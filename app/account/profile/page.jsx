'use client';

import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  getMyProfile,
  updateMyProfile,
} from '@/services/profile.service';

import styles from './profile.module.css';

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="8"
        r="4"
      />

      <path d="M4 20c1.8-4 4.5-6 8-6s6.2 2 8 6" />
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

function PhoneIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M7 3h3l2 5-2 2c1.4 2.8 3.6 5 6.4 6.4l2-2 5 2v3c0 1.1-.9 2-2 2C11.4 21.4 2.6 12.6 2.6 2.6c0-1.1.9-2 2-2H7Z" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M12 3 5 6v5c0 4.5 2.8 8 7 10 4.2-2 7-5.5 7-10V6l-7-3Z" />

      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function ProfileSkeleton() {
  return (
    <main className={styles.skeletonPage}>
      <span />
      <span />
      <span />
      <span />
    </main>
  );
}

export default function ProfilePage() {
  const [profile, setProfile] =
    useState(null);

  const [form, setForm] =
    useState({
      fullName: '',
      phone: '',
    });

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState('');

  const [
    successMessage,
    setSuccessMessage,
  ] = useState('');

  const loadProfile =
    useCallback(async () => {
      try {
        setLoading(true);
        setError('');

        const response =
          await getMyProfile();

        const user =
          response?.user ||
          response?.data?.user ||
          null;

        if (!user) {
          throw new Error(
            'Your profile could not be loaded.',
          );
        }

        setProfile(user);

        setForm({
          fullName:
            user.fullName || '',

          phone:
            user.phone || '',
        });
      } catch (loadError) {
        console.error(
          'Unable to load profile:',
          loadError,
        );

        setError(
          loadError?.message ||
            'We could not load your profile.',
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

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

  function showSuccess(message) {
    setSuccessMessage(message);

    window.setTimeout(() => {
      setSuccessMessage('');
    }, 3500);
  }

  function validateForm() {
    if (
      form.fullName.trim().length < 2
    ) {
      return 'Enter your full name.';
    }

    if (
      form.phone &&
      form.phone.trim().length < 7
    ) {
      return 'Enter a valid phone number.';
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

      const response =
        await updateMyProfile({
          fullName:
            form.fullName,

          phone:
            form.phone,
        });

      const updatedUser =
        response?.user ||
        response?.data?.user;

      if (updatedUser) {
        setProfile(
          (current) => ({
            ...current,
            ...updatedUser,
          }),
        );

        setForm({
          fullName:
            updatedUser.fullName ||
            '',

          phone:
            updatedUser.phone ||
            '',
        });
      } else {
        await loadProfile();
      }

      showSuccess(
        'Profile updated successfully.',
      );
    } catch (saveError) {
      console.error(
        'Unable to update profile:',
        saveError,
      );

      setError(
        saveError?.message ||
          'We could not update your profile.',
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <ProfileSkeleton />;
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

        <h1>Profile</h1>

        <p>
          Manage your personal information
          used across your DESIRE account.
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

      <section className={styles.profileLayout}>
        <div className={styles.mainColumn}>
          <article className={styles.profileCard}>
            <div className={styles.profileIdentity}>
              <div className={styles.avatar}>
                <UserIcon />
              </div>

              <div>
                <span className={styles.eyebrow}>
                  Customer profile
                </span>

                <h2>
                  {profile?.fullName ||
                    'DESIRE Customer'}
                </h2>

                <p>
                  {profile?.email}
                </p>
              </div>
            </div>

            <div className={styles.identityGrid}>
              <div>
                <span>
                  Account type
                </span>

                <strong>
                  {profile?.isAdmin
                    ? 'Administrator'
                    : 'Customer'}
                </strong>
              </div>

              <div>
                <span>
                  Member since
                </span>

                <strong>
                  {profile?.createdAt
                    ? new Intl.DateTimeFormat(
                        'en-NG',
                        {
                          month:
                            'long',
                          year:
                            'numeric',
                        },
                      ).format(
                        new Date(
                          profile.createdAt,
                        ),
                      )
                    : 'DESIRE Member'}
                </strong>
              </div>
            </div>
          </article>

          <article className={styles.formCard}>
            <div className={styles.formHeader}>
              <span className={styles.eyebrow}>
                Personal information
              </span>

              <h2>
                Account details
              </h2>

              <p>
                Update your name and phone
                number below.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
            >
              <div className={styles.formGrid}>
                <label>
                  <span>
                    Full name
                  </span>

                  <div
                    className={
                      styles.inputWrapper
                    }
                  >
                    <UserIcon />

                    <input
                      type="text"
                      value={
                        form.fullName
                      }
                      onChange={(event) =>
                        updateField(
                          'fullName',
                          event.target.value,
                        )
                      }
                      required
                    />
                  </div>
                </label>

                <label>
                  <span>
                    Phone number
                  </span>

                  <div
                    className={
                      styles.inputWrapper
                    }
                  >
                    <PhoneIcon />

                    <input
                      type="tel"
                      value={
                        form.phone
                      }
                      onChange={(event) =>
                        updateField(
                          'phone',
                          event.target.value,
                        )
                      }
                      placeholder="+234 800 000 0000"
                    />
                  </div>
                </label>

                <label
                  className={
                    styles.fullWidth
                  }
                >
                  <span>
                    Email address
                  </span>

                  <div
                    className={`${styles.inputWrapper} ${styles.readOnlyInput}`}
                  >
                    <MailIcon />

                    <input
                      type="email"
                      value={
                        profile?.email ||
                        ''
                      }
                      readOnly
                    />
                  </div>

                  <small>
                    Email changes are not
                    available from this page.
                  </small>
                </label>
              </div>

              <div className={styles.formActions}>
                <button
                  type="submit"
                  disabled={saving}
                  className={
                    styles.saveButton
                  }
                >
                  {saving
                    ? 'Saving changes...'
                    : 'Save profile'}
                </button>
              </div>
            </form>
          </article>
        </div>

        <aside className={styles.sideColumn}>
          <article className={styles.infoCard}>
            <MailIcon />

            <span className={styles.eyebrow}>
              Email
            </span>

            <h3>
              {profile?.email}
            </h3>

            <p>
              This email is used for your
              account, orders and important
              DESIRE notifications.
            </p>
          </article>

          <article className={styles.infoCard}>
            <PhoneIcon />

            <span className={styles.eyebrow}>
              Phone
            </span>

            <h3>
              {profile?.phone ||
                'Not added'}
            </h3>

            <p>
              Keep your number current so
              delivery teams can reach you
              when necessary.
            </p>
          </article>

          <article className={styles.securityCard}>
            <ShieldIcon />

            <div>
              <span className={styles.eyebrow}>
                Account security
              </span>

              <h3>
                Password and security
              </h3>

              <p>
                Password changes and security
                controls are handled in the
                next account section.
              </p>
            </div>
          </article>
        </aside>
      </section>
    </main>
  );
}