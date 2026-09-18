'use client';

import Link from 'next/link';

import { useAuth } from '@/hooks/useAuth';

import styles from './dashboard.module.css';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  getMyOrders,
} from '@/services/orders.service';

import {
  getAddresses,
} from '@/services/addresses.service';

import {
  getWishlist,
} from '@/services/wishlist.service';

import {
  getMyCreditAccount,
  getMyCreditApplications,
} from '@/services/desire-credit.service';

function getFirstName(fullName) {
  if (!fullName) {
    return 'Customer';
  }

  return fullName
    .trim()
    .split(/\s+/)[0];
}

function formatNaira(value) {
  const amount =
    Number(value || 0);

  return new Intl.NumberFormat(
    'en-NG',
    {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    },
  ).format(amount);
}

function formatDate(date) {
  return new Intl.DateTimeFormat(
    'en',
    {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    },
  ).format(date);
}

function formatCreditStatus(status) {
  if (!status) {
    return 'Not applied';
  }

  return String(status)
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase(),
    );
}

function getAccountSummary(
  orderCount,
  addressCount,
  wishlistCount,
) {
  return [
    {
      label: 'Orders',
      value: orderCount,
      description: 'Orders placed',
      href: '/account/orders',
      linkLabel: 'View orders',
      icon: OrdersIcon,
    },
    {
      label: 'Wishlist',
      value: wishlistCount,
      description: 'Saved pieces',
      href: '/account/wishlist',
      linkLabel: 'View wishlist',
      icon: HeartIcon,
    },
    {
      label: 'Addresses',
      value: addressCount,
      description: 'Saved addresses',
      href: '/account/addresses',
      linkLabel: 'Manage addresses',
      icon: LocationIcon,
    },
    {
      label: 'Account',
      value: 'Active',
      description: 'Membership status',
      href: '/account/profile',
      linkLabel: 'View profile',
      icon: UserIcon,
    },
  ];
}

const quickActions = [
  {
    title: 'Browse collection',
    description:
      'Discover the latest pieces from DESIRE.',
    href: '/shop',
    icon: BagIcon,
  },
  {
    title: 'Edit your profile',
    description:
      'Update your personal account information.',
    href: '/account/profile',
    icon: UserIcon,
  },
  {
    title: 'Manage addresses',
    description:
      'Add or update your delivery details.',
    href: '/account/addresses',
    icon: LocationIcon,
  },
  {
    title: 'View your wishlist',
    description:
      'Return to the pieces you have saved.',
    href: '/account/wishlist',
    icon: HeartIcon,
  },
];

