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

import styles from './applications.module.css';

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

function normalizeApplications(
  response,
) {
  if (
    Array.isArray(response)
  ) {
    return response;
  }

  if (
    Array.isArray(
      response?.applications,
    )
  ) {
    return response.applications;
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
        ?.applications,
    )
  ) {
    return response.data.applications;
  }

  return [];
}

function getCustomer(
  application,
) {
  const user =
    application?.user;

  if (
    user &&
    typeof user === 'object'
  ) {
    return user;
  }

  const customer =
    application?.customer;

  if (
    customer &&
    typeof customer ===
      'object'
  ) {
    return customer;
  }

  return {};
}

function getCustomerName(
  application,
) {
  const customer =
    getCustomer(application);

  if (customer.fullName) {
    return customer.fullName;
  }

  const name = [
    customer.firstName,
    customer.lastName,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    name ||
    application?.fullName ||
    application?.name ||
    'Customer'
  );
}

function getCustomerEmail(
  application,
) {
  const customer =
    getCustomer(application);

  return (
    customer.email ||
    application?.email ||
    '—'
  );
}

function getRequestedAmount(
  application,
) {
  return Number(
    application
      ?.requestedCreditLimit ??
      application
        ?.requestedCreditAmount ??
      application
        ?.requestedAmount ??
      application?.creditLimit ??
      0,
  );
}

function getPlan(
  application,
) {
  return (
    application
      ?.preferredInstallmentPlan ||
    application
      ?.installmentPlan ||
    'Not selected'
  );
}

function getApplicationId(
  application,
) {
  return (
    application?._id ||
    application?.id ||
    ''
  );
}

function getApplicationStatus(
  application,
) {
  return (
    application?.status ||
    'PENDING'
  );
}

function getStatusClass(
  status,
) {
  switch (
    String(
      status || '',
    ).toUpperCase()
  ) {
    case 'APPROVED':
      return styles.statusApproved;

    case 'REJECTED':
      return styles.statusRejected;

    case 'UNDER_REVIEW':
      return styles.statusReview;

    case 'MORE_INFORMATION_REQUIRED':
      return styles.statusInformation;

    case 'CANCELLED':
      return styles.statusCancelled;

    case 'PENDING':
    default:
      return styles.statusPending;
  }
}

