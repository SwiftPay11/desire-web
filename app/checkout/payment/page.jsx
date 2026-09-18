'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  createOrder,
} from '@/services/orders.service';

import {
  createPayment,
  PAYMENT_PROVIDERS,
  PAYMENT_PURPOSES,
  submitPaymentProof,
} from '@/services/payments.service';

import {
  createCreditPurchase,
} from '@/services/desire-credit.service';

import styles from './payment.module.css';

import {
  getUploadedFileUrl,
  uploadSingleFile,
} from '@/services/uploads.service';

import {
  PAYMENT_BANK,
} from '@/config/payment-bank';

const CHECKOUT_INFORMATION_KEY =
  'desire_checkout_information';

const CHECKOUT_PAYMENT_KEY =
  'desire_checkout_payment';

const CHECKOUT_RESULT_KEY =
  'desire_checkout_result';

const PAYMENT_METHODS = {
  STANDARD: 'STANDARD',
  DESIRE_CREDIT: 'DESIRE_CREDIT',
};

function formatCurrency(value) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatInstallmentPlan(value) {
  if (!value) {
    return 'Not available';
  }

  return String(value)
    .toLowerCase()
    .split('_')
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1),
    )
    .join(' ');
}

function getDocumentId(document) {
  return (
    document?._id ||
    document?.id ||
    ''
  );
}

function getOrderFromResponse(response) {
  return (
    response?.order ||
    response?.data?.order ||
    null
  );
}

function getPaymentFromResponse(response) {
  return (
    response?.payment ||
    response?.data?.payment ||
    null
  );
}

function getCreditPurchaseFromResponse(
  response,
) {
  return (
    response?.creditPurchase ||
    response?.purchase ||
    response?.data?.creditPurchase ||
    response?.data?.purchase ||
    response ||
    null
  );
}

function ArrowLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M19 12H5M10 17l-5-5 5-5" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h14M14 7l5 5-5 5" />
    </svg>
  );
}

function CardIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="1"
      />
      <path d="M3 9h18M7 15h4" />
    </svg>
  );
}

function CreditIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 7h16v10H4z" />
      <path d="M8 11h8M8 14h5" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3 5 6v5c0 4.5 2.8 8 7 10 4.2-2 7-5.5 7-10V6l-7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

function PendingIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function PaymentSkeleton() {
  return (
    <main className={styles.loadingPage}>
      <section className={styles.loadingMain}>
        <span />
        <span />
        <span />
        <span />
      </section>

      <aside className={styles.loadingSummary}>
        <span />
        <span />
        <span />
        <span />
      </aside>
    </main>
  );
}

