'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import Link from 'next/link';

import {
  getAdminCustomers,
} from '@/services/profile.service';

import styles from './customers.module.css';

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
    },
  ).format(date);
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

export default function AdminCustomersPage() {
  const [
    customers,
    setCustomers,
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
    orderFilter,
    setOrderFilter,
  ] = useState('ALL');

  const loadCustomers =
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
            await getAdminCustomers();

          setCustomers(
            Array.isArray(
              response?.customers,
            )
              ? response.customers
              : [],
          );
        } catch (err) {
          console.error(
            'Unable to load admin customers:',
            err,
          );

          setError(
            err?.message ||
              'Unable to load customers.',
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [],
    );

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const statistics =
    useMemo(() => {
      const totalCustomers =
        customers.length;

      const customersWithOrders =
        customers.filter(
          (customer) =>
            Number(
              customer.totalOrders ||
                0,
            ) > 0,
        ).length;

      const totalPaidOrders =
        customers.reduce(
          (total, customer) =>
            total +
            Number(
              customer.paidOrders ||
                0,
            ),
          0,
        );

      const totalRevenue =
        customers.reduce(
          (total, customer) =>
            total +
            Number(
              customer.totalSpent ||
                0,
            ),
          0,
        );

      return {
        totalCustomers,
        customersWithOrders,
        totalPaidOrders,
        totalRevenue,
      };
    }, [customers]);

  const filteredCustomers =
    useMemo(() => {
      const normalizedSearch =
        search
          .trim()
          .toLowerCase();

      return customers.filter(
        (customer) => {
          const totalOrders =
            Number(
              customer.totalOrders ||
                0,
            );

          const paidOrders =
            Number(
              customer.paidOrders ||
                0,
            );

          let matchesOrderFilter =
            true;

          if (
            orderFilter ===
            'HAS_ORDERS'
          ) {
            matchesOrderFilter =
              totalOrders > 0;
          }

          if (
            orderFilter ===
            'NO_ORDERS'
          ) {
            matchesOrderFilter =
              totalOrders === 0;
          }

          if (
            orderFilter ===
            'HAS_PAID'
          ) {
            matchesOrderFilter =
              paidOrders > 0;
          }

          if (
            !matchesOrderFilter
          ) {
            return false;
          }

          if (
            !normalizedSearch
          ) {
            return true;
          }

          const searchableValues = [
            customer.fullName,
            customer.email,
            customer.phone,
            customer._id,
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
      customers,
      search,
      orderFilter,
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
            Loading customers
          </strong>

          <p>
            Retrieving DESIRE
            customer accounts...
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
            Customer Management
          </span>

          <h1>
            Customers
          </h1>

          <p>
            Review customer
            accounts, order
            activity and confirmed
            spending.
          </p>
        </div>

        <button
          type="button"
          className={
            styles.refreshButton
          }
          disabled={refreshing}
          onClick={() =>
            loadCustomers(true)
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
              customers
            </strong>

            <span>
              {error}
            </span>
          </div>

          <button
            type="button"
            onClick={() =>
              loadCustomers()
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
            <CustomerIcon />
          </div>

          <div>
            <span>
              Total customers
            </span>

            <strong>
              {
                statistics.totalCustomers
              }
            </strong>

            <small>
              Registered customer
              accounts
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
            <OrderIcon />
          </div>

          <div>
            <span>
              With orders
            </span>

            <strong>
              {
                statistics.customersWithOrders
              }
            </strong>

            <small>
              Customers who have
              ordered
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
                statistics.totalPaidOrders
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
            <MoneyIcon />
          </div>

          <div>
            <span>
              Customer revenue
            </span>

            <strong
              className={
                styles.currencyValue
              }
            >
              {formatCurrency(
                statistics.totalRevenue,
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
              placeholder="Search name, email or phone..."
            />
          </div>

          <select
            className={
              styles.filterSelect
            }
            value={orderFilter}
            onChange={(event) =>
              setOrderFilter(
                event.target.value,
              )
            }
          >
            <option value="ALL">
              All customers
            </option>

            <option value="HAS_ORDERS">
              With orders
            </option>

            <option value="HAS_PAID">
              With paid orders
            </option>

            <option value="NO_ORDERS">
              No orders
            </option>
          </select>
        </div>

        <div
          className={
            styles.resultHeader
          }
        >
          <div>
            <strong>
              Customer list
            </strong>

            <span>
              {
                filteredCustomers.length
              }{' '}
              {filteredCustomers.length ===
              1
                ? 'customer'
                : 'customers'}
            </span>
          </div>

          {(search ||
            orderFilter !==
              'ALL') && (
            <button
              type="button"
              className={
                styles.clearButton
              }
              onClick={() => {
                setSearch('');
                setOrderFilter(
                  'ALL',
                );
              }}
            >
              Clear filters
            </button>
          )}
        </div>

        {filteredCustomers.length ===
        0 ? (
          <div
            className={
              styles.emptyState
            }
          >
            <CustomerIcon />

            <strong>
              No customers found
            </strong>

            <p>
              {customers.length ===
              0
                ? 'Registered customer accounts will appear here.'
                : 'No customers match your current search and filter.'}
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
                  styles.customersTable
                }
              >
                <thead>
                  <tr>
                    <th>
                      Customer
                    </th>

                    <th>
                      Phone
                    </th>

                    <th>
                      Joined
                    </th>

                    <th>
                      Orders
                    </th>

                    <th>
                      Paid orders
                    </th>

                    <th>
                      Total spent
                    </th>

                    <th>
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredCustomers.map(
                    (customer) => (
                      <tr
                        key={
                          customer._id
                        }
                      >
                        <td>
                          <div
                            className={
                              styles.customerCell
                            }
                          >
                            <div
                              className={
                                styles.avatar
                              }
                            >
                              {getInitials(
                                customer.fullName,
                              )}
                            </div>

                            <div>
                              <strong>
                                {customer.fullName ||
                                  'Customer'}
                              </strong>

                              <span>
                                {customer.email ||
                                  'No email'}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span
                            className={
                              styles.phone
                            }
                          >
                            {customer.phone ||
                              '—'}
                          </span>
                        </td>

                        <td>
                          <span
                            className={
                              styles.date
                            }
                          >
                            {formatDate(
                              customer.createdAt,
                            )}
                          </span>
                        </td>

                        <td>
                          <strong
                            className={
                              styles.count
                            }
                          >
                            {Number(
                              customer.totalOrders ||
                                0,
                            )}
                          </strong>
                        </td>

                        <td>
                          <strong
                            className={
                              styles.count
                            }
                          >
                            {Number(
                              customer.paidOrders ||
                                0,
                            )}
                          </strong>
                        </td>

                        <td>
                          <strong
                            className={
                              styles.amount
                            }
                          >
                            {formatCurrency(
                              customer.totalSpent,
                            )}
                          </strong>
                        </td>

                        <td>
                          <Link
                            href={`/admin/customers/${customer._id}`}
                            className={
                              styles.viewButton
                            }
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>

            <div
              className={
                styles.mobileCustomers
              }
            >
              {filteredCustomers.map(
                (customer) => (
                  <article
                    key={
                      customer._id
                    }
                    className={
                      styles.mobileCard
                    }
                  >
                    <div
                      className={
                        styles.mobileTop
                      }
                    >
                      <div
                        className={
                          styles.avatar
                        }
                      >
                        {getInitials(
                          customer.fullName,
                        )}
                      </div>

                      <div
                        className={
                          styles.mobileIdentity
                        }
                      >
                        <strong>
                          {customer.fullName ||
                            'Customer'}
                        </strong>

                        <span>
                          {customer.email ||
                            'No email'}
                        </span>

                        {customer.phone && (
                          <small>
                            {
                              customer.phone
                            }
                          </small>
                        )}
                      </div>
                    </div>

                    <div
                      className={
                        styles.mobileStats
                      }
                    >
                      <div>
                        <span>
                          Orders
                        </span>

                        <strong>
                          {Number(
                            customer.totalOrders ||
                              0,
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Paid
                        </span>

                        <strong>
                          {Number(
                            customer.paidOrders ||
                              0,
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Spent
                        </span>

                        <strong>
                          {formatCurrency(
                            customer.totalSpent,
                          )}
                        </strong>
                      </div>
                    </div>

                    <div
                      className={
                        styles.mobileJoined
                      }
                    >
                      <span>
                        Joined
                      </span>

                      <strong>
                        {formatDate(
                          customer.createdAt,
                        )}
                      </strong>
                    </div>

                    <Link
                      href={`/admin/customers/${customer._id}`}
                      className={
                        styles.mobileViewButton
                      }
                    >
                      View customer
                    </Link>
                  </article>
                ),
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}