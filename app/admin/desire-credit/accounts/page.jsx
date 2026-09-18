'use client';

import Link from 'next/link';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import apiFetch from '@/lib/api';
import { ENDPOINTS } from '@/lib/endpoints';

import styles from './accounts.module.css';

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

function normalizeAccounts(
  response,
) {
  if (Array.isArray(response)) {
    return response;
  }

  if (
    Array.isArray(
      response?.accounts,
    )
  ) {
    return response.accounts;
  }

  if (
    Array.isArray(
      response?.creditAccounts,
    )
  ) {
    return response.creditAccounts;
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
      response?.data?.accounts,
    )
  ) {
    return response.data.accounts;
  }

  if (
    Array.isArray(
      response?.data
        ?.creditAccounts,
    )
  ) {
    return response.data.creditAccounts;
  }

  return [];
}

function getAccountId(account) {
  return (
    account?._id ||
    account?.id ||
    ''
  );
}

function getCustomer(account) {
  if (
    account?.user &&
    typeof account.user ===
      'object'
  ) {
    return account.user;
  }

  if (
    account?.customer &&
    typeof account.customer ===
      'object'
  ) {
    return account.customer;
  }

  return {};
}

function getCustomerName(account) {
  const customer =
    getCustomer(account);

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
    account?.fullName ||
    account?.name ||
    'Customer'
  );
}

function getCustomerEmail(account) {
  const customer =
    getCustomer(account);

  return (
    customer.email ||
    account?.email ||
    '—'
  );
}

function getCreditLimit(account) {
  return Number(
    account?.creditLimit ??
      account?.approvedAmount ??
      account?.approvedCreditLimit ??
      account?.limit ??
      0,
  );
}

function getUsedCredit(account) {
  return Number(
    account?.usedCredit ??
      account?.usedAmount ??
      account?.creditUsed ??
      0,
  );
}

function getAvailableCredit(account) {
  const directValue =
    account?.availableCredit ??
    account?.availableAmount ??
    account?.remainingCredit;

  if (
    directValue !== undefined &&
    directValue !== null
  ) {
    return Number(directValue);
  }

  return Math.max(
    0,
    getCreditLimit(account) -
      getUsedCredit(account),
  );
}

function getOutstandingBalance(
  account,
) {
  return Number(
    account
      ?.outstandingBalance ??
      account
        ?.outstandingAmount ??
      account?.balance ??
      0,
  );
}

function getAccountStatus(account) {
  return (
    account?.status ||
    'ACTIVE'
  );
}

function getStatusClass(status) {
  switch (
    String(
      status || '',
    ).toUpperCase()
  ) {
    case 'SUSPENDED':
      return styles.statusSuspended;

    case 'FROZEN':
      return styles.statusFrozen;

    case 'CLOSED':
      return styles.statusClosed;

    case 'ACTIVE':
    default:
      return styles.statusActive;
  }
}

