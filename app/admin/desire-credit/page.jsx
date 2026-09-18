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

import styles from './desire-credit.module.css';

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

function normalizeDashboard(response) {
  if (
    !response ||
    typeof response !== 'object'
  ) {
    return {};
  }

  return (
    response.dashboard ||
    response.data?.dashboard ||
    response.data ||
    response
  );
}

function getValue(
  object,
  keys,
  fallback = 0,
) {
  for (const key of keys) {
    if (
      object?.[key] !== undefined &&
      object?.[key] !== null
    ) {
      return object[key];
    }
  }

  return fallback;
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

export default function AdminDesireCreditPage() {
  const [
    dashboard,
    setDashboard,
  ] = useState({});

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

  const loadDashboard =
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
                .ADMIN_DASHBOARD,
            );

          setDashboard(
            normalizeDashboard(
              response,
            ),
          );
        } catch (loadError) {
          console.error(
            'Unable to load DESIRE CREDIT admin dashboard:',
            loadError,
          );

          setError(
            loadError?.message ||
              'Unable to load the DESIRE CREDIT dashboard.',
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [],
    );

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const applications =
    dashboard?.applications || {};

  const accounts =
    dashboard?.accounts || {};

  const purchases =
    dashboard?.purchases || {};

  const installments =
    dashboard?.installments || {};

  const financials =
    dashboard?.financials || {};

  const pendingApplications =
    Number(
      getValue(
        applications,
        [
          'pending',
          'pendingApplications',
        ],
      ),
    );

  const underReviewApplications =
    Number(
      getValue(
        applications,
        [
          'underReview',
          'underReviewApplications',
        ],
      ),
    );

  const approvedApplications =
    Number(
      getValue(
        applications,
        [
          'approved',
          'approvedApplications',
        ],
      ),
    );

  const rejectedApplications =
    Number(
      getValue(
        applications,
        [
          'rejected',
          'rejectedApplications',
        ],
      ),
    );

  const totalApplications =
    Number(
      getValue(
        applications,
        [
          'total',
          'totalApplications',
        ],
        pendingApplications +
          underReviewApplications +
          approvedApplications +
          rejectedApplications,
      ),
    );

  const activeAccounts =
    Number(
      getValue(
        accounts,
        [
          'active',
          'activeAccounts',
        ],
      ),
    );

  const suspendedAccounts =
    Number(
      getValue(
        accounts,
        [
          'suspended',
          'suspendedAccounts',
        ],
      ),
    );

  const frozenAccounts =
    Number(
      getValue(
        accounts,
        [
          'frozen',
          'frozenAccounts',
        ],
      ),
    );

  const overdueAccounts =
    Number(
      getValue(
        accounts,
        [
          'overdue',
          'overdueAccounts',
        ],
      ),
    );

  const totalAccounts =
    Number(
      getValue(
        accounts,
        [
          'total',
          'totalAccounts',
        ],
        activeAccounts +
          suspendedAccounts +
          frozenAccounts,
      ),
    );

  const activePurchases =
    Number(
      getValue(
        purchases,
        [
          'active',
          'activePurchases',
        ],
      ),
    );

  const pendingPurchases =
    Number(
      getValue(
        purchases,
        [
          'pending',
          'pendingCommitment',
          'pendingCommitmentPayment',
        ],
      ),
    );

  const completedPurchases =
    Number(
      getValue(
        purchases,
        [
          'completed',
          'fullyPaid',
          'completedPurchases',
        ],
      ),
    );

  const overduePurchases =
    Number(
      getValue(
        purchases,
        [
          'overdue',
          'overduePurchases',
        ],
      ),
    );

  const totalPurchases =
    Number(
      getValue(
        purchases,
        [
          'total',
          'totalPurchases',
        ],
        activePurchases +
          pendingPurchases +
          completedPurchases +
          overduePurchases,
      ),
    );

  const pendingInstallments =
    Number(
      getValue(
        installments,
        [
          'pending',
          'pendingInstallments',
        ],
      ),
    );

  const partiallyPaidInstallments =
    Number(
      getValue(
        installments,
        [
          'partiallyPaid',
          'partiallyPaidInstallments',
        ],
      ),
    );

  const paidInstallments =
    Number(
      getValue(
        installments,
        [
          'paid',
          'paidInstallments',
        ],
      ),
    );

  const overdueInstallments =
    Number(
      getValue(
        installments,
        [
          'overdue',
          'overdueInstallments',
        ],
      ),
    );

  const totalCreditLimit =
    Number(
      getValue(
        financials,
        [
          'totalCreditLimit',
          'creditLimit',
        ],
      ),
    );

  const totalUsedCredit =
    Number(
      getValue(
        financials,
        [
          'totalUsedCredit',
          'usedCredit',
        ],
      ),
    );

  const availableCredit =
    Number(
      getValue(
        financials,
        [
          'totalAvailableCredit',
          'availableCredit',
        ],
        Math.max(
          totalCreditLimit -
            totalUsedCredit,
          0,
        ),
      ),
    );

  const outstandingBalance =
    Number(
      getValue(
        financials,
        [
          'outstandingBalance',
          'totalOutstandingBalance',
        ],
      ),
    );

  const totalRepaid =
    Number(
      getValue(
        financials,
        [
          'totalRepaid',
          'repaid',
        ],
      ),
    );

  const overdueBalance =
    Number(
      getValue(
        financials,
        [
          'overdueBalance',
          'totalOverdueBalance',
        ],
      ),
    );

  const attentionCount =
    useMemo(
      () =>
        pendingApplications +
        underReviewApplications +
        overdueAccounts +
        overdueInstallments,
      [
        pendingApplications,
        underReviewApplications,
        overdueAccounts,
        overdueInstallments,
      ],
    );

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
            styles.loadingGrid
          }
        >
          <span />
          <span />
          <span />
          <span />
        </div>

        <div
          className={
            styles.loadingPanel
          }
        />
      </div>
    );
  }

  return (
    <div
      className={
        styles.page
      }
    >
      <section
        className={
          styles.hero
        }
      >
        <div
          className={
            styles.heroContent
          }
        >
          <span
            className={
              styles.eyebrow
            }
          >
            DESIRE CREDIT
          </span>

          <h1>
            Credit management
          </h1>

          <p>
            Manage customer credit
            applications, accounts,
            purchases, installments
            and repayment activity.
          </p>
        </div>

        <div
          className={
            styles.heroActions
          }
        >
          <button
            type="button"
            className={
              styles.refreshButton
            }
            disabled={
              refreshing
            }
            onClick={() =>
              loadDashboard(true)
            }
          >
            <RefreshIcon />

            {refreshing
              ? 'Refreshing...'
              : 'Refresh'}
          </button>
        </div>
      </section>

      {error ? (
        <div
          className={
            styles.errorBanner
          }
          role="alert"
        >
          <div>
            <strong>
              Dashboard unavailable
            </strong>

            <p>{error}</p>
          </div>

          <button
            type="button"
            onClick={() =>
              loadDashboard(true)
            }
          >
            Try again
          </button>
        </div>
      ) : null}

      <section
        className={
          styles.overviewGrid
        }
      >
        <OverviewCard
          label="Applications"
          value={
            totalApplications
          }
          detail={`${pendingApplications} pending`}
          icon={
            <ApplicationIcon />
          }
          href="/admin/desire-credit/applications"
        />

        <OverviewCard
          label="Credit accounts"
          value={
            totalAccounts
          }
          detail={`${activeAccounts} active`}
          icon={
            <AccountIcon />
          }
          href="/admin/desire-credit/accounts"
        />

        <OverviewCard
          label="Credit purchases"
          value={
            totalPurchases
          }
          detail={`${activePurchases} active`}
          icon={
            <PurchaseIcon />
          }
          href="/admin/desire-credit/purchases"
        />

        <OverviewCard
          label="Attention required"
          value={
            attentionCount
          }
          detail={`${overdueInstallments} overdue installments`}
          icon={
            <AlertIcon />
          }
          href="/admin/desire-credit/installments"
        />
      </section>

      <section
        className={
          styles.financialPanel
        }
      >
        <div
          className={
            styles.panelHeading
          }
        >
          <div>
            <span
              className={
                styles.sectionEyebrow
              }
            >
              PORTFOLIO
            </span>

            <h2>
              Credit financials
            </h2>
          </div>

          <MoneyIcon />
        </div>

        <div
          className={
            styles.financialGrid
          }
        >
          <FinancialItem
            label="Total credit limit"
            value={formatCurrency(
              totalCreditLimit,
            )}
          />

          <FinancialItem
            label="Credit in use"
            value={formatCurrency(
              totalUsedCredit,
            )}
          />

          <FinancialItem
            label="Available credit"
            value={formatCurrency(
              availableCredit,
            )}
          />

          <FinancialItem
            label="Outstanding balance"
            value={formatCurrency(
              outstandingBalance,
            )}
          />

          <FinancialItem
            label="Total repaid"
            value={formatCurrency(
              totalRepaid,
            )}
          />

          <FinancialItem
            label="Overdue balance"
            value={formatCurrency(
              overdueBalance,
            )}
            alert={
              overdueBalance > 0
            }
          />
        </div>
      </section>

      <section
        className={
          styles.managementGrid
        }
      >
        <ManagementPanel
          eyebrow="APPLICATIONS"
          title="Credit applications"
          description="Review new applications and manage customer approval decisions."
          href="/admin/desire-credit/applications"
          action="Manage applications"
          icon={
            <ApplicationIcon />
          }
        >
          <StatRow
            label="Pending"
            value={
              pendingApplications
            }
            status="warning"
          />

          <StatRow
            label="Under review"
            value={
              underReviewApplications
            }
            status="info"
          />

          <StatRow
            label="Approved"
            value={
              approvedApplications
            }
            status="success"
          />

          <StatRow
            label="Rejected"
            value={
              rejectedApplications
            }
            status="danger"
          />
        </ManagementPanel>

        <ManagementPanel
          eyebrow="ACCOUNTS"
          title="Credit accounts"
          description="Monitor approved customer credit limits, balances and account status."
          href="/admin/desire-credit/accounts"
          action="Manage accounts"
          icon={
            <AccountIcon />
          }
        >
          <StatRow
            label="Active"
            value={
              activeAccounts
            }
            status="success"
          />

          <StatRow
            label="Suspended"
            value={
              suspendedAccounts
            }
            status="warning"
          />

          <StatRow
            label="Frozen"
            value={
              frozenAccounts
            }
            status="danger"
          />

          <StatRow
            label="Overdue"
            value={
              overdueAccounts
            }
            status="danger"
          />
        </ManagementPanel>

        <ManagementPanel
          eyebrow="PURCHASES"
          title="Credit purchases"
          description="Track customer purchases financed through DESIRE CREDIT."
          href="/admin/desire-credit/purchases"
          action="View purchases"
          icon={
            <PurchaseIcon />
          }
        >
          <StatRow
            label="Pending commitment"
            value={
              pendingPurchases
            }
            status="warning"
          />

          <StatRow
            label="Active"
            value={
              activePurchases
            }
            status="info"
          />

          <StatRow
            label="Overdue"
            value={
              overduePurchases
            }
            status="danger"
          />

          <StatRow
            label="Completed"
            value={
              completedPurchases
            }
            status="success"
          />
        </ManagementPanel>

        <ManagementPanel
          eyebrow="INSTALLMENTS"
          title="Repayments"
          description="Monitor installment schedules and customer repayment status."
          href="/admin/desire-credit/installments"
          action="View installments"
          icon={
            <InstallmentIcon />
          }
        >
          <StatRow
            label="Pending"
            value={
              pendingInstallments
            }
            status="warning"
          />

          <StatRow
            label="Partially paid"
            value={
              partiallyPaidInstallments
            }
            status="info"
          />

          <StatRow
            label="Paid"
            value={
              paidInstallments
            }
            status="success"
          />

          <StatRow
            label="Overdue"
            value={
              overdueInstallments
            }
            status="danger"
          />
        </ManagementPanel>
      </section>

      <section
        className={
          styles.paymentPanel
        }
      >
        <div>
          <span
            className={
              styles.sectionEyebrow
            }
          >
            PAYMENTS
          </span>

          <h2>
            Payment verification
          </h2>

          <p>
            Review DESIRE CREDIT
            commitment and installment
            payment proofs through the
            existing DESIRE payment
            verification system.
          </p>
        </div>

        <Link
          href="/admin/payments"
          className={
            styles.darkAction
          }
        >
          Review payments
          <ArrowIcon />
        </Link>
      </section>
    </div>
  );
}

