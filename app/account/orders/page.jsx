'use client';

import Link from 'next/link';
import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import { getMyOrders } from '@/services/orders.service';

import styles from './orders.module.css';

const statusOptions = [
  'all',
  'pending',
  'paid',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
];

function normaliseStatus(status) {
  return String(status || 'pending')
    .trim()
    .toLowerCase();
}

function formatStatus(status) {
  const value = normaliseStatus(status);

  return value
    .split(/[_-\s]+/)
    .filter(Boolean)
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1),
    )
    .join(' ');
}

function formatDate(value) {
  if (!value) {
    return 'Date unavailable';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Date unavailable';
  }

  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function formatCurrency(value, currency = 'USD') {
  const numericValue = Number(value);

  if (Number.isNaN(numericValue)) {
    return '—';
  }

  try {
    return new Intl.NumberFormat('en', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numericValue);
  } catch {
    return `$${numericValue.toFixed(2)}`;
  }
}

function getOrderId(order) {
  return order?._id || order?.id || '';
}

function getOrderNumber(order) {
  return (
    order?.orderNumber ||
    order?.reference ||
    order?.orderId ||
    getOrderId(order) ||
    'Unavailable'
  );
}

function getOrderDate(order) {
  return (
    order?.createdAt ||
    order?.orderDate ||
    order?.date ||
    null
  );
}

function getOrderItems(order) {
  if (Array.isArray(order?.items)) {
    return order.items;
  }

  if (Array.isArray(order?.orderItems)) {
    return order.orderItems;
  }

  if (Array.isArray(order?.products)) {
    return order.products;
  }

  return [];
}

function getItemCount(order) {
  const items = getOrderItems(order);

  if (items.length === 0) {
    return Number(order?.itemCount || 0);
  }

  return items.reduce((total, item) => {
    const quantity = Number(item?.quantity || 1);

    return total + (
      Number.isNaN(quantity) ? 1 : quantity
    );
  }, 0);
}

function getOrderTotal(order) {
  return (
    order?.totalAmount ??
    order?.total ??
    order?.grandTotal ??
    order?.amount ??
    0
  );
}

function getOrderCurrency(order) {
  return (
    order?.currency ||
    order?.payment?.currency ||
    'USD'
  );
}

function getPaymentStatus(order) {
  return (
    order?.paymentStatus ||
    order?.payment?.status ||
    null
  );
}

function getStatusClassName(status) {
  const value = normaliseStatus(status);

  const statusClassMap = {
    pending: styles.statusPending,
    paid: styles.statusPaid,
    processing: styles.statusProcessing,
    shipped: styles.statusShipped,
    delivered: styles.statusDelivered,
    cancelled: styles.statusCancelled,
    refunded: styles.statusRefunded,
  };

  return (
    statusClassMap[value] ||
    styles.statusDefault
  );
}

function OrdersIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 7.5 12 4l7 3.5v9L12 20l-7-3.5v-9Z" />
      <path d="m5 7.5 7 3.5 7-3.5M12 11v9" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      className={styles.arrowIcon}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M5 12h14M14 7l5 5-5 5" />
    </svg>
  );
}

function LoadingSkeleton() {
  return (
    <div className={styles.ordersList}>
      {[1, 2, 3].map((item) => (
        <article
          key={item}
          className={styles.skeletonCard}
          aria-hidden="true"
        >
          <div className={styles.skeletonHeader}>
            <span
              className={`${styles.skeletonLine} ${styles.skeletonTitle}`}
            />

            <span
              className={`${styles.skeletonLine} ${styles.skeletonBadge}`}
            />
          </div>

          <div className={styles.skeletonDetails}>
            <span className={styles.skeletonLine} />
            <span className={styles.skeletonLine} />
            <span className={styles.skeletonLine} />
          </div>
        </article>
      ))}
    </div>
  );
}

