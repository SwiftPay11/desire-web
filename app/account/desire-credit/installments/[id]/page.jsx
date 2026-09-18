'use client';

import Link from 'next/link';
import {
  useEffect,
  useState,
} from 'react';
import { useParams } from 'next/navigation';

import {
  getMyCreditInstallment,
} from '@/services/desire-credit.service';

import styles from './installment-details.module.css';

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

function normalizeInstallment(
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
    response.installment ||
    response.creditInstallment ||
    response
  );
}

function getObjectId(value) {
  if (!value) {
    return '';
  }

  if (
    typeof value === 'string'
  ) {
    return value;
  }

  if (
    typeof value === 'object'
  ) {
    return (
      value._id ||
      value.id ||
      ''
    );
  }

  return '';
}

function getOrderNumber(
  installment,
) {
  const order =
    installment?.order &&
    typeof installment.order ===
      'object'
      ? installment.order
      : null;

  if (order?.orderNumber) {
    return order.orderNumber;
  }

  const orderId =
    getObjectId(
      installment?.order,
    );

  if (orderId) {
    return `#${orderId
      .slice(-8)
      .toUpperCase()}`;
  }

  return 'Not available';
}

export default function InstallmentDetailsPage() {
  const params = useParams();

  const installmentId =
    Array.isArray(params?.id)
      ? params.id[0]
      : params?.id;

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    installment,
    setInstallment,
  ] = useState(null);

  const [
    error,
    setError,
  ] = useState('');

  useEffect(() => {
    let active = true;

    async function loadInstallment() {
      if (!installmentId) {
        setLoading(false);
        setError(
          'Installment ID is missing.',
        );
        return;
      }

      setLoading(true);
      setError('');

      try {
        const response =
          await getMyCreditInstallment(
            installmentId,
          );

        if (!active) {
          return;
        }

        const normalized =
          normalizeInstallment(
            response,
          );

        if (
          !normalized ||
          !normalized._id
        ) {
          throw new Error(
            'DESIRE CREDIT installment was not found.',
          );
        }

        setInstallment(
          normalized,
        );
      } catch (requestError) {
        if (!active) {
          return;
        }

        setInstallment(null);

        setError(
          requestError?.message ||
            'Unable to load this DESIRE CREDIT installment.',
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadInstallment();

    return () => {
      active = false;
    };
  }, [installmentId]);

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
            Loading installment...
          </h1>

          <p>
            Retrieving your
            repayment details.
          </p>
        </div>
      </main>
    );
  }

  if (
    error ||
    !installment
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
          <Link href="/account/desire-credit/purchases">
            <ArrowLeftIcon />
            Purchases
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
            Installment unavailable
          </h1>

          <p>
            {error ||
              'This installment could not be loaded.'}
          </p>

          <Link
            href="/account/desire-credit/purchases"
            className={
              styles.primaryButton
            }
          >
            Back to purchases
          </Link>
        </section>
      </main>
    );
  }

  const purchaseId =
    getObjectId(
      installment.creditPurchase,
    );

  const canPay =
    [
      'PENDING',
      'PARTIALLY_PAID',
      'OVERDUE',
    ].includes(
      installment.status,
    ) &&
    Number(
      installment.outstandingAmount ||
        0,
    ) > 0;

  const isPaid =
    installment.status ===
    'PAID';

  const paymentProgress =
    Number(
      installment.amount ||
        0,
    ) > 0
      ? Math.min(
          100,
          Math.max(
            0,
            (Number(
              installment.amountPaid ||
                0,
            ) /
              Number(
                installment.amount,
              )) *
              100,
          ),
        )
      : 0;

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
        {purchaseId ? (
          <Link
            href={`/account/desire-credit/purchases/${purchaseId}`}
          >
            <ArrowLeftIcon />
            Back to purchase
          </Link>
        ) : (
          <Link href="/account/desire-credit/purchases">
            <ArrowLeftIcon />
            Back to purchases
          </Link>
        )}
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
              DESIRE CREDIT
              INSTALLMENT
            </span>

            <h1>
              Installment{' '}
              {String(
                installment.installmentNumber ||
                  0,
              ).padStart(
                2,
                '0',
              )}
            </h1>

            <p>
              Review this repayment,
              its due date and
              current payment
              balance.
            </p>
          </div>

          <span
            className={
              styles.statusBadge
            }
          >
            {formatStatus(
              installment.status,
            )}
          </span>
        </div>

        <div
          className={
            styles.balanceGrid
          }
        >
          <div
            className={
              styles.mainBalance
            }
          >
            <span>
              Amount outstanding
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
              Installment amount
            </span>

            <strong>
              {formatNaira(
                installment.amount,
              )}
            </strong>
          </div>

          <div>
            <span>
              Amount paid
            </span>

            <strong>
              {formatNaira(
                installment
                  .amountPaid,
              )}
            </strong>
          </div>
        </div>
      </section>

      {installment.status ===
      'OVERDUE' ? (
        <section
          className={
            styles.notice
          }
        >
          <div>
            <span>
              PAYMENT NOTICE
            </span>

            <h2>
              This installment is
              overdue.
            </h2>
          </div>

          <p>
            The repayment due date
            has passed and an
            outstanding balance
            remains on this
            installment.
          </p>
        </section>
      ) : null}

      <section
        className={
          styles.detailsGrid
        }
      >
        <DetailItem
          label="Installment"
          value={`${installment.installmentNumber || 0} of ${installment.totalInstallments || 0}`}
        />

        <DetailItem
          label="Due date"
          value={formatDate(
            installment.dueDate,
          )}
        />

        <DetailItem
          label="Status"
          value={formatStatus(
            installment.status,
          )}
        />

        <DetailItem
          label="Order"
          value={getOrderNumber(
            installment,
          )}
        />

        <DetailItem
          label="Late fee"
          value={formatNaira(
            installment.lateFee,
          )}
        />

        <DetailItem
          label="Paid date"
          value={formatDate(
            installment.paidAt,
          )}
        />
      </section>

      <section
        className={
          styles.progressCard
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
              PAYMENT PROGRESS
            </span>

            <h2>
              Installment balance
            </h2>
          </div>

          <strong>
            {Math.round(
              paymentProgress,
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
              styles.progressFill
            }
            style={{
              width: `${paymentProgress}%`,
            }}
          />
        </div>

        <div
          className={
            styles.progressAmounts
          }
        >
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
              Remaining
            </span>

            <strong>
              {formatNaira(
                installment
                  .outstandingAmount,
              )}
            </strong>
          </div>
        </div>
      </section>

      <section
        className={
          styles.paymentCard
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
            {isPaid
              ? 'Installment paid'
              : canPay
                ? 'Make your installment payment'
                : 'Payment unavailable'}
          </h2>

          <p>
            {isPaid
              ? 'This installment has been fully paid. No further payment is required.'
              : canPay
                ? `The current outstanding amount for this installment is ${formatNaira(
                    installment.outstandingAmount,
                  )}.`
                : 'This installment cannot currently accept a payment.'}
          </p>
        </div>

        {canPay ? (
          <Link
            href={`/account/desire-credit/installments/${installment._id}/pay`}
            className={
              styles.payButton
            }
          >
            Pay installment
            <ArrowIcon />
          </Link>
        ) : (
          <span
            className={
              styles.paymentState
            }
          >
            {formatStatus(
              installment.status,
            )}
          </span>
        )}
      </section>

      <section
        className={
          styles.referenceCard
        }
      >
        <div>
          <span>
            First payment
          </span>

          <strong>
            {formatDate(
              installment
                .firstPaymentAt,
            )}
          </strong>
        </div>

        <div>
          <span>
            Last payment reference
          </span>

          <strong>
            {installment
              .lastPaymentReference ||
              'Not available'}
          </strong>
        </div>

        <div>
          <span>
            Payments recorded
          </span>

          <strong>
            {Array.isArray(
              installment.payments,
            )
              ? installment
                  .payments
                  .length
              : 0}
          </strong>
        </div>
      </section>
    </main>
  );
}

function DetailItem({
  label,
  value,
}) {
  return (
    <article
      className={
        styles.detailItem
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