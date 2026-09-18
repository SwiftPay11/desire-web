'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import Link from 'next/link';

import {
  useParams,
} from 'next/navigation';

import {
  getAdminCustomer,
} from '@/services/profile.service';

import styles from './customer-details.module.css';

function formatCurrency(value) {
  return new Intl.NumberFormat(
    'en-NG',
    {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    },
  ).format(
    Number(value || 0),
  );
}

function formatDate(value) {
  if (!value) {
    return '—';
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return '—';
  }

  return new Intl.DateTimeFormat(
    'en-NG',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    },
  ).format(date);
}

function formatShortDate(value) {
  if (!value) {
    return '—';
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return '—';
  }

  return new Intl.DateTimeFormat(
    'en-NG',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    },
  ).format(date);
}

function formatStatus(value) {
  if (!value) {
    return 'Unknown';
  }

  return String(value)
    .toLowerCase()
    .split('_')
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1),
    )
    .join(' ');
}

function getInitials(name) {
  if (!name) {
    return 'CU';
  }

  const parts =
    String(name)
      .trim()
      .split(/\s+/)
      .filter(Boolean);

  if (parts.length === 0) {
    return 'CU';
  }

  if (parts.length === 1) {
    return parts[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return `${parts[0][0]}${
    parts[
      parts.length - 1
    ][0]
  }`.toUpperCase();
}

function getOrderStatusClass(
  status,
) {
  switch (status) {
    case 'DELIVERED':
      return styles.successBadge;

    case 'SHIPPED':
      return styles.infoBadge;

    case 'PROCESSING':
      return styles.processingBadge;

    case 'CANCELLED':
      return styles.dangerBadge;

    case 'AWAITING_COMMITMENT_PAYMENT':
      return styles.warningBadge;

    case 'PENDING':
    default:
      return styles.neutralBadge;
  }
}

function getPaymentStatusClass(
  status,
) {
  switch (status) {
    case 'PAID':
      return styles.successBadge;

    case 'FAILED':
      return styles.dangerBadge;

    case 'REFUNDED':
      return styles.infoBadge;

    case 'PENDING':
    default:
      return styles.warningBadge;
  }
}

function BackIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="m15 18-6-6 6-6" />
      <path d="M9 12h11" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M20 6v5h-5" />
      <path d="M4 18v-5h5" />
      <path d="M6.1 9a7 7 0 0 1 11.5-2.5L20 11" />
      <path d="M4 13l2.4 4.5A7 7 0 0 0 17.9 15" />
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

      <path d="M4 21c.7-4 3.4-6 8-6s7.3 2 8 6" />
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

function PaidIcon() {
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

      <path d="m8 12 2.5 2.5L16 9" />
    </svg>
  );
}

function ClockIcon() {
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

      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function MoneyIcon() {
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
        rx="2"
      />

      <circle
        cx="12"
        cy="12"
        r="3"
      />

      <path d="M7 9H5" />
      <path d="M19 15h-2" />
    </svg>
  );
}

export default function AdminCustomerDetailsPage() {
  const params =
    useParams();

  const customerId =
    params?.id;

  const [
    customer,
    setCustomer,
  ] = useState(null);

  const [
    statistics,
    setStatistics,
  ] = useState({
    totalOrders: 0,
    paidOrders: 0,
    pendingOrders: 0,
    totalSpent: 0,
  });

  const [
    orders,
    setOrders,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState('');

  const [
    orderFilter,
    setOrderFilter,
  ] = useState('ALL');

  const loadCustomer =
    useCallback(
      async (
        showRefresh = false,
      ) => {
        if (!customerId) {
          return;
        }

        try {
          setError('');

          if (showRefresh) {
            setRefreshing(true);
          } else {
            setLoading(true);
          }

          const response =
            await getAdminCustomer(
              customerId,
            );

          setCustomer(
            response?.customer ||
              null,
          );

          setStatistics({
            totalOrders:
              Number(
                response
                  ?.statistics
                  ?.totalOrders ||
                  0,
              ),

            paidOrders:
              Number(
                response
                  ?.statistics
                  ?.paidOrders ||
                  0,
              ),

            pendingOrders:
              Number(
                response
                  ?.statistics
                  ?.pendingOrders ||
                  0,
              ),

            totalSpent:
              Number(
                response
                  ?.statistics
                  ?.totalSpent ||
                  0,
              ),
          });

          setOrders(
            Array.isArray(
              response?.orders,
            )
              ? response.orders
              : [],
          );
        } catch (err) {
          console.error(
            'Unable to load admin customer:',
            err,
          );

          setError(
            err?.message ||
              'Unable to load customer.',
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [customerId],
    );

  useEffect(() => {
    loadCustomer();
  }, [loadCustomer]);

  const filteredOrders =
    useMemo(() => {
      if (
        orderFilter === 'ALL'
      ) {
        return orders;
      }

      if (
        orderFilter === 'PAID'
      ) {
        return orders.filter(
          (order) =>
            order.paymentStatus ===
            'PAID',
        );
      }

      if (
        orderFilter ===
        'PAYMENT_PENDING'
      ) {
        return orders.filter(
          (order) =>
            order.paymentStatus ===
            'PENDING',
        );
      }

      return orders.filter(
        (order) =>
          order.status ===
          orderFilter,
      );
    }, [
      orders,
      orderFilter,
    ]);

  const averageOrderValue =
    useMemo(() => {
      if (
        statistics.paidOrders <=
        0
      ) {
        return 0;
      }

      return (
        statistics.totalSpent /
        statistics.paidOrders
      );
    }, [statistics]);

  if (loading) {
    return (
      <section
        className={
          styles.page
        }
      >
        <div
          className={
            styles.loadingState
          }
        >
          <span
            className={
              styles.spinner
            }
          />

          <strong>
            Loading customer
          </strong>

          <p>
            Retrieving customer
            information...
          </p>
        </div>
      </section>
    );
  }

  if (
    !customer &&
    error
  ) {
    return (
      <section
        className={
          styles.page
        }
      >
        <Link
          href="/admin/customers"
          className={
            styles.backLink
          }
        >
          <BackIcon />
          Back to customers
        </Link>

        <div
          className={
            styles.notFound
          }
        >
          <CustomerIcon />

          <h1>
            Customer unavailable
          </h1>

          <p>
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              loadCustomer()
            }
          >
            Try again
          </button>
        </div>
      </section>
    );
  }

  if (!customer) {
    return null;
  }

  return (
    <section
      className={styles.page}
    >
      <div
        className={
          styles.topBar
        }
      >
        <Link
          href="/admin/customers"
          className={
            styles.backLink
          }
        >
          <BackIcon />
          Back to customers
        </Link>

        <button
          type="button"
          className={
            styles.refreshButton
          }
          disabled={refreshing}
          onClick={() =>
            loadCustomer(true)
          }
        >
          <RefreshIcon />

          {refreshing
            ? 'Refreshing...'
            : 'Refresh'}
        </button>
      </div>

      <header
        className={
          styles.customerHeader
        }
      >
        <div
          className={
            styles.customerIdentity
          }
        >
          <div
            className={
              styles.largeAvatar
            }
          >
            {getInitials(
              customer.fullName,
            )}
          </div>

          <div>
            <span
              className={
                styles.eyebrow
              }
            >
              Customer Details
            </span>

            <h1>
              {customer.fullName ||
                'Customer'}
            </h1>

            <p>
              Customer since{' '}
              {formatShortDate(
                customer.createdAt,
              )}
            </p>
          </div>
        </div>

        <div
          className={
            styles.customerStatus
          }
        >
          <span>
            Account
          </span>

          <strong>
            Customer
          </strong>
        </div>
      </header>

      {error && (
        <div
          className={
            styles.errorMessage
          }
        >
          <div>
            <strong>
              Something went wrong
            </strong>

            <span>
              {error}
            </span>
          </div>

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

      <div
        className={
          styles.statisticsGrid
        }
      >
        <article
          className={
            styles.statCard
          }
        >
          <div
            className={
              styles.statIcon
            }
          >
            <OrderIcon />
          </div>

          <div>
            <span>
              Total orders
            </span>

            <strong>
              {
                statistics.totalOrders
              }
            </strong>

            <small>
              All orders placed
            </small>
          </div>
        </article>

        <article
          className={
            styles.statCard
          }
        >
          <div
            className={
              styles.statIcon
            }
          >
            <PaidIcon />
          </div>

          <div>
            <span>
              Paid orders
            </span>

            <strong>
              {
                statistics.paidOrders
              }
            </strong>

            <small>
              Confirmed payments
            </small>
          </div>
        </article>

        <article
          className={
            styles.statCard
          }
        >
          <div
            className={
              styles.statIcon
            }
          >
            <ClockIcon />
          </div>

          <div>
            <span>
              Pending payments
            </span>

            <strong>
              {
                statistics.pendingOrders
              }
            </strong>

            <small>
              Awaiting payment
            </small>
          </div>
        </article>

        <article
          className={
            styles.statCard
          }
        >
          <div
            className={
              styles.statIcon
            }
          >
            <MoneyIcon />
          </div>

          <div>
            <span>
              Total spent
            </span>

            <strong
              className={
                styles.currencyValue
              }
            >
              {formatCurrency(
                statistics.totalSpent,
              )}
            </strong>

            <small>
              Paid orders only
            </small>
          </div>
        </article>
      </div>

      <div
        className={
          styles.layout
        }
      >
        <main
          className={
            styles.mainColumn
          }
        >
          <article
            className={
              styles.card
            }
          >
            <div
              className={
                styles.cardHeader
              }
            >
              <div>
                <h2>
                  Order history
                </h2>

                <p>
                  All orders placed
                  by this customer.
                </p>
              </div>

              <select
                value={
                  orderFilter
                }
                onChange={(event) =>
                  setOrderFilter(
                    event.target
                      .value,
                  )
                }
                className={
                  styles.orderFilter
                }
              >
                <option value="ALL">
                  All orders
                </option>

                <option value="PAID">
                  Paid orders
                </option>

                <option value="PAYMENT_PENDING">
                  Payment pending
                </option>

                <option value="PROCESSING">
                  Processing
                </option>

                <option value="SHIPPED">
                  Shipped
                </option>

                <option value="DELIVERED">
                  Delivered
                </option>

                <option value="CANCELLED">
                  Cancelled
                </option>
              </select>
            </div>

            <div
              className={
                styles.orderCount
              }
            >
              <span>
                {
                  filteredOrders.length
                }{' '}
                {filteredOrders.length ===
                1
                  ? 'order'
                  : 'orders'}
              </span>
            </div>

            {filteredOrders.length ===
            0 ? (
              <div
                className={
                  styles.emptyOrders
                }
              >
                <OrderIcon />

                <strong>
                  No orders found
                </strong>

                <p>
                  {orders.length === 0
                    ? 'This customer has not placed an order yet.'
                    : 'No orders match this filter.'}
                </p>
              </div>
            ) : (
              <>
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
                          Date
                        </th>

                        <th>
                          Items
                        </th>

                        <th>
                          Total
                        </th>

                        <th>
                          Status
                        </th>

                        <th>
                          Payment
                        </th>

                        <th>
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredOrders.map(
                        (order) => {
                          const itemCount =
                            Array.isArray(
                              order.items,
                            )
                              ? order.items.reduce(
                                  (
                                    total,
                                    item,
                                  ) =>
                                    total +
                                    Number(
                                      item.quantity ||
                                        0,
                                    ),
                                  0,
                                )
                              : 0;

                          return (
                            <tr
                              key={
                                order._id
                              }
                            >
                              <td>
                                <div
                                  className={
                                    styles.orderIdentity
                                  }
                                >
                                  <strong>
                                    {order.orderNumber ||
                                      'Order'}
                                  </strong>

                                  <span>
                                    {String(
                                      order._id ||
                                        '',
                                    ).slice(
                                      -8,
                                    )}
                                  </span>
                                </div>
                              </td>

                              <td>
                                <span
                                  className={
                                    styles.dateText
                                  }
                                >
                                  {formatShortDate(
                                    order.createdAt,
                                  )}
                                </span>
                              </td>

                              <td>
                                <span
                                  className={
                                    styles.itemCount
                                  }
                                >
                                  {
                                    itemCount
                                  }
                                </span>
                              </td>

                              <td>
                                <strong
                                  className={
                                    styles.orderAmount
                                  }
                                >
                                  {formatCurrency(
                                    order.totalAmount,
                                  )}
                                </strong>
                              </td>

                              <td>
                                <span
                                  className={`${styles.statusBadge} ${getOrderStatusClass(
                                    order.status,
                                  )}`}
                                >
                                  {formatStatus(
                                    order.status,
                                  )}
                                </span>
                              </td>

                              <td>
                                <span
                                  className={`${styles.statusBadge} ${getPaymentStatusClass(
                                    order.paymentStatus,
                                  )}`}
                                >
                                  {formatStatus(
                                    order.paymentStatus,
                                  )}
                                </span>
                              </td>

                              <td>
                                <Link
                                  href={`/admin/orders/${order._id}`}
                                  className={
                                    styles.viewButton
                                  }
                                >
                                  View
                                </Link>
                              </td>
                            </tr>
                          );
                        },
                      )}
                    </tbody>
                  </table>
                </div>

                <div
                  className={
                    styles.mobileOrders
                  }
                >
                  {filteredOrders.map(
                    (order) => {
                      const itemCount =
                        Array.isArray(
                          order.items,
                        )
                          ? order.items.reduce(
                              (
                                total,
                                item,
                              ) =>
                                total +
                                Number(
                                  item.quantity ||
                                    0,
                                ),
                              0,
                            )
                          : 0;

                      return (
                        <article
                          key={
                            order._id
                          }
                          className={
                            styles.mobileOrder
                          }
                        >
                          <div
                            className={
                              styles.mobileOrderTop
                            }
                          >
                            <div>
                              <strong>
                                {order.orderNumber ||
                                  'Order'}
                              </strong>

                              <span>
                                {formatDate(
                                  order.createdAt,
                                )}
                              </span>
                            </div>

                            <strong>
                              {formatCurrency(
                                order.totalAmount,
                              )}
                            </strong>
                          </div>

                          <div
                            className={
                              styles.mobileOrderMeta
                            }
                          >
                            <div>
                              <span>
                                Items
                              </span>

                              <strong>
                                {
                                  itemCount
                                }
                              </strong>
                            </div>

                            <div>
                              <span>
                                Order
                              </span>

                              <strong>
                                {formatStatus(
                                  order.status,
                                )}
                              </strong>
                            </div>
                          </div>

                          <div
                            className={
                              styles.mobileBadges
                            }
                          >
                            <span
                              className={`${styles.statusBadge} ${getOrderStatusClass(
                                order.status,
                              )}`}
                            >
                              {formatStatus(
                                order.status,
                              )}
                            </span>

                            <span
                              className={`${styles.statusBadge} ${getPaymentStatusClass(
                                order.paymentStatus,
                              )}`}
                            >
                              {formatStatus(
                                order.paymentStatus,
                              )}
                            </span>
                          </div>

                          <Link
                            href={`/admin/orders/${order._id}`}
                            className={
                              styles.mobileViewButton
                            }
                          >
                            View order
                          </Link>
                        </article>
                      );
                    },
                  )}
                </div>
              </>
            )}
          </article>
        </main>

        <aside
          className={
            styles.sideColumn
          }
        >
          <article
            className={
              styles.card
            }
          >
            <div
              className={
                styles.profileHeader
              }
            >
              <div
                className={
                  styles.profileAvatar
                }
              >
                {getInitials(
                  customer.fullName,
                )}
              </div>

              <strong>
                {customer.fullName ||
                  'Customer'}
              </strong>

              <span>
                {customer.email ||
                  'No email'}
              </span>
            </div>

            <div
              className={
                styles.profileDetails
              }
            >
              <div>
                <span>
                  Full name
                </span>

                <strong>
                  {customer.fullName ||
                    '—'}
                </strong>
              </div>

              <div>
                <span>
                  Email
                </span>

                <strong>
                  {customer.email ||
                    '—'}
                </strong>
              </div>

              <div>
                <span>
                  Phone
                </span>

                <strong>
                  {customer.phone ||
                    '—'}
                </strong>
              </div>

              <div>
                <span>
                  Joined
                </span>

                <strong>
                  {formatDate(
                    customer.createdAt,
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Last updated
                </span>

                <strong>
                  {formatDate(
                    customer.updatedAt,
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Customer ID
                </span>

                <strong
                  className={
                    styles.customerId
                  }
                >
                  {customer._id}
                </strong>
              </div>
            </div>
          </article>

          <article
            className={
              styles.card
            }
          >
            <div
              className={
                styles.summaryHeader
              }
            >
              <MoneyIcon />

              <div>
                <h2>
                  Customer value
                </h2>

                <p>
                  Confirmed purchase
                  activity
                </p>
              </div>
            </div>

            <div
              className={
                styles.valueDetails
              }
            >
              <div>
                <span>
                  Total spent
                </span>

                <strong>
                  {formatCurrency(
                    statistics.totalSpent,
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Paid orders
                </span>

                <strong>
                  {
                    statistics.paidOrders
                  }
                </strong>
              </div>

              <div>
                <span>
                  Average paid order
                </span>

                <strong>
                  {formatCurrency(
                    averageOrderValue,
                  )}
                </strong>
              </div>
            </div>
          </article>

          <article
            className={
              styles.securityNotice
            }
          >
            <strong>
              Protected customer
              information
            </strong>

            <p>
              Passwords and other
              authentication
              credentials are not
              exposed through this
              admin page.
            </p>
          </article>
        </aside>
      </div>
    </section>
  );
}