export default function AccountDashboardPage() {
  const { user } = useAuth();

  const firstName =
    getFirstName(
      user?.fullName,
    );

  const currentDate =
    formatDate(
      new Date(),
    );

  const [
    orders,
    setOrders,
  ] = useState([]);

  const [
    addresses,
    setAddresses,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    wishlistCount,
    setWishlistCount,
  ] = useState(0);

  const [
    desireCreditOverview,
    setDesireCreditOverview,
  ] = useState({
    availableCredit: 0,
    creditLimit: 0,
    usedCredit: 0,
    status: 'Not applied',
  });

  useEffect(() => {
    async function loadDesireCredit() {
      try {
        const creditResponse =
          await getMyCreditAccount();

        /*
         * The DESIRE CREDIT account
         * endpoint may return the
         * account directly or inside
         * account / creditAccount /
         * data.
         *
         * Always prefer the actual
         * credit account over the
         * original application.
         */
        const creditAccount =
          creditResponse?.account ||
          creditResponse
            ?.creditAccount ||
          creditResponse
            ?.data?.account ||
          creditResponse
            ?.data
            ?.creditAccount ||
          creditResponse?.data ||
          creditResponse ||
          null;

        if (
          creditAccount &&
          typeof creditAccount ===
            'object' &&
          (
            creditAccount._id ||
            creditAccount.id ||
            creditAccount
              .creditLimit !==
              undefined
          )
        ) {
          const creditLimit =
            Number(
              creditAccount
                .creditLimit ??
                creditAccount
                  .approvedAmount ??
                creditAccount
                  .approvedCreditLimit ??
                0,
            );

          const usedCredit =
            Number(
              creditAccount
                .usedCredit ??
                creditAccount
                  .usedAmount ??
                creditAccount
                  .creditUsed ??
                0,
            );

          const returnedAvailableCredit =
            creditAccount
              .availableCredit ??
            creditAccount
              .availableAmount ??
            creditAccount
              .remainingCredit;

          /*
           * If the backend explicitly
           * returns available credit,
           * use it.
           *
           * Otherwise calculate:
           *
           * creditLimit - usedCredit
           */
          const availableCredit =
            returnedAvailableCredit !==
              undefined &&
            returnedAvailableCredit !==
              null
              ? Number(
                  returnedAvailableCredit,
                )
              : Math.max(
                  0,
                  creditLimit -
                    usedCredit,
                );

          setDesireCreditOverview({
            availableCredit:
              Number.isFinite(
                availableCredit,
              )
                ? availableCredit
                : Math.max(
                    0,
                    creditLimit -
                      usedCredit,
                  ),

            creditLimit:
              Number.isFinite(
                creditLimit,
              )
                ? creditLimit
                : 0,

            usedCredit:
              Number.isFinite(
                usedCredit,
              )
                ? usedCredit
                : 0,

            status:
              creditAccount.status ||
              'ACTIVE',
          });

          return;
        }
      } catch (creditError) {
        /*
         * A customer without an
         * approved DESIRE CREDIT
         * account can legitimately
         * receive a 404.
         *
         * In that situation we check
         * the customer's application
         * below.
         */
      }

      try {
        const applicationsResponse =
          await getMyCreditApplications();

        const applications =
          Array.isArray(
            applicationsResponse,
          )
            ? applicationsResponse
            : Array.isArray(
                  applicationsResponse
                    ?.applications,
                )
              ? applicationsResponse
                  .applications
              : Array.isArray(
                    applicationsResponse
                      ?.data
                      ?.applications,
                  )
                ? applicationsResponse
                    .data
                    .applications
                : Array.isArray(
                      applicationsResponse
                        ?.data,
                    )
                  ? applicationsResponse
                      .data
                  : [];

        const latestApplication =
          [...applications].sort(
            (a, b) =>
              new Date(
                b.createdAt || 0,
              ).getTime() -
              new Date(
                a.createdAt || 0,
              ).getTime(),
          )[0];

        if (latestApplication) {
          const approvedAmount =
            Number(
              latestApplication
                .approvedAmount ??
                latestApplication
                  .approvedCreditLimit ??
                0,
            );

          const isApproved =
            latestApplication
              .status ===
            'APPROVED';

          setDesireCreditOverview({
            /*
             * This section is only
             * used when an actual
             * credit account does
             * not exist.
             */
            availableCredit:
              isApproved
                ? approvedAmount
                : 0,

            creditLimit:
              approvedAmount,

            usedCredit: 0,

            status:
              latestApplication
                .status ||
              'PENDING',
          });

          return;
        }

        setDesireCreditOverview({
          availableCredit: 0,
          creditLimit: 0,
          usedCredit: 0,
          status: 'Not applied',
        });
      } catch (
        applicationError
      ) {
        console.error(
          'Unable to load DESIRE CREDIT overview:',
          applicationError,
        );

        setDesireCreditOverview({
          availableCredit: 0,
          creditLimit: 0,
          usedCredit: 0,
          status: 'Not applied',
        });
      }
    }

    async function loadDashboard() {
      try {
        const [
          ordersResponse,
          addressesResponse,
          wishlistResponse,
        ] = await Promise.all([
          getMyOrders(),
          getAddresses(),
          getWishlist(),
        ]);

        setOrders(
          Array.isArray(
            ordersResponse,
          )
            ? ordersResponse
            : ordersResponse
                ?.orders || [],
        );

        setAddresses(
          Array.isArray(
            addressesResponse,
          )
            ? addressesResponse
            : addressesResponse
                ?.addresses || [],
        );

        setWishlistCount(
          Array.isArray(
            wishlistResponse
              ?.wishlist?.items,
          )
            ? wishlistResponse
                .wishlist.items
                .length
            : 0,
        );

        await loadDesireCredit();
      } catch (error) {
        console.error(
          'Unable to load account dashboard:',
          error,
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  useEffect(() => {
    async function refreshWishlistCount() {
      try {
        const response =
          await getWishlist();

        setWishlistCount(
          Array.isArray(
            response?.wishlist
              ?.items,
          )
            ? response.wishlist
                .items.length
            : 0,
        );
      } catch (error) {
        console.error(
          'Unable to refresh wishlist count:',
          error,
        );
      }
    }

    window.addEventListener(
      'desire-wishlist-updated',
      refreshWishlistCount,
    );

    return () => {
      window.removeEventListener(
        'desire-wishlist-updated',
        refreshWishlistCount,
      );
    };
  }, []);

  const recentOrders =
    useMemo(() => {
      return orders
        .slice(0, 5)
        .map((order) => ({
          id: order._id,

          orderNumber:
            order.orderNumber,

          date:
            formatDate(
              new Date(
                order.createdAt,
              ),
            ),

          total:
            formatNaira(
              order.totalAmount,
            ),

          status:
            order.status,
        }));
    }, [orders]);

  const accountSummary =
    useMemo(
      () =>
        getAccountSummary(
          orders.length,
          addresses.length,
          wishlistCount,
        ),
      [
        orders,
        addresses,
        wishlistCount,
      ],
    );

  if (loading) {
    return (
      <div
        className={
          styles.dashboard
        }
      >
        Loading...
      </div>
    );
  }

  return (
    <div
      className={
        styles.dashboard
      }
    >
      <section
        className={
          styles.hero
        }
      >
        <div
          className={
            styles.heroContent
          }
        >
          <span
            className={
              styles.eyebrow
            }
          >
            Account overview
          </span>

          <h1>
            Welcome back,
            <br />
            {firstName}.
          </h1>

          <p>
            Manage your DESIRE
            account, review your
            purchases and continue
            discovering pieces
            selected for you.
          </p>
        </div>

        <div
          className={
            styles.heroAside
          }
        >
          <span>
            Today
          </span>

          <strong>
            {currentDate}
          </strong>

          <Link href="/shop">
            Explore collection
            <ArrowIcon />
          </Link>
        </div>
      </section>

      <section
        className={
          styles.creditCard
        }
      >
        <div
          className={
            styles.creditCardTop
          }
        >
          <div>
            <span
              className={
                styles.creditEyebrow
              }
            >
              DESIRE CREDIT
            </span>

            <h2>
              Shop now. Pay with
              flexibility.
            </h2>

            <p>
              Access your DESIRE
              CREDIT account,
              review available
              credit and manage
              future installment
              purchases.
            </p>
          </div>

          <span
            className={
              styles.creditStatus
            }
          >
            {formatCreditStatus(
              desireCreditOverview
                .status,
            )}
          </span>
        </div>

        <div
          className={
            styles.creditBalanceGrid
          }
        >
          <div
            className={
              styles.creditPrimaryBalance
            }
          >
            <span>
              Available credit
            </span>

            <strong>
              {formatNaira(
                desireCreditOverview
                  .availableCredit,
              )}
            </strong>
          </div>

          <div>
            <span>
              Credit limit
            </span>

            <strong>
              {formatNaira(
                desireCreditOverview
                  .creditLimit,
              )}
            </strong>
          </div>

          <div>
            <span>
              Used credit
            </span>

            <strong>
              {formatNaira(
                desireCreditOverview
                  .usedCredit,
              )}
            </strong>
          </div>
        </div>

        <div
          className={
            styles.creditActions
          }
        >
          <Link
            href="/account/desire-credit"
            className={
              styles.creditPrimaryAction
            }
          >
            View credit account
            <ArrowIcon />
          </Link>

          <Link
            href="/shop"
            className={
              styles.creditSecondaryAction
            }
          >
            Explore eligible
            products
          </Link>
        </div>
      </section>

      <section
        className={
          styles.summaryGrid
        }
        aria-label="Account summary"
      >
        {accountSummary.map(
          (item) => {
            const Icon =
              item.icon;

            return (
              <article
                key={
                  item.label
                }
                className={
                  styles.summaryCard
                }
              >
                <div
                  className={
                    styles.summaryTop
                  }
                >
                  <span
                    className={
                      styles.summaryIcon
                    }
                  >
                    <Icon />
                  </span>

                  <span
                    className={
                      styles.summaryLabel
                    }
                  >
                    {item.label}
                  </span>
                </div>

                <strong
                  className={
                    styles.summaryValue
                  }
                >
                  {item.value}
                </strong>

                <div
                  className={
                    styles.summaryFooter
                  }
                >
                  <p>
                    {
                      item.description
                    }
                  </p>

                  <Link
                    href={
                      item.href
                    }
                  >
                    {
                      item.linkLabel
                    }

                    <ArrowIcon />
                  </Link>
                </div>
              </article>
            );
          },
        )}
      </section>

      <div
        className={
          styles.contentGrid
        }
      >
        <section
          className={
            styles.ordersSection
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
                Purchase history
              </span>

              <h2>
                Recent orders
              </h2>
            </div>

            <Link
              href="/account/orders"
              className={
                styles.textLink
              }
            >
              View all
              <ArrowIcon />
            </Link>
          </div>

          {recentOrders.length >
          0 ? (
            <div
              className={
                styles.ordersList
              }
            >
              {recentOrders.map(
                (order) => (
                  <article
                    key={
                      order.id
                    }
                    className={
                      styles.orderCard
                    }
                  >
                    <div>
                      <span>
                        Order
                      </span>

                      <strong>
                        {
                          order.orderNumber
                        }
                      </strong>
                    </div>

                    <div>
                      <span>
                        Date
                      </span>

                      <strong>
                        {
                          order.date
                        }
                      </strong>
                    </div>

                    <div>
                      <span>
                        Total
                      </span>

                      <strong>
                        {
                          order.total
                        }
                      </strong>
                    </div>

                    <div>
                      <span>
                        Status
                      </span>

                      <strong>
                        {
                          order.status
                        }
                      </strong>
                    </div>

                    <Link
                      href={`/account/orders/${order.id}`}
                    >
                      View
                    </Link>
                  </article>
                ),
              )}
            </div>
          ) : (
            <div
              className={
                styles.emptyOrders
              }
            >
              <div
                className={
                  styles.emptyOrderIcon
                }
              >
                <OrdersIcon />
              </div>

              <h3>
                No orders yet
              </h3>

              <p>
                Once you place an
                order, its progress
                and details will
                appear here.
              </p>

              <Link
                href="/shop"
                className={
                  styles.primaryButton
                }
              >
                Start shopping
                <ArrowIcon />
              </Link>
            </div>
          )}
        </section>

        <aside
          className={
            styles.accountDetails
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
                Your details
              </span>

              <h2>
                Account profile
              </h2>
            </div>
          </div>

          <div
            className={
              styles.profileCard
            }
          >
            <div
              className={
                styles.profileIdentity
              }
            >
              <span
                className={
                  styles.profileAvatar
                }
              >
                {user?.fullName
                  ?.trim()
                  ?.charAt(0)
                  ?.toUpperCase() ||
                  'D'}
              </span>

              <div>
                <strong>
                  {user?.fullName ||
                    'DESIRE Customer'}
                </strong>

                <p>
                  {user?.email ||
                    'No email available'}
                </p>
              </div>
            </div>

            <dl
              className={
                styles.profileList
              }
            >
              <div>
                <dt>
                  Phone number
                </dt>

                <dd>
                  {user?.phone ||
                    'Not provided'}
                </dd>
              </div>

              <div>
                <dt>
                  Account status
                </dt>

                <dd>
                  <span
                    className={
                      styles.activeStatus
                    }
                  >
                    Active
                  </span>
                </dd>
              </div>
            </dl>

            <Link
              href="/account/profile"
              className={
                styles.outlineButton
              }
            >
              Edit profile
            </Link>
          </div>
        </aside>
      </div>

      <section
        className={
          styles.quickActionsSection
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
              Account shortcuts
            </span>

            <h2>
              Quick actions
            </h2>
          </div>
        </div>

        <div
          className={
            styles.quickActionsGrid
          }
        >
          {quickActions.map(
            (action) => {
              const Icon =
                action.icon;

              return (
                <Link
                  key={
                    action.title
                  }
                  href={
                    action.href
                  }
                  className={
                    styles.quickActionCard
                  }
                >
                  <span
                    className={
                      styles.quickActionIcon
                    }
                  >
                    <Icon />
                  </span>

                  <div>
                    <strong>
                      {
                        action.title
                      }
                    </strong>

                    <p>
                      {
                        action.description
                      }
                    </p>
                  </div>

                  <ArrowIcon />
                </Link>
              );
            },
          )}
        </div>
      </section>

      <section
        className={
          styles.supportBanner
        }
      >
        <div>
          <span
            className={
              styles.eyebrow
            }
          >
            Client assistance
          </span>

          <h2>
            Need help with your
            account?
          </h2>

          <p>
            Our customer care team
            is available to assist
            with orders, delivery
            and account enquiries.
          </p>
        </div>

        <Link
          href="/contact"
          className={
            styles.supportLink
          }
        >
          Contact customer care
          <ArrowIcon />
        </Link>
      </section>
    </div>
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
      <circle
        cx="12"
        cy="10"
        r="2.2"
      />
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

      <path d="M4.5 20c.7-4.2 3.2-6.3 7.5-6.3s6.8 2.1 7.5 6.3" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M5 8h14l-1 12H6L5 8Z" />
      <path d="M9 9V6a3 3 0 0 1 6 0v3" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      className={
        styles.arrowIcon
      }
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M5 12h14M14 7l5 5-5 5" />
    </svg>
  );
}