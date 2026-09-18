'use client';

import Link from 'next/link';
import {
  useParams,
  useSearchParams,
} from 'next/navigation';
import {
  useEffect,
  useState,
} from 'react';

import {
  getMyCreditInstallment,
} from '@/services/desire-credit.service';

import {
  getMyPayment,
  submitPaymentProof,
} from '@/services/payments.service';

import {
  getUploadedFileUrl,
  uploadSingleFile,
} from '@/services/uploads.service';

import styles from './payment-proof.module.css';

const MAX_FILE_SIZE =
  5 * 1024 * 1024;

const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
];

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

export default function InstallmentPaymentProofPage() {
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
    submitting,
    setSubmitting,
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
    senderName,
    setSenderName,
  ] = useState('');

  const [
    transferReference,
    setTransferReference,
  ] = useState('');

  const [
    transferDate,
    setTransferDate,
  ] = useState('');

  const [
    proof,
    setProof,
  ] = useState(null);

  const [
    customerNote,
    setCustomerNote,
  ] = useState('');

  const [
    error,
    setError,
  ] = useState('');

  const [
    submitError,
    setSubmitError,
  ] = useState('');

  const [
    success,
    setSuccess,
  ] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadPage() {
      if (
        !installmentId ||
        !paymentId
      ) {
        setLoading(false);

        setError(
          !paymentId
            ? 'Payment ID is missing.'
            : 'Installment ID is missing.',
        );

        return;
      }

      setLoading(true);
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

        if (!active) {
          return;
        }

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

        setSenderName(
          normalizedPayment.senderName ||
            '',
        );

        setTransferReference(
          normalizedPayment.transferReference ||
            '',
        );

        if (
          normalizedPayment.transferDate
        ) {
          const date =
            new Date(
              normalizedPayment.transferDate,
            );

          if (
            !Number.isNaN(
              date.getTime(),
            )
          ) {
            setTransferDate(
              date
                .toISOString()
                .slice(0, 10),
            );
          }
        }

        setCustomerNote(
          normalizedPayment.customerNote ||
            '',
        );

        /*
         * If the proof was already submitted,
         * don't allow another proof submission.
         */
        if (
          [
            'SUBMITTED',
            'PROCESSING',
            'PAID',
          ].includes(
            normalizedPayment.status,
          )
        ) {
          setSuccess(true);
        }
      } catch (requestError) {
        if (!active) {
          return;
        }

        setError(
          requestError?.message ||
            'Unable to load your payment information.',
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadPage();

    return () => {
      active = false;
    };
  }, [
    installmentId,
    paymentId,
  ]);

  function handleFileChange(
    event,
  ) {
    setSubmitError('');

    const file =
      event.target.files?.[0];

    if (!file) {
      setProof(null);
      return;
    }

    if (
      !ALLOWED_FILE_TYPES.includes(
        file.type,
      )
    ) {
      setProof(null);

      event.target.value =
        '';

      setSubmitError(
        'Please upload a JPG, PNG or WEBP image.',
      );

      return;
    }

    if (
      file.size >
      MAX_FILE_SIZE
    ) {
      setProof(null);

      event.target.value =
        '';

      setSubmitError(
        'Proof of payment must not exceed 5 MB.',
      );

      return;
    }

    setProof(file);
  }

  async function handleSubmit(
    event,
  ) {
    event.preventDefault();

    if (
      submitting ||
      success
    ) {
      return;
    }

    setSubmitError('');

    if (!paymentId) {
      setSubmitError(
        'Payment ID is missing.',
      );

      return;
    }

    if (
      !payment ||
      !payment._id
    ) {
      setSubmitError(
        'Payment information is unavailable.',
      );

      return;
    }

    if (!senderName.trim()) {
      setSubmitError(
        'Enter the name used for the transfer.',
      );

      return;
    }

    if (
      !transferReference.trim()
    ) {
      setSubmitError(
        'Enter your transfer reference.',
      );

      return;
    }

    if (!transferDate) {
      setSubmitError(
        'Select the transfer date.',
      );

      return;
    }

    if (!proof) {
      setSubmitError(
        'Upload your proof of payment.',
      );

      return;
    }

    const submittedAmount =
      Number(
        payment.amount,
      );

    if (
      !Number.isFinite(
        submittedAmount,
      ) ||
      submittedAmount <= 0
    ) {
      setSubmitError(
        'The payment amount is invalid.',
      );

      return;
    }

    setSubmitting(true);

    try {
      /*
       * Step 1:
       * Upload the screenshot using the
       * same upload service already used
       * by normal checkout payments.
       */
      const uploadResponse =
        await uploadSingleFile(
          proof,
        );

      const proofOfPaymentUrl =
        getUploadedFileUrl(
          uploadResponse,
        );

      if (!proofOfPaymentUrl) {
        throw new Error(
          'The screenshot was uploaded, but no file URL was returned.',
        );
      }

      /*
       * Step 2:
       * Submit the URL and transfer details
       * through the existing payment service.
       *
       * The amount is taken from the payment
       * record. The customer cannot change
       * the installment repayment amount.
       */
      const response =
        await submitPaymentProof(
          paymentId,
          {
            proofOfPaymentUrl,

            senderName:
              senderName.trim(),

            transferReference:
              transferReference.trim(),

            transferDate:
              new Date(
                `${transferDate}T12:00:00`,
              ).toISOString(),

            submittedAmount,

            customerNote:
              customerNote.trim(),
          },
        );

      const normalized =
        normalizePayment(
          response,
        );

      if (
        normalized?._id
      ) {
        setPayment(
          normalized,
        );
      } else {
        /*
         * Preserve the existing payment
         * locally if the endpoint does not
         * return the full payment object.
         */
        setPayment(
          (current) => ({
            ...current,
            status: 'SUBMITTED',
            proofOfPaymentUrl,
            senderName:
              senderName.trim(),
            transferReference:
              transferReference.trim(),
            submittedAmount,
          }),
        );
      }

      setSuccess(true);
    } catch (requestError) {
      setSubmitError(
        requestError?.message ||
          'Unable to submit your proof of payment.',
      );
    } finally {
      setSubmitting(false);
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
            Loading payment...
          </h1>

          <p>
            Preparing your proof
            of payment form.
          </p>
        </div>
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
            Payment unavailable
          </h1>

          <p>
            {error ||
              'The payment could not be loaded.'}
          </p>
        </section>
      </main>
    );
  }

  if (success) {
    const currentStatus =
      payment.status ||
      'SUBMITTED';

    return (
      <main
        className={
          styles.page
        }
      >
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
            PAYMENT PROOF
          </span>

          <h1>
            {currentStatus ===
            'PAID'
              ? 'Payment verified'
              : 'Payment received for verification'}
          </h1>

          <p>
            {currentStatus ===
            'PAID'
              ? 'Your payment has been verified. Continue to payment status so the verified repayment can be applied to this installment.'
              : 'Your transfer proof has been submitted. The payment must be verified before it can be applied to this DESIRE CREDIT installment.'}
          </p>

          <div
            className={
              styles.successDetails
            }
          >
            <div>
              <span>
                Payment reference
              </span>

              <strong>
                {payment.reference ||
                  'Not available'}
              </strong>
            </div>

            <div>
              <span>
                Amount
              </span>

              <strong>
                {formatNaira(
                  payment.amount,
                )}
              </strong>
            </div>

            <div>
              <span>
                Status
              </span>

              <strong>
                {currentStatus}
              </strong>
            </div>
          </div>

          <Link
            href={`/account/desire-credit/installments/${installment._id}/pay/status?paymentId=${payment._id}`}
            className={
              styles.successButton
            }
          >
            Check payment status
            <ArrowIcon />
          </Link>
        </section>
      </main>
    );
  }

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
          href={`/account/desire-credit/installments/${installment._id}/pay`}
        >
          <ArrowLeftIcon />
          Back to payment
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
            Submit transfer proof
          </h1>

          <p>
            Provide the transfer
            details and upload your
            payment receipt for
            verification.
          </p>
        </div>

        <div
          className={
            styles.heroAmount
          }
        >
          <span>
            Payment amount
          </span>

          <strong>
            {formatNaira(
              payment.amount ||
                installment.outstandingAmount,
            )}
          </strong>
        </div>
      </section>

      <section
        className={
          styles.layout
        }
      >
        <form
          className={
            styles.formCard
          }
          onSubmit={
            handleSubmit
          }
        >
          <div
            className={
              styles.formHeader
            }
          >
            <span
              className={
                styles.eyebrow
              }
            >
              TRANSFER DETAILS
            </span>

            <h2>
              Payment information
            </h2>

            <p>
              Enter the information
              exactly as it appears
              on your bank transfer
              receipt.
            </p>
          </div>

          <div
            className={
              styles.formGrid
            }
          >
            <label
              className={
                styles.fullField
              }
            >
              <span>
                Sender name
              </span>

              <input
                type="text"
                value={
                  senderName
                }
                onChange={(
                  event,
                ) =>
                  setSenderName(
                    event.target
                      .value,
                  )
                }
                placeholder="Name used for transfer"
                maxLength={150}
                required
              />
            </label>

            <label>
              <span>
                Transfer reference
              </span>

              <input
                type="text"
                value={
                  transferReference
                }
                onChange={(
                  event,
                ) =>
                  setTransferReference(
                    event.target
                      .value,
                  )
                }
                placeholder="Bank transaction reference"
                maxLength={150}
                required
              />
            </label>

            <label>
              <span>
                Transfer date
              </span>

              <input
                type="date"
                value={
                  transferDate
                }
                onChange={(
                  event,
                ) =>
                  setTransferDate(
                    event.target
                      .value,
                  )
                }
                required
              />
            </label>

            <div
              className={
                styles.fullField
              }
            >
              <span
                className={
                  styles.fieldLabel
                }
              >
                Proof of payment
              </span>

              <label
                className={
                  styles.uploadBox
                }
              >
                <UploadIcon />

                <strong>
                  {proof
                    ? proof.name
                    : 'Choose payment receipt'}
                </strong>

                <small>
                  JPG, PNG or WEBP.
                  Maximum 5 MB.
                </small>

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={
                    handleFileChange
                  }
                />
              </label>

              {proof ? (
                <div
                  className={
                    styles.selectedFile
                  }
                >
                  <span>
                    Selected
                  </span>

                  <strong>
                    {proof.name}
                  </strong>

                  <button
                    type="button"
                    onClick={() =>
                      setProof(
                        null,
                      )
                    }
                  >
                    Remove
                  </button>
                </div>
              ) : null}
            </div>

            <label
              className={
                styles.fullField
              }
            >
              <span>
                Note{' '}
                <small>
                  Optional
                </small>
              </span>

              <textarea
                value={
                  customerNote
                }
                onChange={(
                  event,
                ) =>
                  setCustomerNote(
                    event.target
                      .value,
                  )
                }
                placeholder="Add any information that may help verify the transfer."
                maxLength={1000}
                rows={5}
              />
            </label>
          </div>

          {submitError ? (
            <div
              className={
                styles.errorBanner
              }
            >
              {submitError}
            </div>
          ) : null}

          <div
            className={
              styles.formFooter
            }
          >
            <p>
              Make sure the transfer
              information is correct
              before submitting.
            </p>

            <button
              type="submit"
              disabled={
                submitting
              }
            >
              {submitting
                ? 'Uploading & submitting...'
                : 'Submit proof'}

              {!submitting ? (
                <ArrowIcon />
              ) : null}
            </button>
          </div>
        </form>

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
            PAYMENT SUMMARY
          </span>

          <div
            className={
              styles.summaryAmount
            }
          >
            <span>
              Amount
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
              label="Installment"
              value={`${installment.installmentNumber || 0} of ${installment.totalInstallments || 0}`}
            />

            <SummaryRow
              label="Due date"
              value={formatDate(
                installment.dueDate,
              )}
            />

            <SummaryRow
              label="Payment reference"
              value={
                payment.reference ||
                'Not available'
              }
            />

            <SummaryRow
              label="Payment status"
              value={
                payment.status ||
                'PENDING'
              }
            />
          </div>

          <div
            className={
              styles.notice
            }
          >
            <ShieldIcon />

            <div>
              <strong>
                Verification
                required
              </strong>

              <p>
                Uploading proof does
                not immediately mark
                the installment as
                paid. The transfer
                must first be
                verified.
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

function UploadIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M12 16V4M7 9l5-5 5 5" />
      <path d="M5 14v5h14v-5" />
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