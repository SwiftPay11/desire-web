'use client';

import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import Link from 'next/link';

import {
  useParams,
} from 'next/navigation';

import {
  getAdminPayment,
  verifyAdminPayment,
  PAYMENT_STATUSES,
} from '@/services/payments.service';

import styles from './payment-details.module.css';

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
      hour: '2-digit',
      minute: '2-digit',
    },
  ).format(date);
}

function formatLabel(value) {
  if (!value) {
    return '—';
  }

  return value
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase(),
    );
}

function getStatusClass(status) {
  switch (status) {
    case 'PAID':
      return styles.success;

    case 'SUBMITTED':
      return styles.submitted;

    case 'PROCESSING':
      return styles.processing;

    case 'FAILED':
    case 'CANCELLED':
      return styles.danger;

    case 'REFUNDED':
      return styles.info;

    default:
      return styles.pending;
  }
}

function BackIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="m15 18-6-6 6-6" />
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
      <path d="M18.5 9A7 7 0 0 0 6 6.5L4 9" />
      <path d="M5.5 15A7 7 0 0 0 18 17.5L20 15" />
    </svg>
  );
}

function PaymentIcon() {
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
      <path d="M5 20c0-4 3-7 7-7s7 3 7 7" />
    </svg>
  );
}

function OrderIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M5 4h14v16H5V4Z" />
      <path d="M8 8h8" />
      <path d="M8 12h8" />
      <path d="M8 16h5" />
    </svg>
  );
}

function TransferIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M4 7h14" />
      <path d="m15 4 3 3-3 3" />
      <path d="M20 17H6" />
      <path d="m9 14-3 3 3 3" />
    </svg>
  );
}

function CheckIcon() {
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

function RejectIcon() {
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
      <path d="m9 9 6 6" />
      <path d="m15 9-6 6" />
    </svg>
  );
}