function OverviewCard({
  label,
  value,
  detail,
  icon,
  href,
}) {
  return (
    <Link
      href={href}
      className={
        styles.overviewCard
      }
    >
      <div
        className={
          styles.overviewTop
        }
      >
        <span>
          {label}
        </span>

        <div
          className={
            styles.overviewIcon
          }
        >
          {icon}
        </div>
      </div>

      <strong>
        {value}
      </strong>

      <div
        className={
          styles.overviewBottom
        }
      >
        <span>
          {detail}
        </span>

        <ArrowIcon />
      </div>
    </Link>
  );
}

function FinancialItem({
  label,
  value,
  alert = false,
}) {
  return (
    <div
      className={`${styles.financialItem} ${
        alert
          ? styles.financialAlert
          : ''
      }`}
    >
      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>
    </div>
  );
}

function ManagementPanel({
  eyebrow,
  title,
  description,
  href,
  action,
  icon,
  children,
}) {
  return (
    <article
      className={
        styles.managementPanel
      }
    >
      <div
        className={
          styles.managementHeader
        }
      >
        <div>
          <span
            className={
              styles.sectionEyebrow
            }
          >
            {eyebrow}
          </span>

          <h2>
            {title}
          </h2>
        </div>

        <div
          className={
            styles.managementIcon
          }
        >
          {icon}
        </div>
      </div>

      <p
        className={
          styles.managementDescription
        }
      >
        {description}
      </p>

      <div
        className={
          styles.statList
        }
      >
        {children}
      </div>

      <Link
        href={href}
        className={
          styles.panelAction
        }
      >
        {action}
        <ArrowIcon />
      </Link>
    </article>
  );
}

