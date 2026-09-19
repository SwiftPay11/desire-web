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
  getAdminCreditInstallment,
} from '@/services/desire-credit.service';

import styles from './installment-details.module.css';

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

function normalizeInstallment(
  response,
) {
  if (!response) {
    return null;
  }

  if (
    response?.installment &&
    typeof response.installment ===
      'object'
  ) {
    return response.installment;
  }

  if (
    response?.data?.installment &&
    typeof response.data.installment ===
      'object'
  ) {
    return response.data.installment;
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

function getOrder(
  installment,
) {
  if (
    installment?.order &&
    typeof installment.order ===
      'object'
  ) {
    return installment.order;
  }

  return {};
}

function getPurchase(
  installment,
) {
  if (
    installment?.creditPurchase &&
    typeof installment.creditPurchase ===
      'object'
  ) {
    return installment.creditPurchase;
  }

  return {};
}

function getCreditAccount(
  installment,
) {
  if (
    installment?.creditAccount &&
    typeof installment.creditAccount ===
      'object'
  ) {
    return installment.creditAccount;
  }

  return {};
}

function getPayments(
  installment,
) {
  return Array.isArray(
    installment?.payments,
  )
    ? installment.payments.filter(
        (payment) =>
          payment &&
          typeof payment ===
            'object',
      )
    : [];
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

    default:
      return styles.statusPending;
  }
}

export default function AdminInstallmentDetailsPage() {
  const params = useParams();

  const installmentId =
    Array.isArray(
      params?.installmentId,
    )
      ? params.installmentId[0]
      : params?.installmentId;

  const [
    installment,
    setInstallment,
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

  const loadInstallment =
    useCallback(
      async (
        isRefresh = false,
      ) => {
        if (!installmentId) {
          setError(
            'Installment ID is missing.',
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
            await getAdminCreditInstallment(
              installmentId,
            );

          const normalized =
            normalizeInstallment(
              response,
            );

          if (!normalized) {
            throw new Error(
              'Installment could not be found.',
            );
          }

          setInstallment(
            normalized,
          );
        } catch (loadError) {
          console.error(
            'Unable to load DESIRE CREDIT installment:',
            loadError,
          );

          setError(
            loadError?.message ||
              'Unable to load installment.',
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [installmentId],
    );

  useEffect(() => {
    loadInstallment();
  }, [loadInstallment]);

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
    !installment
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
          <Link href="/admin/desire-credit">
            DESIRE CREDIT
          </Link>

          <span>/</span>

          <Link href="/admin/desire-credit/installments">
            Installments
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
          <h1>
            Unable to load installment
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
                loadInstallment()
              }
            >
              Try again
            </button>

            <Link href="/admin/desire-credit/installments">
              Back to installments
            </Link>
          </div>
        </section>
      </div>
    );
  }

  if (!installment) {
    return null;
  }

  const customer =
    getCustomer(installment);

  const order =
    getOrder(installment);

  const purchase =
    getPurchase(installment);

  const creditAccount =
    getCreditAccount(
      installment,
    );

  const payments =
    getPayments(installment);

  const amount =
    Number(
      installment?.amount ||
        0,
    );

  const amountPaid =
    Number(
      installment?.amountPaid ||
        0,
    );

  const outstanding =
    Number(
      installment
        ?.outstandingAmount ||
        0,
    );

  const lateFee =
    Number(
      installment?.lateFee ||
        0,
    );

  const progress =
    amount > 0
      ? Math.min(
          100,
          Math.max(
            0,
            (amountPaid /
              amount) *
              100,
          ),
        )
      : 0;

  const status =
    installment?.status ||
    'PENDING';

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

        <Link href="/admin/desire-credit/installments">
          Installments
        </Link>

        <span>/</span>

        <strong>
          Installment details
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
            REPAYMENT SCHEDULE
          </span>

          <div
            className={
              styles.titleRow
            }
          >
            <h1>
              Installment{' '}
              {installment
                ?.installmentNumber ||
                '—'}
              {' of '}
              {installment
                ?.totalInstallments ||
                '—'}
            </h1>

            <StatusBadge
              status={status}
            />
          </div>

          <p>
            Review this DESIRE
            CREDIT repayment,
            customer information,
            payment history and
            related credit
            purchase.
          </p>

          <span
            className={
              styles.recordId
            }
          >
            Installment ID:{' '}
            {installment?._id ||
              installment?.id ||
              installmentId}
          </span>
        </div>

        <div
          className={
            styles.headerActions
          }
        >
          <Link
            href="/admin/desire-credit/installments"
            className={
              styles.secondaryButton
            }
          >
            Back
          </Link>

          <button
            type="button"
            className={
              styles.refreshButton
            }
            disabled={refreshing}
            onClick={() =>
              loadInstallment(true)
            }
          >
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
              loadInstallment(true)
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
          label="Installment amount"
          value={formatCurrency(
            amount,
          )}
        />

        <StatCard
          label="Amount paid"
          value={formatCurrency(
            amountPaid,
          )}
        />

        <StatCard
          label="Outstanding"
          value={formatCurrency(
            outstanding,
          )}
        />

        <StatCard
          label="Late fee"
          value={formatCurrency(
            lateFee,
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
                styles.darkEyebrow
              }
            >
              PAYMENT PROGRESS
            </span>

            <h2>
              Installment repayment
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
            styles.progressFooter
          }
        >
          <span>
            Received{' '}
            <strong>
              {formatCurrency(
                amountPaid,
              )}
            </strong>
          </span>

          <span>
            Remaining{' '}
            <strong>
              {formatCurrency(
                outstanding,
              )}
            </strong>
          </span>
        </div>
      </section>

      <div
        className={
          styles.twoColumn
        }
      >
        <section
          className={
            styles.panel
          }
        >
          <PanelHeader
            eyebrow="INSTALLMENT"
            title="Repayment details"
          />

          <div
            className={
              styles.detailGrid
            }
          >
            <Detail
              label="Installment"
              value={`${
                installment
                  ?.installmentNumber ||
                '—'
              } of ${
                installment
                  ?.totalInstallments ||
                '—'
              }`}
            />

            <Detail
              label="Status"
              value={
                <StatusBadge
                  status={status}
                />
              }
            />

            <Detail
              label="Amount"
              value={formatCurrency(
                amount,
              )}
            />

            <Detail
              label="Amount paid"
              value={formatCurrency(
                amountPaid,
              )}
            />

            <Detail
              label="Outstanding"
              value={formatCurrency(
                outstanding,
              )}
            />

            <Detail
              label="Late fee"
              value={formatCurrency(
                lateFee,
              )}
            />

            <Detail
              label="Due date"
              value={formatDate(
                installment
                  ?.dueDate,
              )}
            />

            <Detail
              label="Last payment reference"
              value={
                installment
                  ?.lastPaymentReference ||
                '—'
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
                installment,
              )
                .charAt(0)
                .toUpperCase()}
            </div>

            <div>
              <strong>
                {getCustomerName(
                  installment,
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
          styles.twoColumn
        }
      >
        <section
          className={
            styles.panel
          }
        >
          <PanelHeader
            eyebrow="PURCHASE"
            title="Credit purchase"
          />

          <div
            className={
              styles.detailList
            }
          >
            <ListDetail
              label="Order amount"
              value={formatCurrency(
                purchase
                  ?.orderAmount,
              )}
            />

            <ListDetail
              label="Financed amount"
              value={formatCurrency(
                purchase
                  ?.financedAmount,
              )}
            />

            <ListDetail
              label="Purchase repaid"
              value={formatCurrency(
                purchase
                  ?.amountRepaid,
              )}
            />

            <ListDetail
              label="Purchase outstanding"
              value={formatCurrency(
                purchase
                  ?.outstandingBalance,
              )}
            />

            <ListDetail
              label="Plan"
              value={formatStatus(
                purchase
                  ?.installmentPlan,
              )}
            />

            <ListDetail
              label="Purchase status"
              value={formatStatus(
                purchase?.status,
              )}
            />
          </div>

          {(purchase?._id ||
            purchase?.id) && (
            <Link
              href={`/admin/desire-credit/purchases/${
                purchase._id ||
                purchase.id
              }`}
              className={
                styles.panelAction
              }
            >
              View credit purchase
              <span>→</span>
            </Link>
          )}
        </section>

        <section
          className={
            styles.panel
          }
        >
          <PanelHeader
            eyebrow="ORDER"
            title="Related order"
          />

          <div
            className={
              styles.detailList
            }
          >
            <ListDetail
              label="Order number"
              value={
                order?.orderNumber ||
                '—'
              }
            />

            <ListDetail
              label="Order total"
              value={formatCurrency(
                order
                  ?.totalAmount,
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
                '—'
              }
              mono
            />
          </div>
        </section>
      </div>

      <section
        className={
          styles.panel
        }
      >
        <PanelHeader
          eyebrow="PAYMENTS"
          title="Installment payment history"
        />

        {payments.length === 0 ? (
          <div
            className={
              styles.emptyPayments
            }
          >
            <h3>
              No verified payments
            </h3>

            <p>
              No payment has been
              applied to this
              installment yet.
            </p>
          </div>
        ) : (
          <div
            className={
              styles.paymentsList
            }
          >
            {payments.map(
              (
                payment,
                index,
              ) => (
                <article
                  key={
                    payment?._id ||
                    payment?.id ||
                    index
                  }
                  className={
                    styles.paymentCard
                  }
                >
                  <div
                    className={
                      styles.paymentTop
                    }
                  >
                    <div>
                      <span>
                        PAYMENT{' '}
                        {index + 1}
                      </span>

                      <strong>
                        {formatCurrency(
                          payment
                            ?.amount,
                        )}
                      </strong>
                    </div>

                    <PaymentBadge
                      status={
                        payment
                          ?.status
                      }
                    />
                  </div>

                  <div
                    className={
                      styles.paymentGrid
                    }
                  >
                    <Detail
                      label="Reference"
                      value={
                        payment
                          ?.reference ||
                        '—'
                      }
                    />

                    <Detail
                      label="Provider reference"
                      value={
                        payment
                          ?.providerReference ||
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
                      label="Paid"
                      value={formatDate(
                        payment
                          ?.paidAt,
                      )}
                    />

                    <Detail
                      label="Verified"
                      value={formatDate(
                        payment
                          ?.verifiedAt,
                      )}
                    />
                  </div>
                </article>
              ),
            )}
          </div>
        )}
      </section>

      <div
        className={
          styles.twoColumn
        }
      >
        <section
          className={
            styles.panel
          }
        >
          <PanelHeader
            eyebrow="CREDIT ACCOUNT"
            title="Account position"
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
              label="Outstanding"
              value={formatCurrency(
                creditAccount
                  ?.outstandingBalance,
              )}
            />

            <ListDetail
              label="Overdue balance"
              value={formatCurrency(
                creditAccount
                  ?.overdueBalance,
              )}
            />

            <ListDetail
              label="Status"
              value={formatStatus(
                creditAccount
                  ?.status,
              )}
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
              <span>→</span>
            </Link>
          )}
        </section>

        <section
          className={
            styles.panel
          }
        >
          <PanelHeader
            eyebrow="TIMELINE"
            title="Installment timeline"
          />

          <div
            className={
              styles.timeline
            }
          >
            <TimelineItem
              label="Created"
              value={formatDate(
                installment
                  ?.createdAt,
              )}
            />

            <TimelineItem
              label="First payment"
              value={formatDate(
                installment
                  ?.firstPaymentAt,
              )}
            />

            <TimelineItem
              label="Due date"
              value={formatDate(
                installment
                  ?.dueDate,
              )}
            />

            <TimelineItem
              label="Overdue"
              value={formatDate(
                installment
                  ?.overdueAt,
              )}
            />

            <TimelineItem
              label="Paid"
              value={formatDate(
                installment
                  ?.paidAt,
              )}
            />

            <TimelineItem
              label="Waived"
              value={formatDate(
                installment
                  ?.waivedAt,
              )}
            />

            <TimelineItem
              label="Cancelled"
              value={formatDate(
                installment
                  ?.cancelledAt,
              )}
            />
          </div>
        </section>
      </div>

      {installment
        ?.adminNote && (
        <section
          className={
            styles.panel
          }
        >
          <PanelHeader
            eyebrow="ADMIN NOTE"
            title="Installment note"
          />

          <div
            className={
              styles.note
            }
          >
            {
              installment
                .adminNote
            }
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

function PaymentBadge({
  status,
}) {
  const paid =
    String(
      status || '',
    ).toUpperCase() ===
    'PAID';

  return (
    <span
      className={`${styles.paymentBadge} ${
        paid
          ? styles.paymentPaid
          : styles.paymentPending
      }`}
    >
      {formatStatus(status)}
    </span>
  );
}

function TimelineItem({
  label,
  value,
}) {
  return (
    <div
      className={
        styles.timelineItem
      }
    >
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}