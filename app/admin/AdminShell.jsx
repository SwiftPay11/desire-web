'use client';

import {
  useState,
} from 'react';

import Link from 'next/link';

import {
  usePathname,
  useRouter,
} from 'next/navigation';

import authService from '@/services/auth.service';

import styles from './admin.module.css';

function DashboardIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
    </svg>
  );
}

function ProductIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 7h16v14H4V7Z" />
      <path d="M8 7a4 4 0 0 1 8 0" />
    </svg>
  );
}

function OrderIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 3h14v18l-3-2-4 2-4-2-3 2V3Z" />
      <path d="M8 8h8" />
      <path d="M8 12h8" />
    </svg>
  );
}

function PaymentIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="1" />
      <path d="M3 9h18" />
      <path d="M7 15h4" />
    </svg>
  );
}

function CustomerIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c1-4 4-7 8-7s7 3 8 7" />
    </svg>
  );
}

function CategoryIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
    </svg>
  );
}

function CollectionIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="4" width="16" height="12" rx="1" />
      <path d="M7 20h10" />
      <path d="M9 16v4" />
      <path d="M15 16v4" />
      <path d="M7 12l3-3 2 2 2-2 3 3" />
    </svg>
  );
}

function CreditIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="6" width="18" height="12" rx="1" />
      <path d="M7 10h6" />
      <path d="M7 14h4" />
    </svg>
  );
}

function ReviewIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z" />
    </svg>
  );
}

function MediaIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="1" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-5-5L5 21" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M10 17l5-5-5-5" />
      <path d="M15 12H3" />
      <path d="M14 3h7v18h-7" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </svg>
  );
}

function InventoryIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 7h16v13H4V7Z" />
      <path d="M7 4h10v3H7V4Z" />
      <path d="M8 12h8" />
      <path d="M8 16h5" />
    </svg>
  );
}

const navigation = [
  {
    label: 'Dashboard',
    href: '/admin',
    icon: DashboardIcon,
  },
  {
    label: 'Products',
    href: '/admin/products',
    icon: ProductIcon,
  },
  {
  label: 'Inventory',
  href: '/admin/inventory',
  icon: InventoryIcon,
  },
  {
    label: 'Orders',
    href: '/admin/orders',
    icon: OrderIcon,
  },
  {
    label: 'Payments',
    href: '/admin/payments',
    icon: PaymentIcon,
  },
  {
    label: 'Customers',
    href: '/admin/customers',
    icon: CustomerIcon,
  },
  {
    label: 'Categories',
    href: '/admin/categories',
    icon: CategoryIcon,
  },
  {
    label: 'Collections',
    href: '/admin/collections',
    icon: CollectionIcon,
  },
  {
    label: 'DESIRE CREDIT',
    href: '/admin/desire-credit',
    icon: CreditIcon,
  },
  {
    label: 'Reviews',
    href: '/admin/reviews',
    icon: ReviewIcon,
  },
  {
    label: 'Media',
    href: '/admin/uploads',
    icon: MediaIcon,
  },
];

function isActiveRoute(
  pathname,
  href,
) {
  if (href === '/admin') {
    return pathname === '/admin';
  }

  return (
    pathname === href ||
    pathname.startsWith(
      `${href}/`,
    )
  );
}

export default function AdminShell({
  children,
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [
    sidebarOpen,
    setSidebarOpen,
  ] = useState(false);

  if (pathname === '/admin/login') {
    return children;
  }

  function handleLogout() {
    authService.logout();

    router.replace(
      '/admin/login',
    );
  }

  return (
    <div className={styles.adminShell}>
      {sidebarOpen && (
        <button
          type="button"
          className={styles.overlay}
          onClick={() =>
            setSidebarOpen(false)
          }
          aria-label="Close admin menu"
        />
      )}

      <aside
        className={`${styles.sidebar} ${
          sidebarOpen
            ? styles.sidebarOpen
            : ''
        }`}
      >
        <div className={styles.sidebarBrand}>
          <Link
            href="/admin"
            onClick={() =>
              setSidebarOpen(false)
            }
          >
            DESIRE
          </Link>

          <span>
            Administration
          </span>
        </div>

        <nav
          className={styles.navigation}
          aria-label="Admin navigation"
        >
          <span
            className={
              styles.navigationLabel
            }
          >
            Management
          </span>

          {navigation.map((item) => {
            const Icon =
              item.icon;

            const active =
              isActiveRoute(
                pathname,
                item.href,
              );

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navigationLink} ${
                  active
                    ? styles.activeLink
                    : ''
                }`}
                onClick={() =>
                  setSidebarOpen(false)
                }
              >
                <Icon />

                <span>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        <div
          className={
            styles.sidebarFooter
          }
        >
          <button
            type="button"
            onClick={handleLogout}
            className={
              styles.logoutButton
            }
          >
            <LogoutIcon />

            <span>
              Sign out
            </span>
          </button>
        </div>
      </aside>

      <div
        className={
          styles.adminMain
        }
      >
        <header
          className={
            styles.adminHeader
          }
        >
          <button
            type="button"
            className={
              styles.mobileMenuButton
            }
            onClick={() =>
              setSidebarOpen(true)
            }
            aria-label="Open admin menu"
          >
            <MenuIcon />
          </button>

          <div
            className={
              styles.headerIdentity
            }
          >
            <span>
              DESIRE
            </span>

            <strong>
              Admin Portal
            </strong>
          </div>

          <div
            className={
              styles.adminIndicator
            }
          >
            <span />

            Administrator
          </div>
        </header>

        <main
          className={
            styles.adminContent
          }
        >
          {children}
        </main>
      </div>
    </div>
  );
}