export default function AccountOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] =
    useState('');
  const [statusFilter, setStatusFilter] =
    useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadOrders() {
      try {
        setLoading(true);
        setError('');

        const response = await getMyOrders();

        if (!isMounted) {
          return;
        }

        const fetchedOrders = Array.isArray(response)
          ? response
          : response?.orders || [];

        setOrders(fetchedOrders);
      } catch (loadError) {
        console.error(
          'Unable to load customer orders:',
          loadError,
        );

        if (isMounted) {
          setError(
            loadError?.message ||
              'We could not load your orders.',
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadOrders();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredOrders = useMemo(() => {
    const normalisedSearch = searchTerm
      .trim()
      .toLowerCase();

    return orders.filter((order) => {
      const orderNumber = String(
        getOrderNumber(order),
      ).toLowerCase();

      const status = normaliseStatus(
        order?.status,
      );

      const matchesSearch =
        normalisedSearch.length === 0 ||
        orderNumber.includes(normalisedSearch);

      const matchesStatus =
        statusFilter === 'all' ||
        status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, searchTerm, statusFilter]);

  const hasFilters =
    searchTerm.trim().length > 0 ||
    statusFilter !== 'all';

  function clearFilters() {
    setSearchTerm('');
    setStatusFilter('all');
  }

  return (
    <div className={styles.ordersPage}>
      <section className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>
            Purchase history
          </span>

          <h1>My orders</h1>

          <p>
            Review your DESIRE purchases, follow order
            progress and open the full details of each
            order.
          </p>
        </div>

        <Link
          href="/shop"
          className={styles.shopLink}
        >
          Continue shopping
          <ArrowIcon />
        </Link>
      </section>

      <section
        className={styles.toolbar}
        aria-label="Order filters"
      >
        <div className={styles.searchField}>
          <SearchIcon />

          <input
            type="search"
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(event.target.value)
            }
            placeholder="Search by order number"
            aria-label="Search orders by order number"
          />
        </div>

        <div className={styles.filterField}>
          <label htmlFor="order-status">
            Status
          </label>

          <select
            id="order-status"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status === 'all'
                  ? 'All statuses'
                  : formatStatus(status)}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section
        className={styles.ordersSection}
        aria-live="polite"
      >
        <div className={styles.sectionHeader}>
          <div>
            <span className={styles.eyebrow}>
              Your purchases
            </span>

            <h2>Order history</h2>
          </div>

          {!loading && orders.length > 0 && (
            <span className={styles.orderCount}>
              {filteredOrders.length}{' '}
              {filteredOrders.length === 1
                ? 'order'
                : 'orders'}
            </span>
          )}
        </div>

        {loading ? (
          <LoadingSkeleton />
        ) : error ? (
          <div className={styles.messageState}>
            <div className={styles.stateIcon}>
              <OrdersIcon />
            </div>

            <h3>Unable to load orders</h3>

            <p>{error}</p>

            <button
              type="button"
              className={styles.primaryButton}
              onClick={() => window.location.reload()}
            >
              Try again
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className={styles.messageState}>
            <div className={styles.stateIcon}>
              <OrdersIcon />
            </div>

            <h3>No orders yet</h3>

            <p>
              Once you place your first order, its
              details and progress will appear here.
            </p>

            <Link
              href="/shop"
              className={styles.primaryButton}
            >
              Start shopping
              <ArrowIcon />
            </Link>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className={styles.messageState}>
            <div className={styles.stateIcon}>
              <SearchIcon />
            </div>

            <h3>No matching orders</h3>

            <p>
              No orders match your current search or
              status filter.
            </p>

            <button
              type="button"
              className={styles.outlineButton}
              onClick={clearFilters}
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className={styles.ordersList}>
            {filteredOrders.map((order) => {
              const orderId = getOrderId(order);
              const orderNumber =
                getOrderNumber(order);
              const status =
                order?.status || 'pending';
              const itemCount =
                getItemCount(order);
              const paymentStatus =
                getPaymentStatus(order);

              return (
                <article
                  key={orderId || orderNumber}
                  className={styles.orderCard}
                >
                  <div className={styles.cardHeader}>
                    <div>
                      <span
                        className={styles.cardEyebrow}
                      >
                        Order
                      </span>

                      <h3>#{orderNumber}</h3>
                    </div>

                    <span
                      className={`${styles.statusBadge} ${getStatusClassName(
                        status,
                      )}`}
                    >
                      {formatStatus(status)}
                    </span>
                  </div>

                  <div className={styles.orderDetails}>
                    <div>
                      <span>Placed</span>
                      <strong>
                        {formatDate(
                          getOrderDate(order),
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>Items</span>
                      <strong>
                        {itemCount}{' '}
                        {itemCount === 1
                          ? 'item'
                          : 'items'}
                      </strong>
                    </div>

                    <div>
                      <span>Total</span>
                      <strong>
                        {formatCurrency(
                          getOrderTotal(order),
                          getOrderCurrency(order),
                        )}
                      </strong>
                    </div>

                    {paymentStatus && (
                      <div>
                        <span>Payment</span>
                        <strong>
                          {formatStatus(
                            paymentStatus,
                          )}
                        </strong>
                      </div>
                    )}
                  </div>

                  <div className={styles.cardFooter}>
                    <p>
                      View your products, delivery
                      details and order progress.
                    </p>

                    {orderId ? (
                      <Link
                        href={`/account/orders/${orderId}`}
                        className={styles.viewButton}
                      >
                        View details
                        <ArrowIcon />
                      </Link>
                    ) : (
                      <span
                        className={styles.unavailable}
                      >
                        Details unavailable
                      </span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}