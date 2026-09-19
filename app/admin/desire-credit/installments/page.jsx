'use client';

import Link from 'next/link';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  INSTALLMENT_STATUSES,
  getAdminCreditInstallments,
} from '@/services/desire-credit.service';

import styles from './installments.module.css';

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
    },
  ).format(date);
}

function formatStatus(value) {
  if (!value) {
    return 'Not available';
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

function normalizeInstallments(
  response,
) {
  if (Array.isArray(response)) {
    return response;
  }

  if (
    Array.isArray(
      response?.installments,
    )
  ) {
    return response.installments;
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
      response?.data
        ?.installments,
    )
  ) {
    return response.data.installments;
  }

  return [];
}

function getInstallmentId(
  installment,
) {
  return (
    installment?._id ||
    installment?.id ||
    ''
  );
}

function getCustomer(
  installment,
) {
  if (
    installment?.user &&
    typeof installment.user ===
      'object'
  ) {
    return installment.user;
  }

  return {};
}

function getCustomerName(
  installment,
) {
  const customer =
    getCustomer(installment);

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

function getCustomerEmail(
  installment,
) {
  return (
    getCustomer(installment)
      ?.email || '—'
  );
}

function getOrder(installment) {
  if (
    installment?.order &&
    typeof installment.order ===
      'object'
  ) {
    return installment.order;
  }

  return {};
}

function getOrderNumber(
  installment,
) {
  return (
    getOrder(installment)
      ?.orderNumber || '—'
  );
}

function getStatus(
  installment,
) {
  return (
    installment?.status ||
    INSTALLMENT_STATUSES.PENDING
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

    case 'PARTIALLY_PAID':
      return styles.statusPartial;

    case 'OVERDUE':
      return styles.statusOverdue;

    case 'WAIVED':
      return styles.statusWaived;

    case 'CANCELLED':
      return styles.statusCancelled;

    case 'PENDING':
    default:
      return styles.statusPending;
  }
}

function isPastDue(
  installment,
) {
  if (!installment?.dueDate) {
    return false;
  }

  const status =
    String(
      getStatus(installment),
    ).toUpperCase();

  if (
    status === 'PAID' ||
    status === 'WAIVED' ||
    status === 'CANCELLED'
  ) {
    return false;
  }

  const dueDate =
    new Date(
      installment.dueDate,
    );

  if (
    Number.isNaN(
      dueDate.getTime(),
    )
  ) {
    return false;
  }

  return (
    dueDate.getTime() <
    Date.now()
  );
}

export default function AdminCreditInstallmentsPage() {
  const [
    installments,
    setInstallments,
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

  const loadInstallments =
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
            await getAdminCreditInstallments();

          setInstallments(
            normalizeInstallments(
              response,
            ),
          );
        } catch (loadError) {
          console.error(
            'Unable to load DESIRE CREDIT installments:',
            loadError,
          );

          setError(
            loadError?.message ||
              'Unable to load installments.',
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [],
    );

  useEffect(() => {
    loadInstallments();
  }, [loadInstallments]);

  const summary = useMemo(
    () => {
      return installments.reduce(
        (result, installment) => {
          const status =
            String(
              getStatus(
                installment,
              ),
            ).toUpperCase();

          result.total += 1;

          result.totalAmount +=
            Number(
              installment?.amount ||
                0,
            );

          result.amountPaid +=
            Number(
              installment
                ?.amountPaid || 0,
            );

          result.outstanding +=
            Number(
              installment
                ?.outstandingAmount ||
                0,
            );

          if (
            status === 'PENDING'
          ) {
            result.pending += 1;
          }

          if (
            status ===
            'PARTIALLY_PAID'
          ) {
            result.partial += 1;
          }

          if (
            status === 'PAID'
          ) {
            result.paid += 1;
          }

          if (
            status === 'OVERDUE'
          ) {
            result.overdue += 1;
          }

          return result;
        },
        {
          total: 0,
          pending: 0,
          partial: 0,
          paid: 0,
          overdue: 0,
          totalAmount: 0,
          amountPaid: 0,
          outstanding: 0,
        },
      );
    },
    [installments],
  );

  const filteredInstallments =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return installments.filter(
        (installment) => {
          const status =
            String(
              getStatus(
                installment,
              ),
            ).toUpperCase();

          const matchesStatus =
            statusFilter ===
              'ALL' ||
            status ===
              statusFilter;

          if (!matchesStatus) {
            return false;
          }

          if (!query) {
            return true;
          }

          const customerName =
            getCustomerName(
              installment,
            ).toLowerCase();

          const email =
            getCustomerEmail(
              installment,
            ).toLowerCase();

          const orderNumber =
            String(
              getOrderNumber(
                installment,
              ),
            ).toLowerCase();

          const id =
            String(
              getInstallmentId(
                installment,
              ),
            ).toLowerCase();

          return (
            customerName.includes(
              query,
            ) ||
            email.includes(
              query,
            ) ||
            orderNumber.includes(
              query,
            ) ||
            id.includes(query)
          );
        },
      );
    }, [
      installments,
      search,
      statusFilter,
    ]);

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
    <div
      className={styles.page}
    >
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
          Installments
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
            Installments
          </h1>

          <p>
            Monitor customer
            repayment schedules,
            payments, outstanding
            balances and overdue
            DESIRE CREDIT
            installments.
          </p>
        </div>

        <button
          type="button"
          className={
            styles.refreshButton
          }
          disabled={refreshing}
          onClick={() =>
            loadInstallments(true)
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
              installments
            </strong>

            <p>{error}</p>
          </div>

          <button
            type="button"
            onClick={() =>
              loadInstallments(true)
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
          label="Total installments"
          value={summary.total}
        />

        <StatCard
          label="Pending"
          value={summary.pending}
        />

        <StatCard
          label="Paid"
          value={summary.paid}
        />

        <StatCard
          label="Overdue"
          value={summary.overdue}
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
            REPAYMENTS
          </span>

          <h2>
            Installment exposure
          </h2>
        </div>

        <div
          className={
            styles.financialGrid
          }
        >
          <FinancialItem
            label="Scheduled amount"
            value={formatCurrency(
              summary.totalAmount,
            )}
          />

          <FinancialItem
            label="Amount received"
            value={formatCurrency(
              summary.amountPaid,
            )}
          />

          <FinancialItem
            label="Outstanding"
            value={formatCurrency(
              summary.outstanding,
            )}
          />

          <FinancialItem
            label="Partially paid"
            value={summary.partial}
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
              placeholder="Search customer, email, order or installment ID..."
              aria-label="Search installments"
            />
          </div>

          <select
            className={
              styles.statusSelect
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

            <option
              value={
                INSTALLMENT_STATUSES
                  .PENDING
              }
            >
              Pending
            </option>

            <option
              value={
                INSTALLMENT_STATUSES
                  .PARTIALLY_PAID
              }
            >
              Partially paid
            </option>

            <option
              value={
                INSTALLMENT_STATUSES
                  .PAID
              }
            >
              Paid
            </option>

            <option
              value={
                INSTALLMENT_STATUSES
                  .OVERDUE
              }
            >
              Overdue
            </option>

            <option
              value={
                INSTALLMENT_STATUSES
                  .WAIVED
              }
            >
              Waived
            </option>

            <option
              value={
                INSTALLMENT_STATUSES
                  .CANCELLED
              }
            >
              Cancelled
            </option>
          </select>
        </div>

        <div
          className={
            styles.resultsHeader
          }
        >
          <div>
            <strong>
              Repayment schedule
            </strong>

            <span>
              {
                filteredInstallments.length
              }{' '}
              result
              {filteredInstallments.length ===
              1
                ? ''
                : 's'}
            </span>
          </div>

          {(search ||
            statusFilter !==
              'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setStatusFilter(
                  'ALL',
                );
              }}
            >
              Clear filters
            </button>
          )}
        </div>

        {filteredInstallments.length ===
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
              <InstallmentIcon />
            </div>

            <h2>
              No installments found
            </h2>

            <p>
              {installments.length ===
              0
                ? 'There are no DESIRE CREDIT installments yet.'
                : 'No installments match your current search or filter.'}
            </p>
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
                      Installment
                    </th>

                    <th>
                      Amount
                    </th>

                    <th>
                      Paid
                    </th>

                    <th>
                      Outstanding
                    </th>

                    <th>
                      Due date
                    </th>

                    <th>
                      Status
                    </th>

                    <th>
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredInstallments.map(
                    (installment) => {
                      const id =
                        getInstallmentId(
                          installment,
                        );

                      const status =
                        getStatus(
                          installment,
                        );

                      return (
                        <tr key={id}>
                          <td>
                            <Customer
                              installment={
                                installment
                              }
                            />
                          </td>

                          <td>
                            <strong
                              className={
                                styles.orderNumber
                              }
                            >
                              {getOrderNumber(
                                installment,
                              )}
                            </strong>
                          </td>

                          <td>
                            <strong
                              className={
                                styles.installmentNumber
                              }
                            >
                              {installment
                                ?.installmentNumber ||
                                '—'}
                              {' of '}
                              {installment
                                ?.totalInstallments ||
                                '—'}
                            </strong>
                          </td>

                          <td>
                            <strong
                              className={
                                styles.amount
                              }
                            >
                              {formatCurrency(
                                installment
                                  ?.amount,
                              )}
                            </strong>
                          </td>

                          <td>
                            <strong
                              className={
                                styles.paid
                              }
                            >
                              {formatCurrency(
                                installment
                                  ?.amountPaid,
                              )}
                            </strong>
                          </td>

                          <td>
                            <strong
                              className={
                                styles.outstanding
                              }
                            >
                              {formatCurrency(
                                installment
                                  ?.outstandingAmount,
                              )}
                            </strong>
                          </td>

                          <td>
                            <div
                              className={
                                styles.dueDate
                              }
                            >
                              <span>
                                {formatDate(
                                  installment
                                    ?.dueDate,
                                )}
                              </span>

                              {isPastDue(
                                installment,
                              ) && (
                                <small>
                                  Past due
                                </small>
                              )}
                            </div>
                          </td>

                          <td>
                            <StatusBadge
                              status={
                                status
                              }
                            />
                          </td>

                          <td>
                            {id && (
                              <Link
                                href={`/admin/desire-credit/installments/${id}`}
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
              {filteredInstallments.map(
                (installment) => {
                  const id =
                    getInstallmentId(
                      installment,
                    );

                  const status =
                    getStatus(
                      installment,
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
                          installment={
                            installment
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
                          styles.mobileInstallment
                        }
                      >
                        <div>
                          <span>
                            Installment
                          </span>

                          <strong>
                            {installment
                              ?.installmentNumber ||
                              '—'}
                            {' of '}
                            {installment
                              ?.totalInstallments ||
                              '—'}
                          </strong>
                        </div>

                        <div>
                          <span>
                            Order
                          </span>

                          <strong>
                            {getOrderNumber(
                              installment,
                            )}
                          </strong>
                        </div>
                      </div>

                      <div
                        className={
                          styles.mobileDetails
                        }
                      >
                        <MobileDetail
                          label="Amount"
                          value={formatCurrency(
                            installment
                              ?.amount,
                          )}
                        />

                        <MobileDetail
                          label="Paid"
                          value={formatCurrency(
                            installment
                              ?.amountPaid,
                          )}
                        />

                        <MobileDetail
                          label="Outstanding"
                          value={formatCurrency(
                            installment
                              ?.outstandingAmount,
                          )}
                        />

                        <MobileDetail
                          label="Late fee"
                          value={formatCurrency(
                            installment
                              ?.lateFee,
                          )}
                        />

                        <MobileDetail
                          label="Due date"
                          value={formatDate(
                            installment
                              ?.dueDate,
                          )}
                        />
                      </div>

                      {id && (
                        <Link
                          href={`/admin/desire-credit/installments/${id}`}
                          className={
                            styles.mobileAction
                          }
                        >
                          View installment

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
  installment,
}) {
  const name =
    getCustomerName(
      installment,
    );

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
            installment,
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
      {formatStatus(status)}
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

function InstallmentIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <rect
        x="4"
        y="3"
        width="16"
        height="18"
        rx="2"
      />
      <path d="M8 8h8" />
      <path d="M8 12h8" />
      <path d="M8 16h5" />
    </svg>
  );
}