export default function AdminCreditAccountsPage() {
  const [
    accounts,
    setAccounts,
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

  const loadAccounts =
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
            await apiFetch(
              ENDPOINTS
                .DESIRE_CREDIT
                .ADMIN_ACCOUNTS,
            );

          setAccounts(
            normalizeAccounts(
              response,
            ),
          );
        } catch (loadError) {
          console.error(
            'Unable to load DESIRE CREDIT accounts:',
            loadError,
          );

          setError(
            loadError?.message ||
              'Unable to load credit accounts.',
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [],
    );

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const summary = useMemo(
    () => {
      return accounts.reduce(
        (result, account) => {
          const status =
            String(
              getAccountStatus(
                account,
              ),
            ).toUpperCase();

          result.total += 1;

          if (
            status === 'ACTIVE'
          ) {
            result.active += 1;
          }

          if (
            status ===
              'SUSPENDED' ||
            status === 'FROZEN'
          ) {
            result.restricted +=
              1;
          }

          result.totalLimit +=
            getCreditLimit(
              account,
            );

          result.totalUsed +=
            getUsedCredit(
              account,
            );

          result.outstanding +=
            getOutstandingBalance(
              account,
            );

          return result;
        },
        {
          total: 0,
          active: 0,
          restricted: 0,
          totalLimit: 0,
          totalUsed: 0,
          outstanding: 0,
        },
      );
    },
    [accounts],
  );

  const filteredAccounts =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return accounts.filter(
        (account) => {
          const status =
            String(
              getAccountStatus(
                account,
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
              account,
            ).toLowerCase();

          const email =
            getCustomerEmail(
              account,
            ).toLowerCase();

          const id = String(
            getAccountId(account),
          ).toLowerCase();

          return (
            customerName.includes(
              query,
            ) ||
            email.includes(
              query,
            ) ||
            id.includes(query)
          );
        },
      );
    }, [
      accounts,
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
          Credit Accounts
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
            Credit accounts
          </h1>

          <p>
            Monitor customer credit
            limits, usage, available
            credit and outstanding
            balances.
          </p>
        </div>

        <button
          type="button"
          className={
            styles.refreshButton
          }
          disabled={refreshing}
          onClick={() =>
            loadAccounts(true)
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
              credit accounts
            </strong>

            <p>{error}</p>
          </div>

          <button
            type="button"
            onClick={() =>
              loadAccounts(true)
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
          label="Total accounts"
          value={summary.total}
        />

        <StatCard
          label="Active accounts"
          value={summary.active}
        />

        <StatCard
          label="Total credit limit"
          value={formatCurrency(
            summary.totalLimit,
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
            Credit exposure
          </h2>
        </div>

        <div
          className={
            styles.financialGrid
          }
        >
          <FinancialItem
            label="Total approved credit"
            value={formatCurrency(
              summary.totalLimit,
            )}
          />

          <FinancialItem
            label="Credit currently used"
            value={formatCurrency(
              summary.totalUsed,
            )}
          />

          <FinancialItem
            label="Outstanding balance"
            value={formatCurrency(
              summary.outstanding,
            )}
          />

          <FinancialItem
            label="Restricted accounts"
            value={
              summary.restricted
            }
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
              placeholder="Search customer, email or account ID..."
              aria-label="Search credit accounts"
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
            aria-label="Filter accounts by status"
          >
            <option value="ALL">
              All statuses
            </option>

            <option value="ACTIVE">
              Active
            </option>

            <option value="SUSPENDED">
              Suspended
            </option>

            <option value="FROZEN">
              Frozen
            </option>

            <option value="CLOSED">
              Closed
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
              Customer accounts
            </strong>

            <span>
              {
                filteredAccounts.length
              }{' '}
              result
              {filteredAccounts.length ===
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

        {filteredAccounts.length ===
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
              <CreditIcon />
            </div>

            <h2>
              No credit accounts
              found
            </h2>

            <p>
              {accounts.length ===
              0
                ? 'There are no DESIRE CREDIT accounts yet.'
                : 'No accounts match your current search or filter.'}
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
                      Credit limit
                    </th>

                    <th>
                      Used
                    </th>

                    <th>
                      Available
                    </th>

                    <th>
                      Outstanding
                    </th>

                    <th>
                      Status
                    </th>

                    <th>
                      Created
                    </th>

                    <th>
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredAccounts.map(
                    (account) => {
                      const id =
                        getAccountId(
                          account,
                        );

                      const status =
                        getAccountStatus(
                          account,
                        );

                      return (
                        <tr key={id}>
                          <td>
                            <Customer
                              account={
                                account
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
                                getCreditLimit(
                                  account,
                                ),
                              )}
                            </strong>
                          </td>

                          <td>
                            {formatCurrency(
                              getUsedCredit(
                                account,
                              ),
                            )}
                          </td>

                          <td>
                            <strong
                              className={
                                styles.available
                              }
                            >
                              {formatCurrency(
                                getAvailableCredit(
                                  account,
                                ),
                              )}
                            </strong>
                          </td>

                          <td>
                            {formatCurrency(
                              getOutstandingBalance(
                                account,
                              ),
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
                            <span
                              className={
                                styles.date
                              }
                            >
                              {formatDate(
                                account
                                  ?.createdAt,
                              )}
                            </span>
                          </td>

                          <td>
                            {id && (
                              <Link
                                href={`/admin/desire-credit/accounts/${id}`}
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
              {filteredAccounts.map(
                (account) => {
                  const id =
                    getAccountId(
                      account,
                    );

                  const status =
                    getAccountStatus(
                      account,
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
                          account={
                            account
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
                          styles.mobileDetails
                        }
                      >
                        <MobileDetail
                          label="Credit limit"
                          value={formatCurrency(
                            getCreditLimit(
                              account,
                            ),
                          )}
                        />

                        <MobileDetail
                          label="Used credit"
                          value={formatCurrency(
                            getUsedCredit(
                              account,
                            ),
                          )}
                        />

                        <MobileDetail
                          label="Available credit"
                          value={formatCurrency(
                            getAvailableCredit(
                              account,
                            ),
                          )}
                        />

                        <MobileDetail
                          label="Outstanding"
                          value={formatCurrency(
                            getOutstandingBalance(
                              account,
                            ),
                          )}
                        />

                        <MobileDetail
                          label="Created"
                          value={formatDate(
                            account
                              ?.createdAt,
                          )}
                        />
                      </div>

                      {id && (
                        <Link
                          href={`/admin/desire-credit/accounts/${id}`}
                          className={
                            styles.mobileAction
                          }
                        >
                          View credit
                          account

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
  account,
}) {
  const name =
    getCustomerName(account);

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
            account,
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

function CreditIcon() {
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