'use client';

import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import { useRouter } from 'next/navigation';

import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '@/services/notifications.service';

import styles from './notifications.module.css';

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z" />
      <path d="M10 21h4" />
    </svg>
  );
}

function OrderIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 7h14l-1 13H6L5 7Z" />
      <path d="M9 9V6a3 3 0 0 1 6 0v3" />
    </svg>
  );
}

function PaymentIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="1"
      />
      <path d="M3 9h18" />
      <path d="M7 15h3" />
    </svg>
  );
}

function CreditIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect
        x="3"
        y="6"
        width="18"
        height="12"
        rx="1"
      />
      <path d="M7 10h6" />
      <path d="M7 14h4" />
    </svg>
  );
}

function AccountIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c1-4 4-7 8-7s7 3 8 7" />
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

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h14" />
      <path d="m14 7 5 5-5 5" />
    </svg>
  );
}

function getNotificationIcon(type) {
  switch (type) {
    case 'PAYMENT':
      return <PaymentIcon />;

    case 'ORDER':
      return <OrderIcon />;

    case 'DESIRE_CREDIT':
      return <CreditIcon />;

    case 'ACCOUNT':
      return <AccountIcon />;

    default:
      return <BellIcon />;
  }
}

function formatNotificationDate(date) {
  if (!date) {
    return '';
  }

  const value =
    new Date(date);

  if (
    Number.isNaN(
      value.getTime(),
    )
  ) {
    return '';
  }

  const now =
    new Date();

  const difference =
    now.getTime() -
    value.getTime();

  const minutes =
    Math.floor(
      difference / 60000,
    );

  if (minutes < 1) {
    return 'Just now';
  }

  if (minutes < 60) {
    return `${minutes} min ago`;
  }

  const hours =
    Math.floor(
      minutes / 60,
    );

  if (hours < 24) {
    return `${hours} ${
      hours === 1
        ? 'hour'
        : 'hours'
    } ago`;
  }

  const days =
    Math.floor(
      hours / 24,
    );

  if (days < 7) {
    return `${days} ${
      days === 1
        ? 'day'
        : 'days'
    } ago`;
  }

  return new Intl.DateTimeFormat(
    'en-NG',
    {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    },
  ).format(value);
}

function normalizeNotifications(
  response,
) {
  if (Array.isArray(response)) {
    return response;
  }

  if (
    Array.isArray(
      response?.notifications,
    )
  ) {
    return response.notifications;
  }

  if (
    Array.isArray(
      response?.data
        ?.notifications,
    )
  ) {
    return response.data
      .notifications;
  }

  return [];
}

function NotificationSkeleton() {
  return (
    <div className={styles.skeletonList}>
      {[1, 2, 3, 4].map(
        (item) => (
          <div
            key={item}
            className={
              styles.skeletonItem
            }
          >
            <span />
            <div>
              <span />
              <span />
              <span />
            </div>
          </div>
        ),
      )}
    </div>
  );
}

