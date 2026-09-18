'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  useEffect,
  useState,
} from 'react';

import {
  getMyCreditInstallment,
} from '@/services/desire-credit.service';

import {
  createInstallmentPayment,
} from '@/services/payments.service';

import {
  PAYMENT_BANK,
} from '@/config/payment-bank';

import styles from './pay-installment.module.css';

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

  if (!orderId) {
    return 'Not available';
  }

  return `#${orderId
    .slice(-8)
    .toUpperCase()}`;
}

function getBankDetails(payment) {
  return (
    payment?.bankDetails ||
    payment?.paymentDetails ||
    payment?.bankAccount ||
    null
  );
}

export default function PayInstallmentPage() {
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
    creating,
    setCreating,
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
    createError,
    setCreateError,
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
            'Unable to load this installment.',
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

  const canPay =
    installment &&
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

  async function handleCreatePayment() {
    if (
      !installment ||
      !canPay ||
      creating
    ) {
      return;
    }

    const orderId =
      getObjectId(
        installment.order,
      );

    if (!orderId) {
      setCreateError(
        'The order connected to this installment could not be identified.',
      );

      return;
    }

    setCreating(true);
    setCreateError('');

    try {
      /*
       * The payment service now creates
       * DESIRE CREDIT installment payments
       * through the same payment architecture
       * used by the rest of the storefront.
       *
       * The backend determines the real
       * installment amount from the current
       * outstanding balance.
       */
      const response =
        await createInstallmentPayment({
          orderId,

          installmentId:
            installment._id,
        });

      const normalized =
        normalizePayment(
          response,
        );

      if (
        !normalized ||
        !normalized._id
      ) {
        throw new Error(
          'The installment payment could not be created.',
        );
      }

      setPayment(normalized);
    } catch (requestError) {
      setCreateError(
        requestError?.message ||
          'Unable to create your installment payment.',
      );
    } finally {
      setCreating(false);
    }
  }

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
            Preparing payment...
          </h1>

          <p>
            Retrieving your
            installment repayment
            information.
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
            Payment unavailable
          </h1>

          <p>
            {error ||
              'This installment could not be loaded.'}
          </p>

          <Link
            href="/account/desire-credit/purchases"
            className={
              styles.darkButton
            }
          >
            Back to purchases
          </Link>
        </section>
      </main>
    );
  }

  if (!canPay) {
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
            styles.errorState
          }
        >
          <span>
            DESIRE CREDIT
          </span>

          <h1>
            No payment required
          </h1>

          <p>
            This installment
            currently has a status
            of{' '}
            <strong>
              {formatStatus(
                installment.status,
              )}
            </strong>{' '}
            and cannot accept a new
            repayment.
          </p>

          <Link
            href={`/account/desire-credit/installments/${installment._id}`}
            className={
              styles.darkButton
            }
          >
            View installment
          </Link>
        </section>
      </main>
    );
  }

  const bankDetails =
    getBankDetails(payment);

  const bankName =
    bankDetails?.bankName ||
    payment?.bankName ||
    PAYMENT_BANK?.bankName ||
    'Not available';

  const accountName =
    bankDetails?.accountName ||
    payment?.accountName ||
    PAYMENT_BANK?.accountName ||
    'Not available';

  const accountNumber =
    bankDetails?.accountNumber ||
    payment?.accountNumber ||
    PAYMENT_BANK?.accountNumber ||
    'Not available';

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
            REPAYMENT
          </span>

          <h1>
            Pay installment{' '}
            {String(
              installment.installmentNumber ||
                0,
            ).padStart(
              2,
              '0',
            )}
          </h1>

          <p>
            Complete your
            installment repayment
            using the DESIRE
            payment process.
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
      </section>

      <section
        className={
          styles.paymentLayout
        }
      >
        <div
          className={
            styles.mainColumn
          }
        >
          {!payment ? (
            <section
              className={
                styles.paymentCard
              }
            >
              <span
                className={
                  styles.eyebrow
                }
              >
                PAYMENT SUMMARY
              </span>

              <h2>
                Confirm your
                repayment
              </h2>

              <p
                className={
                  styles.description
                }
              >
                You are about to
                create a payment for
                this DESIRE CREDIT
                installment.
              </p>

              <div
                className={
                  styles.amountBox
                }
              >
                <span>
                  Amount due
                </span>

                <strong>
                  {formatNaira(
                    installment
                      .outstandingAmount,
                  )}
                </strong>

                <small>
                  The final payment
                  amount is verified
                  by the server
                  against your
                  installment
                  balance.
                </small>
              </div>

              {createError ? (
                <div
                  className={
                    styles.errorBanner
                  }
                >
                  {createError}
                </div>
              ) : null}

              <button
                type="button"
                className={
                  styles.createButton
                }
                onClick={
                  handleCreatePayment
                }
                disabled={
                  creating
                }
              >
                {creating
                  ? 'Creating payment...'
                  : 'Continue to payment'}

                {!creating ? (
                  <ArrowIcon />
                ) : null}
              </button>
            </section>
          ) : (
            <section
              className={
                styles.paymentCreated
              }
            >
              <div
                className={
                  styles.createdHeader
                }
              >
                <div>
                  <span
                    className={
                      styles.eyebrow
                    }
                  >
                    PAYMENT CREATED
                  </span>

                  <h2>
                    Transfer details
                  </h2>

                  <p>
                    Your installment
                    payment has been
                    created. Make the
                    transfer using
                    the payment
                    details below.
                  </p>
                </div>

                <span
                  className={
                    styles.paymentStatus
                  }
                >
                  {formatStatus(
                    payment.status,
                  )}
                </span>
              </div>

              <div
                className={
                  styles.createdAmount
                }
              >
                <span>
                  Transfer amount
                </span>

                <strong>
                  {formatNaira(
                    payment.amount ||
                      installment.outstandingAmount,
                  )}
                </strong>
              </div>

              <div
                className={
                  styles.bankGrid
                }
              >
                <DetailItem
                  label="Bank"
                  value={bankName}
                />

                <DetailItem
                  label="Account name"
                  value={
                    accountName
                  }
                />

                <DetailItem
                  label="Account number"
                  value={
                    accountNumber
                  }
                />

                <DetailItem
                  label="Payment reference"
                  value={
                    payment.reference ||
                    'Not available'
                  }
                />
              </div>

              <div
                className={
                  styles.instructions
                }
              >
                <strong>
                  Important
                </strong>

                <p>
                  Transfer the exact
                  amount shown above.
                  After completing
                  the transfer, you
                  will submit your
                  proof of payment
                  for verification.
                </p>
              </div>

              <Link
                href={`/account/desire-credit/installments/${installment._id}/pay/proof?paymentId=${payment._id}`}
                className={
                  styles.proofButton
                }
              >
                I have made the
                transfer
                <ArrowIcon />
              </Link>
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
            INSTALLMENT DETAILS
          </span>

          <div
            className={
              styles.summaryAmount
            }
          >
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

          <div
            className={
              styles.summaryRows
            }
          >
            <SummaryRow
              label="Installment"
              value={`${installment.installmentNumber || 0} of ${installment.totalInstallments || 0}`}
            />

            <SummaryRow
              label="Original amount"
              value={formatNaira(
                installment.amount,
              )}
            />

            <SummaryRow
              label="Already paid"
              value={formatNaira(
                installment.amountPaid,
              )}
            />

            <SummaryRow
              label="Due date"
              value={formatDate(
                installment.dueDate,
              )}
            />

            <SummaryRow
              label="Status"
              value={formatStatus(
                installment.status,
              )}
            />

            <SummaryRow
              label="Order"
              value={getOrderNumber(
                installment,
              )}
            />
          </div>

          <div
            className={
              styles.secureNote
            }
          >
            <ShieldIcon />

            <div>
              <strong>
                Secure repayment
              </strong>

              <p>
                Payment details are
                tied to this exact
                DESIRE CREDIT
                installment.
              </p>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}

function DetailItem({
  label,
  value,
}) {
  return (
    <div
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
    </div>
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
      <span>
        {label}
      </span>

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