'use client';

import Link from 'next/link';

import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  useParams,
} from 'next/navigation';

import apiFetch from '@/lib/api';
import { ENDPOINTS } from '@/lib/endpoints';

import styles from './account-details.module.css';

const ACCOUNT_STATUSES = [
  {
    value: 'ACTIVE',
    label: 'Active',
  },
  {
    value: 'SUSPENDED',
    label: 'Suspended',
  },
  {
    value: 'FROZEN',
    label: 'Frozen',
  },
  {
    value: 'CLOSED',
    label: 'Closed',
  },
];

const RESTRICTED_ACCOUNT_STATUSES = [
  'SUSPENDED',
  'FROZEN',
  'CLOSED',
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
      month: 'long',
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

function normalizeAccount(response) {
  if (
    !response ||
    typeof response !==
      'object'
  ) {
    return null;
  }

  return (
    response.account ||
    response.creditAccount ||
    response.data?.account ||
    response.data?.creditAccount ||
    response.data ||
    response
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

  const name = [
    customer.firstName,
    customer.lastName,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    name ||
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

function getCustomerPhone(account) {
  const customer =
    getCustomer(account);

  return (
    customer.phone ||
    account?.phone ||
    account?.phoneNumber ||
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
  const value =
    account?.availableCredit ??
    account?.availableAmount ??
    account?.remainingCredit;

  if (
    value !== undefined &&
    value !== null
  ) {
    return Number(value);
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
    account?.outstandingBalance ??
      account?.outstandingAmount ??
      account?.balance ??
      0,
  );
}

function getTotalRepaid(account) {
  return Number(
    account?.totalRepaid ??
      account?.repaidAmount ??
      account?.amountRepaid ??
      0,
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

export default function AdminCreditAccountDetailsPage() {
  const params = useParams();

  const accountId =
    Array.isArray(params?.id)
      ? params.id[0]
      : params?.id;

  const [
    account,
    setAccount,
  ] = useState(null);

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
    modal,
    setModal,
  ] = useState(null);

  const [
    newCreditLimit,
    setNewCreditLimit,
  ] = useState('');

  const [
    newStatus,
    setNewStatus,
  ] = useState('');

  const [
    reason,
    setReason,
  ] = useState('');

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    actionError,
    setActionError,
  ] = useState('');

  const [
    successMessage,
    setSuccessMessage,
  ] = useState('');

  const loadAccount =
    useCallback(
      async (
        isRefresh = false,
      ) => {
        if (!accountId) {
          setError(
            'Credit account ID is missing.',
          );

          setLoading(false);
          return;
        }

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
                .ADMIN_ACCOUNT(
                  accountId,
                ),
            );

          const normalized =
            normalizeAccount(
              response,
            );

          if (
            !normalized ||
            !(
              normalized._id ||
              normalized.id
            )
          ) {
            throw new Error(
              'Credit account was not found.',
            );
          }

          setAccount(normalized);
        } catch (loadError) {
          console.error(
            'Unable to load DESIRE CREDIT account:',
            loadError,
          );

          setError(
            loadError?.message ||
              'Unable to load this credit account.',
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [accountId],
    );

  useEffect(() => {
    loadAccount();
  }, [loadAccount]);

  function openLimitModal() {
    setActionError('');
    setSuccessMessage('');
    setReason('');

    setNewCreditLimit(
      String(
        getCreditLimit(account) ||
          '',
      ),
    );

    setModal('LIMIT');
  }

  function openStatusModal() {
    setActionError('');
    setSuccessMessage('');
    setReason('');

    setNewStatus(
      account?.status ||
        'ACTIVE',
    );

    setModal('STATUS');
  }

  function closeModal() {
    if (submitting) {
      return;
    }

    setModal(null);
    setActionError('');
    setReason('');
  }

  async function handleUpdate(
    event,
  ) {
    event.preventDefault();

    if (
      !accountId ||
      !modal
    ) {
      return;
    }

    const payload = {};

    if (modal === 'LIMIT') {
      const amount =
        Number(
          newCreditLimit,
        );

      if (
        !Number.isFinite(
          amount,
        ) ||
        amount < 5000 ||
        amount > 1000000
      ) {
        setActionError(
          'Credit limit must be between ₦5,000 and ₦1,000,000.',
        );

        return;
      }

      if (
        amount <
        getUsedCredit(account)
      ) {
        setActionError(
          `Credit limit cannot be lower than the currently used credit of ${formatCurrency(
            getUsedCredit(
              account,
            ),
          )}.`,
        );

        return;
      }

      payload.creditLimit =
        amount;
    }

    if (modal === 'STATUS') {
      const validStatus =
        ACCOUNT_STATUSES.some(
          (item) =>
            item.value ===
            newStatus,
        );

      if (!validStatus) {
        setActionError(
          'Select a valid account status.',
        );

        return;
      }

      const requiresReason =
        RESTRICTED_ACCOUNT_STATUSES.includes(
          newStatus,
        );

      if (
        requiresReason &&
        !reason.trim()
      ) {
        setActionError(
          'A reason is required when restricting or closing a DESIRE CREDIT account.',
        );

        return;
      }

      payload.status =
        newStatus;

      if (reason.trim()) {
        payload.reason =
          reason.trim();
      }
    }

    setSubmitting(true);
    setActionError('');
    setSuccessMessage('');

    try {
      await apiFetch(
        ENDPOINTS
          .DESIRE_CREDIT
          .ADMIN_UPDATE_ACCOUNT(
            accountId,
          ),
        {
          method: 'PATCH',
          body: JSON.stringify(
            payload,
          ),
        },
      );

      const completedAction =
        modal;

      setModal(null);
      setReason('');

      setSuccessMessage(
        completedAction ===
          'LIMIT'
          ? 'Credit limit updated successfully.'
          : 'Account status updated successfully.',
      );

      await loadAccount(true);
    } catch (updateError) {
      console.error(
        'Unable to update DESIRE CREDIT account:',
        updateError,
      );

      setActionError(
        updateError?.message ||
          'Unable to update this credit account.',
      );
    } finally {
      setSubmitting(false);
    }
  }

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
            styles.loadingGrid
          }
        >
          <span />
          <span />
        </div>
      </div>
    );
  }

  if (
    error ||
    !account
  ) {
    return (
      <div
        className={styles.page}
      >
        <div
          className={
            styles.breadcrumb
          }
        >
          <Link href="/admin/desire-credit/accounts">
            Credit Accounts
          </Link>

          <span>/</span>

          <strong>
            Details
          </strong>
        </div>

        <section
          className={
            styles.errorState
          }
        >
          <CreditIcon />

          <h1>
            Credit account
            unavailable
          </h1>

          <p>
            {error ||
              'Unable to retrieve this credit account.'}
          </p>

          <button
            type="button"
            onClick={() =>
              loadAccount(true)
            }
          >
            Try again
          </button>
        </section>
      </div>
    );
  }

  const customer =
    getCustomer(account);

  const status =
    account.status ||
    'ACTIVE';

  const creditLimit =
    getCreditLimit(account);

  const usedCredit =
    getUsedCredit(account);

  const availableCredit =
    getAvailableCredit(
      account,
    );

  const outstanding =
    getOutstandingBalance(
      account,
    );

  const usagePercent =
    creditLimit > 0
      ? Math.min(
          100,
          Math.max(
            0,
            (usedCredit /
              creditLimit) *
              100,
          ),
        )
      : 0;

  const statusRequiresReason =
    RESTRICTED_ACCOUNT_STATUSES.includes(
      newStatus,
    );

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

        <Link href="/admin/desire-credit/accounts">
          Credit Accounts
        </Link>

        <span>/</span>

        <strong>
          Details
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
            CREDIT ACCOUNT
          </span>

          <h1>
            {getCustomerName(
              account,
            )}
          </h1>

          <p>
            Review this customer's
            DESIRE CREDIT account,
            credit usage and account
            controls.
          </p>
        </div>

        <div
          className={
            styles.headerActions
          }
        >
          <span
            className={`${styles.statusBadge} ${getStatusClass(
              status,
            )}`}
          >
            {formatStatus(
              status,
            )}
          </span>

          <button
            type="button"
            className={
              styles.refreshButton
            }
            disabled={
              refreshing
            }
            onClick={() =>
              loadAccount(true)
            }
          >
            <RefreshIcon />

            {refreshing
              ? 'Refreshing...'
              : 'Refresh'}
          </button>
        </div>
      </section>

      {successMessage && (
        <div
          className={
            styles.successBanner
          }
        >
          <CheckIcon />

          <div>
            <strong>
              Account updated
            </strong>

            <p>
              {successMessage}
            </p>
          </div>
        </div>
      )}

      <section
        className={
          styles.statsGrid
        }
      >
        <StatCard
          label="Credit limit"
          value={formatCurrency(
            creditLimit,
          )}
        />

        <StatCard
          label="Used credit"
          value={formatCurrency(
            usedCredit,
          )}
        />

        <StatCard
          label="Available credit"
          value={formatCurrency(
            availableCredit,
          )}
        />

        <StatCard
          label="Outstanding"
          value={formatCurrency(
            outstanding,
          )}
        />
      </section>

      <section
        className={
          styles.usageCard
        }
      >
        <div
          className={
            styles.usageHeader
          }
        >
          <div>
            <span
              className={
                styles.eyebrow
              }
            >
              CREDIT USAGE
            </span>

            <h2>
              Account utilization
            </h2>
          </div>

          <strong>
            {usagePercent.toFixed(
              0,
            )}
            %
          </strong>
        </div>

        <div
          className={
            styles.progressTrack
          }
        >
          <div
            className={
              styles.progressBar
            }
            style={{
              width: `${usagePercent}%`,
            }}
          />
        </div>

        <div
          className={
            styles.usageFooter
          }
        >
          <span>
            {formatCurrency(
              usedCredit,
            )}{' '}
            used
          </span>

          <span>
            {formatCurrency(
              availableCredit,
            )}{' '}
            available
          </span>
        </div>
      </section>

      <section
        className={
          styles.layout
        }
      >
        <div
          className={
            styles.mainColumn
          }
        >
          <DetailsSection
            eyebrow="CUSTOMER"
            title="Customer information"
          >
            <div
              className={
                styles.detailsGrid
              }
            >
              <Detail
                label="Full name"
                value={getCustomerName(
                  account,
                )}
              />

              <Detail
                label="Email"
                value={getCustomerEmail(
                  account,
                )}
              />

              <Detail
                label="Phone"
                value={getCustomerPhone(
                  account,
                )}
              />

              <Detail
                label="Country"
                value={
                  customer.country ||
                  account.country ||
                  '—'
                }
              />
            </div>
          </DetailsSection>

          <DetailsSection
            eyebrow="CREDIT"
            title="Credit information"
          >
            <div
              className={
                styles.detailsGrid
              }
            >
              <Detail
                label="Credit limit"
                value={formatCurrency(
                  creditLimit,
                )}
              />

              <Detail
                label="Used credit"
                value={formatCurrency(
                  usedCredit,
                )}
              />

              <Detail
                label="Available credit"
                value={formatCurrency(
                  availableCredit,
                )}
              />

              <Detail
                label="Outstanding balance"
                value={formatCurrency(
                  outstanding,
                )}
              />

              <Detail
                label="Total repaid"
                value={formatCurrency(
                  getTotalRepaid(
                    account,
                  ),
                )}
              />

              <Detail
                label="Account status"
                value={formatStatus(
                  status,
                )}
              />

              <Detail
                label="Installment plan"
                value={formatStatus(
                  account
                    ?.installmentPlan ||
                    account
                      ?.approvedInstallmentPlan,
                )}
              />

              <Detail
                label="Created"
                value={formatDate(
                  account.createdAt,
                )}
              />
            </div>
          </DetailsSection>

          {(account
            ?.adminNote ||
            account?.note ||
            account?.reason) && (
            <DetailsSection
              eyebrow="ADMIN"
              title="Administrative note"
            >
              <div
                className={
                  styles.note
                }
              >
                {account
                  ?.reason ||
                  account
                    ?.adminNote ||
                  account?.note}
              </div>
            </DetailsSection>
          )}
        </div>

        <aside
          className={
            styles.sidebar
          }
        >
          <section
            className={
              styles.actionCard
            }
          >
            <span
              className={
                styles.eyebrow
              }
            >
              ACCOUNT CONTROLS
            </span>

            <h2>
              Manage account
            </h2>

            <p>
              Update the customer's
              approved credit limit or
              control access to DESIRE
              CREDIT.
            </p>

            <div
              className={
                styles.actions
              }
            >
              <button
                type="button"
                className={
                  styles.primaryAction
                }
                onClick={
                  openLimitModal
                }
              >
                Edit credit limit
              </button>

              <button
                type="button"
                className={
                  styles.secondaryAction
                }
                onClick={
                  openStatusModal
                }
              >
                Change account status
              </button>
            </div>
          </section>

          <section
            className={
              styles.metaCard
            }
          >
            <span
              className={
                styles.eyebrow
              }
            >
              ACCOUNT
            </span>

            <MetaRow
              label="Account ID"
              value={
                account._id ||
                account.id
              }
            />

            <MetaRow
              label="Status"
              value={formatStatus(
                status,
              )}
            />

            <MetaRow
              label="Created"
              value={formatDate(
                account.createdAt,
              )}
            />

            <MetaRow
              label="Updated"
              value={formatDate(
                account.updatedAt,
              )}
            />

            {account
              ?.lastPurchaseAt && (
              <MetaRow
                label="Last purchase"
                value={formatDate(
                  account
                    .lastPurchaseAt,
                )}
              />
            )}

            {account
              ?.lastPaymentAt && (
              <MetaRow
                label="Last payment"
                value={formatDate(
                  account
                    .lastPaymentAt,
                )}
              />
            )}
          </section>
        </aside>
      </section>

      {modal && (
        <div
          className={
            styles.modalBackdrop
          }
          role="presentation"
          onMouseDown={(
            event,
          ) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeModal();
            }
          }}
        >
          <div
            className={
              styles.modal
            }
            role="dialog"
            aria-modal="true"
            aria-labelledby="account-modal-title"
          >
            <div
              className={
                styles.modalHeader
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

                <h2
                  id="account-modal-title"
                >
                  {modal ===
                  'LIMIT'
                    ? 'Update credit limit'
                    : 'Change account status'}
                </h2>
              </div>

              <button
                type="button"
                className={
                  styles.closeButton
                }
                disabled={
                  submitting
                }
                onClick={
                  closeModal
                }
                aria-label="Close"
              >
                <CloseIcon />
              </button>
            </div>

            <form
              onSubmit={
                handleUpdate
              }
            >
              {modal ===
                'LIMIT' && (
                <div
                  className={
                    styles.field
                  }
                >
                  <label
                    htmlFor="creditLimit"
                  >
                    Credit limit
                  </label>

                  <div
                    className={
                      styles.currencyInput
                    }
                  >
                    <span>
                      ₦
                    </span>

                    <input
                      id="creditLimit"
                      type="number"
                      min="5000"
                      max="1000000"
                      step="1"
                      value={
                        newCreditLimit
                      }
                      onChange={(
                        event,
                      ) =>
                        setNewCreditLimit(
                          event
                            .target
                            .value,
                        )
                      }
                      required
                    />
                  </div>

                  <small>
                    Current used
                    credit:{' '}
                    {formatCurrency(
                      usedCredit,
                    )}
                  </small>
                </div>
              )}

              {modal ===
                'STATUS' && (
                <>
                  <div
                    className={
                      styles.field
                    }
                  >
                    <label
                      htmlFor="accountStatus"
                    >
                      Account status
                    </label>

                    <select
                      id="accountStatus"
                      value={
                        newStatus
                      }
                      onChange={(
                        event,
                      ) => {
                        setNewStatus(
                          event
                            .target
                            .value,
                        );

                        setActionError(
                          '',
                        );
                      }}
                      required
                    >
                      {ACCOUNT_STATUSES.map(
                        (item) => (
                          <option
                            key={
                              item.value
                            }
                            value={
                              item.value
                            }
                          >
                            {
                              item.label
                            }
                          </option>
                        ),
                      )}
                    </select>

                    <small>
                      Use account status
                      controls carefully.
                      Existing balances
                      remain recorded by
                      the backend.
                    </small>
                  </div>

                  <div
                    className={
                      styles.field
                    }
                  >
                    <label
                      htmlFor="reason"
                    >
                      Reason
                      {statusRequiresReason
                        ? ' *'
                        : ''}
                    </label>

                    <textarea
                      id="reason"
                      rows="4"
                      value={
                        reason
                      }
                      onChange={(
                        event,
                      ) =>
                        setReason(
                          event
                            .target
                            .value,
                        )
                      }
                      placeholder={
                        statusRequiresReason
                          ? `Enter the reason for setting this account to ${formatStatus(
                              newStatus,
                            )}...`
                          : 'Optional reason for this status change...'
                      }
                      required={
                        statusRequiresReason
                      }
                    />

                    {statusRequiresReason ? (
                      <small>
                        A reason is
                        required when
                        restricting or
                        closing a DESIRE
                        CREDIT account.
                      </small>
                    ) : (
                      <small>
                        A reason is
                        optional when
                        activating the
                        account.
                      </small>
                    )}
                  </div>
                </>
              )}

              {actionError && (
                <div
                  className={
                    styles.modalError
                  }
                >
                  {actionError}
                </div>
              )}

              <div
                className={
                  styles.modalActions
                }
              >
                <button
                  type="button"
                  className={
                    styles.cancelButton
                  }
                  disabled={
                    submitting
                  }
                  onClick={
                    closeModal
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className={
                    styles.confirmButton
                  }
                  disabled={
                    submitting
                  }
                >
                  {submitting
                    ? 'Saving...'
                    : 'Save changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailsSection({
  eyebrow,
  title,
  children,
}) {
  return (
    <section
      className={
        styles.detailsCard
      }
    >
      <div
        className={
          styles.sectionHeader
        }
      >
        <span
          className={
            styles.eyebrow
          }
        >
          {eyebrow}
        </span>

        <h2>{title}</h2>
      </div>

      {children}
    </section>
  );
}

function Detail({
  label,
  value,
}) {
  return (
    <div
      className={
        styles.detail
      }
    >
      <span>{label}</span>

      <strong>
        {value || '—'}
      </strong>
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

function MetaRow({
  label,
  value,
}) {
  return (
    <div
      className={
        styles.metaRow
      }
    >
      <span>{label}</span>

      <strong>
        {value || '—'}
      </strong>
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

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M6 6l12 12" />
      <path d="M18 6 6 18" />
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