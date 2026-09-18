'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import Link from 'next/link';

import {
  getAdminPayments,
  PAYMENT_STATUSES,
} from '@/services/payments.service';

import styles from './payments.module.css';

const STATUS_OPTIONS = [
  'ALL',
  PAYMENT_STATUSES.PENDING,
  PAYMENT_STATUSES.SUBMITTED,
  PAYMENT_STATUSES.PROCESSING,
  PAYMENT_STATUSES.PAID,
  PAYMENT_STATUSES.FAILED,
  PAYMENT_STATUSES.CANCELLED,
  PAYMENT_STATUSES.REFUNDED,
];

const PURPOSE_OPTIONS = [
  'ALL',
  'ORDER',
  'DESIRE_CREDIT_COMMITMENT',
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

function formatLabel(value) {
  if (!value) {
    return '—';
  }

  return value
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase(),
    );
}

function getStatusClass(status) {
  switch (status) {
    case 'PAID':
      return styles.success;

    case 'SUBMITTED':
      return styles.submitted;

    case 'PROCESSING':
      return styles.processing;

    case 'FAILED':
    case 'CANCELLED':
      return styles.danger;

    case 'REFUNDED':
      return styles.info;

    default:
      return styles.pending;
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
      <path d="M18.5 9A7 7 0 0 0 6 6.5L4 9" />
      <path d="M5.5 15A7 7 0 0 0 18 17.5L20 15" />
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
        rx="2"
      />
      <path d="M3 10h18" />
      <path d="M7 15h4" />
    </svg>
  );
}

function ReviewIcon() {
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
      <path d="M12 7v5" />
      <path d="M12 16h.01" />
    </svg>
  );
}

