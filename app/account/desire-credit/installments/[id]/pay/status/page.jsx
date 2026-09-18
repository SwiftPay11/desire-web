'use client';

import Link from 'next/link';
import {
  useParams,
  useSearchParams,
} from 'next/navigation';
import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  getMyCreditInstallment,
  recordCreditInstallmentPayment,
} from '@/services/desire-credit.service';

import {
  getMyPayment,
} from '@/services/payments.service';

import styles from './payment-status.module.css';

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
      hour: 'numeric',
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

function normalizePayment(
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
    response.payment ||
    response.data?.payment ||
    response.data ||
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

function installmentContainsPayment(
  installment,
  paymentId,
) {
  if (
    !installment ||
    !paymentId ||
    !Array.isArray(
      installment.payments,
    )
  ) {
    return false;
  }

  return installment.payments.some(
    (item) =>
      getObjectId(item) ===
      paymentId,
  );
}

export default function InstallmentPaymentStatusPage() {
  const params = useParams();

  const searchParams =
    useSearchParams();

  const installmentId =
    Array.isArray(params?.id)
      ? params.id[0]
      : params?.id;

  const paymentId =
    searchParams.get(
      'paymentId',
    );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    applying,
    setApplying,
  ] = useState(false);

  const [
    installment,
    setInstallment,
  ] = useState(null);

  const [
    payment,
    setPayment,
  ] = useState(null);

  const [
    error,
    setError,
  ] = useState('');

  const [
    applyError,
    setApplyError,
  ] = useState('');

  const [
    applied,
    setApplied,
  ] = useState(false);

  const loadStatus =
    useCallback(
      async (
        showRefreshState = false,
      ) => {
        if (
          !installmentId ||
          !paymentId
        ) {
          setError(
            !paymentId
              ? 'Payment ID is missing.'
              : 'Installment ID is missing.',
          );

          setLoading(false);

          return null;
        }

        if (showRefreshState) {
          setRefreshing(true);
        }

        setError('');

        try {
          const [
            installmentResponse,
            paymentResponse,
          ] =
            await Promise.all([
              getMyCreditInstallment(
                installmentId,
              ),

              getMyPayment(
                paymentId,
              ),
            ]);

          const normalizedInstallment =
            normalizeInstallment(
              installmentResponse,
            );

          const normalizedPayment =
            normalizePayment(
              paymentResponse,
            );

          if (
            !normalizedInstallment ||
            !normalizedInstallment._id
          ) {
            throw new Error(
              'Installment was not found.',
            );
          }

          if (
            !normalizedPayment ||
            !normalizedPayment._id
          ) {
            throw new Error(
              'Payment was not found.',
            );
          }

          setInstallment(
            normalizedInstallment,
          );

          setPayment(
            normalizedPayment,
          );

          const alreadyApplied =
            installmentContainsPayment(
              normalizedInstallment,
              normalizedPayment._id,
            );

          setApplied(
            alreadyApplied,
          );

          return {
            installment:
              normalizedInstallment,

            payment:
              normalizedPayment,

            alreadyApplied,
          };
        } catch (requestError) {
          setError(
            requestError?.message ||
              'Unable to load the payment status.',
          );

          return null;
        } finally {
          setLoading(false);

          if (showRefreshState) {
            setRefreshing(false);
          }
        }
      },
      [
        installmentId,
        paymentId,
      ],
    );

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  async function handleApplyPayment() {
    if (
      applying ||
      !payment ||
      !installment
    ) {
      return;
    }

    if (
      payment.status !== 'PAID'
    ) {
      setApplyError(
        'This payment has not been verified yet.',
      );

      return;
    }

    if (
      installmentContainsPayment(
        installment,
        payment._id,
      )
    ) {
      setApplied(true);
      setApplyError('');

      return;
    }

    const paymentAmount =
      Number(
        payment.amount,
      );

    if (
      !Number.isFinite(
        paymentAmount,
      ) ||
      paymentAmount <= 0
    ) {
      setApplyError(
        'The verified payment amount is invalid.',
      );

      return;
    }

    setApplying(true);
    setApplyError('');

    try {
      await recordCreditInstallmentPayment({
        installmentId:
          installment._id,

        amount:
          paymentAmount,

        paymentId:
          payment._id,

        paymentReference:
          payment.reference ||
          payment.providerReference ||
          payment.transferReference ||
          undefined,
      });

      /*
       * Refresh from the backend instead
       * of manually changing balances.
       *
       * This makes the backend the source
       * of truth for outstandingAmount,
       * amountPaid and installment status.
       */
      const refreshed =
        await loadStatus();

      if (
        refreshed?.alreadyApplied
      ) {
        setApplied(true);
      } else {
        /*
         * The repayment endpoint succeeded,
         * so consider it applied even if the
         * refreshed response shape does not
         * expose the payments array.
         */
        setApplied(true);
      }
    } catch (requestError) {
      /*
       * If the backend reports that this
       * payment has already been used,
       * refresh before showing an error.
       */
      const refreshed =
        await loadStatus();

      if (
        refreshed?.alreadyApplied
      ) {
        setApplied(true);
        setApplyError('');
      } else {
        setApplyError(
          requestError?.message ||
            'Unable to apply this verified payment to the installment.',
        );
      }
    } finally {
      setApplying(false);
    }
  }

  if (loading) {
    return (
      <main
        className={
          styles.page
        }
      >
        <section
          className={
            styles.loadingState
          }
        >
          <span>
            DESIRE CREDIT
          </span>

          <h1>
            Checking payment...
          </h1>

          <p>
            Retrieving the latest
            verification status.
          </p>
        </section>
      </main>
    );
  }

  if (
    error ||
    !installment ||
    !payment
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
          <Link
            href={
              installmentId
                ? `/account/desire-credit/installments/${installmentId}`
                : '/account/desire-credit/purchases'
            }
          >
            <ArrowLeftIcon />
            Go back
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
            Status unavailable
          </h1>

          <p>
            {error ||
              'We could not retrieve this payment.'}
          </p>

          <button
            type="button"
            onClick={() =>
              loadStatus(true)
            }
          >
            Try again
          </button>
        </section>
      </main>
    );
  }

  const status =
    payment.status ||
    'PENDING';

  const isWaiting =
    [
      'PENDING',
      'SUBMITTED',
      'PROCESSING',
    ].includes(status);

  const isPaid =
    status === 'PAID';

  const isFailed =
    [
      'FAILED',
      'CANCELLED',
    ].includes(status);

  const installmentPaid =
    installment.status ===
      'PAID' ||
    Number(
      installment.outstandingAmount ||
        0,
    ) <= 0;

  const paymentApplied =
    applied ||
    installmentContainsPayment(
      installment,
      payment._id,
    );

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
        <Link
          href={`/account/desire-credit/installments/${installment._id}`}
        >
          <ArrowLeftIcon />
          Back to installment
        </Link>
      </div>

      <section
        className={
          styles.hero
        }
      >
        <div>
          <span
            className={
              styles.eyebrowLight
            }
          >
            DESIRE CREDIT
          </span>

          <h1>
            Payment status
          </h1>

          <p>
            Track the verification
            and application of your
            installment repayment.
          </p>
        </div>

        <span
          className={`${styles.statusBadge} ${
            isPaid
              ? styles.paidBadge
              : isFailed
                ? styles.failedBadge
                : styles.waitingBadge
          }`}
        >
          {formatStatus(status)}
        </span>
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
          {isWaiting && (
            <section
              className={
                styles.statusCard
              }
            >
              <div
                className={
                  styles.statusIcon
                }
              >
                <ClockIcon />
              </div>

              <span
                className={
                  styles.eyebrow
                }
              >
                VERIFICATION
                PENDING
              </span>

              <h2>
                Your payment is
                being verified
              </h2>

              <p>
                Your transfer proof
                has been received.
                The installment will
                not be updated until
                the payment is
                verified.
              </p>

              <div
                className={
                  styles.notice
                }
              >
                <ShieldIcon />

                <div>
                  <strong>
                    No action required
                  </strong>

                  <p>
                    Once the payment
                    has been approved,
                    return here and
                    check the status
                    again.
                  </p>
                </div>
              </div>

              <button
                type="button"
                className={
                  styles.primaryButton
                }
                disabled={
                  refreshing
                }
                onClick={() =>
                  loadStatus(true)
                }
              >
                {refreshing
                  ? 'Checking...'
                  : 'Check payment status'}

                {!refreshing && (
                  <RefreshIcon />
                )}
              </button>
            </section>
          )}

          {isPaid &&
            !paymentApplied && (
              <section
                className={
                  styles.statusCard
                }
              >
                <div
                  className={`${styles.statusIcon} ${styles.verifiedIcon}`}
                >
                  <CheckIcon />
                </div>

                <span
                  className={
                    styles.eyebrow
                  }
                >
                  PAYMENT VERIFIED
                </span>

                <h2>
                  Your payment has
                  been approved
                </h2>

                <p>
                  The transfer has
                  been verified. It
                  can now be securely
                  applied to this
                  DESIRE CREDIT
                  installment.
                </p>

                {applyError && (
                  <div
                    className={
                      styles.errorBanner
                    }
                  >
                    {applyError}
                  </div>
                )}

                <button
                  type="button"
                  className={
                    styles.primaryButton
                  }
                  disabled={
                    applying
                  }
                  onClick={
                    handleApplyPayment
                  }
                >
                  {applying
                    ? 'Applying payment...'
                    : 'Apply verified payment'}

                  {!applying && (
                    <ArrowIcon />
                  )}
                </button>
              </section>
            )}

          {isPaid &&
            paymentApplied && (
              <section
                className={
                  styles.successCard
                }
              >
                <div
                  className={
                    styles.successIcon
                  }
                >
                  <CheckIcon />
                </div>

                <span
                  className={
                    styles.eyebrowLight
                  }
                >
                  PAYMENT APPLIED
                </span>

                <h2>
                  {installmentPaid
                    ? 'Installment paid'
                    : 'Repayment applied'}
                </h2>

                <p>
                  {installmentPaid
                    ? 'This verified payment has been applied and the installment is fully paid.'
                    : 'This verified payment has been successfully applied to your installment balance.'}
                </p>

                <div
                  className={
                    styles.successAmounts
                  }
                >
                  <div>
                    <span>
                      Amount paid
                    </span>

                    <strong>
                      {formatNaira(
                        installment.amountPaid,
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Outstanding
                    </span>

                    <strong>
                      {formatNaira(
                        installment.outstandingAmount,
                      )}
                    </strong>
                  </div>
                </div>

                <Link
                  href={`/account/desire-credit/installments/${installment._id}`}
                  className={
                    styles.primaryLink
                  }
                >
                  View installment
                  <ArrowIcon />
                </Link>
              </section>
            )}

          {isFailed && (
            <section
              className={
                styles.statusCard
              }
            >
              <div
                className={`${styles.statusIcon} ${styles.failedIcon}`}
              >
                <CloseIcon />
              </div>

              <span
                className={
                  styles.eyebrow
                }
              >
                PAYMENT NOT
                APPROVED
              </span>

              <h2>
                {status ===
                'CANCELLED'
                  ? 'Payment cancelled'
                  : 'Payment verification failed'}
              </h2>

              <p>
                This payment cannot
                be applied to the
                installment. Your
                installment balance
                has not been changed.
              </p>

              {payment.failureReason && (
                <div
                  className={
                    styles.failureReason
                  }
                >
                  <span>
                    Reason
                  </span>

                  <p>
                    {
                      payment.failureReason
                    }
                  </p>
                </div>
              )}

              <Link
                href={`/account/desire-credit/installments/${installment._id}`}
                className={
                  styles.primaryLink
                }
              >
                Return to installment
                <ArrowIcon />
              </Link>
            </section>
          )}

          {!isWaiting &&
            !isPaid &&
            !isFailed && (
              <section
                className={
                  styles.statusCard
                }
              >
                <span
                  className={
                    styles.eyebrow
                  }
                >
                  PAYMENT STATUS
                </span>

                <h2>
                  {formatStatus(
                    status,
                  )}
                </h2>

                <p>
                  The payment is
                  currently in this
                  state. Refresh to
                  retrieve the latest
                  information.
                </p>

                <button
                  type="button"
                  className={
                    styles.primaryButton
                  }
                  disabled={
                    refreshing
                  }
                  onClick={() =>
                    loadStatus(true)
                  }
                >
                  {refreshing
                    ? 'Checking...'
                    : 'Refresh status'}
                </button>
              </section>
            )}
        </div>

        <aside
          className={
            styles.summaryCard
          }
        >
          <span
            className={
              styles.eyebrow
            }
          >
            PAYMENT DETAILS
          </span>

          <div
            className={
              styles.summaryAmount
            }
          >
            <span>
              Payment amount
            </span>

            <strong>
              {formatNaira(
                payment.amount,
              )}
            </strong>
          </div>

          <div
            className={
              styles.summaryRows
            }
          >
            <SummaryRow
              label="Payment reference"
              value={
                payment.reference ||
                'Not available'
              }
            />

            <SummaryRow
              label="Payment status"
              value={formatStatus(
                status,
              )}
            />

            <SummaryRow
              label="Installment"
              value={`${installment.installmentNumber || 0} of ${installment.totalInstallments || 0}`}
            />

            <SummaryRow
              label="Installment status"
              value={formatStatus(
                installment.status,
              )}
            />

            <SummaryRow
              label="Due date"
              value={formatDate(
                installment.dueDate,
              )}
            />

            <SummaryRow
              label="Outstanding"
              value={formatNaira(
                installment.outstandingAmount,
              )}
            />

            {payment.verifiedAt && (
              <SummaryRow
                label="Verified"
                value={formatDate(
                  payment.verifiedAt,
                )}
              />
            )}
          </div>

          <div
            className={
              styles.securityNotice
            }
          >
            <ShieldIcon />

            <div>
              <strong>
                Verified repayments
              </strong>

              <p>
                Only a payment
                verified as PAID can
                be applied to an
                installment.
              </p>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}

function SummaryRow({
  label,
  value,
}) {
  return (
    <div
      className={
        styles.summaryRow
      }
    >
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
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

function RefreshIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M20 11a8 8 0 1 0-2.3 5.7" />
      <path d="M20 4v7h-7" />
    </svg>
  );
}

function ClockIcon() {
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
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M12 3l7 3v5c0 4.7-2.8 8.4-7 10-4.2-1.6-7-5.3-7-10V6l7-3z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M5 12l4 4L19 6" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}