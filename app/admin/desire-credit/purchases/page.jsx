'use client';

import Link from 'next/link';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  CREDIT_PURCHASE_STATUSES,
  getAdminCreditPurchases,
} from '@/services/desire-credit.service';

import styles from './purchases.module.css';

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

function formatPlan(value) {
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

function normalizePurchases(
  response,
) {
  if (Array.isArray(response)) {
    return response;
  }

  if (
    Array.isArray(
      response?.purchases,
    )
  ) {
    return response.purchases;
  }

  if (
    Array.isArray(
      response?.creditPurchases,
    )
  ) {
    return response.creditPurchases;
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
      response?.data?.purchases,
    )
  ) {
    return response.data.purchases;
  }

  if (
    Array.isArray(
      response?.data
        ?.creditPurchases,
    )
  ) {
    return response.data.creditPurchases;
  }

  return [];
}

function getPurchaseId(purchase) {
  return (
    purchase?._id ||
    purchase?.id ||
    ''
  );
}

function getCustomer(purchase) {
  if (
    purchase?.user &&
    typeof purchase.user ===
      'object'
  ) {
    return purchase.user;
  }

  if (
    purchase?.customer &&
    typeof purchase.customer ===
      'object'
  ) {
    return purchase.customer;
  }

  return {};
}

function getCustomerName(purchase) {
  const customer =
    getCustomer(purchase);

  if (customer.fullName) {
    return customer.fullName;
  }

  const fullName = [
    customer.firstName,
    customer.lastName,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    fullName ||
    'Customer'
  );
}

function getCustomerEmail(purchase) {
  const customer =
    getCustomer(purchase);

  return (
    customer.email ||
    '—'
  );
}

function getOrder(purchase) {
  if (
    purchase?.order &&
    typeof purchase.order ===
      'object'
  ) {
    return purchase.order;
  }

  return {};
}

function getOrderNumber(purchase) {
  const order =
    getOrder(purchase);

  return (
    order.orderNumber ||
    purchase?.orderNumber ||
    '—'
  );
}

function getOrderAmount(purchase) {
  return Number(
    purchase?.orderAmount ??
      getOrder(purchase)
        ?.totalAmount ??
      0,
  );
}

function getFinancedAmount(
  purchase,
) {
  return Number(
    purchase?.financedAmount ??
      0,
  );
}

function getAmountRepaid(
  purchase,
) {
  return Number(
    purchase?.amountRepaid ??
      0,
  );
}

function getOutstandingBalance(
  purchase,
) {
  return Number(
    purchase
      ?.outstandingBalance ??
      0,
  );
}

function getCommitmentAmount(
  purchase,
) {
  return Number(
    purchase
      ?.commitmentPaymentAmount ??
      0,
  );
}

function getPurchaseStatus(
  purchase,
) {
  return (
    purchase?.status ||
    CREDIT_PURCHASE_STATUSES
      .PENDING_COMMITMENT_PAYMENT
  );
}

function getStatusClass(status) {
  switch (
    String(
      status || '',
    ).toUpperCase()
  ) {
    case 'ACTIVE':
      return styles.statusActive;

    case 'COMPLETED':
    case 'FULLY_PAID':
      return styles.statusCompleted;

    case 'OVERDUE':
      return styles.statusOverdue;

    case 'DEFAULTED':
      return styles.statusDefaulted;

    case 'CANCELLED':
      return styles.statusCancelled;

    case 'PENDING_COMMITMENT_PAYMENT':
    default:
      return styles.statusPending;
  }
}

