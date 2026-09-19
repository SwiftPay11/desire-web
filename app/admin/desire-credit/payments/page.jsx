'use client';

import Link from 'next/link';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  PAYMENT_PURPOSES,
  PAYMENT_STATUSES,
  getAdminPayments,
} from '@/services/payments.service';

import styles from './payments.module.css';

function formatCurrency(value) {
  return new Intl.NumberFormat(
    'en-NG',
    {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    },
  ).format(Number(value || 0));
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
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    },
  ).format(date);
}

function formatValue(value) {
  if (!value) {
    return '—';
  }

  return String(value)
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase(),
    );
}

function normalizePayments(response) {
  if (Array.isArray(response)) {
    return response;
  }

  if (
    Array.isArray(
      response?.payments,
    )
  ) {
    return response.payments;
  }

  if (
    Array.isArray(
      response?.data,
    )
  ) {
    return response.data;
  }

  if (
    Array.isArray(
      response?.data?.payments,
    )
  ) {
    return response.data.payments;
  }

  return [];
}

function getPaymentId(payment) {
  return (
    payment?._id ||
    payment?.id ||
    ''
  );
}

function getCustomer(payment) {
  if (
    payment?.user &&
    typeof payment.user ===
      'object'
  ) {
    return payment.user;
  }

  return {};
}

function getCustomerName(payment) {
  const customer =
    getCustomer(payment);

  if (customer.fullName) {
    return customer.fullName;
  }

  const name = [
    customer.firstName,
    customer.lastName,
  ]
    .filter(Boolean)
    .join(' ');

  return name || 'Customer';
}

function getCustomerEmail(payment) {
  return (
    getCustomer(payment)
      ?.email ||
    '—'
  );
}

function getOrder(payment) {
  if (
    payment?.order &&
    typeof payment.order ===
      'object'
  ) {
    return payment.order;
  }

  return {};
}

function getOrderNumber(payment) {
  return (
    getOrder(payment)
      ?.orderNumber ||
    payment?.orderNumber ||
    '—'
  );
}

function getPurpose(payment) {
  return (
    payment?.purpose ||
    PAYMENT_PURPOSES.ORDER
  );
}

function getStatus(payment) {
  return (
    payment?.status ||
    PAYMENT_STATUSES.PENDING
  );
}

function getStatusClass(status) {
  switch (
    String(
      status || '',
    ).toUpperCase()
  ) {
    case 'PAID':
      return styles.statusPaid;

    case 'SUBMITTED':
      return styles.statusSubmitted;

    case 'PROCESSING':
      return styles.statusProcessing;

    case 'FAILED':
      return styles.statusFailed;

    case 'CANCELLED':
      return styles.statusCancelled;

    case 'REFUNDED':
      return styles.statusRefunded;

    case 'PENDING':
    default:
      return styles.statusPending;
  }
}

function getPurposeClass(purpose) {
  if (
    purpose ===
    PAYMENT_PURPOSES
      .DESIRE_CREDIT_INSTALLMENT
  ) {
    return styles.purposeInstallment;
  }

  return styles.purposeCommitment;
}