export default function AdminPaymentDetailsPage() {
  const params =
    useParams();

  const paymentId =
    params?.id;

  const [
    payment,
    setPayment,
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
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState('');

  const [
    success,
    setSuccess,
  ] = useState('');

  const [
    providerReference,
    setProviderReference,
  ] = useState('');

  const [
    rejectionReason,
    setRejectionReason,
  ] = useState('');

  const [
    action,
    setAction,
  ] = useState(null);

  const loadPayment =
    useCallback(
      async (
        showRefresh = false,
      ) => {
        if (!paymentId) {
          return;
        }

        try {
          if (showRefresh) {
            setRefreshing(true);
          } else {
            setLoading(true);
          }

          setError('');

          const response =
            await getAdminPayment(
              paymentId,
            );

          const loadedPayment =
            response?.payment ||
            null;

          setPayment(
            loadedPayment,
          );

          setProviderReference(
            loadedPayment
              ?.providerReference ||
              '',
          );
        } catch (err) {
          console.error(
            'Unable to load payment:',
            err,
          );

          setError(
            err?.message ||
              'Unable to load payment.',
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [paymentId],
    );

  useEffect(() => {
    loadPayment();
  }, [loadPayment]);

  async function approvePayment() {
    if (!payment) {
      return;
    }

    const confirmed =
      window.confirm(
        'Confirm this payment as PAID? For normal order payments, this will deduct the ordered quantity from inventory.',
      );

    if (!confirmed) {
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      setSuccess('');

      const response =
        await verifyAdminPayment(
          payment._id,
          {
            providerReference,
          },
        );

      setSuccess(
        response?.message ||
          'Payment approved successfully.',
      );

      setAction(null);

      await loadPayment();
    } catch (err) {
      console.error(
        'Unable to approve payment:',
        err,
      );

      setError(
        err?.message ||
          'Unable to approve payment.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function rejectPayment() {
    if (!payment) {
      return;
    }

    const reason =
      rejectionReason.trim();

    if (!reason) {
      setError(
        'Enter a reason for rejecting this payment.',
      );

      return;
    }

    const confirmed =
      window.confirm(
        'Reject this payment verification?',
      );

    if (!confirmed) {
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      setSuccess('');

      const response =
        await verifyAdminPayment(
          payment._id,
          {
            providerReference,
            failureReason:
              reason,
          },
        );

      setSuccess(
        response?.message ||
          'Payment rejected.',
      );

      setRejectionReason('');
      setAction(null);

      await loadPayment();
    } catch (err) {
      console.error(
        'Unable to reject payment:',
        err,
      );

      setError(
        err?.message ||
          'Unable to reject payment.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div
        className={
          styles.statePage
        }
      >
        <div
          className={
            styles.loader
          }
        />

        <h2>
          Loading payment
        </h2>

        <p>
          Retrieving payment
          information.
        </p>
      </div>
    );
  }

  if (!payment) {
    return (
      <div
        className={
          styles.statePage
        }
      >
        <PaymentIcon />

        <h2>
          Payment unavailable
        </h2>

        <p>
          {error ||
            'This payment could not be found.'}
        </p>

        <Link
          href="/admin/payments"
          className={
            styles.stateButton
          }
        >
          Back to payments
        </Link>
      </div>
    );
  }

  const customer =
    payment.user || {};

  const order =
    payment.order || {};

  const isPaid =
    payment.status ===
    PAYMENT_STATUSES.PAID;

  const isFailed =
    payment.status ===
    PAYMENT_STATUSES.FAILED;

  const isCancelled =
    payment.status ===
    PAYMENT_STATUSES.CANCELLED;

  const isRefunded =
    payment.status ===
    PAYMENT_STATUSES.REFUNDED;

  const canVerify =
    !isPaid &&
    !isCancelled &&
    !isRefunded;

  const amountMatches =
    Number(
      payment.submittedAmount ||
        0,
    ) ===
    Number(
      payment.amount ||
        0,
    );

  return (
    <div
      className={
        styles.page
      }
    >
      <div
        className={
          styles.topbar
        }
      >
        <Link
          href="/admin/payments"
          className={
            styles.backButton
          }
        >
          <BackIcon />
          Payments
        </Link>

        <button
          type="button"
          className={
            styles.refreshButton
          }
          disabled={
            refreshing ||
            submitting
          }
          onClick={() =>
            loadPayment(true)
          }
        >
          <RefreshIcon />

          {refreshing
            ? 'Refreshing...'
            : 'Refresh'}
        </button>
      </div>

      <header
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
            Payment review
          </span>

          <h1>
            {payment.reference}
          </h1>

          <p>
            Created{' '}
            {formatDate(
              payment.createdAt,
            )}
          </p>
        </div>

        <div
          className={
            styles.headerStatus
          }
        >
          <span
            className={`${styles.badge} ${
              getStatusClass(
                payment.status,
              )
            }`}
          >
            {formatLabel(
              payment.status,
            )}
          </span>

          <strong>
            {formatCurrency(
              payment.amount,
            )}
          </strong>
        </div>
      </header>

      {error ? (
        <div
          className={
            styles.errorBox
          }
        >
          {error}
        </div>
      ) : null}

      {success ? (
        <div
          className={
            styles.successBox
          }
        >
          {success}
        </div>
      ) : null}

      <div
        className={
          styles.layout
        }
      >
        <main
          className={
            styles.mainColumn
          }
        >
          <section
            className={
              styles.card
            }
          >
            <div
              className={
                styles.cardHeader
              }
            >
              <div
                className={
                  styles.cardTitle
                }
              >
                <TransferIcon />

                <div>
                  <h2>
                    Transfer details
                  </h2>

                  <p>
                    Information
                    submitted by the
                    customer.
                  </p>
                </div>
              </div>
            </div>

            <div
              className={
                styles.detailsGrid
              }
            >
              <div>
                <span>
                  Expected amount
                </span>

                <strong>
                  {formatCurrency(
                    payment.amount,
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Submitted amount
                </span>

                <strong>
                  {payment.submittedAmount
                    ? formatCurrency(
                        payment.submittedAmount,
                      )
                    : '—'}
                </strong>
              </div>

              <div>
                <span>
                  Sender name
                </span>

                <strong>
                  {payment.senderName ||
                    '—'}
                </strong>
              </div>

              <div>
                <span>
                  Transfer reference
                </span>

                <strong>
                  {payment.transferReference ||
                    '—'}
                </strong>
              </div>

              <div>
                <span>
                  Transfer date
                </span>

                <strong>
                  {formatDate(
                    payment.transferDate,
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Submitted
                </span>

                <strong>
                  {formatDate(
                    payment.submittedAt,
                  )}
                </strong>
              </div>
            </div>

            {payment.submittedAmount ? (
              <div
                className={
                  amountMatches
                    ? styles.amountMatch
                    : styles.amountWarning
                }
              >
                {amountMatches
                  ? 'Submitted amount matches the expected payment amount.'
                  : `Amount mismatch: expected ${formatCurrency(
                      payment.amount,
                    )}, but the customer submitted ${formatCurrency(
                      payment.submittedAmount,
                    )}.`}
              </div>
            ) : null}

            {payment.customerNote ? (
              <div
                className={
                  styles.noteBox
                }
              >
                <span>
                  Customer note
                </span>

                <p>
                  {
                    payment.customerNote
                  }
                </p>
              </div>
            ) : null}
          </section>

          <section
            className={
              styles.card
            }
          >
            <div
              className={
                styles.cardHeader
              }
            >
              <div
                className={
                  styles.cardTitle
                }
              >
                <PaymentIcon />

                <div>
                  <h2>
                    Payment proof
                  </h2>

                  <p>
                    Review the
                    submitted proof
                    before approving
                    payment.
                  </p>
                </div>
              </div>
            </div>

            {payment.proofOfPaymentUrl ? (
              <div
                className={
                  styles.proofArea
                }
              >
                <img
                  src={
                    payment.proofOfPaymentUrl
                  }
                  alt="Customer payment proof"
                  className={
                    styles.proofImage
                  }
                />

                <a
                  href={
                    payment.proofOfPaymentUrl
                  }
                  target="_blank"
                  rel="noreferrer"
                  className={
                    styles.proofButton
                  }
                >
                  Open proof in new tab
                </a>
              </div>
            ) : (
              <div
                className={
                  styles.noProof
                }
              >
                No payment proof has
                been submitted.
              </div>
            )}
          </section>

          <section
            className={
              styles.card
            }
          >
            <div
              className={
                styles.cardHeader
              }
            >
              <div
                className={
                  styles.cardTitle
                }
              >
                <OrderIcon />

                <div>
                  <h2>
                    Related order
                  </h2>

                  <p>
                    Order associated
                    with this
                    payment.
                  </p>
                </div>
              </div>

              {order._id ? (
                <Link
                  href={`/admin/orders/${order._id}`}
                  className={
                    styles.smallButton
                  }
                >
                  View order
                </Link>
              ) : null}
            </div>

            <div
              className={
                styles.detailsGrid
              }
            >
              <div>
                <span>
                  Order number
                </span>

                <strong>
                  {order.orderNumber ||
                    '—'}
                </strong>
              </div>

              <div>
                <span>
                  Order total
                </span>

                <strong>
                  {formatCurrency(
                    order.totalAmount,
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Order status
                </span>

                <strong>
                  {formatLabel(
                    order.status,
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Order payment
                </span>

                <strong>
                  {formatLabel(
                    order.paymentStatus,
                  )}
                </strong>
              </div>
            </div>
          </section>
        </main>

        <aside
          className={
            styles.sideColumn
          }
        >
          <section
            className={
              styles.card
            }
          >
            <div
              className={
                styles.cardTitle
              }
            >
              <CustomerIcon />

              <div>
                <h2>
                  Customer
                </h2>

                <p>
                  Payment owner.
                </p>
              </div>
            </div>

            <div
              className={
                styles.sideDetails
              }
            >
              <div>
                <span>
                  Name
                </span>

                <strong>
                  {customer.fullName ||
                    'Customer'}
                </strong>
              </div>

              <div>
                <span>
                  Email
                </span>

                <strong>
                  {customer.email ||
                    '—'}
                </strong>
              </div>

              <div>
                <span>
                  Phone
                </span>

                <strong>
                  {customer.phone ||
                    '—'}
                </strong>
              </div>
            </div>

            {customer._id ? (
              <Link
                href={`/admin/customers/${customer._id}`}
                className={
                  styles.fullButton
                }
              >
                View customer
              </Link>
            ) : null}
          </section>

          <section
            className={
              styles.card
            }
          >
            <div
              className={
                styles.cardTitle
              }
            >
              <PaymentIcon />

              <div>
                <h2>
                  Payment record
                </h2>

                <p>
                  Provider and
                  verification
                  information.
                </p>
              </div>
            </div>

            <div
              className={
                styles.sideDetails
              }
            >
              <div>
                <span>
                  Provider
                </span>

                <strong>
                  {formatLabel(
                    payment.provider,
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Purpose
                </span>

                <strong>
                  {formatLabel(
                    payment.purpose,
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Currency
                </span>

                <strong>
                  {payment.currency ||
                    'NGN'}
                </strong>
              </div>

              <div>
                <span>
                  Paid at
                </span>

                <strong>
                  {formatDate(
                    payment.paidAt,
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Verified at
                </span>

                <strong>
                  {formatDate(
                    payment.verifiedAt,
                  )}
                </strong>
              </div>
            </div>

            {payment.failureReason ? (
              <div
                className={
                  styles.failureBox
                }
              >
                <span>
                  Failure reason
                </span>

                <p>
                  {
                    payment.failureReason
                  }
                </p>
              </div>
            ) : null}
          </section>

          {canVerify ? (
            <section
              className={`${styles.card} ${styles.actionCard}`}
            >
              <div
                className={
                  styles.cardTitle
                }
              >
                <CheckIcon />

                <div>
                  <h2>
                    Verification
                  </h2>

                  <p>
                    Approve or reject
                    this payment.
                  </p>
                </div>
              </div>

              <label
                className={
                  styles.field
                }
              >
                <span>
                  Provider reference
                </span>

                <input
                  type="text"
                  value={
                    providerReference
                  }
                  onChange={(
                    event,
                  ) =>
                    setProviderReference(
                      event.target
                        .value,
                    )
                  }
                  placeholder="Optional bank/provider reference"
                  disabled={
                    submitting
                  }
                />
              </label>

              {action ===
              'reject' ? (
                <label
                  className={
                    styles.field
                  }
                >
                  <span>
                    Rejection reason
                  </span>

                  <textarea
                    value={
                      rejectionReason
                    }
                    onChange={(
                      event,
                    ) =>
                      setRejectionReason(
                        event.target
                          .value,
                      )
                    }
                    placeholder="Explain why this payment could not be verified..."
                    rows={4}
                    maxLength={500}
                    disabled={
                      submitting
                    }
                  />
                </label>
              ) : null}

              <div
                className={
                  styles.actionButtons
                }
              >
                {action ===
                'reject' ? (
                  <>
                    <button
                      type="button"
                      className={
                        styles.cancelButton
                      }
                      disabled={
                        submitting
                      }
                      onClick={() => {
                        setAction(
                          null,
                        );

                        setRejectionReason(
                          '',
                        );

                        setError(
                          '',
                        );
                      }}
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      className={
                        styles.rejectButton
                      }
                      disabled={
                        submitting
                      }
                      onClick={
                        rejectPayment
                      }
                    >
                      <RejectIcon />

                      {submitting
                        ? 'Rejecting...'
                        : 'Confirm rejection'}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className={
                        styles.rejectButton
                      }
                      disabled={
                        submitting
                      }
                      onClick={() => {
                        setError(
                          '',
                        );

                        setSuccess(
                          '',
                        );

                        setAction(
                          'reject',
                        );
                      }}
                    >
                      <RejectIcon />
                      Reject
                    </button>

                    <button
                      type="button"
                      className={
                        styles.approveButton
                      }
                      disabled={
                        submitting
                      }
                      onClick={
                        approvePayment
                      }
                    >
                      <CheckIcon />

                      {submitting
                        ? 'Approving...'
                        : 'Approve payment'}
                    </button>
                  </>
                )}
              </div>

              <div
                className={
                  styles.inventoryNotice
                }
              >
                <strong>
                  Inventory protection
                </strong>

                <p>
                  For a normal order,
                  approving payment
                  marks the order paid
                  and deducts its
                  inventory exactly
                  once.
                </p>
              </div>
            </section>
          ) : (
            <section
              className={
                styles.card
              }
            >
              <div
                className={
                  styles.completedState
                }
              >
                {isPaid ? (
                  <CheckIcon />
                ) : (
                  <RejectIcon />
                )}

                <strong>
                  {isPaid
                    ? 'Payment approved'
                    : isFailed
                      ? 'Verification failed'
                      : isRefunded
                        ? 'Payment refunded'
                        : 'Payment closed'}
                </strong>

                <p>
                  {isPaid
                    ? 'This payment has already been confirmed as paid.'
                    : 'This payment is not currently available for approval.'}
                </p>
              </div>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}