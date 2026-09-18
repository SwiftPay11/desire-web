'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import Link from 'next/link';

import {
  getAdminOrders,
} from '@/services/orders.service';

import styles from './orders.module.css';

const ORDER_FILTERS = [
  {
    label: 'All orders',
    value: 'ALL',
  },
  {
    label: 'Pending',
    value: 'PENDING',
  },
  {
    label: 'Awaiting payment',
    value:
      'AWAITING_COMMITMENT_PAYMENT',
  },
  {
    label: 'Processing',
    value: 'PROCESSING',
  },
  {
    label: 'Shipped',
    value: 'SHIPPED',
  },
  {
    label: 'Delivered',
    value: 'DELIVERED',
  },
  {
    label: 'Cancelled',
    value: 'CANCELLED',
  },
];

const PAYMENT_FILTERS = [
  {
    label: 'All payments',
    value: 'ALL',
  },
  {
    label: 'Pending',
    value: 'PENDING',
  },
  {
    label: 'Paid',
    value: 'PAID',
  },
  {
    label: 'Failed',
    value: 'FAILED',
  },
  {
    label: 'Refunded',
    value: 'REFUNDED',
  },
];

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

  const date = new Date(value);

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

function getStatusClass(status) {
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

function getPaymentClass(status) {
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

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        cx="11"
        cy="11"
        r="7"
      />

      <path d="m20 20-4-4" />
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

function PackageIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="m12 3 8 4-8 4-8-4 8-4Z" />

      <path d="m4 7 8 4 8-4" />

      <path d="M4 7v10l8 4 8-4V7" />

      <path d="M12 11v10" />
    </svg>
  );
}

