'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import styles from './confirmation.module.css';

const CHECKOUT_INFORMATION_KEY =
  'desire_checkout_information';

const CHECKOUT_PAYMENT_KEY =
  'desire_checkout_payment';

const CHECKOUT_RESULT_KEY =
  'desire_checkout_result';

function formatCurrency(value) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatDate(value) {
  if (!value) {
    return 'Not available';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Not available';
  }

  return new Intl.DateTimeFormat('en-NG', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function getDocumentId(document) {
  return (
    document?._id ||
    document?.id ||
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

function getProductImage(item) {
  const product = getProduct(item);

  const image =
    item?.image ||
    product?.images?.[0] ||
    '';

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

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h14M14 7l5 5-5 5" />
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

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 8h14l-1 12H6L5 8Z" />
      <path d="M9 9V6a3 3 0 0 1 6 0v3" />
    </svg>
  );
}

function CreditIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="1" />
      <path d="M3 9h18M7 15h4" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M19 10c0 5-7 10-7 10S5 15 5 10a7 7 0 1 1 14 0Z" />
      <circle cx="12" cy="10" r="2.2" />
    </svg>
  );
}

function ConfirmationSkeleton() {
  return (
    <main className={styles.loadingPage}>
      <span />
      <span />
      <span />
      <span />
    </main>
  );
}

export default function OrderConfirmationPage() {
  const router = useRouter();

  const [result, setResult] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    try {
      const storedResult =
        sessionStorage.getItem(
          CHECKOUT_RESULT_KEY,
        );

      if (!storedResult) {
        router.replace('/account/orders');
        return;
      }

      const parsed =
        JSON.parse(storedResult);

      if (!parsed?.order) {
        router.replace('/account/orders');
        return;
      }

      setResult(parsed);

      /*
       * Checkout information is no longer
       * needed once the order has been created.
       */
      sessionStorage.removeItem(
        CHECKOUT_INFORMATION_KEY,
      );

      sessionStorage.removeItem(
        CHECKOUT_PAYMENT_KEY,
      );
    } catch (error) {
      console.error(
        'Unable to load order confirmation:',
        error,
      );

      router.replace('/account/orders');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const order =
    result?.order || {};

  const payment =
    result?.payment || {};

  const creditPurchase =
    result?.creditPurchase || null;

  const isDesireCredit =
    result?.method ===
    'DESIRE_CREDIT';

  const orderItems = useMemo(() => {
    if (Array.isArray(order?.items)) {
      return order.items;
    }

    return [];
  }, [order]);

  const paymentStatus =
    payment?.status ||
    order?.paymentStatus ||
    'PENDING';

  const isPaid =
    paymentStatus === 'PAID';

  const isSubmitted =
    paymentStatus === 'SUBMITTED';

  const orderId =
    getDocumentId(order);

  const accountOrderHref =
    orderId
      ? `/account/orders/${orderId}`
      : '/account/orders';

  if (loading) {
    return <ConfirmationSkeleton />;
  }

  if (!result) {
    return null;
  }

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.statusIcon}>
          {isPaid ? (
            <CheckIcon />
          ) : (
            <ClockIcon />
          )}
        </div>

        <span className={styles.eyebrow}>
          Order created
        </span>

        <h1>
          Thank you for your order.
        </h1>

        <p>
          Your DESIRE order has been
          created successfully.
          {' '}
          {isPaid
            ? 'Your payment has been confirmed.'
            : isSubmitted
              ? 'Your payment proof is currently awaiting verification.'
              : 'Your payment is currently pending.'}
        </p>
      </section>

      <section className={styles.statusBanner}>
        <div>
          <span>Order number</span>

          <strong>
            {order?.orderNumber ||
              'Created'}
          </strong>
        </div>

        <div>
          <span>Order status</span>

          <strong>
            {order?.status ||
              'PENDING'}
          </strong>
        </div>

        <div>
          <span>Payment status</span>

          <strong
            className={
              isPaid
                ? styles.paidStatus
                : styles.pendingStatus
            }
          >
            {paymentStatus}
          </strong>
        </div>

        <div>
          <span>Order date</span>

          <strong>
            {formatDate(
              order?.createdAt,
            )}
          </strong>
        </div>
      </section>

      <section className={styles.confirmationLayout}>
        <div className={styles.mainColumn}>
          <article className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <span className={styles.eyebrow}>
                  Your purchase
                </span>

                <h2>Order items</h2>
              </div>

              <span className={styles.itemCount}>
                {orderItems.length}{' '}
                {orderItems.length === 1
                  ? 'product'
                  : 'products'}
              </span>
            </div>

            {orderItems.length > 0 ? (
              <div className={styles.itemsList}>
                {orderItems.map(
                  (item, index) => {
                    const product =
                      getProduct(item);

                    return (
                      <article
                        key={
                          item?._id ||
                          item?.id ||
                          index
                        }
                        className={
                          styles.orderItem
                        }
                      >
                        <div
                          className={
                            styles.itemImage
                          }
                        >
                          <img
                            src={
                              getProductImage(
                                item,
                              )
                            }
                            alt={
                              item?.productName ||
                              product?.name ||
                              'DESIRE product'
                            }
                          />
                        </div>

                        <div
                          className={
                            styles.itemInfo
                          }
                        >
                          <span>
                            DESIRE
                          </span>

                          <h3>
                            {item?.productName ||
                              product?.name ||
                              'DESIRE Product'}
                          </h3>

                          <p>
                            Size:{' '}
                            {item?.size ||
                              '—'}
                            <br />
                            Colour:{' '}
                            {item?.color ||
                              '—'}
                            <br />
                            Quantity:{' '}
                            {item?.quantity ||
                              1}
                          </p>
                        </div>

                        <strong
                          className={
                            styles.itemPrice
                          }
                        >
                          {formatCurrency(
                            item?.subtotal ||
                              item?.total ||
                              (
                                Number(
                                  item?.price ||
                                    product?.price ||
                                    0,
                                ) *
                                Number(
                                  item?.quantity ||
                                    1,
                                )
                              ),
                          )}
                        </strong>
                      </article>
                    );
                  },
                )}
              </div>
            ) : (
              <p className={styles.emptyMessage}>
                Your order items are available
                from your account order page.
              </p>
            )}
          </article>

          <article className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <span className={styles.eyebrow}>
                  Delivery
                </span>

                <h2>Delivery information</h2>
              </div>

              <LocationIcon />
            </div>

            <div className={styles.addressCard}>
              <strong>
                {order?.shippingAddress
                  ?.fullName ||
                  order?.address
                    ?.fullName ||
                  'Delivery address saved'}
              </strong>

              {order?.shippingAddress ? (
                <>
                  <p>
                    {
                      order.shippingAddress
                        .addressLine1
                    }
                  </p>

                  {order.shippingAddress
                    .addressLine2 && (
                    <p>
                      {
                        order.shippingAddress
                          .addressLine2
                      }
                    </p>
                  )}

                  <p>
                    {
                      order.shippingAddress
                        .city
                    }
                    ,{' '}
                    {
                      order.shippingAddress
                        .state
                    }
                  </p>

                  <p>
                    {
                      order.shippingAddress
                        .country
                    }
                  </p>

                  <p>
                    {
                      order.shippingAddress
                        .phone
                    }
                  </p>
                </>
              ) : (
                <p>
                  Delivery details are stored
                  with this order.
                </p>
              )}
            </div>
          </article>

          {isDesireCredit && (
            <article
              className={
                styles.creditPanel
              }
            >
              <div
                className={
                  styles.creditHeader
                }
              >
                <div>
                  <span>
                    DESIRE CREDIT
                  </span>

                  <h2>
                    Credit purchase
                  </h2>
                </div>

                <CreditIcon />
              </div>

              <div
                className={
                  styles.creditGrid
                }
              >
                <div>
                  <span>
                    Commitment payment
                  </span>

                  <strong>
                    {formatCurrency(
                      creditPurchase
                        ?.commitmentPaymentAmount ||
                        payment?.amount,
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Financed amount
                  </span>

                  <strong>
                    {formatCurrency(
                      creditPurchase
                        ?.financedAmount,
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Purchase status
                  </span>

                  <strong>
                    {creditPurchase
                      ?.status ||
                      'PENDING_COMMITMENT_PAYMENT'}
                  </strong>
                </div>

                <div>
                  <span>
                    Installment plan
                  </span>

                  <strong>
                    {creditPurchase
                      ?.installmentPlan ||
                      'Approved plan'}
                  </strong>
                </div>
              </div>

              {!isPaid && (
                <p className={styles.creditNotice}>
                  Your DESIRE CREDIT purchase
                  will activate after the
                  commitment payment has been
                  verified.
                </p>
              )}
            </article>
          )}
        </div>

        <aside className={styles.summaryPanel}>
          <span className={styles.eyebrow}>
            Order summary
          </span>

          <h2>
            {formatCurrency(
              order?.totalAmount ||
                payment?.amount,
            )}
          </h2>

          <div className={styles.summaryRows}>
            <div>
              <span>Order number</span>

              <strong>
                {order?.orderNumber ||
                  'Created'}
              </strong>
            </div>

            <div>
              <span>Payment method</span>

              <strong>
                {isDesireCredit
                  ? 'DESIRE CREDIT'
                  : payment?.provider ||
                    'Manual payment'}
              </strong>
            </div>

            <div>
              <span>
                Payment reference
              </span>

              <strong>
                {payment?.reference ||
                  'Pending'}
              </strong>
            </div>

            <div>
              <span>Payment status</span>

              <strong>
                {paymentStatus}
              </strong>
            </div>
          </div>

          {!isPaid && (
            <div className={styles.pendingNotice}>
              <ClockIcon />

              <div>
                <strong>
                  Verification pending
                </strong>

                <p>
                  Your order exists, but the
                  transfer must still be
                  verified before payment is
                  considered complete.
                </p>
              </div>
            </div>
          )}

          <Link
            href={accountOrderHref}
            className={styles.primaryButton}
          >
            View order details
            <ArrowIcon />
          </Link>

          <Link
            href="/shop"
            className={styles.secondaryButton}
          >
            Continue shopping
          </Link>

          <div className={styles.accountNote}>
            <BagIcon />

            <p>
              You can track this order from
              your customer account at any
              time.
            </p>
          </div>
        </aside>
      </section>
    </main>
  );
}