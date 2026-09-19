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

import {
  getAdminCreditPurchase,
} from '@/services/desire-credit.service';

import styles from './purchase-details.module.css';

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

  return formatStatus(value);
}

function normalizePurchase(
  response,
) {
  if (!response) {
    return null;
  }

  if (
    response?.purchase &&
    typeof response.purchase ===
      'object'
  ) {
    return response.purchase;
  }

  if (
    response?.creditPurchase &&
    typeof response.creditPurchase ===
      'object'
  ) {
    return response.creditPurchase;
  }

  if (
    response?.data?.purchase &&
    typeof response.data.purchase ===
      'object'
  ) {
    return response.data.purchase;
  }

  if (
    response?.data?.creditPurchase &&
    typeof response.data.creditPurchase ===
      'object'
  ) {
    return response.data.creditPurchase;
  }

  if (
    response?.data &&
    typeof response.data ===
      'object'
  ) {
    return response.data;
  }

  if (
    typeof response ===
      'object'
  ) {
    return response;
  }

  return null;
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

  const name = [
    customer.firstName,
    customer.lastName,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    name ||
    'Customer'
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

function getCreditAccount(
  purchase,
) {
  if (
    purchase?.creditAccount &&
    typeof purchase.creditAccount ===
      'object'
  ) {
    return purchase.creditAccount;
  }

  return {};
}

function getPayment(purchase) {
  if (
    purchase?.commitmentPayment &&
    typeof purchase
      .commitmentPayment ===
      'object'
  ) {
    return purchase
      .commitmentPayment;
  }

  return {};
}

function getStatusClass(status) {
  switch (
    String(
      status || '',
    ).toUpperCase()
  ) {
    case 'ACTIVE':
      return styles.statusActive;

    case 'FULLY_PAID':
    case 'COMPLETED':
    case 'PAID':
      return styles.statusCompleted;

    case 'OVERDUE':
      return styles.statusOverdue;

    case 'DEFAULTED':
    case 'FAILED':
      return styles.statusDefaulted;

    case 'CANCELLED':
      return styles.statusCancelled;

    default:
      return styles.statusPending;
  }
}

export default function AdminCreditPurchaseDetailsPage() {
  const params = useParams();

  const purchaseId =
    Array.isArray(
      params?.purchaseId,
    )
      ? params.purchaseId[0]
      : params?.purchaseId;

  const [
    purchase,
    setPurchase,
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

  const loadPurchase =
    useCallback(
      async (
        isRefresh = false,
      ) => {
        if (!purchaseId) {
          setError(
            'Credit purchase ID is missing.',
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
            await getAdminCreditPurchase(
              purchaseId,
            );

          const normalized =
            normalizePurchase(
              response,
            );

          if (!normalized) {
            throw new Error(
              'Credit purchase could not be found.',
            );
          }

          setPurchase(
            normalized,
          );
        } catch (loadError) {
          console.error(
            'Unable to load DESIRE CREDIT purchase:',
            loadError,
          );

          setError(
            loadError?.message ||
              'Unable to load credit purchase.',
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [purchaseId],
    );

  useEffect(() => {
    loadPurchase();
  }, [loadPurchase]);

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
            styles.loadingPanel
          }
        />
      </div>
    );
  }

  if (
    error &&
    !purchase
  ) {
    return (
      <div
        className={
          styles.page
        }
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

          <Link href="/admin/desire-credit/purchases">
            Purchases
          </Link>

          <span>/</span>

          <strong>
            Purchase
          </strong>
        </div>

        <section
          className={
            styles.errorState
          }
        >
          <div
            className={
              styles.errorIcon
            }
          >
            <PurchaseIcon />
          </div>

          <h1>
            Unable to load purchase
          </h1>

          <p>{error}</p>

          <div
            className={
              styles.errorActions
            }
          >
            <button
              type="button"
              onClick={() =>
                loadPurchase()
              }
            >
              Try again
            </button>

            <Link href="/admin/desire-credit/purchases">
              Back to purchases
            </Link>
          </div>
        </section>
      </div>
    );
  }

  if (!purchase) {
    return null;
  }

  const customer =
    getCustomer(purchase);

  const order =
    getOrder(purchase);

  const creditAccount =
    getCreditAccount(
      purchase,
    );

  const payment =
    getPayment(purchase);

  const purchaseStatus =
    purchase?.status ||
    'PENDING_COMMITMENT_PAYMENT';

  const paymentStatus =
    payment?.status ||
    (purchase
      ?.commitmentPaymentPaid
      ? 'PAID'
      : 'PENDING');

  const orderAmount =
    Number(
      purchase?.orderAmount ??
        order?.totalAmount ??
        0,
    );

  const commitmentAmount =
    Number(
      purchase
        ?.commitmentPaymentAmount ??
        0,
    );

  const financedAmount =
    Number(
      purchase
        ?.financedAmount ??
        0,
    );

  const amountRepaid =
    Number(
      purchase
        ?.amountRepaid ??
        0,
    );

  const outstandingBalance =
    Number(
      purchase
        ?.outstandingBalance ??
        0,
    );

  const progress =
    financedAmount > 0
      ? Math.min(
          100,
          Math.max(
            0,
            (
              amountRepaid /
              financedAmount
            ) * 100,
          ),
        )
      : 0;

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

        <Link href="/admin/desire-credit/purchases">
          Purchases
        </Link>

        <span>/</span>

        <strong>
          Purchase details
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
            DESIRE CREDIT PURCHASE
          </span>

          <div
            className={
              styles.titleRow
            }
          >
            <h1>
              {order
                ?.orderNumber ||
                'Credit purchase'}
            </h1>

            <StatusBadge
              status={
                purchaseStatus
              }
            />
          </div>

          <p>
            Review the financed
            order, customer,
            commitment payment and
            repayment position for
            this purchase.
          </p>

          <span
            className={
              styles.purchaseId
            }
          >
            Purchase ID:{' '}
            {purchase?._id ||
              purchase?.id ||
              purchaseId}
          </span>
        </div>

        <div
          className={
            styles.headerActions
          }
        >
          <Link
            href="/admin/desire-credit/purchases"
            className={
              styles.secondaryButton
            }
          >
            <BackIcon />

            Back
          </Link>

          <button
            type="button"
            className={
              styles.refreshButton
            }
            disabled={refreshing}
            onClick={() =>
              loadPurchase(true)
            }
          >
            <RefreshIcon />

            {refreshing
              ? 'Refreshing...'
              : 'Refresh'}
          </button>
        </div>
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
              Refresh failed
            </strong>

            <p>{error}</p>
          </div>

          <button
            type="button"
            onClick={() =>
              loadPurchase(true)
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
          label="Order amount"
          value={formatCurrency(
            orderAmount,
          )}
        />

        <StatCard
          label="Financed amount"
          value={formatCurrency(
            financedAmount,
          )}
        />

        <StatCard
          label="Amount repaid"
          value={formatCurrency(
            amountRepaid,
          )}
        />

        <StatCard
          label="Outstanding"
          value={formatCurrency(
            outstandingBalance,
          )}
        />
      </section>

      <section
        className={
          styles.progressPanel
        }
      >
        <div
          className={
            styles.progressHeader
          }
        >
          <div>
            <span
              className={
                styles.eyebrow
              }
            >
              REPAYMENT
            </span>

            <h2>
              Repayment progress
            </h2>
          </div>

          <strong>
            {progress.toFixed(0)}%
          </strong>
        </div>

        <div
          className={
            styles.progressTrack
          }
        >
          <div
            className={
              styles.progressFill
            }
            style={{
              width: `${progress}%`,
            }}
          />
        </div>

        <div
          className={
            styles.progressAmounts
          }
        >
          <span>
            Repaid{' '}
            <strong>
              {formatCurrency(
                amountRepaid,
              )}
            </strong>
          </span>

          <span>
            Outstanding{' '}
            <strong>
              {formatCurrency(
                outstandingBalance,
              )}
            </strong>
          </span>
        </div>
      </section>

      <div
        className={
          styles.mainGrid
        }
      >
        <section
          className={
            styles.panel
          }
        >
          <PanelHeader
            eyebrow="PURCHASE"
            title="Financing details"
          />

          <div
            className={
              styles.detailGrid
            }
          >
            <Detail
              label="Order amount"
              value={formatCurrency(
                orderAmount,
              )}
            />

            <Detail
              label="Commitment payment"
              value={formatCurrency(
                commitmentAmount,
              )}
            />

            <Detail
              label="Financed amount"
              value={formatCurrency(
                financedAmount,
              )}
            />

            <Detail
              label="Amount repaid"
              value={formatCurrency(
                amountRepaid,
              )}
            />

            <Detail
              label="Outstanding balance"
              value={formatCurrency(
                outstandingBalance,
              )}
            />

            <Detail
              label="Installment amount"
              value={formatCurrency(
                purchase
                  ?.installmentAmount,
              )}
            />

            <Detail
              label="Installment plan"
              value={formatPlan(
                purchase
                  ?.installmentPlan,
              )}
            />

            <Detail
              label="Purchase status"
              value={
                <StatusBadge
                  status={
                    purchaseStatus
                  }
                />
              }
            />
          </div>
        </section>

        <section
          className={
            styles.panel
          }
        >
          <PanelHeader
            eyebrow="CUSTOMER"
            title="Customer details"
          />

          <div
            className={
              styles.customerCard
            }
          >
            <div
              className={
                styles.avatar
              }
            >
              {getCustomerName(
                purchase,
              )
                .charAt(0)
                .toUpperCase()}
            </div>

            <div>
              <strong>
                {getCustomerName(
                  purchase,
                )}
              </strong>

              <span>
                {customer?.email ||
                  'No email'}
              </span>
            </div>
          </div>

          <div
            className={
              styles.detailList
            }
          >
            <ListDetail
              label="Email"
              value={
                customer?.email ||
                '—'
              }
            />

            <ListDetail
              label="Phone"
              value={
                customer?.phone ||
                '—'
              }
            />

            <ListDetail
              label="Customer ID"
              value={
                customer?._id ||
                customer?.id ||
                '—'
              }
              mono
            />
          </div>
        </section>
      </div>

      <div
        className={
          styles.mainGrid
        }
      >
        <section
          className={
            styles.panel
          }
        >
          <PanelHeader
            eyebrow="ORDER"
            title="Order information"
          />

          <div
            className={
              styles.detailList
            }
          >
            <ListDetail
              label="Order number"
              value={
                order
                  ?.orderNumber ||
                '—'
              }
            />

            <ListDetail
              label="Order total"
              value={formatCurrency(
                order
                  ?.totalAmount ??
                  orderAmount,
              )}
            />

            <ListDetail
              label="Order status"
              value={formatStatus(
                order?.status,
              )}
            />

            <ListDetail
              label="Payment status"
              value={formatStatus(
                order
                  ?.paymentStatus,
              )}
            />

            <ListDetail
              label="Inventory secured"
              value={
                order
                  ?.inventoryDeducted
                  ? 'Yes'
                  : 'No'
              }
            />

            <ListDetail
              label="Created"
              value={formatDate(
                order?.createdAt,
              )}
            />

            <ListDetail
              label="Order ID"
              value={
                order?._id ||
                order?.id ||
                (typeof purchase
                  ?.order ===
                  'string'
                  ? purchase.order
                  : '—')
              }
              mono
            />
          </div>
        </section>

        <section
          className={
            styles.panel
          }
        >
          <PanelHeader
            eyebrow="CREDIT ACCOUNT"
            title="Credit account"
          />

          <div
            className={
              styles.detailList
            }
          >
            <ListDetail
              label="Credit limit"
              value={formatCurrency(
                creditAccount
                  ?.creditLimit,
              )}
            />

            <ListDetail
              label="Used credit"
              value={formatCurrency(
                creditAccount
                  ?.usedCredit,
              )}
            />

            <ListDetail
              label="Available credit"
              value={formatCurrency(
                creditAccount
                  ?.availableCredit,
              )}
            />

            <ListDetail
              label="Account status"
              value={formatStatus(
                creditAccount
                  ?.status,
              )}
            />

            <ListDetail
              label="Outstanding"
              value={formatCurrency(
                creditAccount
                  ?.outstandingBalance,
              )}
            />

            <ListDetail
              label="Account ID"
              value={
                creditAccount
                  ?._id ||
                creditAccount?.id ||
                (typeof purchase
                  ?.creditAccount ===
                  'string'
                  ? purchase
                      .creditAccount
                  : '—')
              }
              mono
            />
          </div>

          {(creditAccount?._id ||
            creditAccount?.id) && (
            <Link
              href={`/admin/desire-credit/accounts/${
                creditAccount._id ||
                creditAccount.id
              }`}
              className={
                styles.panelAction
              }
            >
              View credit account

              <ArrowIcon />
            </Link>
          )}
        </section>
      </div>

      <section
        className={
          styles.panel
        }
      >
        <PanelHeader
          eyebrow="COMMITMENT PAYMENT"
          title="Commitment payment"
        />

        <div
          className={
            styles.paymentHeader
          }
        >
          <div>
            <span>
              Payment status
            </span>

            <StatusBadge
              status={
                paymentStatus
              }
            />
          </div>

          <strong>
            {formatCurrency(
              payment?.amount ??
                commitmentAmount,
            )}
          </strong>
        </div>

        <div
          className={
            styles.detailGrid
          }
        >
          <Detail
            label="Reference"
            value={
              payment
                ?.reference ||
              purchase
                ?.commitmentPaymentReference ||
              '—'
            }
          />

          <Detail
            label="Transfer reference"
            value={
              payment
                ?.transferReference ||
              '—'
            }
          />

          <Detail
            label="Sender"
            value={
              payment
                ?.senderName ||
              '—'
            }
          />

          <Detail
            label="Purpose"
            value={formatStatus(
              payment?.purpose,
            )}
          />

          <Detail
            label="Paid at"
            value={formatDate(
              payment?.paidAt ??
                purchase
                  ?.commitmentPaymentPaidAt,
            )}
          />

          <Detail
            label="Verified at"
            value={formatDate(
              payment?.verifiedAt,
            )}
          />
        </div>
      </section>

      <section
        className={
          styles.panel
        }
      >
        <PanelHeader
          eyebrow="SCHEDULE"
          title="Purchase timeline"
        />

        <div
          className={
            styles.timeline
          }
        >
          <TimelineItem
            label="Purchase created"
            value={formatDate(
              purchase?.createdAt,
            )}
            active
          />

          <TimelineItem
            label="Commitment payment"
            value={
              purchase
                ?.commitmentPaymentPaid
                ? formatDate(
                    purchase
                      ?.commitmentPaymentPaidAt,
                  )
                : 'Pending'
            }
            active={
              purchase
                ?.commitmentPaymentPaid
            }
          />

          <TimelineItem
            label="Activated"
            value={formatDate(
              purchase?.activatedAt,
            )}
            active={
              Boolean(
                purchase?.activatedAt,
              )
            }
          />

          <TimelineItem
            label="First payment due"
            value={formatDate(
              purchase
                ?.firstPaymentDueDate,
            )}
            active={
              Boolean(
                purchase
                  ?.firstPaymentDueDate,
              )
            }
          />

          <TimelineItem
            label="Final payment due"
            value={formatDate(
              purchase
                ?.finalPaymentDueDate,
            )}
            active={
              Boolean(
                purchase
                  ?.finalPaymentDueDate,
              )
            }
          />

          <TimelineItem
            label="Fully paid"
            value={formatDate(
              purchase?.fullyPaidAt,
            )}
            active={
              Boolean(
                purchase
                  ?.fullyPaidAt,
              )
            }
          />
        </div>
      </section>

      {(purchase?.statusReason ||
        purchase?.notes) && (
        <section
          className={
            styles.panel
          }
        >
          <PanelHeader
            eyebrow="NOTES"
            title="Purchase notes"
          />

          <div
            className={
              styles.notesGrid
            }
          >
            {purchase
              ?.statusReason && (
              <div
                className={
                  styles.note
                }
              >
                <span>
                  Status reason
                </span>

                <p>
                  {
                    purchase
                      .statusReason
                  }
                </p>
              </div>
            )}

            {purchase?.notes && (
              <div
                className={
                  styles.note
                }
              >
                <span>
                  Purchase notes
                </span>

                <p>
                  {purchase.notes}
                </p>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

function PanelHeader({
  eyebrow,
  title,
}) {
  return (
    <div
      className={
        styles.panelHeader
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

      <strong>{value}</strong>
    </div>
  );
}

function ListDetail({
  label,
  value,
  mono = false,
}) {
  return (
    <div
      className={
        styles.listDetail
      }
    >
      <span>{label}</span>

      <strong
        className={
          mono
            ? styles.mono
            : ''
        }
      >
        {value}
      </strong>
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

function TimelineItem({
  label,
  value,
  active = false,
}) {
  return (
    <div
      className={
        styles.timelineItem
      }
    >
      <div
        className={`${styles.timelineDot} ${
          active
            ? styles.timelineDotActive
            : ''
        }`}
      />

      <div>
        <strong>
          {label}
        </strong>

        <span>
          {value || '—'}
        </span>
      </div>
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

function BackIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M19 12H5" />
      <path d="m10 17-5-5 5-5" />
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