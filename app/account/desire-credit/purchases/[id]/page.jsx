'use client';

import Link from 'next/link';
import {
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useParams } from 'next/navigation';

import {
  CREDIT_INSTALLMENT_PLAN_OPTIONS,
  getMyCreditPurchase,
} from '@/services/desire-credit.service';

import styles from './purchase-details.module.css';

function formatNaira(value) {
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
    return 'Not available';
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return 'Not available';
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

function getInstallmentPlanLabel(
  value,
) {
  if (!value) {
    return 'Not selected';
  }

  const option =
    CREDIT_INSTALLMENT_PLAN_OPTIONS.find(
      (item) =>
        item.value === value,
    );

  return (
    option?.label ||
    formatStatus(value)
  );
}

function normalizePurchase(
  response,
) {
  if (
    !response ||
    typeof response !==
      'object'
  ) {
    return null;
  }

  return (
    response.purchase ||
    response.creditPurchase ||
    response
  );
}

function getInstallments(
  purchase,
) {
  if (
    Array.isArray(
      purchase?.installments,
    )
  ) {
    return purchase.installments;
  }

  if (
    Array.isArray(
      purchase?.installmentSchedule,
    )
  ) {
    return purchase.installmentSchedule;
  }

  return [];
}

export default function CreditPurchaseDetailsPage() {
  const params = useParams();

 const purchaseId =
  Array.isArray(
    params?.id,
  )
    ? params.id[0]
    : params?.id;

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    purchase,
    setPurchase,
  ] = useState(null);

  const [
    error,
    setError,
  ] = useState('');

  useEffect(() => {
    let active = true;

    async function loadPurchase() {
      if (!purchaseId) {
        return;
      }

      setLoading(true);
      setError('');

      try {
        const response =
          await getMyCreditPurchase(
            purchaseId,
          );

        if (!active) {
          return;
        }

        const normalized =
          normalizePurchase(
            response,
          );

        if (
          !normalized ||
          !normalized._id
        ) {
          throw new Error(
            'DESIRE CREDIT purchase was not found.',
          );
        }

        setPurchase(
          normalized,
        );
      } catch (requestError) {
        if (!active) {
          return;
        }

        setPurchase(null);

        setError(
          requestError?.message ||
            'Unable to load this DESIRE CREDIT purchase.',
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadPurchase();

    return () => {
      active = false;
    };
  }, [purchaseId]);

  const installments =
    useMemo(
      () =>
        getInstallments(
          purchase,
        ).sort(
          (a, b) =>
            Number(
              a.installmentNumber ||
                0,
            ) -
            Number(
              b.installmentNumber ||
                0,
            ),
        ),
      [purchase],
    );

  if (loading) {
    return (
      <main
        className={
          styles.page
        }
      >
        <div
          className={
            styles.loadingState
          }
        >
          <span>
            DESIRE CREDIT
          </span>

          <h1>
            Loading purchase...
          </h1>

          <p>
            Retrieving your
            purchase and repayment
            schedule.
          </p>
        </div>
      </main>
    );
  }

  if (
    error ||
    !purchase
  ) {
    return (
      <main
        className={
          styles.page
        }
      >
        <div
          className={
            styles.backRow
          }
        >
          <Link href="/account/desire-credit">
            <ArrowLeftIcon />
            DESIRE CREDIT
          </Link>
        </div>

        <section
          className={
            styles.errorState
          }
        >
          <span>
            DESIRE CREDIT
          </span>

          <h1>
            Purchase unavailable
          </h1>

          <p>
            {error ||
              'This purchase could not be loaded.'}
          </p>

          <Link
            href="/account/desire-credit"
            className={
              styles.primaryButton
            }
          >
            Back to credit account
          </Link>
        </section>
      </main>
    );
  }

  const order =
    purchase.order &&
    typeof purchase.order ===
      'object'
      ? purchase.order
      : null;

  const purchaseNumber =
    order?.orderNumber ||
    `#${purchase._id
      .slice(-8)
      .toUpperCase()}`;

  const paidInstallments =
    installments.filter(
      (installment) =>
        installment.status ===
        'PAID',
    ).length;

  return (
    <main
      className={
        styles.page
      }
    >
      <div
        className={
          styles.backRow
        }
      >
        <Link href="/account/desire-credit">
          <ArrowLeftIcon />
          Back to DESIRE CREDIT
        </Link>
      </div>

      <section
        className={
          styles.hero
        }
      >
        <div
          className={
            styles.heroTop
          }
        >
          <div>
            <span
              className={
                styles.eyebrowLight
              }
            >
              DESIRE CREDIT PURCHASE
            </span>

            <h1>
              {purchaseNumber}
            </h1>

            <p>
              Review your purchase,
              credit balance and
              installment repayment
              schedule.
            </p>
          </div>

          <span
            className={
              styles.statusBadge
            }
          >
            {formatStatus(
              purchase.status,
            )}
          </span>
        </div>

        <div
          className={
            styles.heroBalances
          }
        >
          <div
            className={
              styles.mainBalance
            }
          >
            <span>
              Outstanding
            </span>

            <strong>
              {formatNaira(
                purchase
                  .outstandingBalance,
              )}
            </strong>
          </div>

          <div>
            <span>
              Financed
            </span>

            <strong>
              {formatNaira(
                purchase
                  .financedAmount,
              )}
            </strong>
          </div>

          <div>
            <span>
              Repaid
            </span>

            <strong>
              {formatNaira(
                purchase
                  .amountRepaid,
              )}
            </strong>
          </div>
        </div>
      </section>

      <section
        className={
          styles.summaryGrid
        }
      >
        <SummaryItem
          label="Order amount"
          value={formatNaira(
            purchase.orderAmount,
          )}
        />

        <SummaryItem
          label="Commitment payment"
          value={formatNaira(
            purchase
              .commitmentPayment,
          )}
        />

        <SummaryItem
          label="Repayment plan"
          value={getInstallmentPlanLabel(
            purchase
              .installmentPlan,
          )}
        />

        <SummaryItem
          label="Purchase status"
          value={formatStatus(
            purchase.status,
          )}
        />

        <SummaryItem
          label="Purchase date"
          value={formatDate(
            purchase.createdAt,
          )}
        />

        <SummaryItem
          label="Final payment due"
          value={formatDate(
            purchase
              .finalPaymentDueDate,
          )}
        />
      </section>

      <section
        className={
          styles.scheduleSection
        }
      >
        <div
          className={
            styles.sectionHeader
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

            <h2>
              Your installments
            </h2>

            <p>
              View the amount,
              balance, due date and
              current status of
              each repayment.
            </p>
          </div>

          <div
            className={
              styles.scheduleProgress
            }
          >
            <span>
              Payments completed
            </span>

            <strong>
              {paidInstallments}
              {' / '}
              {installments.length}
            </strong>
          </div>
        </div>

        {installments.length ===
        0 ? (
          <div
            className={
              styles.emptySchedule
            }
          >
            <h3>
              Repayment schedule
              not available yet.
            </h3>

            <p>
              Your installments
              will appear here once
              the DESIRE CREDIT
              purchase has been
              activated.
            </p>
          </div>
        ) : (
          <div
            className={
              styles.installmentList
            }
          >
            {installments.map(
              (installment) => {
                const canPay =
                  [
                    'PENDING',
                    'PARTIALLY_PAID',
                    'OVERDUE',
                  ].includes(
                    installment.status,
                  ) &&
                  Number(
                    installment
                      .outstandingAmount ||
                      0,
                  ) > 0;

                return (
                  <article
                    key={
                      installment._id
                    }
                    className={
                      styles.installmentCard
                    }
                  >
                    <div
                      className={
                        styles.installmentNumber
                      }
                    >
                      <span>
                        Installment
                      </span>

                      <strong>
                        {String(
                          installment
                            .installmentNumber ||
                            0,
                        ).padStart(
                          2,
                          '0',
                        )}
                      </strong>
                    </div>

                    <div
                      className={
                        styles.installmentInfo
                      }
                    >
                      <div>
                        <span>
                          Amount
                        </span>

                        <strong>
                          {formatNaira(
                            installment
                              .amount,
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Paid
                        </span>

                        <strong>
                          {formatNaira(
                            installment
                              .amountPaid,
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Outstanding
                        </span>

                        <strong>
                          {formatNaira(
                            installment
                              .outstandingAmount,
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Due date
                        </span>

                        <strong>
                          {formatDate(
                            installment
                              .dueDate,
                          )}
                        </strong>
                      </div>
                    </div>

                    <div
                      className={
                        styles.installmentAction
                      }
                    >
                      <span
                        className={
                          styles.installmentStatus
                        }
                      >
                        {formatStatus(
                          installment.status,
                        )}
                      </span>

                      {canPay ? (
                        <Link
                          href={`/account/desire-credit/installments/${installment._id}`}
                        >
                          View payment
                          <ArrowIcon />
                        </Link>
                      ) : (
                        <span
                          className={
                            styles.completedText
                          }
                        >
                          {installment.status ===
                          'PAID'
                            ? 'Paid'
                            : formatStatus(
                                installment.status,
                              )}
                        </span>
                      )}
                    </div>
                  </article>
                );
              },
            )}
          </div>
        )}
      </section>
    </main>
  );
}

function SummaryItem({
  label,
  value,
}) {
  return (
    <article
      className={
        styles.summaryItem
      }
    >
      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>
    </article>
  );
}

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M5 12h14M14 7l5 5-5 5" />
    </svg>
  );
}

function ArrowLeftIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M19 12H5M10 7l-5 5 5 5" />
    </svg>
  );
}