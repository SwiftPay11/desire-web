'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { getOrder } from '@/services/orders.service';

import styles from './order-details.module.css';

function normalizeStatus(value) {
  return String(value || 'pending')
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, '-');
}

function formatStatus(value) {
  return normalizeStatus(value)
    .split('-')
    .filter(Boolean)
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1),
    )
    .join(' ');
}

function formatDate(value, includeTime = false) {
  if (!value) {
    return 'Unavailable';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Unavailable';
  }

  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...(includeTime
      ? {
          hour: '2-digit',
          minute: '2-digit',
        }
      : {}),
  }).format(date);
}

function formatCurrency(value, currency = 'USD') {
  const number = Number(value);

  if (Number.isNaN(number)) {
    return '—';
  }

  try {
    return new Intl.NumberFormat('en', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(number);
  } catch {
    return `$${number.toFixed(2)}`;
  }
}

function getOrderId(order) {
  return order?._id || order?.id || '';
}

function getOrderNumber(order) {
  return (
    order?.orderNumber ||
    order?.reference ||
    order?.orderId ||
    getOrderId(order) ||
    'Unavailable'
  );
}

function getOrderDate(order) {
  return (
    order?.createdAt ||
    order?.orderDate ||
    order?.date ||
    null
  );
}

function getOrderItems(order) {
  if (Array.isArray(order?.items)) {
    return order.items;
  }

  if (Array.isArray(order?.orderItems)) {
    return order.orderItems;
  }

  if (Array.isArray(order?.products)) {
    return order.products;
  }

  return [];
}

function getItemProduct(item) {
  return item?.product || item?.productId || item || {};
}

function getItemName(item) {
  const product = getItemProduct(item);

  return (
    item?.name ||
    item?.productName ||
    product?.name ||
    product?.title ||
    'DESIRE Product'
  );
}

function getItemImage(item) {
  const product = getItemProduct(item);

  if (typeof item?.image === 'string') {
    return item.image;
  }

  if (typeof product?.image === 'string') {
    return product.image;
  }

  if (
    Array.isArray(item?.images) &&
    item.images.length > 0
  ) {
    return typeof item.images[0] === 'string'
      ? item.images[0]
      : item.images[0]?.url;
  }

  if (
    Array.isArray(product?.images) &&
    product.images.length > 0
  ) {
    return typeof product.images[0] === 'string'
      ? product.images[0]
      : product.images[0]?.url;
  }

  return '/images/product-placeholder.jpg';
}

function getItemQuantity(item) {
  const quantity = Number(item?.quantity || 1);

  return Number.isNaN(quantity) ? 1 : quantity;
}

function getItemPrice(item) {
  const product = getItemProduct(item);

  return Number(
    item?.price ??
      item?.unitPrice ??
      item?.productPrice ??
      product?.price ??
      0,
  );
}

function getItemTotal(item) {
  const explicitTotal = Number(
    item?.total ??
      item?.totalPrice ??
      item?.lineTotal,
  );

  if (!Number.isNaN(explicitTotal)) {
    return explicitTotal;
  }

  return getItemPrice(item) * getItemQuantity(item);
}

function getItemSize(item) {
  return (
    item?.size ||
    item?.variant?.size ||
    item?.selectedSize ||
    null
  );
}

function getItemColor(item) {
  return (
    item?.color ||
    item?.colour ||
    item?.variant?.color ||
    item?.variant?.colour ||
    item?.selectedColor ||
    null
  );
}

function getCurrency(order) {
  return (
    order?.currency ||
    order?.payment?.currency ||
    'USD'
  );
}

function getSubtotal(order, items) {
  const explicitSubtotal = Number(
    order?.subtotal ?? order?.subTotal,
  );

  if (!Number.isNaN(explicitSubtotal)) {
    return explicitSubtotal;
  }

  return items.reduce(
    (total, item) => total + getItemTotal(item),
    0,
  );
}

function getShippingFee(order) {
  return Number(
    order?.shippingFee ??
      order?.shippingCost ??
      order?.deliveryFee ??
      0,
  );
}

function getDiscount(order) {
  return Number(
    order?.discount ??
      order?.discountAmount ??
      order?.couponDiscount ??
      0,
  );
}

function getTax(order) {
  return Number(
    order?.tax ??
      order?.taxAmount ??
      0,
  );
}

function getGrandTotal(order, items) {
  const explicitTotal = Number(
    order?.totalAmount ??
      order?.grandTotal ??
      order?.total ??
      order?.amount,
  );

  if (!Number.isNaN(explicitTotal)) {
    return explicitTotal;
  }

  return (
    getSubtotal(order, items) +
    getShippingFee(order) +
    getTax(order) -
    getDiscount(order)
  );
}

function getShippingAddress(order) {
  return (
    order?.shippingAddress ||
    order?.deliveryAddress ||
    order?.address ||
    {}
  );
}

function getBillingAddress(order) {
  return (
    order?.billingAddress ||
    order?.billing ||
    getShippingAddress(order)
  );
}

function getCustomerName(address, order) {
  const fullName = [
    address?.firstName,
    address?.lastName,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    address?.fullName ||
    address?.name ||
    fullName ||
    order?.customerName ||
    order?.user?.name ||
    'Customer'
  );
}

function getAddressLines(address) {
  return [
    address?.addressLine1 ||
      address?.line1 ||
      address?.street ||
      address?.address,
    address?.addressLine2 ||
      address?.line2,
    [
      address?.city,
      address?.state ||
        address?.region,
    ]
      .filter(Boolean)
      .join(', '),
    address?.postalCode ||
      address?.zipCode ||
      address?.zip,
    address?.country,
  ].filter(Boolean);
}

function getPaymentMethod(order) {
  return (
    order?.paymentMethod ||
    order?.payment?.method ||
    order?.payment?.provider ||
    'Not specified'
  );
}

function getPaymentReference(order) {
  return (
    order?.paymentReference ||
    order?.payment?.reference ||
    order?.transactionReference ||
    null
  );
}

function getPaymentStatus(order) {
  return (
    order?.paymentStatus ||
    order?.payment?.status ||
    'pending'
  );
}

function getTimeline(order) {
  if (Array.isArray(order?.timeline)) {
    return order.timeline;
  }

  if (Array.isArray(order?.statusHistory)) {
    return order.statusHistory;
  }

  const status = normalizeStatus(order?.status);
  const createdAt = getOrderDate(order);

  const stages = [
    {
      key: 'pending',
      label: 'Order placed',
    },
    {
      key: 'processing',
      label: 'Processing',
    },
    {
      key: 'shipped',
      label: 'Shipped',
    },
    {
      key: 'delivered',
      label: 'Delivered',
    },
  ];

  const currentIndex = stages.findIndex(
    (stage) => stage.key === status,
  );

  return stages.map((stage, index) => ({
    status: stage.key,
    label: stage.label,
    completed:
      status === 'cancelled'
        ? index === 0
        : currentIndex >= index,
    date:
      index === 0
        ? createdAt
        : null,
  }));
}

function isTimelineStepComplete(step, orderStatus) {
  if (typeof step?.completed === 'boolean') {
    return step.completed;
  }

  const stepStatus = normalizeStatus(
    step?.status || step?.label,
  );
  const currentStatus = normalizeStatus(orderStatus);

  const order = [
    'pending',
    'paid',
    'processing',
    'shipped',
    'delivered',
  ];

  const stepIndex = order.indexOf(stepStatus);
  const currentIndex = order.indexOf(currentStatus);

  return (
    stepIndex !== -1 &&
    currentIndex !== -1 &&
    currentIndex >= stepIndex
  );
}

function getStatusClass(status) {
  const map = {
    pending: styles.statusPending,
    paid: styles.statusPaid,
    processing: styles.statusProcessing,
    shipped: styles.statusShipped,
    delivered: styles.statusDelivered,
    cancelled: styles.statusCancelled,
    refunded: styles.statusRefunded,
  };

  return (
    map[normalizeStatus(status)] ||
    styles.statusDefault
  );
}

function ArrowLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M19 12H5M10 17l-5-5 5-5" />
    </svg>
  );
}

function PackageIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m4 7 8-4 8 4v10l-8 4-8-4V7Z" />
      <path d="m4 7 8 4 8-4M12 11v10" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

function CardIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="1" />
      <path d="M3 9h18M7 15h4" />
    </svg>
  );
}

function ReceiptIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" />
      <path d="M9 8h6M9 12h6M9 16h4" />
    </svg>
  );
}

function LoadingState() {
  return (
    <div className={styles.loadingPage}>
      <div className={styles.loadingHero}>
        <span className={styles.skeleton} />
        <span className={styles.skeleton} />
        <span className={styles.skeleton} />
      </div>

      <div className={styles.loadingGrid}>
        <div className={styles.loadingLarge}>
          {[1, 2, 3].map((item) => (
            <div
              className={styles.loadingItem}
              key={item}
            >
              <span className={styles.loadingImage} />

              <div>
                <span className={styles.skeleton} />
                <span className={styles.skeleton} />
                <span className={styles.skeleton} />
              </div>
            </div>
          ))}
        </div>

        <div className={styles.loadingSide}>
          <span className={styles.skeleton} />
          <span className={styles.skeleton} />
          <span className={styles.skeleton} />
          <span className={styles.skeleton} />
        </div>
      </div>
    </div>
  );
}

export default function CustomerOrderDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const orderId = params?.id;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    async function loadOrder() {
      if (!orderId) {
        return;
      }

      try {
        setLoading(true);
        setError('');

        const response = await getOrder(orderId);

        if (!mounted) {
          return;
        }

        const fetchedOrder =
          response?.order ||
          response?.data?.order ||
          response?.data ||
          response;

        if (
          !fetchedOrder ||
          typeof fetchedOrder !== 'object'
        ) {
          throw new Error(
            'The requested order could not be found.',
          );
        }

        setOrder(fetchedOrder);
      } catch (loadError) {
        console.error(
          'Unable to load order details:',
          loadError,
        );

        if (mounted) {
          setError(
            loadError?.message ||
              'We could not load this order.',
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadOrder();

    return () => {
      mounted = false;
    };
  }, [orderId]);

  const items = useMemo(
    () => getOrderItems(order),
    [order],
  );

  const currency = getCurrency(order);
  const subtotal = getSubtotal(order, items);
  const shippingFee = getShippingFee(order);
  const discount = getDiscount(order);
  const tax = getTax(order);
  const grandTotal = getGrandTotal(
    order,
    items,
  );

  const shippingAddress =
    getShippingAddress(order);
  const billingAddress =
    getBillingAddress(order);

  const timeline = useMemo(
    () => getTimeline(order),
    [order],
  );

  if (loading) {
    return <LoadingState />;
  }

  if (error || !order) {
    return (
      <section className={styles.errorState}>
        <div className={styles.errorIcon}>
          <PackageIcon />
        </div>

        <span className={styles.eyebrow}>
          Order unavailable
        </span>

        <h1>We could not open this order</h1>

        <p>
          {error ||
            'The order may not exist or may not belong to your account.'}
        </p>

        <div className={styles.errorActions}>
          <button
            type="button"
            onClick={() => router.refresh()}
            className={styles.primaryButton}
          >
            Try again
          </button>

          <Link
            href="/account/orders"
            className={styles.secondaryButton}
          >
            Back to orders
          </Link>
        </div>
      </section>
    );
  }

  const orderNumber = getOrderNumber(order);
  const orderStatus =
    order?.status || 'pending';
  const paymentStatus =
    getPaymentStatus(order);

  return (
    <main className={styles.page}>
      <div className={styles.topNavigation}>
        <Link
          href="/account/orders"
          className={styles.backLink}
        >
          <ArrowLeftIcon />
          Back to orders
        </Link>
      </div>

      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <span className={styles.eyebrow}>
            Order details
          </span>

          <h1>Order #{orderNumber}</h1>

          <p>
            Placed on{' '}
            {formatDate(
              getOrderDate(order),
              true,
            )}
          </p>
        </div>

        <div className={styles.heroStatuses}>
          <div>
            <span>Order status</span>

            <strong
              className={`${styles.statusBadge} ${getStatusClass(
                orderStatus,
              )}`}
            >
              {formatStatus(orderStatus)}
            </strong>
          </div>

          <div>
            <span>Payment</span>

            <strong
              className={`${styles.statusBadge} ${getStatusClass(
                paymentStatus,
              )}`}
            >
              {formatStatus(paymentStatus)}
            </strong>
          </div>
        </div>
      </section>

      <section className={styles.mainGrid}>
        <div className={styles.primaryColumn}>
          <article className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <span className={styles.eyebrow}>
                  Purchased items
                </span>

                <h2>Products in this order</h2>
              </div>

              <span className={styles.itemCount}>
                {items.reduce(
                  (total, item) =>
                    total +
                    getItemQuantity(item),
                  0,
                )}{' '}
                items
              </span>
            </div>

            {items.length === 0 ? (
              <div className={styles.emptyItems}>
                No product information is available
                for this order.
              </div>
            ) : (
              <div className={styles.itemList}>
                {items.map((item, index) => {
                  const quantity =
                    getItemQuantity(item);
                  const size =
                    getItemSize(item);
                  const color =
                    getItemColor(item);

                  return (
                    <div
                      className={styles.productItem}
                      key={
                        item?._id ||
                        item?.id ||
                        `${getItemName(item)}-${index}`
                      }
                    >
                      <div
                        className={
                          styles.productImage
                        }
                      >
                        <img
                          src={getItemImage(item)}
                          alt={getItemName(item)}
                          onError={(event) => {
                            event.currentTarget.src =
                              '/images/product-placeholder.jpg';
                          }}
                        />
                      </div>

                      <div
                        className={
                          styles.productInformation
                        }
                      >
                        <span
                          className={
                            styles.productLabel
                          }
                        >
                          DESIRE
                        </span>

                        <h3>
                          {getItemName(item)}
                        </h3>

                        <div
                          className={
                            styles.variants
                          }
                        >
                          {size && (
                            <span>
                              Size: {size}
                            </span>
                          )}

                          {color && (
                            <span>
                              Colour: {color}
                            </span>
                          )}

                          <span>
                            Quantity: {quantity}
                          </span>
                        </div>

                        <span
                          className={
                            styles.unitPrice
                          }
                        >
                          {formatCurrency(
                            getItemPrice(item),
                            currency,
                          )}{' '}
                          each
                        </span>
                      </div>

                      <strong
                        className={
                          styles.productTotal
                        }
                      >
                        {formatCurrency(
                          getItemTotal(item),
                          currency,
                        )}
                      </strong>
                    </div>
                  );
                })}
              </div>
            )}
          </article>

          <article className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <span className={styles.eyebrow}>
                  Progress
                </span>

                <h2>Order timeline</h2>
              </div>
            </div>

            {normalizeStatus(orderStatus) ===
            'cancelled' ? (
              <div
                className={
                  styles.cancelledMessage
                }
              >
                <span
                  className={
                    styles.cancelledDot
                  }
                />

                <div>
                  <strong>
                    Order cancelled
                  </strong>

                  <p>
                    This order is no longer being
                    processed.
                  </p>
                </div>
              </div>
            ) : (
              <div className={styles.timeline}>
                {timeline.map(
                  (step, index) => {
                    const complete =
                      isTimelineStepComplete(
                        step,
                        orderStatus,
                      );

                    return (
                      <div
                        className={`${styles.timelineStep} ${
                          complete
                            ? styles.timelineComplete
                            : ''
                        }`}
                        key={
                          step?._id ||
                          step?.status ||
                          step?.label ||
                          index
                        }
                      >
                        <div
                          className={
                            styles.timelineMarker
                          }
                        >
                          <span />
                        </div>

                        <div
                          className={
                            styles.timelineContent
                          }
                        >
                          <strong>
                            {formatStatus(
                              step?.label ||
                                step?.status ||
                                'Update',
                            )}
                          </strong>

                          <p>
                            {step?.description ||
                              (complete
                                ? 'This stage has been completed.'
                                : 'Waiting for this stage.')}
                          </p>

                          {(step?.date ||
                            step?.createdAt ||
                            step?.timestamp) && (
                            <time>
                              {formatDate(
                                step?.date ||
                                  step?.createdAt ||
                                  step?.timestamp,
                                true,
                              )}
                            </time>
                          )}
                        </div>
                      </div>
                    );
                  },
                )}
              </div>
            )}
          </article>

          <div
            className={
              styles.addressGrid
            }
          >
            <article className={styles.panel}>
              <div
                className={
                  styles.iconHeading
                }
              >
                <span>
                  <LocationIcon />
                </span>

                <div>
                  <small>
                    Delivery information
                  </small>
                  <h2>
                    Shipping address
                  </h2>
                </div>
              </div>

              <address
                className={styles.address}
              >
                <strong>
                  {getCustomerName(
                    shippingAddress,
                    order,
                  )}
                </strong>

                {getAddressLines(
                  shippingAddress,
                ).map((line) => (
                  <span key={line}>
                    {line}
                  </span>
                ))}

                {(shippingAddress?.phone ||
                  order?.phone ||
                  order?.customerPhone) && (
                  <span>
                    {shippingAddress?.phone ||
                      order?.phone ||
                      order?.customerPhone}
                  </span>
                )}
              </address>
            </article>

            <article className={styles.panel}>
              <div
                className={
                  styles.iconHeading
                }
              >
                <span>
                  <ReceiptIcon />
                </span>

                <div>
                  <small>
                    Billing information
                  </small>
                  <h2>
                    Billing address
                  </h2>
                </div>
              </div>

              <address
                className={styles.address}
              >
                <strong>
                  {getCustomerName(
                    billingAddress,
                    order,
                  )}
                </strong>

                {getAddressLines(
                  billingAddress,
                ).map((line) => (
                  <span key={line}>
                    {line}
                  </span>
                ))}
              </address>
            </article>
          </div>
        </div>

        <aside className={styles.sidebar}>
          <article
            className={`${styles.panel} ${styles.summaryPanel}`}
          >
            <div className={styles.panelHeader}>
              <div>
                <span className={styles.eyebrow}>
                  Payment summary
                </span>

                <h2>Order total</h2>
              </div>
            </div>

            <div className={styles.summaryRows}>
              <div>
                <span>Subtotal</span>
                <strong>
                  {formatCurrency(
                    subtotal,
                    currency,
                  )}
                </strong>
              </div>

              <div>
                <span>Shipping</span>
                <strong>
                  {shippingFee > 0
                    ? formatCurrency(
                        shippingFee,
                        currency,
                      )
                    : 'Free'}
                </strong>
              </div>

              {tax > 0 && (
                <div>
                  <span>Tax</span>
                  <strong>
                    {formatCurrency(
                      tax,
                      currency,
                    )}
                  </strong>
                </div>
              )}

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
                      currency,
                    )}
                  </strong>
                </div>
              )}
            </div>

            <div className={styles.grandTotal}>
              <span>Total</span>

              <strong>
                {formatCurrency(
                  grandTotal,
                  currency,
                )}
              </strong>
            </div>
          </article>

          <article className={styles.panel}>
            <div className={styles.iconHeading}>
              <span>
                <CardIcon />
              </span>

              <div>
                <small>
                  Transaction details
                </small>

                <h2>Payment</h2>
              </div>
            </div>

            <dl className={styles.detailList}>
              <div>
                <dt>Method</dt>
                <dd>
                  {formatStatus(
                    getPaymentMethod(order),
                  )}
                </dd>
              </div>

              <div>
                <dt>Status</dt>
                <dd>
                  {formatStatus(
                    paymentStatus,
                  )}
                </dd>
              </div>

              {getPaymentReference(order) && (
                <div>
                  <dt>Reference</dt>
                  <dd>
                    {getPaymentReference(order)}
                  </dd>
                </div>
              )}
            </dl>
          </article>

          <article
            className={`${styles.panel} ${styles.helpPanel}`}
          >
            <span className={styles.eyebrow}>
              Need assistance?
            </span>

            <h2>Questions about your order?</h2>

            <p>
              Contact DESIRE support and include your
              order number so the team can assist you.
            </p>

            <Link
              href="/contact"
              className={styles.contactLink}
            >
              Contact support
            </Link>
          </article>
        </aside>
      </section>
    </main>
  );
}