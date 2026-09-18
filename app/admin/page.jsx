'use client';

import Link from 'next/link';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  getAdminDashboard,
} from '@/services/admin-dashboard.service';

import styles from './admin-dashboard.module.css';

function formatCurrency(value) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatDate(value) {
  if (!value) {
    return '—';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return new Intl.DateTimeFormat(
    'en-NG',
    {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    },
  ).format(date);
}

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      <path d="m14 7 5 5-5 5" />
    </svg>
  );
}

function OrderIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M5 3h14v18l-3-2-4 2-4-2-3 2V3Z" />
      <path d="M8 8h8" />
      <path d="M8 12h8" />
    </svg>
  );
}

function RevenueIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
      />
      <path d="M8 9h6a2 2 0 0 1 0 4h-4a2 2 0 0 0 0 4h6" />
      <path d="M12 6v12" />
    </svg>
  );
}

function CustomerIcon() {
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
      <path d="M4 21c1-4 4-7 8-7s7 3 8 7" />
    </svg>
  );
}

function ProductIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M4 7h16v14H4V7Z" />
      <path d="M8 7a4 4 0 0 1 8 0" />
    </svg>
  );
}

function PaymentIcon() {
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
      <path d="M3 9h18" />
      <path d="M7 15h4" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M12 3 2.5 20h19L12 3Z" />
      <path d="M12 9v5" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function CreditIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
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

function RefreshIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M20 7v5h-5" />
      <path d="M4 17v-5h5" />
      <path d="M6.5 9a7 7 0 0 1 11.5-2" />
      <path d="M17.5 15a7 7 0 0 1-11.5 2" />
    </svg>
  );
}

function DashboardSkeleton() {
  return (
    <div className={styles.skeletonPage}>
      <span />
      <div className={styles.skeletonCards}>
        <span />
        <span />
        <span />
        <span />
      </div>
      <span />
      <span />
    </div>
  );
}

function StatusBadge({
  value,
}) {
  const normalized =
    String(value || '')
      .toLowerCase();

  let className =
    styles.statusNeutral;

  if (
    normalized === 'paid' ||
    normalized === 'delivered'
  ) {
    className =
      styles.statusSuccess;
  }

  if (
    normalized === 'pending' ||
    normalized === 'submitted' ||
    normalized ===
      'awaiting_commitment_payment'
  ) {
    className =
      styles.statusWarning;
  }

  if (
    normalized === 'failed' ||
    normalized === 'cancelled'
  ) {
    className =
      styles.statusDanger;
  }

  if (
    normalized === 'processing' ||
    normalized === 'shipped'
  ) {
    className =
      styles.statusInfo;
  }

  return (
    <span
      className={`${styles.statusBadge} ${className}`}
    >
      {value || '—'}
    </span>
  );
}