function StatRow({
  label,
  value,
  status = 'neutral',
}) {
  const statusClass =
    status === 'success'
      ? styles.dotSuccess
      : status === 'warning'
        ? styles.dotWarning
        : status === 'danger'
          ? styles.dotDanger
          : status === 'info'
            ? styles.dotInfo
            : styles.dotNeutral;

  return (
    <div
      className={
        styles.statRow
      }
    >
      <div>
        <span
          className={`${styles.statDot} ${statusClass}`}
        />

        <span>
          {label}
        </span>
      </div>

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

function AccountIcon() {
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
      <path d="M4 21c1-4 4-7 8-7s7 3 8 7" />
    </svg>
  );
}

function PurchaseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M4 7h16v14H4V7Z" />
      <path d="M8 7a4 4 0 0 1 8 0" />
      <path d="M8 13h8" />
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
        x="3"
        y="5"
        width="18"
        height="14"
        rx="1"
      />
      <path d="M3 9h18" />
      <path d="M7 14h3" />
      <path d="M14 14h3" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M12 3 2.5 20h19L12 3Z" />
      <path d="M12 9v5" />
      <path d="M12 17h.01" />
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
      <path d="M8 9h6a2 2 0 0 1 0 4h-4a2 2 0 0 0 0 4h6" />
      <path d="M12 6v12" />
    </svg>
  );
}