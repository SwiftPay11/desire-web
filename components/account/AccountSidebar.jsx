'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import styles from './account.module.css';

const navigationItems = [
  {
    label: 'Dashboard',
    href: '/account/dashboard',
    icon: DashboardIcon,
  },
  {
    label: 'Orders',
    href: '/account/orders',
    icon: OrdersIcon,
  },
  {
    label: 'Wishlist',
    href: '/account/wishlist',
    icon: HeartIcon,
  },
  {
    label: 'Addresses',
    href: '/account/addresses',
    icon: LocationIcon,
  },
  {
    label: 'Profile',
    href: '/account/profile',
    icon: UserIcon,
  },
  {
    label: 'Security',
    href: '/account/security',
    icon: LockIcon,
  },
];

function getFirstName(fullName) {
  if (!fullName) {
    return 'Customer';
  }

  return fullName.trim().split(/\s+/)[0];
}

function isActiveRoute(pathname, href) {
  if (href === '/account/dashboard') {
    return pathname === href;
  }

  return pathname === href ||
    pathname.startsWith(`${href}/`);
}

export default function AccountSidebar({
  user,
  menuOpen,
  onClose,
  onLogout,
}) {
  const pathname = usePathname();

  return (
    <aside
      className={`${styles.sidebar} ${
        menuOpen ? styles.sidebarOpen : ''
      }`}
      aria-label="Customer account navigation"
    >
      <div className={styles.sidebarMobileHeader}>
        <Link
          href="/"
          className={styles.sidebarBrand}
          onClick={onClose}
        >
          DESIRE
        </Link>

        <button
          type="button"
          className={styles.sidebarCloseButton}
          onClick={onClose}
          aria-label="Close account menu"
        >
          <CloseIcon />
        </button>
      </div>

      <div className={styles.sidebarProfile}>
        <div className={styles.profileAvatar}>
          {user?.fullName
            ?.trim()
            ?.charAt(0)
            ?.toUpperCase() || 'D'}
        </div>

        <div className={styles.profileDetails}>
          <span>Welcome</span>

          <strong>
            {getFirstName(user?.fullName)}
          </strong>

          <p>{user?.email}</p>
        </div>
      </div>

      <div className={styles.sidebarDivider} />

      <nav className={styles.sidebarNavigation}>
        {navigationItems.map((item) => {
          const Icon = item.icon;

          const active = isActiveRoute(
            pathname,
            item.href,
          );

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`${styles.sidebarLink} ${
                active ? styles.sidebarLinkActive : ''
              }`}
              aria-current={
                active ? 'page' : undefined
              }
            >
              <Icon />

              <span>{item.label}</span>

              <ArrowIcon />
            </Link>
          );
        })}
      </nav>

      <div className={styles.sidebarFooter}>
        <div className={styles.sidebarDivider} />

        <button
          type="button"
          className={styles.logoutButton}
          onClick={onLogout}
        >
          <LogoutIcon />

          <span>Sign out</span>
        </button>

        <p>DESIRE Customer Account</p>
      </div>
    </aside>
  );
}

function DashboardIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <rect
        x="4"
        y="4"
        width="6"
        height="6"
        rx="1"
      />
      <rect
        x="14"
        y="4"
        width="6"
        height="6"
        rx="1"
      />
      <rect
        x="4"
        y="14"
        width="6"
        height="6"
        rx="1"
      />
      <rect
        x="14"
        y="14"
        width="6"
        height="6"
        rx="1"
      />
    </svg>
  );
}

function OrdersIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M5 7.5 12 4l7 3.5v9L12 20l-7-3.5v-9Z" />
      <path d="m5 7.5 7 3.5 7-3.5M12 11v9" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M20.5 8.8c0 5.2-8.5 10-8.5 10s-8.5-4.8-8.5-10A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 8.5 1.2Z" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M19 10c0 5-7 10-7 10S5 15 5 10a7 7 0 1 1 14 0Z" />
      <circle cx="12" cy="10" r="2.2" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 20c.7-4.2 3.2-6.3 7.5-6.3s6.8 2.1 7.5 6.3" />
    </svg>
  );
}

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
        rx="2"
      />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M10 5H5v14h5M14 8l4 4-4 4M18 12H9" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      className={styles.sidebarArrow}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="m9 5 7 7-7 7" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="m5 5 14 14M19 5 5 19" />
    </svg>
  );
}