function MoneyIcon() {
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
      <path d="M15 8.5h-4a2 2 0 0 0 0 4h2a2 2 0 0 1 0 4H9" />
      <path d="M12 6v12" />
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

export default function AdminPaymentsPage() {
  const [
    payments,
    setPayments,
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
    statusFilter,
    setStatusFilter,
  ] = useState('ALL');

  const [
    purposeFilter,
    setPurposeFilter,
  ] = useState('ALL');

  const loadPayments =
    useCallback(
      async (
        showRefresh = false,
      ) => {
        try {
          if (showRefresh) {
            setRefreshing(true);
          } else {
            setLoading(true);
          }

          setError('');

          const response =
            await getAdminPayments();

          setPayments(
            Array.isArray(
              response?.payments,
            )
              ? response.payments
              : [],
          );
        } catch (err) {
          console.error(
            'Unable to load admin payments:',
            err,
          );

          setError(
            err?.message ||
              'Unable to load payments.',
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [],
    );

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const statistics =
    useMemo(() => {
      const submitted =
        payments.filter(
          (payment) =>
            payment.status ===
            PAYMENT_STATUSES.SUBMITTED,
        ).length;

      const paidPayments =
        payments.filter(
          (payment) =>
            payment.status ===
            PAYMENT_STATUSES.PAID,
        );

      const paidRevenue =
        paidPayments.reduce(
          (
            total,
            payment,
          ) =>
            total +
            Number(
              payment.amount ||
                0,
            ),
          0,
        );

      return {
        total:
          payments.length,

        submitted,

        paid:
          paidPayments.length,

        paidRevenue,
      };
    }, [payments]);

  const filteredPayments =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return payments.filter(
        (payment) => {
          const customer =
            payment.user || {};

          const order =
            payment.order || {};

          const matchesSearch =
            !query ||
            payment.reference
              ?.toLowerCase()
              .includes(query) ||
            payment
              .providerReference
              ?.toLowerCase()
              .includes(query) ||
            payment
              .transferReference
              ?.toLowerCase()
              .includes(query) ||
            customer.fullName
              ?.toLowerCase()
              .includes(query) ||
            customer.email
              ?.toLowerCase()
              .includes(query) ||
            customer.phone
              ?.toLowerCase()
              .includes(query) ||
            order.orderNumber
              ?.toLowerCase()
              .includes(query) ||
            payment._id
              ?.toLowerCase()
              .includes(query);

          const matchesStatus =
            statusFilter ===
              'ALL' ||
            payment.status ===
              statusFilter;

          const matchesPurpose =
            purposeFilter ===
              'ALL' ||
            payment.purpose ===
              purposeFilter;

          return (
            matchesSearch &&
            matchesStatus &&
            matchesPurpose
          );
        },
      );
    }, [
      payments,
      search,
      statusFilter,
      purposeFilter,
    ]);

  if (loading) {
    return (
      <div
        className={
          styles.statePage
        }
      >
        <div
          className={
            styles.loader
          }
        />

        <h2>
          Loading payments
        </h2>

        <p>
          Retrieving payment
          records.
        </p>
      </div>
    );
  }

  return (
    <div
      className={
        styles.page
      }
    >
      <div
        className={
          styles.header
        }
      >
        <div>
          <span
            className={
              styles.eyebrow
            }
          >
            Finance
          </span>

          <h1>
            Payments
          </h1>

          <p>
            Review customer
            payments and payment
            verification activity.
          </p>
        </div>

        <button
          type="button"
          className={
            styles.refreshButton
          }
          disabled={
            refreshing
          }
          onClick={() =>
            loadPayments(true)
          }
        >
          <RefreshIcon />

          {refreshing
            ? 'Refreshing...'
            : 'Refresh'}
        </button>
      </div>

      {error ? (
        <div
          className={
            styles.errorBox
          }
        >
          <div>
            <strong>
              Unable to load
              payments
            </strong>

            <span>
              {error}
            </span>
          </div>

          <button
            type="button"
            onClick={() =>
              loadPayments()
            }
          >
            Retry
          </button>
        </div>
      ) : null}

      <section
        className={
          styles.summaryGrid
        }
      >
        <article
          className={
            styles.summaryCard
          }
        >
          <div
            className={
              styles.summaryIcon
            }
          >
            <PaymentIcon />
          </div>

          <div>
            <span>
              Total payments
            </span>

            <strong>
              {statistics.total}
            </strong>
          </div>
        </article>

        <article
          className={
            styles.summaryCard
          }
        >
          <div
            className={
              styles.summaryIcon
            }
          >
            <ReviewIcon />
          </div>

          <div>
            <span>
              Awaiting review
            </span>

            <strong>
              {
                statistics.submitted
              }
            </strong>
          </div>
        </article>

        <article
          className={
            styles.summaryCard
          }
        >
          <div
            className={
              styles.summaryIcon
            }
          >
            <CheckIcon />
          </div>

          <div>
            <span>
              Paid payments
            </span>

            <strong>
              {statistics.paid}
            </strong>
          </div>
        </article>

        <article
          className={
            styles.summaryCard
          }
        >
          <div
            className={
              styles.summaryIcon
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
                styles.moneyValue
              }
            >
              {formatCurrency(
                statistics.paidRevenue,
              )}
            </strong>
          </div>
        </article>
      </section>

      <section
        className={
          styles.panel
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
              placeholder="Search reference, customer or order..."
              value={search}
              onChange={(
                event,
              ) =>
                setSearch(
                  event.target
                    .value,
                )
              }
            />
          </div>

          <select
            value={
              statusFilter
            }
            onChange={(
              event,
            ) =>
              setStatusFilter(
                event.target
                  .value,
              )
            }
            className={
              styles.select
            }
          >
            {STATUS_OPTIONS.map(
              (status) => (
                <option
                  key={status}
                  value={status}
                >
                  {status ===
                  'ALL'
                    ? 'All statuses'
                    : formatLabel(
                        status,
                      )}
                </option>
              ),
            )}
          </select>

          <select
            value={
              purposeFilter
            }
            onChange={(
              event,
            ) =>
              setPurposeFilter(
                event.target
                  .value,
              )
            }
            className={
              styles.select
            }
          >
            {PURPOSE_OPTIONS.map(
              (purpose) => (
                <option
                  key={purpose}
                  value={purpose}
                >
                  {purpose ===
                  'ALL'
                    ? 'All purposes'
                    : formatLabel(
                        purpose,
                      )}
                </option>
              ),
            )}
          </select>
        </div>

        <div
          className={
            styles.panelHeader
          }
        >
          <div>
            <h2>
              Payment records
            </h2>

            <p>
              {
                filteredPayments.length
              }{' '}
              result
              {filteredPayments.length ===
              1
                ? ''
                : 's'}
            </p>
          </div>
        </div>

        {filteredPayments.length ===
        0 ? (
          <div
            className={
              styles.emptyState
            }
          >
            <PaymentIcon />

            <h3>
              No payments found
            </h3>

            <p>
              No payment records
              match the selected
              filters.
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
                  styles.table
                }
              >
                <thead>
                  <tr>
                    <th>
                      Payment
                    </th>

                    <th>
                      Customer
                    </th>

                    <th>
                      Order
                    </th>

                    <th>
                      Amount
                    </th>

                    <th>
                      Provider
                    </th>

                    <th>
                      Status
                    </th>

                    <th>
                      Date
                    </th>

                    <th />
                  </tr>
                </thead>

                <tbody>
                  {filteredPayments.map(
                    (
                      payment,
                    ) => {
                      const customer =
                        payment.user ||
                        {};

                      const order =
                        payment.order ||
                        {};

                      return (
                        <tr
                          key={
                            payment._id
                          }
                        >
                          <td>
                            <div
                              className={
                                styles.primaryCell
                              }
                            >
                              <strong>
                                {
                                  payment.reference
                                }
                              </strong>

                              <span>
                                {formatLabel(
                                  payment.purpose,
                                )}
                              </span>
                            </div>
                          </td>

                          <td>
                            <div
                              className={
                                styles.primaryCell
                              }
                            >
                              <strong>
                                {customer.fullName ||
                                  'Customer'}
                              </strong>

                              <span>
                                {customer.email ||
                                  '—'}
                              </span>
                            </div>
                          </td>

                          <td>
                            <div
                              className={
                                styles.primaryCell
                              }
                            >
                              <strong>
                                {order.orderNumber ||
                                  '—'}
                              </strong>

                              <span>
                                {order.status
                                  ? formatLabel(
                                      order.status,
                                    )
                                  : '—'}
                              </span>
                            </div>
                          </td>

                          <td>
                            <strong
                              className={
                                styles.amount
                              }
                            >
                              {formatCurrency(
                                payment.amount,
                              )}
                            </strong>
                          </td>

                          <td>
                            {formatLabel(
                              payment.provider,
                            )}
                          </td>

                          <td>
                            <span
                              className={`${styles.badge} ${
                                getStatusClass(
                                  payment.status,
                                )
                              }`}
                            >
                              {formatLabel(
                                payment.status,
                              )}
                            </span>
                          </td>

                          <td>
                            {formatDate(
                              payment.createdAt,
                            )}
                          </td>

                          <td>
                            <Link
                              href={`/admin/payments/${payment._id}`}
                              className={
                                styles.viewButton
                              }
                            >
                              Review
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
                styles.mobileList
              }
            >
              {filteredPayments.map(
                (
                  payment,
                ) => {
                  const customer =
                    payment.user ||
                    {};

                  const order =
                    payment.order ||
                    {};

                  return (
                    <article
                      key={
                        payment._id
                      }
                      className={
                        styles.mobileCard
                      }
                    >
                      <div
                        className={
                          styles.mobileCardHeader
                        }
                      >
                        <div>
                          <strong>
                            {
                              payment.reference
                            }
                          </strong>

                          <span>
                            {formatDate(
                              payment.createdAt,
                            )}
                          </span>
                        </div>

                        <span
                          className={`${styles.badge} ${
                            getStatusClass(
                              payment.status,
                            )
                          }`}
                        >
                          {formatLabel(
                            payment.status,
                          )}
                        </span>
                      </div>

                      <div
                        className={
                          styles.mobileAmount
                        }
                      >
                        {formatCurrency(
                          payment.amount,
                        )}
                      </div>

                      <div
                        className={
                          styles.mobileDetails
                        }
                      >
                        <div>
                          <span>
                            Customer
                          </span>

                          <strong>
                            {customer.fullName ||
                              customer.email ||
                              'Customer'}
                          </strong>
                        </div>

                        <div>
                          <span>
                            Order
                          </span>

                          <strong>
                            {order.orderNumber ||
                              '—'}
                          </strong>
                        </div>

                        <div>
                          <span>
                            Provider
                          </span>

                          <strong>
                            {formatLabel(
                              payment.provider,
                            )}
                          </strong>
                        </div>

                        <div>
                          <span>
                            Purpose
                          </span>

                          <strong>
                            {formatLabel(
                              payment.purpose,
                            )}
                          </strong>
                        </div>
                      </div>

                      <Link
                        href={`/admin/payments/${payment._id}`}
                        className={
                          styles.mobileViewButton
                        }
                      >
                        Review payment
                      </Link>
                    </article>
                  );
                },
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}