export default function AdminDesireCreditPaymentsPage() {
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
    purposeFilter,
    setPurposeFilter,
  ] = useState('ALL');

  const [
    statusFilter,
    setStatusFilter,
  ] = useState('ALL');

  const loadPayments =
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

          const [
            commitmentResponse,
            installmentResponse,
          ] = await Promise.all([
            getAdminPayments({
              purpose:
                PAYMENT_PURPOSES
                  .DESIRE_CREDIT_COMMITMENT,
            }),

            getAdminPayments({
              purpose:
                PAYMENT_PURPOSES
                  .DESIRE_CREDIT_INSTALLMENT,
            }),
          ]);

          const combined = [
            ...normalizePayments(
              commitmentResponse,
            ),
            ...normalizePayments(
              installmentResponse,
            ),
          ];

          combined.sort(
            (a, b) =>
              new Date(
                b?.createdAt || 0,
              ).getTime() -
              new Date(
                a?.createdAt || 0,
              ).getTime(),
          );

          setPayments(combined);
        } catch (loadError) {
          console.error(
            'Unable to load DESIRE CREDIT payments:',
            loadError,
          );

          setError(
            loadError?.message ||
              'Unable to load DESIRE CREDIT payments.',
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

  const summary = useMemo(
    () => {
      return payments.reduce(
        (result, payment) => {
          const status =
            String(
              getStatus(payment),
            ).toUpperCase();

          const purpose =
            getPurpose(payment);

          const amount =
            Number(
              payment?.amount || 0,
            );

          result.total += 1;
          result.totalAmount +=
            amount;

          if (
            purpose ===
            PAYMENT_PURPOSES
              .DESIRE_CREDIT_COMMITMENT
          ) {
            result.commitments +=
              1;
          }

          if (
            purpose ===
            PAYMENT_PURPOSES
              .DESIRE_CREDIT_INSTALLMENT
          ) {
            result.installments +=
              1;
          }

          if (
            status ===
            PAYMENT_STATUSES
              .SUBMITTED
          ) {
            result.awaitingReview +=
              1;

            result.awaitingAmount +=
              amount;
          }

          if (
            status ===
            PAYMENT_STATUSES.PAID
          ) {
            result.paid += 1;
            result.paidAmount +=
              amount;
          }

          return result;
        },
        {
          total: 0,
          commitments: 0,
          installments: 0,
          awaitingReview: 0,
          paid: 0,
          totalAmount: 0,
          awaitingAmount: 0,
          paidAmount: 0,
        },
      );
    },
    [payments],
  );

  const filteredPayments =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return payments.filter(
        (payment) => {
          const purpose =
            getPurpose(payment);

          const status =
            String(
              getStatus(payment),
            ).toUpperCase();

          const matchesPurpose =
            purposeFilter ===
              'ALL' ||
            purpose ===
              purposeFilter;

          const matchesStatus =
            statusFilter ===
              'ALL' ||
            status ===
              statusFilter;

          if (
            !matchesPurpose ||
            !matchesStatus
          ) {
            return false;
          }

          if (!query) {
            return true;
          }

          const customer =
            getCustomerName(
              payment,
            ).toLowerCase();

          const email =
            getCustomerEmail(
              payment,
            ).toLowerCase();

          const order =
            String(
              getOrderNumber(
                payment,
              ),
            ).toLowerCase();

          const reference =
            String(
              payment
                ?.reference ||
              payment
                ?.paymentReference ||
              payment
                ?.providerReference ||
              '',
            ).toLowerCase();

          const id =
            String(
              getPaymentId(
                payment,
              ),
            ).toLowerCase();

          return (
            customer.includes(
              query,
            ) ||
            email.includes(
              query,
            ) ||
            order.includes(
              query,
            ) ||
            reference.includes(
              query,
            ) ||
            id.includes(query)
          );
        },
      );
    }, [
      payments,
      search,
      purposeFilter,
      statusFilter,
    ]);

  function clearFilters() {
    setSearch('');
    setPurposeFilter('ALL');
    setStatusFilter('ALL');
  }

  const hasFilters =
    Boolean(search) ||
    purposeFilter !== 'ALL' ||
    statusFilter !== 'ALL';

  if (loading) {
    return (
      <div
        className={
          styles.loadingPage
        }
      >
        <div
          className={
            styles.loadingHeader
          }
        />

        <div
          className={
            styles.loadingStats
          }
        >
          <span />
          <span />
          <span />
          <span />
        </div>

        <div
          className={
            styles.loadingTable
          }
        />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div
        className={
          styles.breadcrumb
        }
      >
        <Link href="/admin/desire-credit">
          DESIRE CREDIT
        </Link>

        <span>/</span>

        <strong>
          Payments
        </strong>
      </div>

      <section
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
            DESIRE CREDIT
          </span>

          <h1>
            Credit payments
          </h1>

          <p>
            Review commitment and
            installment payments,
            monitor submitted proofs
            and track verified DESIRE
            CREDIT repayments.
          </p>
        </div>

        <button
          type="button"
          className={
            styles.refreshButton
          }
          disabled={refreshing}
          onClick={() =>
            loadPayments(true)
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
          <div>
            <strong>
              Unable to load
              payments
            </strong>

            <p>{error}</p>
          </div>

          <button
            type="button"
            onClick={() =>
              loadPayments(true)
            }
          >
            Try again
          </button>
        </div>
      )}

      <section
        className={
          styles.statsGrid
        }
      >
        <StatCard
          label="Total payments"
          value={summary.total}
        />

        <StatCard
          label="Awaiting review"
          value={
            summary.awaitingReview
          }
        />

        <StatCard
          label="Commitment payments"
          value={
            summary.commitments
          }
        />

        <StatCard
          label="Installment payments"
          value={
            summary.installments
          }
        />
      </section>

      <section
        className={
          styles.financialPanel
        }
      >
        <div>
          <span
            className={
              styles.eyebrow
            }
          >
            PAYMENT FLOW
          </span>

          <h2>
            Credit collections
          </h2>
        </div>

        <div
          className={
            styles.financialGrid
          }
        >
          <FinancialItem
            label="Total payment value"
            value={formatCurrency(
              summary.totalAmount,
            )}
          />

          <FinancialItem
            label="Awaiting verification"
            value={formatCurrency(
              summary.awaitingAmount,
            )}
          />

          <FinancialItem
            label="Verified payments"
            value={formatCurrency(
              summary.paidAmount,
            )}
          />

          <FinancialItem
            label="Verified count"
            value={summary.paid}
          />
        </div>
      </section>

      <section
        className={
          styles.contentPanel
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
              onChange={(
                event,
              ) =>
                setSearch(
                  event.target
                    .value,
                )
              }
              placeholder="Search customer, order, reference or payment ID..."
              aria-label="Search DESIRE CREDIT payments"
            />
          </div>

          <select
            className={
              styles.filterSelect
            }
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
          >
            <option value="ALL">
              All payment types
            </option>

            <option
              value={
                PAYMENT_PURPOSES
                  .DESIRE_CREDIT_COMMITMENT
              }
            >
              Commitment
            </option>

            <option
              value={
                PAYMENT_PURPOSES
                  .DESIRE_CREDIT_INSTALLMENT
              }
            >
              Installment
            </option>
          </select>

          <select
            className={
              styles.filterSelect
            }
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
          >
            <option value="ALL">
              All statuses
            </option>

            {Object.values(
              PAYMENT_STATUSES,
            ).map((status) => (
              <option
                key={status}
                value={status}
              >
                {formatValue(
                  status,
                )}
              </option>
            ))}
          </select>
        </div>

        <div
          className={
            styles.resultsHeader
          }
        >
          <div>
            <strong>
              Credit payments
            </strong>

            <span>
              {
                filteredPayments.length
              }{' '}
              result
              {filteredPayments.length ===
              1
                ? ''
                : 's'}
            </span>
          </div>

          {hasFilters && (
            <button
              type="button"
              onClick={
                clearFilters
              }
            >
              Clear filters
            </button>
          )}
        </div>

        {filteredPayments.length ===
        0 ? (
          <div
            className={
              styles.emptyState
            }
          >
            <div
              className={
                styles.emptyIcon
              }
            >
              <PaymentIcon />
            </div>

            <h2>
              No credit payments
              found
            </h2>

            <p>
              {payments.length ===
              0
                ? 'There are no DESIRE CREDIT payments yet.'
                : 'No payments match your current search or filters.'}
            </p>

            {hasFilters && (
              <button
                type="button"
                onClick={
                  clearFilters
                }
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div
              className={
                styles.desktopTable
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
                      Customer
                    </th>

                    <th>
                      Order
                    </th>

                    <th>
                      Type
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
                      Submitted
                    </th>

                    <th>
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredPayments.map(
                    (payment) => {
                      const id =
                        getPaymentId(
                          payment,
                        );

                      const purpose =
                        getPurpose(
                          payment,
                        );

                      const status =
                        getStatus(
                          payment,
                        );

                      return (
                        <tr key={id}>
                          <td>
                            <Customer
                              payment={
                                payment
                              }
                            />
                          </td>

                          <td>
                            <div
                              className={
                                styles.orderCell
                              }
                            >
                              <strong>
                                {getOrderNumber(
                                  payment,
                                )}
                              </strong>

                              <span>
                                {formatDate(
                                  payment
                                    ?.createdAt,
                                )}
                              </span>
                            </div>
                          </td>

                          <td>
                            <PurposeBadge
                              purpose={
                                purpose
                              }
                            />
                          </td>

                          <td>
                            <strong
                              className={
                                styles.amount
                              }
                            >
                              {formatCurrency(
                                payment
                                  ?.amount,
                              )}
                            </strong>
                          </td>

                          <td>
                            {formatValue(
                              payment
                                ?.provider,
                            )}
                          </td>

                          <td>
                            <StatusBadge
                              status={
                                status
                              }
                            />
                          </td>

                          <td>
                            {formatDate(
                              payment
                                ?.submittedAt ||
                                payment
                                  ?.createdAt,
                            )}
                          </td>

                          <td>
                            {id && (
                              <Link
                                href={`/admin/desire-credit/payments/${id}`}
                                className={
                                  styles.viewButton
                                }
                              >
                                View

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

            <div
              className={
                styles.mobileList
              }
            >
              {filteredPayments.map(
                (payment) => {
                  const id =
                    getPaymentId(
                      payment,
                    );

                  const purpose =
                    getPurpose(
                      payment,
                    );

                  const status =
                    getStatus(
                      payment,
                    );

                  return (
                    <article
                      key={id}
                      className={
                        styles.mobileCard
                      }
                    >
                      <div
                        className={
                          styles.mobileHeader
                        }
                      >
                        <Customer
                          payment={
                            payment
                          }
                        />

                        <StatusBadge
                          status={
                            status
                          }
                        />
                      </div>

                      <div
                        className={
                          styles.mobilePurpose
                        }
                      >
                        <PurposeBadge
                          purpose={
                            purpose
                          }
                        />

                        <strong>
                          {formatCurrency(
                            payment
                              ?.amount,
                          )}
                        </strong>
                      </div>

                      <div
                        className={
                          styles.mobileDetails
                        }
                      >
                        <MobileDetail
                          label="Order"
                          value={getOrderNumber(
                            payment,
                          )}
                        />

                        <MobileDetail
                          label="Provider"
                          value={formatValue(
                            payment
                              ?.provider,
                          )}
                        />

                        <MobileDetail
                          label="Created"
                          value={formatDate(
                            payment
                              ?.createdAt,
                          )}
                        />

                        <MobileDetail
                          label="Submitted"
                          value={formatDate(
                            payment
                              ?.submittedAt,
                          )}
                        />
                      </div>

                      {id && (
                        <Link
                          href={`/admin/desire-credit/payments/${id}`}
                          className={
                            styles.mobileAction
                          }
                        >
                          View payment

                          <ArrowIcon />
                        </Link>
                      )}
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

function Customer({
  payment,
}) {
  const name =
    getCustomerName(payment);

  return (
    <div
      className={
        styles.customer
      }
    >
      <div
        className={
          styles.avatar
        }
      >
        {name
          .charAt(0)
          .toUpperCase()}
      </div>

      <div>
        <strong>{name}</strong>

        <span>
          {getCustomerEmail(
            payment,
          )}
        </span>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
}) {
  return (
    <article
      className={
        styles.statCard
      }
    >
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function FinancialItem({
  label,
  value,
}) {
  return (
    <div
      className={
        styles.financialItem
      }
    >
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function StatusBadge({
  status,
}) {
  return (
    <span
      className={`${styles.statusBadge} ${getStatusClass(
        status,
      )}`}
    >
      {formatValue(status)}
    </span>
  );
}

function PurposeBadge({
  purpose,
}) {
  const label =
    purpose ===
    PAYMENT_PURPOSES
      .DESIRE_CREDIT_INSTALLMENT
      ? 'Installment'
      : 'Commitment';

  return (
    <span
      className={`${styles.purposeBadge} ${getPurposeClass(
        purpose,
      )}`}
    >
      {label}
    </span>
  );
}

function MobileDetail({
  label,
  value,
}) {
  return (
    <div
      className={
        styles.mobileDetail
      }
    >
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
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