export default function AdminCreditApplicationsPage() {
  const [
    applications,
    setApplications,
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

  const loadApplications =
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
                .ADMIN_APPLICATIONS,
            );

          setApplications(
            normalizeApplications(
              response,
            ),
          );
        } catch (loadError) {
          console.error(
            'Unable to load DESIRE CREDIT applications:',
            loadError,
          );

          setError(
            loadError?.message ||
              'Unable to load credit applications.',
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [],
    );

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const counts = useMemo(() => {
    const result = {
      ALL: applications.length,
      PENDING: 0,
      UNDER_REVIEW: 0,
      APPROVED: 0,
      REJECTED: 0,
    };

    applications.forEach(
      (application) => {
        const status =
          String(
            getApplicationStatus(
              application,
            ),
          ).toUpperCase();

        if (
          result[status] !==
          undefined
        ) {
          result[status] += 1;
        }
      },
    );

    return result;
  }, [applications]);

  const filteredApplications =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return applications.filter(
        (application) => {
          const status =
            String(
              getApplicationStatus(
                application,
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
              application,
            ).toLowerCase();

          const email =
            getCustomerEmail(
              application,
            ).toLowerCase();

          const applicationId =
            String(
              getApplicationId(
                application,
              ),
            ).toLowerCase();

          return (
            customerName.includes(
              query,
            ) ||
            email.includes(
              query,
            ) ||
            applicationId.includes(
              query,
            )
          );
        },
      );
    }, [
      applications,
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
          Applications
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
            Credit applications
          </h1>

          <p>
            Review and manage
            customer applications
            for DESIRE CREDIT.
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
            loadApplications(true)
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
              Unable to load applications
            </strong>

            <p>{error}</p>
          </div>

          <button
            type="button"
            onClick={() =>
              loadApplications(true)
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
          label="All applications"
          value={counts.ALL}
        />

        <StatCard
          label="Pending"
          value={
            counts.PENDING
          }
        />

        <StatCard
          label="Under review"
          value={
            counts.UNDER_REVIEW
          }
        />

        <StatCard
          label="Approved"
          value={
            counts.APPROVED
          }
        />
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
              placeholder="Search customer, email or application ID..."
              aria-label="Search applications"
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
              styles.statusSelect
            }
            aria-label="Filter by status"
          >
            <option value="ALL">
              All statuses
            </option>

            <option value="PENDING">
              Pending
            </option>

            <option value="UNDER_REVIEW">
              Under review
            </option>

            <option value="APPROVED">
              Approved
            </option>

            <option value="REJECTED">
              Rejected
            </option>

            <option value="MORE_INFORMATION_REQUIRED">
              More information
              required
            </option>

            <option value="CANCELLED">
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
              Applications
            </strong>

            <span>
              {
                filteredApplications.length
              }{' '}
              result
              {filteredApplications.length ===
              1
                ? ''
                : 's'}
            </span>
          </div>

          {statusFilter !==
            'ALL' && (
            <button
              type="button"
              onClick={() =>
                setStatusFilter(
                  'ALL',
                )
              }
            >
              Clear filter
            </button>
          )}
        </div>

        {filteredApplications.length ===
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
              <ApplicationIcon />
            </div>

            <h2>
              No applications found
            </h2>

            <p>
              {applications.length ===
              0
                ? 'There are no DESIRE CREDIT applications yet.'
                : 'No applications match the current search or filter.'}
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
                      Requested credit
                    </th>

                    <th>
                      Preferred plan
                    </th>

                    <th>
                      Status
                    </th>

                    <th>
                      Applied
                    </th>

                    <th>
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredApplications.map(
                    (
                      application,
                    ) => {
                      const id =
                        getApplicationId(
                          application,
                        );

                      const status =
                        getApplicationStatus(
                          application,
                        );

                      return (
                        <tr
                          key={id}
                        >
                          <td>
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
                                {getCustomerName(
                                  application,
                                )
                                  .charAt(
                                    0,
                                  )
                                  .toUpperCase()}
                              </div>

                              <div>
                                <strong>
                                  {getCustomerName(
                                    application,
                                  )}
                                </strong>

                                <span>
                                  {getCustomerEmail(
                                    application,
                                  )}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td>
                            <strong
                              className={
                                styles.amount
                              }
                            >
                              {formatCurrency(
                                getRequestedAmount(
                                  application,
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
                              {formatStatus(
                                getPlan(
                                  application,
                                ),
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
                            <span
                              className={
                                styles.date
                              }
                            >
                              {formatDate(
                                application
                                  ?.createdAt,
                              )}
                            </span>
                          </td>

                          <td>
                            {id && (
                              <Link
                                href={`/admin/desire-credit/applications/${id}`}
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
              {filteredApplications.map(
                (
                  application,
                ) => {
                  const id =
                    getApplicationId(
                      application,
                    );

                  const status =
                    getApplicationStatus(
                      application,
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
                          styles.mobileCardHeader
                        }
                      >
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
                            {getCustomerName(
                              application,
                            )
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div>
                            <strong>
                              {getCustomerName(
                                application,
                              )}
                            </strong>

                            <span>
                              {getCustomerEmail(
                                application,
                              )}
                            </span>
                          </div>
                        </div>

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
                          label="Requested credit"
                          value={formatCurrency(
                            getRequestedAmount(
                              application,
                            ),
                          )}
                        />

                        <MobileDetail
                          label="Preferred plan"
                          value={formatStatus(
                            getPlan(
                              application,
                            ),
                          )}
                        />

                        <MobileDetail
                          label="Applied"
                          value={formatDate(
                            application
                              ?.createdAt,
                          )}
                        />
                      </div>

                      {id && (
                        <Link
                          href={`/admin/desire-credit/applications/${id}`}
                          className={
                            styles.mobileAction
                          }
                        >
                          View application
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

      <strong>
        {value}
      </strong>
    </article>
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

      <strong>
        {value}
      </strong>
    </div>
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

function ApplicationIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M6 3h9l4 4v14H6V3Z" />
      <path d="M15 3v5h5" />
      <path d="M9 12h6" />
      <path d="M9 16h6" />
    </svg>
  );
}