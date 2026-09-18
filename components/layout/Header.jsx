'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Header.module.css';

const navigationLinks = [
  {
    label: 'Home',
    href: '/',
  },
  {
    label: 'Shop',
    href: '/shop',
  },
  {
    label: 'Collections',
    href: '/products',
  },
  {
    label: 'About',
    href: '/#about',
  },
  {
    label: 'Contact',
    href: '/#contact',
  },
];

export default function Header() {
  const pathname = usePathname();

  const [isMobileMenuOpen, setIsMobileMenuOpen] =
    useState(false);

  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    handleScroll();

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const isActiveLink = (href) => {
    if (href === '/') {
      return pathname === '/';
    }

    if (href.includes('#')) {
      return false;
    }

    return pathname.startsWith(href);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((currentValue) => !currentValue);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <header
        className={`${styles.header} ${
          isScrolled ? styles.scrolled : ''
        }`}
      >
        <div className={styles.headerInner}>
          <button
            type="button"
            className={styles.mobileMenuButton}
            onClick={toggleMobileMenu}
            aria-label={
              isMobileMenuOpen
                ? 'Close navigation menu'
                : 'Open navigation menu'
            }
            aria-expanded={isMobileMenuOpen}
            aria-controls="desire-mobile-navigation"
          >
            <span
              className={`${styles.menuLine} ${
                isMobileMenuOpen ? styles.menuLineTopOpen : ''
              }`}
            />

            <span
              className={`${styles.menuLine} ${
                isMobileMenuOpen
                  ? styles.menuLineMiddleOpen
                  : ''
              }`}
            />

            <span
              className={`${styles.menuLine} ${
                isMobileMenuOpen
                  ? styles.menuLineBottomOpen
                  : ''
              }`}
            />
          </button>

          <Link
            href="/"
            className={styles.logo}
            aria-label="DESIRE home"
          >
            DESIRE
          </Link>

          <nav
            className={styles.desktopNavigation}
            aria-label="Main navigation"
          >
            <ul className={styles.navigationList}>
              {navigationLinks.map((link) => {
                const active = isActiveLink(link.href);

                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={`${styles.navigationLink} ${
                        active ? styles.activeLink : ''
                      }`}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.actionButton}
              aria-label="Search"
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className={styles.icon}
              >
                <circle
                  cx="11"
                  cy="11"
                  r="6.5"
                />

                <path d="M16 16L21 21" />
              </svg>
            </button>

            <Link
              href="/login"
              className={styles.actionButton}
              aria-label="Account"
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className={styles.icon}
              >
                <circle
                  cx="12"
                  cy="8"
                  r="4"
                />

                <path d="M4.5 21C5.2 16.8 8 14.5 12 14.5C16 14.5 18.8 16.8 19.5 21" />
              </svg>
            </Link>

            <Link
              href="/cart"
              className={styles.cartButton}
              aria-label="Shopping cart"
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className={styles.icon}
              >
                <path d="M3 4H5L7.2 15.2C7.4 16.2 8.3 17 9.4 17H17.5C18.5 17 19.4 16.3 19.7 15.3L21 9H6" />

                <circle
                  cx="10"
                  cy="21"
                  r="1"
                />

                <circle
                  cx="18"
                  cy="21"
                  r="1"
                />
              </svg>

              <span className={styles.cartCount}>0</span>
            </Link>
          </div>
        </div>
      </header>

      <div
        className={`${styles.mobileOverlay} ${
          isMobileMenuOpen ? styles.mobileOverlayVisible : ''
        }`}
        onClick={closeMobileMenu}
        aria-hidden="true"
      />

      <aside
        id="desire-mobile-navigation"
        className={`${styles.mobileNavigation} ${
          isMobileMenuOpen
            ? styles.mobileNavigationOpen
            : ''
        }`}
        aria-hidden={!isMobileMenuOpen}
      >
        <div className={styles.mobileNavigationHeader}>
          <span className={styles.mobileLogo}>DESIRE</span>

          <button
            type="button"
            className={styles.mobileCloseButton}
            onClick={closeMobileMenu}
            aria-label="Close navigation menu"
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className={styles.closeIcon}
            >
              <path d="M5 5L19 19" />
              <path d="M19 5L5 19" />
            </svg>
          </button>
        </div>

        <nav aria-label="Mobile navigation">
          <ul className={styles.mobileNavigationList}>
            {navigationLinks.map((link, index) => {
              const active = isActiveLink(link.href);

              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={closeMobileMenu}
                    className={`${styles.mobileNavigationLink} ${
                      active ? styles.mobileActiveLink : ''
                    }`}
                  >
                    <span className={styles.mobileLinkNumber}>
                      {String(index + 1).padStart(2, '0')}
                    </span>

                    <span>{link.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className={styles.mobileActions}>
          <Link
            href="/login"
            onClick={closeMobileMenu}
            className={styles.mobileActionLink}
          >
            Account
          </Link>

          <Link
            href="/cart"
            onClick={closeMobileMenu}
            className={styles.mobileActionLink}
          >
            Cart

            <span className={styles.mobileCartCount}>0</span>
          </Link>
        </div>

        <p className={styles.mobileFooterText}>
          Designed for desire. Created for distinction.
        </p>
      </aside>
    </>
  );
}