'use client';

import Link from 'next/link';

import styles from './account.module.css';

import {
  useEffect,
  useState,
} from 'react';

import {
  getUnreadNotificationCount,
} from '@/services/notifications.service';

function getFirstName(fullName) {
  if (!fullName) {
    return 'Customer';
  }

  return fullName
    .trim()
    .split(/\s+/)[0];
}

function BellIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z" />

      <path d="M10 21h4" />
    </svg>
  );
}

export default function AccountHeader({
  user,
  menuOpen,
  onMenuToggle,
}) {
  const [
    unreadNotifications,
    setUnreadNotifications,
  ] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadUnreadNotifications() {
      try {
        const response =
          await getUnreadNotificationCount();

        if (!active) {
          return;
        }

        setUnreadNotifications(
          Number(
            response?.unreadCount ??
              response?.data
                ?.unreadCount ??
              0,
          ),
        );
      } catch (error) {
        console.error(
          'Unable to load notification count:',
          error,
        );
      }
    }

    loadUnreadNotifications();

    return () => {
      active = false;
    };
  }, []);

  return (
    <header
      className={
        styles.accountHeader
      }
    >
      <div
        className={
          styles.accountHeaderInner
        }
      >
        <button
          type="button"
          className={
            styles.menuButton
          }
          onClick={onMenuToggle}
          aria-label={
            menuOpen
              ? 'Close account menu'
              : 'Open account menu'
          }
          aria-expanded={
            menuOpen
          }
        >
          <span />
          <span />
          <span />
        </button>

        <div
          className={
            styles.headerTitle
          }
        >
          <span>
            My account
          </span>

          <strong>
            Welcome back,{' '}
            {getFirstName(
              user?.fullName,
            )}
          </strong>
        </div>

        <div
          className={
            styles.headerActions
          }
        >
          <Link
            href="/shop"
            className={
              styles.continueShoppingLink
            }
          >
            Continue shopping
          </Link>

          <Link
            href="/account/notifications"
            className={
              styles.notificationButton
            }
            aria-label={
              unreadNotifications > 0
                ? `Notifications, ${unreadNotifications} unread`
                : 'Notifications'
            }
          >
            <BellIcon />

            {unreadNotifications >
              0 && (
              <span
                className={
                  styles.notificationBadge
                }
              >
                {unreadNotifications >
                99
                  ? '99+'
                  : unreadNotifications}
              </span>
            )}
          </Link>

          <Link
            href="/account/profile"
            className={
              styles.headerAvatar
            }
            aria-label="View profile"
          >
            {user?.fullName
              ?.trim()
              ?.charAt(0)
              ?.toUpperCase() ||
              'D'}
          </Link>
        </div>
      </div>
    </header>
  );
}