export default function AdminCreditPurchasesPage() {
  const [
    purchases,
    setPurchases,
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

  const loadPurchases =
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
            await getAdminCreditPurchases();

          setPurchases(
            normalizePurchases(
              response,
            ),
          );
        } catch (loadError) {
          console.error(
            'Unable to load DESIRE CREDIT purchases:',
            loadError,
          );

          setError(
            loadError?.message ||
              'Unable to load credit purchases.',
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [],
    );

  useEffect(() => {
    loadPurchases();
  }, [loadPurchases]);

  const summary = useMemo(
    () => {
      return purchases.reduce(
        (result, purchase) => {
          const status =
            String(
              getPurchaseStatus(
                purchase,
              ),
            ).toUpperCase();

          result.total += 1;

          if (
            status === 'ACTIVE'
          ) {
            result.active += 1;
          }

          if (
            status === 'OVERDUE' ||
            status === 'DEFAULTED'
          ) {
            result.atRisk += 1;
          }

          result.financed +=
            getFinancedAmount(
              purchase,
            );

          result.repaid +=
            getAmountRepaid(
              purchase,
            );

          result.outstanding +=
            getOutstandingBalance(
              purchase,
            );

          return result;
        },
        {
          total: 0,
          active: 0,
          atRisk: 0,
          financed: 0,
          repaid: 0,
          outstanding: 0,
        },
      );
    },
    [purchases],
  );

  const filteredPurchases =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return purchases.filter(
        (purchase) => {
          const status =
            String(
              getPurchaseStatus(
                purchase,
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
              purchase,
            ).toLowerCase();

          const email =
            getCustomerEmail(
              purchase,
            ).toLowerCase();

          const orderNumber =
            String(
              getOrderNumber(
                purchase,
              ),
            ).toLowerCase();

          const id =
            String(
              getPurchaseId(
                purchase,
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
      purchases,
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
          Purchases
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
            Credit purchases
          </h1>

          <p>
            Monitor financed orders,
            commitment payments,
            repayments and outstanding
            DESIRE CREDIT balances.
          </p>
        </div>

        <button
          type="button"
          className={
            styles.refreshButton
          }
          disabled={refreshing}
          onClick={() =>
            loadPurchases(true)
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
              credit purchases
            </strong>

            <p>{error}</p>
          </div>

          <button
            type="button"
            onClick={() =>
              loadPurchases(true)
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
          label="Total purchases"
          value={summary.total}
        />

        <StatCard
          label="Active purchases"
          value={summary.active}
        />

        <StatCard
          label="Total financed"
          value={formatCurrency(
            summary.financed,
          )}
        />

        <StatCard
          label="Outstanding"
          value={formatCurrency(
            summary.outstanding,
          )}
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
            PORTFOLIO
          </span>

          <h2>
            Purchase exposure
          </h2>
        </div>

        <div
          className={
            styles.financialGrid
          }
        >
          <FinancialItem
            label="Total financed"
            value={formatCurrency(
              summary.financed,
            )}
          />

          <FinancialItem
            label="Amount repaid"
            value={formatCurrency(
              summary.repaid,
            )}
          />

          <FinancialItem
            label="Outstanding balance"
            value={formatCurrency(
              summary.outstanding,
            )}
          />

          <FinancialItem
            label="Overdue / defaulted"
            value={summary.atRisk}
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
              placeholder="Search customer, email, order or purchase ID..."
              aria-label="Search credit purchases"
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
            aria-label="Filter purchases by status"
          >
            <option value="ALL">
              All statuses
            </option>

            <option
              value={
                CREDIT_PURCHASE_STATUSES
                  .PENDING_COMMITMENT_PAYMENT
              }
            >
              Pending commitment
            </option>

            <option
              value={
                CREDIT_PURCHASE_STATUSES
                  .ACTIVE
              }
            >
              Active
            </option>

            <option
              value={
                CREDIT_PURCHASE_STATUSES
                  .FULLY_PAID
              }
            >
              Fully paid
            </option>

            <option
              value={
                CREDIT_PURCHASE_STATUSES
                  .COMPLETED
              }
            >
              Completed
            </option>

            <option
              value={
                CREDIT_PURCHASE_STATUSES
                  .OVERDUE
              }
            >
              Overdue
            </option>

            <option
              value={
                CREDIT_PURCHASE_STATUSES
                  .DEFAULTED
              }
            >
              Defaulted
            </option>

            <option
              value={
                CREDIT_PURCHASE_STATUSES
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
              Customer purchases
            </strong>

            <span>
              {
                filteredPurchases.length
              }{' '}
              result
              {filteredPurchases.length ===
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

        {filteredPurchases.length ===
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
              <PurchaseIcon />
            </div>

            <h2>
              No credit purchases
              found
            </h2>

            <p>
              {purchases.length ===
              0
                ? 'There are no DESIRE CREDIT purchases yet.'
                : 'No purchases match your current search or filter.'}
            </p>

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
                      Order amount
                    </th>

                    <th>
                      Financed
                    </th>

                    <th>
                      Repaid
                    </th>

                    <th>
                      Outstanding
                    </th>

                    <th>
                      Plan
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
                  {filteredPurchases.map(
                    (purchase) => {
                      const id =
                        getPurchaseId(
                          purchase,
                        );

                      const status =
                        getPurchaseStatus(
                          purchase,
                        );

                      return (
                        <tr key={id}>
                          <td>
                            <Customer
                              purchase={
                                purchase
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
                                  purchase,
                                )}
                              </strong>

                              <span>
                                {formatDate(
                                  purchase
                                    ?.createdAt,
                                )}
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
                                getOrderAmount(
                                  purchase,
                                ),
                              )}
                            </strong>
                          </td>

                          <td>
                            {formatCurrency(
                              getFinancedAmount(
                                purchase,
                              ),
                            )}
                          </td>

                          <td>
                            <strong
                              className={
                                styles.repaid
                              }
                            >
                              {formatCurrency(
                                getAmountRepaid(
                                  purchase,
                                ),
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
                                getOutstandingBalance(
                                  purchase,
                                ),
                              )}
                            </strong>
                          </td>

                          <td>
                            <span
                              className={
                                styles.plan
                              }
                            >
                              {formatPlan(
                                purchase
                                  ?.installmentPlan,
                              )}
                            </span>
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
                                href={`/admin/desire-credit/purchases/${id}`}
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
              {filteredPurchases.map(
                (purchase) => {
                  const id =
                    getPurchaseId(
                      purchase,
                    );

                  const status =
                    getPurchaseStatus(
                      purchase,
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
                          purchase={
                            purchase
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
                          styles.mobileOrder
                        }
                      >
                        <span>
                          Order
                        </span>

                        <strong>
                          {getOrderNumber(
                            purchase,
                          )}
                        </strong>
                      </div>

                      <div
                        className={
                          styles.mobileDetails
                        }
                      >
                        <MobileDetail
                          label="Order amount"
                          value={formatCurrency(
                            getOrderAmount(
                              purchase,
                            ),
                          )}
                        />

                        <MobileDetail
                          label="Commitment"
                          value={formatCurrency(
                            getCommitmentAmount(
                              purchase,
                            ),
                          )}
                        />

                        <MobileDetail
                          label="Financed"
                          value={formatCurrency(
                            getFinancedAmount(
                              purchase,
                            ),
                          )}
                        />

                        <MobileDetail
                          label="Repaid"
                          value={formatCurrency(
                            getAmountRepaid(
                              purchase,
                            ),
                          )}
                        />

                        <MobileDetail
                          label="Outstanding"
                          value={formatCurrency(
                            getOutstandingBalance(
                              purchase,
                            ),
                          )}
                        />

                        <MobileDetail
                          label="Plan"
                          value={formatPlan(
                            purchase
                              ?.installmentPlan,
                          )}
                        />

                        <MobileDetail
                          label="Created"
                          value={formatDate(
                            purchase
                              ?.createdAt,
                          )}
                        />
                      </div>

                      {id && (
                        <Link
                          href={`/admin/desire-credit/purchases/${id}`}
                          className={
                            styles.mobileAction
                          }
                        >
                          View purchase

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
  purchase,
}) {
  const name =
    getCustomerName(purchase);

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
        <strong>
          {name}
        </strong>

        <span>
          {getCustomerEmail(
            purchase,
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

function PurchaseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M6 7h12l1 13H5L6 7Z" />
      <path d="M9 9V5a3 3 0 0 1 6 0v4" />
    </svg>
  );
}