function CheckIcon() {
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

export default function AdminOrdersPage() {
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
    search,
    setSearch,
  ] = useState('');

  const [
    orderStatus,
    setOrderStatus,
  ] = useState('ALL');

  const [
    paymentStatus,
    setPaymentStatus,
  ] = useState('ALL');

  const loadOrders =
    useCallback(
      async (
        showRefresh = false,
      ) => {
        try {
          setError('');

          if (showRefresh) {
            setRefreshing(true);
          } else {
            setLoading(true);
          }

          const response =
            await getAdminOrders();

          setOrders(
            Array.isArray(
              response?.orders,
            )
              ? response.orders
              : [],
          );
        } catch (err) {
          console.error(
            'Unable to load admin orders:',
            err,
          );

          setError(
            err?.message ||
              'Unable to load orders.',
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [],
    );

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const statistics =
    useMemo(() => {
      const totalOrders =
        orders.length;

      const pendingOrders =
        orders.filter(
          (order) =>
            order.status ===
              'PENDING' ||
            order.status ===
              'AWAITING_COMMITMENT_PAYMENT',
        ).length;

      const paidOrders =
        orders.filter(
          (order) =>
            order.paymentStatus ===
            'PAID',
        );

      const paidRevenue =
        paidOrders.reduce(
          (total, order) =>
            total +
            Number(
              order.totalAmount ||
                0,
            ),
          0,
        );

      const deliveredOrders =
        orders.filter(
          (order) =>
            order.status ===
            'DELIVERED',
        ).length;

      return {
        totalOrders,
        pendingOrders,
        paidRevenue,
        deliveredOrders,
      };
    }, [orders]);

  const filteredOrders =
    useMemo(() => {
      const normalizedSearch =
        search
          .trim()
          .toLowerCase();

      return orders.filter(
        (order) => {
          const matchesOrderStatus =
            orderStatus === 'ALL' ||
            order.status ===
              orderStatus;

          const matchesPaymentStatus =
            paymentStatus ===
              'ALL' ||
            order.paymentStatus ===
              paymentStatus;

          if (
            !matchesOrderStatus ||
            !matchesPaymentStatus
          ) {
            return false;
          }

          if (
            !normalizedSearch
          ) {
            return true;
          }

          const customer =
            order.user || {};

          const searchableValues = [
            order.orderNumber,
            order._id,
            customer.fullName,
            customer.email,
            customer.phone,
            order.shippingAddress
              ?.fullName,
            order.shippingAddress
              ?.phone,
          ];

          return searchableValues.some(
            (value) =>
              String(value || '')
                .toLowerCase()
                .includes(
                  normalizedSearch,
                ),
          );
        },
      );
    }, [
      orders,
      search,
      orderStatus,
      paymentStatus,
    ]);

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
            Loading orders
          </strong>

          <p>
            Retrieving DESIRE
            orders...
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      className={styles.page}
    >
      <div
        className={
          styles.pageHeader
        }
      >
        <div>
          <span
            className={
              styles.eyebrow
            }
          >
            Order Management
          </span>

          <h1>
            Orders
          </h1>

          <p>
            Review customer
            orders, payments and
            fulfilment progress.
          </p>
        </div>

        <button
          type="button"
          className={
            styles.refreshButton
          }
          disabled={refreshing}
          onClick={() =>
            loadOrders(true)
          }
        >
          <RefreshIcon />

          {refreshing
            ? 'Refreshing...'
            : 'Refresh'}
        </button>
      </div>

      {error && (
        <div
          className={
            styles.errorMessage
          }
        >
          <div>
            <strong>
              Unable to load
              orders
            </strong>

            <span>
              {error}
            </span>
          </div>

          <button
            type="button"
            onClick={() =>
              loadOrders()
            }
          >
            Try again
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
              All customer orders
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
            <PackageIcon />
          </div>

          <div>
            <span>
              Pending
            </span>

            <strong>
              {
                statistics.pendingOrders
              }
            </strong>

            <small>
              Require attention
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
              Paid revenue
            </span>

            <strong
              className={
                styles.currencyValue
              }
            >
              {formatCurrency(
                statistics.paidRevenue,
              )}
            </strong>

            <small>
              Confirmed paid
              orders
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
            <CheckIcon />
          </div>

          <div>
            <span>
              Delivered
            </span>

            <strong>
              {
                statistics.deliveredOrders
              }
            </strong>

            <small>
              Completed
              fulfilments
            </small>
          </div>
        </article>
      </div>

      <div
        className={
          styles.managementCard
        }
      >
        <div
          className={
            styles.toolbar
          }
        >
          <div
            className={
              styles.searchBox
            }
          >
            <SearchIcon />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
              placeholder="Search order, customer, email or phone..."
            />
          </div>

          <div
            className={
              styles.filters
            }
          >
            <select
              value={
                orderStatus
              }
              onChange={(event) =>
                setOrderStatus(
                  event.target.value,
                )
              }
              aria-label="Filter order status"
            >
              {ORDER_FILTERS.map(
                (filter) => (
                  <option
                    key={
                      filter.value
                    }
                    value={
                      filter.value
                    }
                  >
                    {filter.label}
                  </option>
                ),
              )}
            </select>

            <select
              value={
                paymentStatus
              }
              onChange={(event) =>
                setPaymentStatus(
                  event.target.value,
                )
              }
              aria-label="Filter payment status"
            >
              {PAYMENT_FILTERS.map(
                (filter) => (
                  <option
                    key={
                      filter.value
                    }
                    value={
                      filter.value
                    }
                  >
                    {filter.label}
                  </option>
                ),
              )}
            </select>
          </div>
        </div>

        <div
          className={
            styles.resultHeader
          }
        >
          <div>
            <strong>
              Order list
            </strong>

            <span>
              {filteredOrders.length}{' '}
              {filteredOrders.length ===
              1
                ? 'order'
                : 'orders'}
            </span>
          </div>

          {(search ||
            orderStatus !==
              'ALL' ||
            paymentStatus !==
              'ALL') && (
            <button
              type="button"
              className={
                styles.clearButton
              }
              onClick={() => {
                setSearch('');
                setOrderStatus(
                  'ALL',
                );
                setPaymentStatus(
                  'ALL',
                );
              }}
            >
              Clear filters
            </button>
          )}
        </div>

        {filteredOrders.length ===
        0 ? (
          <div
            className={
              styles.emptyState
            }
          >
            <OrderIcon />

            <strong>
              No orders found
            </strong>

            <p>
              {orders.length === 0
                ? 'Customer orders will appear here when they are placed.'
                : 'No orders match your current search and filters.'}
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
                      Customer
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
                      Order status
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
                      const customer =
                        order.user ||
                        {};

                      const customerName =
                        customer.fullName ||
                        order
                          .shippingAddress
                          ?.fullName ||
                        'Customer';

                      const customerEmail =
                        customer.email ||
                        'No email';

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
                            <div
                              className={
                                styles.customerIdentity
                              }
                            >
                              <strong>
                                {
                                  customerName
                                }
                              </strong>

                              <span>
                                {
                                  customerEmail
                                }
                              </span>
                            </div>
                          </td>

                          <td>
                            <span
                              className={
                                styles.dateText
                              }
                            >
                              {formatDate(
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
                              {itemCount}{' '}
                              {itemCount ===
                              1
                                ? 'item'
                                : 'items'}
                            </span>
                          </td>

                          <td>
                            <strong
                              className={
                                styles.totalAmount
                              }
                            >
                              {formatCurrency(
                                order.totalAmount,
                              )}
                            </strong>
                          </td>

                          <td>
                            <span
                              className={`${styles.statusBadge} ${getStatusClass(
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
                              className={`${styles.statusBadge} ${getPaymentClass(
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
                  const customer =
                    order.user ||
                    {};

                  const customerName =
                    customer.fullName ||
                    order
                      .shippingAddress
                      ?.fullName ||
                    'Customer';

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
                        styles.mobileOrderCard
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

                        <strong
                          className={
                            styles.mobileTotal
                          }
                        >
                          {formatCurrency(
                            order.totalAmount,
                          )}
                        </strong>
                      </div>

                      <div
                        className={
                          styles.mobileCustomer
                        }
                      >
                        <span>
                          Customer
                        </span>

                        <strong>
                          {customerName}
                        </strong>

                        {customer.email && (
                          <small>
                            {
                              customer.email
                            }
                          </small>
                        )}
                      </div>

                      <div
                        className={
                          styles.mobileMeta
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
                            Status
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
                          className={`${styles.statusBadge} ${getStatusClass(
                            order.status,
                          )}`}
                        >
                          {formatStatus(
                            order.status,
                          )}
                        </span>

                        <span
                          className={`${styles.statusBadge} ${getPaymentClass(
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
      </div>
    </section>
  );
}