export default function NotificationsPage() {
  const router =
    useRouter();

  const [
    notifications,
    setNotifications,
  ] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const [
    markingAll,
    setMarkingAll,
  ] = useState(false);

  const [
    openingId,
    setOpeningId,
  ] = useState('');

  const [
    successMessage,
    setSuccessMessage,
  ] = useState('');

  const loadNotifications =
    useCallback(async () => {
      try {
        setLoading(true);
        setError('');

        const response =
          await getNotifications();

        setNotifications(
          normalizeNotifications(
            response,
          ),
        );
      } catch (loadError) {
        console.error(
          'Unable to load notifications:',
          loadError,
        );

        setError(
          loadError?.message ||
            'We could not load your notifications.',
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const unreadCount =
    notifications.filter(
      (notification) =>
        !notification.read,
    ).length;

  function showSuccess(
    message,
  ) {
    setSuccessMessage(
      message,
    );

    window.setTimeout(() => {
      setSuccessMessage('');
    }, 3000);
  }

  async function handleMarkAll() {
    if (
      markingAll ||
      unreadCount === 0
    ) {
      return;
    }

    try {
      setMarkingAll(true);
      setError('');

      await markAllNotificationsAsRead();

      setNotifications(
        (current) =>
          current.map(
            (notification) => ({
              ...notification,
              read: true,
              readAt:
                notification.readAt ||
                new Date().toISOString(),
            }),
          ),
      );

      showSuccess(
        'All notifications marked as read.',
      );
    } catch (markError) {
      console.error(
        'Unable to mark notifications as read:',
        markError,
      );

      setError(
        markError?.message ||
          'We could not update your notifications.',
      );
    } finally {
      setMarkingAll(false);
    }
  }

  async function handleNotification(
    notification,
  ) {
    const notificationId =
      notification?._id ||
      notification?.id;

    if (!notificationId) {
      return;
    }

    try {
      setOpeningId(
        notificationId,
      );

      if (!notification.read) {
        await markNotificationAsRead(
          notificationId,
        );

        setNotifications(
          (current) =>
            current.map(
              (item) =>
                (item._id ||
                  item.id) ===
                notificationId
                  ? {
                      ...item,
                      read: true,
                      readAt:
                        new Date()
                          .toISOString(),
                    }
                  : item,
            ),
        );
      }

      if (notification.link) {
        router.push(
          notification.link,
        );
      }
    } catch (openError) {
      console.error(
        'Unable to open notification:',
        openError,
      );

      setError(
        openError?.message ||
          'We could not open this notification.',
      );
    } finally {
      setOpeningId('');
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
        <div>
          <span
            className={
              styles.eyebrow
            }
          >
            My account
          </span>

          <h1>
            Notifications
          </h1>

          <p>
            Stay up to date with
            your DESIRE orders,
            payments, account and
            DESIRE CREDIT activity.
          </p>
        </div>

        {!loading &&
          unreadCount > 0 && (
            <button
              type="button"
              className={
                styles.markAllButton
              }
              disabled={
                markingAll
              }
              onClick={
                handleMarkAll
              }
            >
              <CheckIcon />

              {markingAll
                ? 'Updating...'
                : 'Mark all as read'}
            </button>
          )}
      </section>

      {error && (
        <div
          className={
            styles.errorBanner
          }
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

      <section
        className={
          styles.notificationSection
        }
      >
        <div
          className={
            styles.sectionHeader
          }
        >
          <div>
            <span
              className={
                styles.eyebrow
              }
            >
              Activity
            </span>

            <h2>
              Recent updates
            </h2>
          </div>

          {!loading && (
            <div
              className={
                styles.summary
              }
            >
              <span>
                {
                  notifications.length
                }{' '}
                total
              </span>

              <span
                className={
                  unreadCount > 0
                    ? styles.unreadSummary
                    : ''
                }
              >
                {unreadCount}{' '}
                unread
              </span>
            </div>
          )}
        </div>

        {loading ? (
          <NotificationSkeleton />
        ) : notifications.length ===
          0 ? (
          <div
            className={
              styles.emptyState
            }
          >
            <div
              className={
                styles.emptyIcon
              }
            >
              <BellIcon />
            </div>

            <span
              className={
                styles.eyebrow
              }
            >
              You're all caught up
            </span>

            <h3>
              No notifications yet
            </h3>

            <p>
              Updates about your
              orders, payments and
              DESIRE account will
              appear here.
            </p>
          </div>
        ) : (
          <div
            className={
              styles.notificationList
            }
          >
            {notifications.map(
              (notification) => {
                const id =
                  notification._id ||
                  notification.id;

                const clickable =
                  Boolean(
                    notification.link,
                  );

                return (
                  <article
                    key={id}
                    className={`${styles.notificationItem} ${
                      !notification.read
                        ? styles.unread
                        : ''
                    } ${
                      clickable
                        ? styles.clickable
                        : ''
                    }`}
                    onClick={() =>
                      handleNotification(
                        notification,
                      )
                    }
                  >
                    <div
                      className={
                        styles.typeIcon
                      }
                    >
                      {getNotificationIcon(
                        notification.type,
                      )}
                    </div>

                    <div
                      className={
                        styles.notificationContent
                      }
                    >
                      <div
                        className={
                          styles.notificationTop
                        }
                      >
                        <div
                          className={
                            styles.titleRow
                          }
                        >
                          {!notification.read && (
                            <span
                              className={
                                styles.unreadDot
                              }
                            />
                          )}

                          <h3>
                            {
                              notification.title
                            }
                          </h3>
                        </div>

                        <time>
                          {formatNotificationDate(
                            notification.createdAt,
                          )}
                        </time>
                      </div>

                      <p>
                        {
                          notification.message
                        }
                      </p>

                      <div
                        className={
                          styles.notificationMeta
                        }
                      >
                        <span>
                          {notification.type
                            ?.replaceAll(
                              '_',
                              ' ',
                            ) ||
                            'GENERAL'}
                        </span>

                        {!notification.read && (
                          <span>
                            New
                          </span>
                        )}
                      </div>
                    </div>

                    {clickable && (
                      <div
                        className={
                          styles.arrow
                        }
                      >
                        {openingId ===
                        id ? (
                          <span
                            className={
                              styles.loadingDot
                            }
                          />
                        ) : (
                          <ArrowIcon />
                        )}
                      </div>
                    )}
                  </article>
                );
              },
            )}
          </div>
        )}
      </section>
    </main>
  );
}