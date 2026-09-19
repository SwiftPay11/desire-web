'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  getAddresses,
} from '@/services/addresses.service';

import {
  getCart,
} from '@/services/cart.service';

import {
  getMyCreditAccount,
} from '@/services/desire-credit.service';

import styles from './review.module.css';

const CHECKOUT_INFORMATION_KEY =
  'desire_checkout_information';

const CHECKOUT_PAYMENT_KEY =
  'desire_checkout_payment';

const PAYMENT_METHODS = {
  STANDARD: 'STANDARD',
  DESIRE_CREDIT: 'DESIRE_CREDIT',
};

function formatCurrency(value) {
  const amount = Number(value || 0);

  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
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

function normalizeCart(response) {
  const cart =
    response?.cart ||
    response?.data?.cart;

  if (!cart) {
    return {
      id: '',
      items: [],
      totalItems: 0,
      totalAmount: 0,
    };
  }

  return {
    id: cart.id || '',
    items: Array.isArray(cart.items)
      ? cart.items
      : [],
    totalItems: Number(
      cart.totalItems || 0,
    ),
    totalAmount: Number(
      cart.totalAmount || 0,
    ),
  };
}

function normalizeAddresses(response) {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.addresses)) {
    return response.addresses;
  }

  if (
    Array.isArray(
      response?.data?.addresses,
    )
  ) {
    return response.data.addresses;
  }

  return [];
}

function normalizeCreditAccount(
  response,
) {
  return (
    response?.account ||
    response?.creditAccount ||
    response?.data?.account ||
    response?.data?.creditAccount ||
    response?.data ||
    response ||
    null
  );
}

function getAddressId(address) {
  return (
    address?._id ||
    address?.id ||
    ''
  );
}

function getProduct(item) {
  if (
    item?.product &&
    typeof item.product === 'object'
  ) {
    return item.product;
  }

  return {};
}

function getProductImage(product) {
  const image =
    Array.isArray(product?.images) &&
    product.images.length > 0
      ? product.images[0]
      : '';

  if (!image) {
    return '/images/product-placeholder.jpg';
  }

  if (
    image.startsWith('http://') ||
    image.startsWith('https://') ||
    image.startsWith('/')
  ) {
    return image;
  }

  return `/${image}`;
}

function getCreditEligibility(
  account,
  orderTotal,
) {
  if (!account) {
    return {
      eligible: false,
      reason:
        'You do not currently have an approved DESIRE CREDIT account.',
      commitmentPayment: 0,
      financedAmount: 0,
      availableCredit: 0,
      creditLimit: 0,
    };
  }

  const accountStatus =
    String(
      account.status || '',
    ).toUpperCase();

  if (
    accountStatus !== 'ACTIVE'
  ) {
    return {
      eligible: false,
      reason:
        'Your DESIRE CREDIT account is not currently active.',
      commitmentPayment: Number(
        account.commitmentPayment ??
          account.commitmentPaymentAmount ??
          0,
      ),
      financedAmount: 0,
      availableCredit: 0,
      creditLimit: 0,
    };
  }

  const total = Number(
    orderTotal || 0,
  );

  const creditLimit = Number(
    account.creditLimit ??
      account.approvedAmount ??
      account.approvedCreditLimit ??
      0,
  );

  const usedCredit = Number(
    account.usedCredit ??
      account.usedAmount ??
      account.creditUsed ??
      0,
  );

  const returnedAvailableCredit =
    account.availableCredit ??
    account.availableAmount ??
    account.remainingCredit;

  const availableCredit =
    returnedAvailableCredit !==
      undefined &&
    returnedAvailableCredit !== null
      ? Number(
          returnedAvailableCredit,
        )
      : Math.max(
          0,
          creditLimit -
            usedCredit,
        );

  const commitmentPayment =
    Number(
      account.commitmentPayment ??
        account.commitmentPaymentAmount ??
        0,
    );

  if (
    !Number.isFinite(total) ||
    total <= 0
  ) {
    return {
      eligible: false,
      reason:
        'Your order total is invalid.',
      commitmentPayment,
      financedAmount: 0,
      availableCredit,
      creditLimit,
    };
  }

  if (
    total <= commitmentPayment
  ) {
    return {
      eligible: false,
      reason:
        'Your order total must be greater than the required commitment payment.',
      commitmentPayment,
      financedAmount: 0,
      availableCredit,
      creditLimit,
    };
  }

  const financedAmount =
    total - commitmentPayment;

  if (
    financedAmount >
    availableCredit
  ) {
    return {
      eligible: false,
      reason:
        'Your available DESIRE CREDIT is not enough to finance this order.',
      commitmentPayment,
      financedAmount,
      availableCredit,
      creditLimit,
    };
  }

  return {
    eligible: true,
    reason: '',
    commitmentPayment,
    financedAmount,
    availableCredit,
    creditLimit,
  };
}

function ArrowLeftIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M19 12H5M10 17l-5-5 5-5" />
    </svg>
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

function CardIcon() {
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

      <path d="M3 9h18M7 15h4" />
    </svg>
  );
}

function CreditIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M4 7h16v10H4z" />
      <path d="M8 11h8M8 14h5" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M19 10c0 5-7 10-7 10S5 15 5 10a7 7 0 1 1 14 0Z" />
      <circle
        cx="12"
        cy="10"
        r="2.2"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M5 8h14l-1 12H6L5 8Z" />
      <path d="M9 9V6a3 3 0 0 1 6 0v3" />
    </svg>
  );
}

function ReviewSkeleton() {
  return (
    <main className={styles.loadingPage}>
      <div
        className={styles.loadingMain}
      >
        <span />
        <span />
        <span />
        <span />
      </div>

      <aside
        className={styles.loadingSummary}
      >
        <span />
        <span />
        <span />
        <span />
      </aside>
    </main>
  );
}

export default function CheckoutReviewPage() {
  const router = useRouter();

  const [cart, setCart] = useState({
    id: '',
    items: [],
    totalItems: 0,
    totalAmount: 0,
  });

  const [
    checkoutInformation,
    setCheckoutInformation,
  ] = useState(null);

  const [
    selectedAddress,
    setSelectedAddress,
  ] = useState(null);

  const [
    creditAccount,
    setCreditAccount,
  ] = useState(null);

  const [
    creditAccountMissing,
    setCreditAccountMissing,
  ] = useState(false);

  const [
    paymentMethod,
    setPaymentMethod,
  ] = useState(
    PAYMENT_METHODS.STANDARD,
  );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const [
    creditLoading,
    setCreditLoading,
  ] = useState(true);

  const [
    continuing,
    setContinuing,
  ] = useState(false);

  const loadReview =
    useCallback(async () => {
      try {
        setLoading(true);
        setCreditLoading(true);
        setError('');

        const storedInformation =
          sessionStorage.getItem(
            CHECKOUT_INFORMATION_KEY,
          );

        if (!storedInformation) {
          router.replace('/checkout');
          return;
        }

        let parsedInformation;

        try {
          parsedInformation =
            JSON.parse(
              storedInformation,
            );
        } catch {
          sessionStorage.removeItem(
            CHECKOUT_INFORMATION_KEY,
          );

          router.replace('/checkout');
          return;
        }

        if (
          !parsedInformation?.addressId
        ) {
          router.replace('/checkout');
          return;
        }

        setCheckoutInformation(
          parsedInformation,
        );

        const [
          cartResult,
          addressesResult,
          creditResult,
        ] = await Promise.allSettled([
          getCart(),
          getAddresses(),
          getMyCreditAccount(),
        ]);

        if (
          cartResult.status ===
          'rejected'
        ) {
          if (
            cartResult.reason?.status ===
            401
          ) {
            router.push(
              `/login?redirect=${encodeURIComponent(
                '/checkout/review',
              )}`,
            );

            return;
          }

          throw cartResult.reason;
        }

        const loadedCart =
          normalizeCart(
            cartResult.value,
          );

        if (
          loadedCart.items.length === 0
        ) {
          router.replace('/cart');
          return;
        }

        setCart(loadedCart);

        if (
          addressesResult.status ===
          'rejected'
        ) {
          throw addressesResult.reason;
        }

        const loadedAddresses =
          normalizeAddresses(
            addressesResult.value,
          );

        const address =
          loadedAddresses.find(
            (item) =>
              String(
                getAddressId(item),
              ) ===
              String(
                parsedInformation.addressId,
              ),
          );

        if (!address) {
          setError(
            'The selected delivery address could not be found. Return to checkout and choose another address.',
          );

          return;
        }

        setSelectedAddress(address);

        if (
          creditResult.status ===
          'fulfilled'
        ) {
          const normalizedCreditAccount =
            normalizeCreditAccount(
              creditResult.value,
            );

          setCreditAccount(
            normalizedCreditAccount,
          );

          setCreditAccountMissing(
            !normalizedCreditAccount,
          );
        } else if (
          creditResult.reason?.status ===
          404
        ) {
          setCreditAccount(null);
          setCreditAccountMissing(true);
        } else {
          console.error(
            'Unable to load DESIRE CREDIT account:',
            creditResult.reason,
          );

          setCreditAccount(null);
          setCreditAccountMissing(false);
        }
      } catch (loadError) {
        console.error(
          'Unable to load checkout review:',
          loadError,
        );

        setError(
          loadError?.message ||
            'We could not load your order review.',
        );
      } finally {
        setLoading(false);
        setCreditLoading(false);
      }
    }, [router]);

  useEffect(() => {
    loadReview();
  }, [loadReview]);

  const subtotal = Number(
    cart.totalAmount || 0,
  );

  const shippingFee = 0;
  const discount = 0;

  const total =
    subtotal +
    shippingFee -
    discount;

  const creditEligibility =
    useMemo(
      () =>
        getCreditEligibility(
          creditAccount,
          total,
        ),
      [
        creditAccount,
        total,
      ],
    );

  const selectedPaymentIsValid =
    paymentMethod ===
      PAYMENT_METHODS.STANDARD ||
    (paymentMethod ===
      PAYMENT_METHODS.DESIRE_CREDIT &&
      creditEligibility.eligible);

  function handleSelectPayment(
    method,
  ) {
    setError('');

    if (
      method ===
        PAYMENT_METHODS.DESIRE_CREDIT &&
      !creditEligibility.eligible
    ) {
      setPaymentMethod(
        PAYMENT_METHODS.DESIRE_CREDIT,
      );

      return;
    }

    setPaymentMethod(method);
  }

  function handleContinue() {
    if (!checkoutInformation) {
      router.replace('/checkout');
      return;
    }

    if (!selectedAddress) {
      setError(
        'Your selected delivery address is unavailable.',
      );

      return;
    }

    if (
      paymentMethod ===
        PAYMENT_METHODS.DESIRE_CREDIT &&
      !creditEligibility.eligible
    ) {
      setError(
        creditEligibility.reason ||
          'DESIRE CREDIT is not available for this order.',
      );

      return;
    }

    try {
      setContinuing(true);
      setError('');

      const paymentSelection = {
        method: paymentMethod,

        addressId:
          checkoutInformation.addressId,

        notes:
          checkoutInformation.notes || '',

        orderTotal: total,

        credit:
          paymentMethod ===
          PAYMENT_METHODS.DESIRE_CREDIT
            ? {
                accountId:
                  creditAccount?._id ||
                  creditAccount?.id,

                commitmentPayment:
                  creditEligibility.commitmentPayment,

                financedAmount:
                  creditEligibility.financedAmount,

                installmentPlan:
                  creditAccount?.installmentPlan,
              }
            : null,
      };

      sessionStorage.setItem(
        CHECKOUT_PAYMENT_KEY,
        JSON.stringify(
          paymentSelection,
        ),
      );

      router.push('/checkout/payment');
    } catch (continueError) {
      console.error(
        'Unable to continue to payment:',
        continueError,
      );

      setError(
        'We could not save your payment selection.',
      );

      setContinuing(false);
    }
  }

  if (loading) {
    return <ReviewSkeleton />;
  }

  return (
    <main className={styles.page}>
      <div className={styles.topNavigation}>
        <Link
          href="/checkout"
          className={styles.backLink}
        >
          <ArrowLeftIcon />
          Edit information
        </Link>

        <div className={styles.steps}>
          <span>01 Information</span>

          <span
            className={styles.activeStep}
          >
            02 Review
          </span>

          <span>03 Payment</span>
        </div>
      </div>

      <section className={styles.hero}>
        <span className={styles.eyebrow}>
          Final review
        </span>

        <h1>Review your order</h1>

        <p>
          Confirm your products, delivery
          information and preferred payment
          method before continuing.
        </p>
      </section>

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

      <section
        className={styles.reviewLayout}
      >
        <div className={styles.mainColumn}>
          <article className={styles.panel}>
            <div
              className={styles.panelHeader}
            >
              <div>
                <span
                  className={
                    styles.eyebrow
                  }
                >
                  Your selection
                </span>

                <h2>Order products</h2>
              </div>

              <Link
                href="/cart"
                className={styles.editLink}
              >
                Edit cart
              </Link>
            </div>

            <div className={styles.productList}>
              {cart.items.map((item) => {
                const product =
                  getProduct(item);

                return (
                  <article
                    key={
                      item.id ||
                      `${product.id}-${item.size}-${item.color}`
                    }
                    className={
                      styles.productItem
                    }
                  >
                    <div
                      className={
                        styles.productImage
                      }
                    >
                      <img
                        src={getProductImage(
                          product,
                        )}
                        alt={
                          product.name ||
                          'DESIRE product'
                        }
                        onError={(event) => {
                          event.currentTarget.src =
                            '/images/product-placeholder.jpg';
                        }}
                      />

                      <span>
                        {item.quantity}
                      </span>
                    </div>

                    <div
                      className={
                        styles.productDetails
                      }
                    >
                      <span>
                        DESIRE
                      </span>

                      <h3>
                        {product.name ||
                          'DESIRE Product'}
                      </h3>

                      <p>
                        Size: {item.size}
                        <br />
                        Colour: {item.color}
                      </p>

                      <small>
                        {formatCurrency(
                          product.price,
                        )}{' '}
                        each
                      </small>
                    </div>

                    <strong
                      className={
                        styles.productSubtotal
                      }
                    >
                      {formatCurrency(
                        item.subtotal,
                      )}
                    </strong>
                  </article>
                );
              })}
            </div>
          </article>

          <article className={styles.panel}>
            <div
              className={styles.panelHeader}
            >
              <div>
                <span
                  className={
                    styles.eyebrow
                  }
                >
                  Delivery information
                </span>

                <h2>
                  Shipping address
                </h2>
              </div>

              <Link
                href="/checkout"
                className={styles.editLink}
              >
                Change address
              </Link>
            </div>

            {selectedAddress ? (
              <div
                className={
                  styles.addressReview
                }
              >
                <span
                  className={
                    styles.addressIcon
                  }
                >
                  <LocationIcon />
                </span>

                <div>
                  <strong>
                    {
                      selectedAddress.fullName
                    }
                  </strong>

                  <p>
                    {
                      selectedAddress.addressLine1
                    }
                  </p>

                  {selectedAddress.addressLine2 && (
                    <p>
                      {
                        selectedAddress.addressLine2
                      }
                    </p>
                  )}

                  <p>
                    {selectedAddress.city},{' '}
                    {selectedAddress.state}
                  </p>

                  <p>
                    {selectedAddress.country}
                    {selectedAddress.postalCode
                      ? `, ${selectedAddress.postalCode}`
                      : ''}
                  </p>

                  <p>
                    {
                      selectedAddress.phone
                    }
                  </p>
                </div>

                {selectedAddress.isDefault && (
                  <span
                    className={
                      styles.defaultBadge
                    }
                  >
                    Default
                  </span>
                )}
              </div>
            ) : (
              <p
                className={
                  styles.missingInformation
                }
              >
                The selected delivery
                address is unavailable.
              </p>
            )}
          </article>

          <article className={styles.panel}>
            <div
              className={styles.panelHeader}
            >
              <div>
                <span
                  className={
                    styles.eyebrow
                  }
                >
                  Instructions
                </span>

                <h2>Order notes</h2>
              </div>

              <Link
                href="/checkout"
                className={styles.editLink}
              >
                Edit notes
              </Link>
            </div>

            <div className={styles.notesReview}>
              {checkoutInformation?.notes ? (
                <p>
                  {
                    checkoutInformation.notes
                  }
                </p>
              ) : (
                <p>
                  No additional order
                  instructions were provided.
                </p>
              )}
            </div>
          </article>

          <article className={styles.panel}>
            <div
              className={styles.panelHeader}
            >
              <div>
                <span
                  className={
                    styles.eyebrow
                  }
                >
                  Payment preference
                </span>

                <h2>
                  Choose how to pay
                </h2>
              </div>
            </div>

            <div
              className={
                styles.paymentOptions
              }
            >
              <button
                type="button"
                onClick={() =>
                  handleSelectPayment(
                    PAYMENT_METHODS.STANDARD,
                  )
                }
                className={`${styles.paymentCard} ${
                  paymentMethod ===
                  PAYMENT_METHODS.STANDARD
                    ? styles.selectedPayment
                    : ''
                }`}
              >
                <span
                  className={
                    styles.paymentRadio
                  }
                />

                <span
                  className={
                    styles.paymentIcon
                  }
                >
                  <CardIcon />
                </span>

                <span
                  className={
                    styles.paymentContent
                  }
                >
                  <strong>
                    Standard payment
                  </strong>

                  <small>
                    Pay the complete order
                    amount using the standard
                    payment process.
                  </small>

                  <b>
                    {formatCurrency(total)}
                  </b>
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleSelectPayment(
                    PAYMENT_METHODS.DESIRE_CREDIT,
                  )
                }
                className={`${styles.paymentCard} ${
                  paymentMethod ===
                  PAYMENT_METHODS.DESIRE_CREDIT
                    ? styles.selectedPayment
                    : ''
                } ${
                  !creditEligibility.eligible
                    ? styles.unavailablePayment
                    : ''
                }`}
              >
                <span
                  className={
                    styles.paymentRadio
                  }
                />

                <span
                  className={
                    styles.paymentIcon
                  }
                >
                  <CreditIcon />
                </span>

                <span
                  className={
                    styles.paymentContent
                  }
                >
                  <strong>
                    DESIRE CREDIT
                  </strong>

                  <small>
                    Make your commitment
                    payment now and repay the
                    financed amount according
                    to your approved plan.
                  </small>

                  <b>
                    {creditLoading
                      ? 'Checking account...'
                      : creditEligibility.eligible
                        ? `${formatCurrency(
                            creditEligibility.commitmentPayment,
                          )} commitment`
                        : 'Unavailable'}
                  </b>
                </span>
              </button>
            </div>

            {paymentMethod ===
              PAYMENT_METHODS.DESIRE_CREDIT && (
              <div
                className={
                  styles.creditPanel
                }
              >
                <div
                  className={
                    styles.creditPanelHeader
                  }
                >
                  <div>
                    <span
                      className={
                        styles.creditLabel
                      }
                    >
                      DESIRE CREDIT account
                    </span>

                    <h3>
                      Shop now. Repay over
                      time.
                    </h3>
                  </div>

                  <span
                    className={`${styles.creditStatus} ${
                      creditEligibility.eligible
                        ? styles.activeCreditStatus
                        : styles.inactiveCreditStatus
                    }`}
                  >
                    {creditAccount?.status ||
                      'No account'}
                  </span>
                </div>

                {creditEligibility.eligible ? (
                  <>
                    <div
                      className={
                        styles.creditGrid
                      }
                    >
                      <div>
                        <span>
                          Available credit
                        </span>

                        <strong>
                          {formatCurrency(
                            creditEligibility
                              .availableCredit,
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Credit limit
                        </span>

                        <strong>
                          {formatCurrency(
                            creditEligibility
                              .creditLimit,
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Commitment payment
                        </span>

                        <strong>
                          {formatCurrency(
                            creditEligibility
                              .commitmentPayment,
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Amount financed
                        </span>

                        <strong>
                          {formatCurrency(
                            creditEligibility
                              .financedAmount,
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Approved plan
                        </span>

                        <strong>
                          {formatInstallmentPlan(
                            creditAccount
                              ?.installmentPlan,
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Outstanding balance
                        </span>

                        <strong>
                          {formatCurrency(
                            creditAccount
                              ?.outstandingBalance ??
                              creditAccount
                                ?.outstandingAmount ??
                              0,
                          )}
                        </strong>
                      </div>
                    </div>

                    <div
                      className={
                        styles.creditNotice
                      }
                    >
                      <CheckIcon />

                      <p>
                        Your account is eligible
                        for this purchase. The
                        commitment payment will
                        be processed during the
                        next stage.
                      </p>
                    </div>
                  </>
                ) : (
                  <div
                    className={
                      styles.creditUnavailable
                    }
                  >
                    <p>
                      {creditEligibility.reason}
                    </p>

                    {creditAccountMissing && (
                      <div
                        className={
                          styles.creditApplyArea
                        }
                      >
                        <span>
                          You can apply for DESIRE
                          CREDIT and track your
                          application from your
                          customer account.
                        </span>

                        <Link
                          href="/account/desire-credit/apply"
                          className={
                            styles.creditApplyButton
                          }
                        >
                          Apply now
                          <ArrowIcon />
                        </Link>
                      </div>
                    )}

                    {!creditAccountMissing &&
                      creditAccount
                        ?.statusReason && (
                        <span>
                          {
                            creditAccount.statusReason
                          }
                        </span>
                      )}
                  </div>
                )}
              </div>
            )}
          </article>
        </div>

        <aside className={styles.summaryPanel}>
          <span className={styles.eyebrow}>
            Order summary
          </span>

          <h2>Your total</h2>

          <div className={styles.summaryRows}>
            <div>
              <span>
                Subtotal ({cart.totalItems}{' '}
                {cart.totalItems === 1
                  ? 'item'
                  : 'items'}
                )
              </span>

              <strong>
                {formatCurrency(subtotal)}
              </strong>
            </div>

            <div>
              <span>Shipping</span>

              <strong>
                Calculated later
              </strong>
            </div>

            {discount > 0 && (
              <div
                className={
                  styles.discountRow
                }
              >
                <span>Discount</span>

                <strong>
                  −
                  {formatCurrency(
                    discount,
                  )}
                </strong>
              </div>
            )}
          </div>

          <div className={styles.totalRow}>
            <span>Total</span>

            <strong>
              {formatCurrency(total)}
            </strong>
          </div>

          {paymentMethod ===
            PAYMENT_METHODS.DESIRE_CREDIT &&
            creditEligibility.eligible && (
              <div
                className={
                  styles.creditSummary
                }
              >
                <div>
                  <span>
                    Pay during next step
                  </span>

                  <strong>
                    {formatCurrency(
                      creditEligibility
                        .commitmentPayment,
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Financed with credit
                  </span>

                  <strong>
                    {formatCurrency(
                      creditEligibility
                        .financedAmount,
                    )}
                  </strong>
                </div>
              </div>
            )}

          <button
            type="button"
            onClick={handleContinue}
            disabled={
              continuing ||
              !selectedPaymentIsValid ||
              !selectedAddress
            }
            className={
              styles.continueButton
            }
          >
            <span>
              {continuing
                ? 'Preparing payment...'
                : paymentMethod ===
                    PAYMENT_METHODS.DESIRE_CREDIT
                  ? 'Continue with DESIRE CREDIT'
                  : 'Continue to payment'}
            </span>

            <ArrowIcon />
          </button>

          <Link
            href="/checkout"
            className={styles.returnLink}
          >
            Return to information
          </Link>

          <div
            className={
              styles.securityMessage
            }
          >
            <BagIcon />

            <p>
              Your order has not been
              created yet. The final order
              and payment process begins on
              the next page.
            </p>
          </div>
        </aside>
      </section>
    </main>
  );
}