export default function AdminDashboardPage() {
  const [dashboard, setDashboard] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState('');

  const loadDashboard =
    useCallback(
      async (
        isRefresh = false,
      ) => {
        try {
          if (isRefresh) {
            setRefreshing(true);
          } else {
            setLoading(true);
          }

          setError('');

          const response =
            await getAdminDashboard();

          setDashboard(
            response?.data ||
            response,
          );
        } catch (loadError) {
          console.error(
            'Unable to load admin dashboard:',
            loadError,
          );

          setError(
            loadError?.message ||
              'We could not load the admin dashboard.',
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [],
    );

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const overview =
    dashboard?.overview || {};

  const attention =
    dashboard?.attention || {};

  const inventory =
    dashboard?.inventory || {};

  const desireCredit =
    dashboard?.desireCredit ||
    {};

  const creditApplications =
    desireCredit?.applications ||
    {};

  const creditAccounts =
    desireCredit?.accounts ||
    {};

  const creditFinancials =
    desireCredit?.financials ||
    {};

  const recentOrders =
    Array.isArray(
      dashboard?.recentOrders,
    )
      ? dashboard.recentOrders
      : [];

  const attentionTotal =
    useMemo(
      () =>
        Number(
          attention
            ?.paymentsAwaitingReview ||
            0,
        ) +
        Number(
          attention?.pendingOrders ||
            0,
        ) +
        Number(
          attention
            ?.awaitingCommitmentOrders ||
            0,
        ) +
        Number(
          attention
            ?.lowStockProducts ||
            0,
        ) +
        Number(
          attention
            ?.outOfStockProducts ||
            0,
        ) +
        Number(
          attention
            ?.pendingCreditApplications ||
            0,
        ) +
        Number(
          attention
            ?.underReviewCreditApplications ||
            0,
        ) +
        Number(
          attention
            ?.overdueCreditAccounts ||
            0,
        ),
      [attention],
    );

  const overviewCards = [
    {
      label:
        'Total orders',
      value:
        overview?.totalOrders ||
        0,
      icon:
        OrderIcon,
      href:
        '/admin/orders',
    },
    {
      label:
        'Confirmed revenue',
      value:
        formatCurrency(
          overview
            ?.confirmedRevenue,
        ),
      icon:
        RevenueIcon,
      href:
        '/admin/payments',
    },
    {
      label:
        'Customers',
      value:
        overview
          ?.totalCustomers ||
        0,
      icon:
        CustomerIcon,
      href:
        '/admin/customers',
    },
    {
      label:
        'Products',
      value:
        overview
          ?.totalProducts ||
        0,
      icon:
        ProductIcon,
      href:
        '/admin/products',
    },
  ];

  const attentionItems = [
    {
      label:
        'Payments awaiting review',
      value:
        attention
          ?.paymentsAwaitingReview ||
        0,
      href:
        '/admin/payments',
    },
    {
      label:
        'Pending orders',
      value:
        attention
          ?.pendingOrders ||
        0,
      href:
        '/admin/orders',
    },
    {
      label:
        'Awaiting commitment payment',
      value:
        attention
          ?.awaitingCommitmentOrders ||
        0,
      href:
        '/admin/orders',
    },
    {
      label:
        'Low-stock products',
      value:
        attention
          ?.lowStockProducts ||
        0,
      href:
        '/admin/products',
    },
    {
      label:
        'Out-of-stock products',
      value:
        attention
          ?.outOfStockProducts ||
        0,
      href:
        '/admin/products',
    },
    {
      label:
        'Credit applications pending',
      value:
        attention
          ?.pendingCreditApplications ||
        0,
      href:
        '/admin/desire-credit/applications',
    },
    {
      label:
        'Credit applications under review',
      value:
        attention
          ?.underReviewCreditApplications ||
        0,
      href:
        '/admin/desire-credit/applications',
    },
    {
      label:
        'Overdue credit accounts',
      value:
        attention
          ?.overdueCreditAccounts ||
        0,
      href:
        '/admin/desire-credit/overdue',
    },
  ];

  if (loading) {
    return (
      <DashboardSkeleton />
    );
  }

  return (
    <div className={styles.page}>
      <section
        className={
          styles.dashboardHeader
        }
      >
        <div>
          <span
            className={
              styles.eyebrow
            }
          >
            Administration
          </span>

          <h1>
            Dashboard
          </h1>

          <p>
            Monitor DESIRE orders,
            payments, customers,
            inventory and credit
            activity from one place.
          </p>
        </div>

        <button
          type="button"
          className={
            styles.refreshButton
          }
          disabled={refreshing}
          onClick={() =>
            loadDashboard(true)
          }
        >
          <RefreshIcon />

          {refreshing
            ? 'Refreshing...'
            : 'Refresh'}
        </button>
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
              loadDashboard(true)
            }
          >
            Try again
          </button>
        </div>
      )}

      <section
        className={
          styles.overviewGrid
        }
      >
        {overviewCards.map(
          (card) => {
            const Icon =
              card.icon;

            return (
              <Link
                key={
                  card.label
                }
                href={
                  card.href
                }
                className={
                  styles.overviewCard
                }
              >
                <div
                  className={
                    styles.cardTop
                  }
                >
                  <span>
                    {
                      card.label
                    }
                  </span>

                  <div
                    className={
                      styles.cardIcon
                    }
                  >
                    <Icon />
                  </div>
                </div>

                <strong>
                  {card.value}
                </strong>

                <div
                  className={
                    styles.cardLink
                  }
                >
                  View details
                  <ArrowIcon />
                </div>
              </Link>
            );
          },
        )}
      </section>

      <section
        className={
          styles.mainGrid
        }
      >
        <article
          className={
            styles.attentionPanel
          }
        >
          <div
            className={
              styles.panelHeader
            }
          >
            <div>
              <span
                className={
                  styles.eyebrow
                }
              >
                Operations
              </span>

              <h2>
                Attention required
              </h2>
            </div>

            <div
              className={
                styles.attentionCount
              }
            >
              <AlertIcon />

              <strong>
                {
                  attentionTotal
                }
              </strong>
            </div>
          </div>

          <div
            className={
              styles.attentionList
            }
          >
            {attentionItems.map(
              (item) => (
                <Link
                  key={
                    item.label
                  }
                  href={
                    item.href
                  }
                  className={
                    styles.attentionItem
                  }
                >
                  <div>
                    <span
                      className={
                        Number(
                          item.value,
                        ) > 0
                          ? styles.attentionDotActive
                          : styles.attentionDot
                      }
                    />

                    <strong>
                      {
                        item.label
                      }
                    </strong>
                  </div>

                  <span
                    className={
                      styles.attentionValue
                    }
                  >
                    {item.value}
                  </span>
                </Link>
              ),
            )}
          </div>
        </article>

        <article
          className={
            styles.inventoryPanel
          }
        >
          <div
            className={
              styles.panelHeader
            }
          >
            <div>
              <span
                className={
                  styles.eyebrow
                }
              >
                Inventory
              </span>

              <h2>
                Stock overview
              </h2>
            </div>

            <ProductIcon />
          </div>

          <div
            className={
              styles.statGrid
            }
          >
            <div>
              <span>
                Active products
              </span>

              <strong>
                {inventory
                  ?.activeProducts ||
                  0}
              </strong>
            </div>

            <div>
              <span>
                Low stock
              </span>

              <strong>
                {inventory
                  ?.lowStockProducts ||
                  0}
              </strong>
            </div>

            <div>
              <span>
                Out of stock
              </span>

              <strong>
                {inventory
                  ?.outOfStockProducts ||
                  0}
              </strong>
            </div>

            <div>
              <span>
                Total products
              </span>

              <strong>
                {inventory
                  ?.totalProducts ||
                  0}
              </strong>
            </div>
          </div>

          <Link
            href="/admin/products"
            className={
              styles.panelAction
            }
          >
            Manage inventory
            <ArrowIcon />
          </Link>
        </article>
      </section>

      <section
        className={
          styles.creditSection
        }
      >
        <div
          className={
            styles.creditHeader
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
              Credit operations
            </h2>

            <p>
              Monitor applications,
              customer credit accounts
              and outstanding balances.
            </p>
          </div>

          <CreditIcon />
        </div>

        <div
          className={
            styles.creditGrid
          }
        >
          <div
            className={
              styles.creditStat
            }
          >
            <span>
              Pending applications
            </span>

            <strong>
              {creditApplications
                ?.pending ||
                0}
            </strong>
          </div>

          <div
            className={
              styles.creditStat
            }
          >
            <span>
              Under review
            </span>

            <strong>
              {creditApplications
                ?.underReview ||
                0}
            </strong>
          </div>

          <div
            className={
              styles.creditStat
            }
          >
            <span>
              Active accounts
            </span>

            <strong>
              {creditAccounts
                ?.active ||
                0}
            </strong>
          </div>

          <div
            className={
              styles.creditStat
            }
          >
            <span>
              Overdue accounts
            </span>

            <strong>
              {creditAccounts
                ?.overdue ||
                0}
            </strong>
          </div>

          <div
            className={`${styles.creditStat} ${styles.creditMoneyStat}`}
          >
            <span>
              Total credit limit
            </span>

            <strong>
              {formatCurrency(
                creditFinancials
                  ?.totalCreditLimit,
              )}
            </strong>
          </div>

          <div
            className={`${styles.creditStat} ${styles.creditMoneyStat}`}
          >
            <span>
              Outstanding balance
            </span>

            <strong>
              {formatCurrency(
                creditFinancials
                  ?.outstandingBalance,
              )}
            </strong>
          </div>

          <div
            className={`${styles.creditStat} ${styles.creditMoneyStat}`}
          >
            <span>
              Total repaid
            </span>

            <strong>
              {formatCurrency(
                creditFinancials
                  ?.totalRepaid,
              )}
            </strong>
          </div>

          <div
            className={`${styles.creditStat} ${styles.creditMoneyStat}`}
          >
            <span>
              Overdue balance
            </span>

            <strong>
              {formatCurrency(
                creditFinancials
                  ?.overdueBalance,
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
            href="/admin/desire-credit"
          >
            Open DESIRE CREDIT
            <ArrowIcon />
          </Link>

          <Link
            href="/admin/desire-credit/applications"
          >
            Review applications
          </Link>
        </div>
      </section>

      <section
        className={
          styles.ordersPanel
        }
      >
        <div
          className={
            styles.panelHeader
          }
        >
          <div>
            <span
              className={
                styles.eyebrow
              }
            >
              Orders
            </span>

            <h2>
              Recent orders
            </h2>
          </div>

          <Link
            href="/admin/orders"
            className={
              styles.headerLink
            }
          >
            View all orders
            <ArrowIcon />
          </Link>
        </div>

        {recentOrders.length ===
        0 ? (
          <div
            className={
              styles.emptyOrders
            }
          >
            No orders have been
            created yet.
          </div>
        ) : (
          <div
            className={
              styles.tableWrapper
            }
          >
            <table
              className={
                styles.ordersTable
              }
            >
              <thead>
                <tr>
                  <th>
                    Order
                  </th>

                  <th>
                    Customer
                  </th>

                  <th>
                    Amount
                  </th>

                  <th>
                    Order status
                  </th>

                  <th>
                    Payment
                  </th>

                  <th>
                    Date
                  </th>

                  <th />
                </tr>
              </thead>

              <tbody>
                {recentOrders.map(
                  (order) => {
                    const orderId =
                      order?._id ||
                      order?.id;

                    const customer =
                      typeof order?.user ===
                      'object'
                        ? order.user
                        : null;

                    return (
                      <tr
                        key={
                          orderId ||
                          order
                            ?.orderNumber
                        }
                      >
                        <td>
                          <strong>
                            {order
                              ?.orderNumber ||
                              '—'}
                          </strong>
                        </td>

                        <td>
                          <div
                            className={
                              styles.customerCell
                            }
                          >
                            <strong>
                              {customer
                                ?.fullName ||
                                'Customer'}
                            </strong>

                            <span>
                              {customer
                                ?.email ||
                                '—'}
                            </span>
                          </div>
                        </td>

                        <td>
                          {formatCurrency(
                            order
                              ?.totalAmount,
                          )}
                        </td>

                        <td>
                          <StatusBadge
                            value={
                              order
                                ?.status
                            }
                          />
                        </td>

                        <td>
                          <StatusBadge
                            value={
                              order
                                ?.paymentStatus
                            }
                          />
                        </td>

                        <td>
                          {formatDate(
                            order
                              ?.createdAt,
                          )}
                        </td>

                        <td>
                          {orderId && (
                            <Link
                              href={`/admin/orders/${orderId}`}
                              className={
                                styles.orderArrow
                              }
                              aria-label={`View ${order?.orderNumber || 'order'}`}
                            >
                              <ArrowIcon />
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  },
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section
        className={
          styles.quickActions
        }
      >
        <div
          className={
            styles.quickActionHeader
          }
        >
          <span
            className={
              styles.eyebrow
            }
          >
            Shortcuts
          </span>

          <h2>
            Quick actions
          </h2>
        </div>

        <div
          className={
            styles.quickActionGrid
          }
        >
          <Link
            href="/admin/products/create"
          >
            <ProductIcon />

            <span>
              Add product
            </span>

            <ArrowIcon />
          </Link>

          <Link
            href="/admin/orders"
          >
            <OrderIcon />

            <span>
              Manage orders
            </span>

            <ArrowIcon />
          </Link>

          <Link
            href="/admin/payments"
          >
            <PaymentIcon />

            <span>
              Review payments
            </span>

            <ArrowIcon />
          </Link>

          <Link
            href="/admin/desire-credit"
          >
            <CreditIcon />

            <span>
              DESIRE CREDIT
            </span>

            <ArrowIcon />
          </Link>
        </div>
      </section>
    </div>
  );
}