export default function CheckoutPaymentPage() {
  const router = useRouter();

  const [
    checkoutInformation,
    setCheckoutInformation,
  ] = useState(null);

  const [
    paymentSelection,
    setPaymentSelection,
  ] = useState(null);

  const [provider, setProvider] =
    useState(PAYMENT_PROVIDERS.MANUAL);

  const [loading, setLoading] =
    useState(true);

  const [processing, setProcessing] =
    useState(false);

  const [error, setError] =
    useState('');

  const [completedResult, setCompletedResult] =
    useState(null);

    const [showProofForm, setShowProofForm] =
  useState(false);

const [proofFile, setProofFile] =
  useState(null);

const [proofPreview, setProofPreview] =
  useState('');

const [proofForm, setProofForm] =
  useState({
    senderName: '',
    transferReference: '',
    submittedAmount: '',
    customerNote: '',
  });

const [submittingProof, setSubmittingProof] =
  useState(false);

const [proofSubmitted, setProofSubmitted] =
  useState(false);

const [copyMessage, setCopyMessage] =
  useState('');

  useEffect(() => {
    try {
      const informationValue =
        sessionStorage.getItem(
          CHECKOUT_INFORMATION_KEY,
        );

      const paymentValue =
        sessionStorage.getItem(
          CHECKOUT_PAYMENT_KEY,
        );

      if (
        !informationValue ||
        !paymentValue
      ) {
        router.replace('/checkout/review');
        return;
      }

      const information =
        JSON.parse(informationValue);

      const selection =
        JSON.parse(paymentValue);

      if (
        !information?.addressId ||
        !selection?.method
      ) {
        router.replace('/checkout/review');
        return;
      }

      if (
        selection.method ===
          PAYMENT_METHODS.DESIRE_CREDIT &&
        !selection?.credit
          ?.installmentPlan
      ) {
        router.replace('/checkout/review');
        return;
      }

      setCheckoutInformation(information);
      setPaymentSelection(selection);
    } catch (loadError) {
      console.error(
        'Unable to read checkout payment information:',
        loadError,
      );

      sessionStorage.removeItem(
        CHECKOUT_PAYMENT_KEY,
      );

      router.replace('/checkout/review');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
  return () => {
    if (proofPreview) {
      URL.revokeObjectURL(
        proofPreview,
      );
    }
  };
}, [proofPreview]);

  const isDesireCredit =
    paymentSelection?.method ===
    PAYMENT_METHODS.DESIRE_CREDIT;

  const amountDueNow = useMemo(() => {
    if (isDesireCredit) {
      return Number(
        paymentSelection?.credit
          ?.commitmentPayment || 0,
      );
    }

    return Number(
      paymentSelection?.orderTotal || 0,
    );
  }, [
    isDesireCredit,
    paymentSelection,
  ]);

  const financedAmount = Number(
    paymentSelection?.credit
      ?.financedAmount || 0,
  );

  function updateProofField(field, value) {
  setProofForm((current) => ({
    ...current,
    [field]: value,
  }));

  setError('');
}

function handleProofFileChange(event) {
  const file = event.target.files?.[0];

  if (!file) {
    return;
  }

  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
  ];

  if (!allowedTypes.includes(file.type)) {
    setError(
      'Upload a JPG, PNG, or WEBP screenshot.',
    );

    event.target.value = '';

    return;
  }

  const maximumSize =
    5 * 1024 * 1024;

  if (file.size > maximumSize) {
    setError(
      'Payment proof must not exceed 5 MB.',
    );

    event.target.value = '';

    return;
  }

  if (proofPreview) {
    URL.revokeObjectURL(
      proofPreview,
    );
  }

  setProofFile(file);

  setProofPreview(
    URL.createObjectURL(file),
  );

  setError('');
}

async function copyValue(value, label) {
  try {
    await navigator.clipboard.writeText(
      value,
    );

    setCopyMessage(
      `${label} copied.`,
    );

    window.setTimeout(() => {
      setCopyMessage('');
    }, 2500);
  } catch (copyError) {
    console.error(
      'Unable to copy value:',
      copyError,
    );

    setError(
      `Unable to copy ${label.toLowerCase()}.`,
    );
  }
}

function validateProofForm() {
  if (!proofFile) {
    return 'Select your payment screenshot.';
  }

  if (
    proofForm.senderName.trim().length <
    2
  ) {
    return 'Enter the sender or account name.';
  }

  if (
    proofForm.transferReference.trim()
      .length < 2
  ) {
    return 'Enter the bank transfer reference.';
  }

  const transferredAmount = Number(
    proofForm.submittedAmount,
  );

  if (
    !Number.isFinite(
      transferredAmount,
    ) ||
    transferredAmount <= 0
  ) {
    return 'Enter a valid transferred amount.';
  }

  return '';
}

  async function handleCreatePaymentFlow() {
    if (
      !checkoutInformation ||
      !paymentSelection ||
      processing
    ) {
      return;
    }

    try {
      setProcessing(true);
      setError('');

      /*
       * Step 1:
       * Create the order.
       *
       * Your backend validates stock again,
       * snapshots the delivery address and
       * clears the cart after creation.
       */
      const orderResponse =
        await createOrder({
          addressId:
            checkoutInformation.addressId,

          notes:
            checkoutInformation.notes ||
            '',
        });

      const order =
        getOrderFromResponse(
          orderResponse,
        );

      const orderId =
        getDocumentId(order);

      if (!orderId) {
        throw new Error(
          'The order was created, but no order ID was returned.',
        );
      }

      if (!isDesireCredit) {
        /*
         * Standard payment:
         * Create a payment for the complete
         * order total.
         */
        const paymentResponse =
          await createPayment({
            orderId,

            provider,

            currency: 'NGN',

            purpose:
              PAYMENT_PURPOSES.ORDER,
          });

        const payment =
          getPaymentFromResponse(
            paymentResponse,
          );

        const paymentId =
          getDocumentId(payment);

        if (!paymentId) {
          throw new Error(
            'The payment record was not returned.',
          );
        }

        const result = {
          method:
            PAYMENT_METHODS.STANDARD,

          order,

          payment,

          status:
            payment?.status ||
            'PENDING',

          message:
            'Your order and payment record were created successfully. Payment verification is pending.',
        };

        sessionStorage.setItem(
          CHECKOUT_RESULT_KEY,
          JSON.stringify(result),
        );

        setCompletedResult(result);

        window.dispatchEvent(
          new CustomEvent(
            'desire-cart-updated',
          ),
        );

        return;
      }

      /*
       * DESIRE CREDIT:
       * Create the credit purchase after the
       * order exists.
       */
      const creditPurchaseResponse =
        await createCreditPurchase({
          orderId,

          installmentPlan:
            paymentSelection.credit
              .installmentPlan,

          notes:
            checkoutInformation.notes ||
            '',
        });

      const creditPurchase =
        getCreditPurchaseFromResponse(
          creditPurchaseResponse,
        );

      const creditPurchaseId =
        getDocumentId(
          creditPurchase,
        );

      if (!creditPurchaseId) {
        throw new Error(
          'The DESIRE CREDIT purchase was not returned.',
        );
      }

      /*
       * Create a separate payment record for
       * only the required commitment amount.
       */
      const paymentResponse =
        await createPayment({
          orderId,

          provider,

          currency: 'NGN',

          purpose:
            PAYMENT_PURPOSES
              .DESIRE_CREDIT_COMMITMENT,

          creditPurchaseId,
        });

      const payment =
        getPaymentFromResponse(
          paymentResponse,
        );

      const paymentId =
        getDocumentId(payment);

      if (!paymentId) {
        throw new Error(
          'The commitment-payment record was not returned.',
        );
      }

      const result = {
        method:
          PAYMENT_METHODS.DESIRE_CREDIT,

        order,

        creditPurchase,

        payment,

        status:
          creditPurchase?.status ||
          'PENDING_COMMITMENT_PAYMENT',

        message:
          'Your DESIRE CREDIT purchase and commitment-payment record were created. Verification is pending.',
      };

      sessionStorage.setItem(
        CHECKOUT_RESULT_KEY,
        JSON.stringify(result),
      );

      setCompletedResult(result);

      window.dispatchEvent(
        new CustomEvent(
          'desire-cart-updated',
        ),
      );
    } catch (processError) {
      console.error(
        'Unable to create payment flow:',
        processError,
      );

      setError(
        processError?.message ||
          'We could not prepare your payment.',
      );
    } finally {
      setProcessing(false);
    }
  }

  async function handleSubmitProof(event) {
  event.preventDefault();

  if (!completedResult?.payment) {
    setError(
      'Create the payment record before uploading proof.',
    );

    return;
  }

  const validationError =
    validateProofForm();

  if (validationError) {
    setError(validationError);

    return;
  }

  const paymentId =
    getDocumentId(
      completedResult.payment,
    );

  if (!paymentId) {
    setError(
      'The payment ID is missing.',
    );

    return;
  }

  try {
    setSubmittingProof(true);
    setError('');

    const uploadResponse =
      await uploadSingleFile(
        proofFile,
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

    const response =
      await submitPaymentProof(
        paymentId,
        {
          proofOfPaymentUrl,

          senderName:
            proofForm.senderName,

          transferReference:
            proofForm.transferReference,

         transferDate:
  new Date().toISOString(),

          submittedAmount:
            Number(
              proofForm.submittedAmount,
            ),

          customerNote:
            proofForm.customerNote,
        },
      );

    const updatedPayment =
      response?.payment ||
      response?.data?.payment ||
      completedResult.payment;

    const updatedResult = {
      ...completedResult,

      payment:
        updatedPayment,

      status:
        updatedPayment?.status ||
        'SUBMITTED',

      message:
        'Your payment proof has been received and is awaiting verification.',
    };

    setCompletedResult(
      updatedResult,
    );

    setProofSubmitted(true);

    sessionStorage.setItem(
      CHECKOUT_RESULT_KEY,
      JSON.stringify(
        updatedResult,
      ),
    );
  } catch (submitError) {
    console.error(
      'Unable to submit payment proof:',
      submitError,
    );

    setError(
      submitError?.message ||
        'We could not submit your payment proof.',
    );
  } finally {
    setSubmittingProof(false);
  }
}

  function handleContinueAfterCreation() {
    if (!completedResult) {
      return;
    }

    router.push('/checkout/confirmation');
  }

  if (loading) {
    return <PaymentSkeleton />;
  }

  if (
    !checkoutInformation ||
    !paymentSelection
  ) {
    return null;
  }

  return (
    <main className={styles.page}>
      {!(
  proofSubmitted ||
  completedResult?.payment?.status ===
    'SUBMITTED'
) && (
  <div className={styles.topNavigation}>
        <Link
          href="/checkout/review"
          className={styles.backLink}
        >
          <ArrowLeftIcon />
          Back to review
        </Link>

        <div className={styles.steps}>
          <span>01 Information</span>
          <span>02 Review</span>

          <span className={styles.activeStep}>
            03 Payment
          </span>
        </div>
      </div>
      )}

      {!(
  proofSubmitted ||
  completedResult?.payment?.status ===
    'SUBMITTED'
) && (
  <section className={styles.hero}>
    <span className={styles.eyebrow}>
      Secure payment
    </span>

    <h1>
      {isDesireCredit
        ? 'Complete your commitment payment'
        : 'Complete your payment'}
    </h1>

    <p>
      {isDesireCredit
        ? 'Confirm your DESIRE CREDIT commitment payment before your installment purchase is activated.'
        : 'Create your secure payment record and continue to payment verification.'}
    </p>
  </section>
)}

      {error && (
        <div
          className={styles.errorBanner}
          role="alert"
        >
          <p>{error}</p>

          <button
            type="button"
            onClick={() => setError('')}
          >
            Dismiss
          </button>
        </div>
      )}

     
      {completedResult ? (
  proofSubmitted ||
completedResult.payment?.status ===
  'SUBMITTED' ? (
  <section className={styles.submittedCelebration}>
    <div
      className={styles.confetti}
      aria-hidden="true"
    >
      {Array.from({
        length: 28,
      }).map((_, index) => (
        <span key={index} />
      ))}
    </div>

    <div className={styles.celebrationGlow} />

    <div className={styles.celebrationLayout}>
      <div
        className={styles.mascotArea}
        aria-hidden="true"
      >
        <div className={styles.mascotShadow} />

        <div className={styles.cssMascot}>
          <div className={styles.mascotHat}>
            <span>D.</span>
          </div>

          <div className={styles.mascotHead}>
            <span className={styles.mascotEyeLeft} />
            <span className={styles.mascotEyeRight} />
            <span className={styles.mascotMouth} />
          </div>

         <div className={styles.mascotBody}>
  <img
    src="/images/desire-logo.png"
    alt="DESIRE"
    className={styles.mascotLogo}
  />
</div>

          <div className={styles.mascotArmLeft}>
            <span />
          </div>

          <div className={styles.mascotArmRight}>
            <span />
          </div>

          <div className={styles.mascotLegLeft} />
          <div className={styles.mascotLegRight} />
        </div>
      </div>

      <div className={styles.celebrationContent}>
        <div className={styles.successSeal}>
          <CheckIcon />
        </div>

        <span className={styles.celebrationEyebrow}>
          Proof received
        </span>

        <h2 className={styles.pidginHeadline}>
          You get level boss,
          <em>I hail o!</em>
        </h2>

        <p className={styles.professionalMessage}>
          Your payment proof has been received
          successfully and is now awaiting
          verification by the DESIRE team.
        </p>

        <div className={styles.celebrationDetails}>
          <article>
            <span>Order number</span>

            <strong>
              {completedResult.order
                ?.orderNumber ||
                'Created'}
            </strong>
          </article>

          <article>
            <span>Payment reference</span>

            <strong>
              {completedResult.payment
                ?.reference ||
                'Pending'}
            </strong>
          </article>

          <article>
            <span>Amount submitted</span>

            <strong>
              {formatCurrency(
                completedResult.payment
                  ?.submittedAmount ||
                  proofForm.submittedAmount,
              )}
            </strong>
          </article>

          <article>
            <span>Status</span>

            <strong
              className={styles.submittedStatus}
            >
              Submitted
            </strong>
          </article>
        </div>

        <div className={styles.verificationNotice}>
          <PendingIcon />

          <div>
            <strong>
              Awaiting verification
            </strong>

            <p>
              You will receive a confirmation
              after the payment is approved or
              rejected. Until then, it is not
              considered a successful payment.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={
            handleContinueAfterCreation
          }
          className={
            styles.celebrationButton
          }
        >
          <span>
            View order confirmation
          </span>

          <ArrowIcon />
        </button>
      </div>
    </div>
  </section>
) : (
    <section
      className={
        styles.transferPage
      }
    >
      {copyMessage && (
        <div
          className={
            styles.copyToast
          }
          role="status"
        >
          <CheckIcon />
          {copyMessage}
        </div>
      )}

      <div
        className={
          styles.transferLayout
        }
      >
        <div
          className={
            styles.transferMain
          }
        >
          <section
            className={
              styles.transferHeader
            }
          >
            <span
              className={
                styles.eyebrow
              }
            >
              Payment created
            </span>

            <h2>
              Complete your bank
              transfer
            </h2>

            <p>
              Transfer the exact amount
              below, then upload your
              screenshot for verification.
            </p>
          </section>

          <section
            className={
              styles.transferSteps
            }
          >
            <article>
              <span>01</span>
              <strong>
                Transfer funds
              </strong>
              <p>
                Send the exact amount to
                the DESIRE bank account.
              </p>
            </article>

            <article>
              <span>02</span>
              <strong>
                Upload proof
              </strong>
              <p>
                Submit a clear screenshot
                and transfer information.
              </p>
            </article>

            <article>
              <span>03</span>
              <strong>
                Verification
              </strong>
              <p>
                The DESIRE team confirms
                receipt of the transfer.
              </p>
            </article>

            <article>
              <span>04</span>
              <strong>
                Order processing
              </strong>
              <p>
                Your order proceeds after
                approval.
              </p>
            </article>
          </section>

          <section
            className={
              styles.bankCard
            }
          >
            <div
              className={
                styles.bankCardHeader
              }
            >
              <div>
                <span>
                  DESIRE BANK DETAILS
                </span>

                <h3>
                  Make your transfer
                </h3>
              </div>

              <strong>
                {formatCurrency(
                  completedResult.payment
                    ?.amount,
                )}
              </strong>
            </div>

            <div
              className={
                styles.bankDetails
              }
            >
              <div>
                <span>Bank name</span>
                <strong>
                  {
                    PAYMENT_BANK.bankName
                  }
                </strong>
              </div>

              <div>
                <span>
                  Account name
                </span>
                <strong>
                  {
                    PAYMENT_BANK.accountName
                  }
                </strong>
              </div>

              <div>
                <span>
                  Account number
                </span>

                <div
                  className={
                    styles.copyRow
                  }
                >
                  <strong>
                    {
                      PAYMENT_BANK.accountNumber
                    }
                  </strong>

                  <button
                    type="button"
                    onClick={() =>
                      copyValue(
                        PAYMENT_BANK.accountNumber,
                        'Account number',
                      )
                    }
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div>
                <span>
                  Payment reference
                </span>

                <div
                  className={
                    styles.copyRow
                  }
                >
                  <strong>
                    {completedResult.payment
                      ?.reference}
                  </strong>

                  <button
                    type="button"
                    onClick={() =>
                      copyValue(
                        completedResult
                          .payment
                          ?.reference ||
                          '',
                        'Payment reference',
                      )
                    }
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>

            <div
              className={
                styles.referenceNotice
              }
            >
              <ShieldIcon />

              <p>
                Use the payment reference
                in your transfer narration
                whenever your banking app
                allows it.
              </p>
            </div>
          </section>

          {!showProofForm ? (
            <button
              type="button"
              onClick={() =>
                setShowProofForm(true)
              }
              className={
                styles.transferCompletedButton
              }
            >
              I’ve completed my transfer
              <ArrowIcon />
            </button>
          ) : (
            <form
              className={
                styles.proofForm
              }
              onSubmit={
                handleSubmitProof
              }
            >
              <div
                className={
                  styles.proofFormHeader
                }
              >
                <div>
                  <span
                    className={
                      styles.eyebrow
                    }
                  >
                    Payment evidence
                  </span>

                  <h3>
                    Upload your proof
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setShowProofForm(
                      false,
                    )
                  }
                >
                  Close
                </button>
              </div>

              <label
                className={
                  styles.uploadArea
                }
              >
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={
                    handleProofFileChange
                  }
                />

                {proofPreview ? (
                  <img
                    src={proofPreview}
                    alt="Payment proof preview"
                  />
                ) : (
                  <div>
                    <strong>
                      Choose payment
                      screenshot
                    </strong>

                    <span>
                      JPG, PNG or WEBP,
                      maximum 5 MB
                    </span>
                  </div>
                )}
              </label>

              <div
                className={
                  styles.proofGrid
                }
              >
                <label>
                  <span>
                    Sender/account name
                  </span>

                  <input
                    type="text"
                    value={
                      proofForm.senderName
                    }
                    onChange={(event) =>
                      updateProofField(
                        'senderName',
                        event.target.value,
                      )
                    }
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
                      proofForm.transferReference
                    }
                    onChange={(event) =>
                      updateProofField(
                        'transferReference',
                        event.target.value,
                      )
                    }
                    required
                  />
                </label>


                <label>
                  <span>
                    Amount transferred
                  </span>

                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={
                      proofForm.submittedAmount
                    }
                    onChange={(event) =>
                      updateProofField(
                        'submittedAmount',
                        event.target.value,
                      )
                    }
                    placeholder={String(
                      completedResult.payment
                        ?.amount || '',
                    )}
                    required
                  />
                </label>

                <label
                  className={
                    styles.fullWidth
                  }
                >
                  <span>
                    Optional note
                  </span>

                  <textarea
                    value={
                      proofForm.customerNote
                    }
                    onChange={(event) =>
                      updateProofField(
                        'customerNote',
                        event.target.value.slice(
                          0,
                          1000,
                        ),
                      )
                    }
                    maxLength={1000}
                  />
                </label>
              </div>

              <button
                type="submit"
                disabled={
                  submittingProof
                }
                className={
                  styles.submitProofButton
                }
              >
                <span>
                  {submittingProof
                    ? 'Submitting proof...'
                    : 'Submit payment proof'}
                </span>

                <ArrowIcon />
              </button>
            </form>
          )}
        </div>

        <aside
          className={
            styles.transferSummary
          }
        >
          <span
            className={
              styles.eyebrow
            }
          >
            Transfer summary
          </span>

          <h3>
            {isDesireCredit
              ? 'Commitment payment'
              : 'Order payment'}
          </h3>

          <div
            className={
              styles.transferAmount
            }
          >
            <span>Amount due</span>

            <strong>
              {formatCurrency(
                completedResult.payment
                  ?.amount,
              )}
            </strong>
          </div>

          <div
            className={
              styles.transferSummaryRows
            }
          >
            <div>
              <span>Order number</span>

              <strong>
                {completedResult.order
                  ?.orderNumber ||
                  'Created'}
              </strong>
            </div>

            <div>
              <span>Purpose</span>

              <strong>
                {completedResult.payment
                  ?.purpose ||
                  (isDesireCredit
                    ? 'DESIRE_CREDIT_COMMITMENT'
                    : 'ORDER')}
              </strong>
            </div>

            <div>
              <span>Status</span>
              <strong>PENDING</strong>
            </div>

            <div>
              <span>Currency</span>
              <strong>NGN</strong>
            </div>
          </div>

          <div
            className={
              styles.transferWarning
            }
          >
            <PendingIcon />

            <p>
              Creating the payment record
              does not confirm that money
              has been received. Upload
              proof after completing the
              transfer.
            </p>
          </div>
        </aside>
      </div>
    </section>
  )
) : (
        <section className={styles.paymentLayout}>
          <div className={styles.mainColumn}>
            <article className={styles.paymentCard}>
              <div className={styles.cardHeader}>
                <div
                  className={
                    styles.methodIcon
                  }
                >
                  {isDesireCredit ? (
                    <CreditIcon />
                  ) : (
                    <CardIcon />
                  )}
                </div>

                <div>
                  <span className={styles.eyebrow}>
                    Selected method
                  </span>

                  <h2>
                    {isDesireCredit
                      ? 'DESIRE CREDIT'
                      : 'Standard payment'}
                  </h2>
                </div>
              </div>

              {isDesireCredit ? (
                <div
                  className={
                    styles.creditOverview
                  }
                >
                  <div
                    className={
                      styles.primaryAmount
                    }
                  >
                    <span>
                      Commitment payment
                    </span>

                    <strong>
                      {formatCurrency(
                        amountDueNow,
                      )}
                    </strong>
                  </div>

                  <div
                    className={
                      styles.creditDetails
                    }
                  >
                    <div>
                      <span>
                        Order total
                      </span>

                      <strong>
                        {formatCurrency(
                          paymentSelection
                            .orderTotal,
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Amount financed
                      </span>

                      <strong>
                        {formatCurrency(
                          financedAmount,
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Installment plan
                      </span>

                      <strong>
                        {formatInstallmentPlan(
                          paymentSelection
                            ?.credit
                            ?.installmentPlan,
                        )}
                      </strong>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  className={
                    styles.standardOverview
                  }
                >
                  <span>
                    Complete order amount
                  </span>

                  <strong>
                    {formatCurrency(
                      amountDueNow,
                    )}
                  </strong>

                  <p>
                    This payment covers the
                    complete order total.
                  </p>
                </div>
              )}
            </article>

            <article className={styles.providerPanel}>
              <div className={styles.sectionHeader}>
                <span className={styles.eyebrow}>
                  Payment provider
                </span>

                <h2>
                  Choose a payment option
                </h2>
              </div>

              <div
                className={
                  styles.providerGrid
                }
              >
                <button
                  type="button"
                  onClick={() =>
                    setProvider(
                      PAYMENT_PROVIDERS.MANUAL,
                    )
                  }
                  className={`${styles.providerCard} ${
                    provider ===
                    PAYMENT_PROVIDERS.MANUAL
                      ? styles.selectedProvider
                      : ''
                  }`}
                >
                  <span
                    className={
                      styles.providerRadio
                    }
                  />

                  <strong>
                    Manual payment
                  </strong>

                  <p>
                    Create a payment record
                    for verification by the
                    DESIRE team.
                  </p>
                </button>

                <button
                  type="button"
                  disabled
                  className={`${styles.providerCard} ${styles.disabledProvider}`}
                >
                  <span
                    className={
                      styles.providerRadio
                    }
                  />

                  <strong>Paystack</strong>

                  <p>
                    Automatic provider
                    integration will be added
                    later.
                  </p>

                  <small>Coming soon</small>
                </button>

                <button
                  type="button"
                  disabled
                  className={`${styles.providerCard} ${styles.disabledProvider}`}
                >
                  <span
                    className={
                      styles.providerRadio
                    }
                  />

                  <strong>
                    Flutterwave
                  </strong>

                  <p>
                    Automatic provider
                    integration will be added
                    later.
                  </p>

                  <small>Coming soon</small>
                </button>
              </div>
            </article>

            <article className={styles.noticePanel}>
              <ShieldIcon />

              <div>
                <strong>
                  Payment verification
                </strong>

                <p>
                  The current payment system
                  uses manual verification.
                  Creating this record does
                  not mark the payment as
                  successful. The payment
                  will remain pending until
                  verified by an administrator
                  or a future payment-provider
                  integration.
                </p>
              </div>
            </article>
          </div>

          <aside className={styles.summaryPanel}>
            <span className={styles.eyebrow}>
              Payment summary
            </span>

            <h2>
              {isDesireCredit
                ? 'Commitment total'
                : 'Order total'}
            </h2>

            <div className={styles.summaryRows}>
              <div>
                <span>Order total</span>

                <strong>
                  {formatCurrency(
                    paymentSelection
                      .orderTotal,
                  )}
                </strong>
              </div>

              {isDesireCredit && (
                <>
                  <div>
                    <span>
                      Commitment payment
                    </span>

                    <strong>
                      {formatCurrency(
                        amountDueNow,
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Financed amount
                    </span>

                    <strong>
                      {formatCurrency(
                        financedAmount,
                      )}
                    </strong>
                  </div>
                </>
              )}

              <div>
                <span>Currency</span>
                <strong>NGN</strong>
              </div>

              <div>
                <span>Provider</span>

                <strong>
                  {provider}
                </strong>
              </div>
            </div>

            <div className={styles.totalRow}>
              <span>Due now</span>

              <strong>
                {formatCurrency(
                  amountDueNow,
                )}
              </strong>
            </div>

            <button
              type="button"
              onClick={
                handleCreatePaymentFlow
              }
              disabled={processing}
              className={
                styles.createPaymentButton
              }
            >
              <span>
                {processing
                  ? 'Preparing payment...'
                  : isDesireCredit
                    ? 'Create commitment payment'
                    : 'Create payment'}
              </span>

              <ArrowIcon />
            </button>

            <Link
              href="/checkout/review"
              className={styles.returnLink}
            >
              Change payment method
            </Link>

            <div className={styles.summaryNotice}>
              <CheckIcon />

              <p>
                Stock, address ownership and
                order totals will be validated
                again by the backend.
              </p>
            </div>
          </aside>
        </section>
      )}
    </main>
  );
}