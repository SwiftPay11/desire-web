'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import Link from 'next/link';

import {
  useParams,
} from 'next/navigation';

import {
  getAdminOrder,
  updateAdminOrderStatus,
} from '@/services/orders.service';

import styles from './order-details.module.css';

const ORDER_STATUSES = [
  {
    value: 'PENDING',
    label: 'Pending',
  },
  {
    value:
      'AWAITING_COMMITMENT_PAYMENT',
    label: 'Awaiting payment',
  },
  {
    value: 'PROCESSING',
    label: 'Processing',
  },
  {
    value: 'SHIPPED',
    label: 'Shipped',
  },
  {
    value: 'DELIVERED',
    label: 'Delivered',
  },
  {
    value: 'CANCELLED',
    label: 'Cancelled',
  },
];

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

function formatStatus(value) {
  if (!value) {
    return 'Unknown';
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

function getOrderStatusClass(
  status,
) {
  switch (status) {
    case 'DELIVERED':
      return styles.successBadge;

    case 'SHIPPED':
      return styles.infoBadge;

    case 'PROCESSING':
      return styles.processingBadge;

    case 'CANCELLED':
      return styles.dangerBadge;

    case 'AWAITING_COMMITMENT_PAYMENT':
      return styles.warningBadge;

    case 'PENDING':
    default:
      return styles.neutralBadge;
  }
}

function getPaymentStatusClass(
  status,
) {
  switch (status) {
    case 'PAID':
      return styles.successBadge;

    case 'FAILED':
      return styles.dangerBadge;

    case 'REFUNDED':
      return styles.infoBadge;

    case 'PENDING':
    default:
      return styles.warningBadge;
  }
}

function BackIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="m15 18-6-6 6-6" />

      <path d="M9 12h11" />
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

      <path d="M6.1 9a7 7 0 0 1 11.5-2.5L20 11" />

      <path d="M4 13l2.4 4.5A7 7 0 0 0 17.9 15" />
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

      <path d="M4 21c.7-4 3.4-6 8-6s7.3 2 8 6" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />

      <circle
        cx="12"
        cy="10"
        r="2.5"
      />
    </svg>
  );
}

function PackageIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="m12 3 8 4-8 4-8-4 8-4Z" />

      <path d="m4 7 8 4 8-4" />

      <path d="M4 7v10l8 4 8-4V7" />

      <path d="M12 11v10" />
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

      <path d="M7 15h3" />
    </svg>
  );
}

function InventoryIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M4 7h16v13H4V7Z" />

      <path d="M7 4h10v3H7V4Z" />

      <path d="M8 12h8" />

      <path d="M8 16h5" />
    </svg>
  );
}

export default function AdminOrderDetailsPage() {
  const params =
    useParams();

  const orderId =
    params?.id;

  const [
    order,
    setOrder,
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
    error,
    setError,
  ] = useState('');

  const [
    selectedStatus,
    setSelectedStatus,
  ] = useState('');

  const [
    updatingStatus,
    setUpdatingStatus,
  ] = useState(false);

  const [
    successMessage,
    setSuccessMessage,
  ] = useState('');

  const loadOrder =
    useCallback(
      async (
        showRefresh = false,
      ) => {
        if (!orderId) {
          return;
        }

        try {
          setError('');

          if (showRefresh) {
            setRefreshing(true);
          } else {
            setLoading(true);
          }

          const response =
            await getAdminOrder(
              orderId,
            );

          const nextOrder =
            response?.order ||
            null;

          setOrder(
            nextOrder,
          );

          setSelectedStatus(
            nextOrder?.status ||
              '',
          );
        } catch (err) {
          console.error(
            'Unable to load admin order:',
            err,
          );

          setError(
            err?.message ||
              'Unable to load order.',
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [orderId],
    );

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  useEffect(() => {
    if (!successMessage) {
      return undefined;
    }

    const timeout =
      window.setTimeout(
        () => {
          setSuccessMessage('');
        },
        3500,
      );

    return () =>
      window.clearTimeout(
        timeout,
      );
  }, [successMessage]);

  const itemCount =
    useMemo(() => {
      if (
        !Array.isArray(
          order?.items,
        )
      ) {
        return 0;
      }

      return order.items.reduce(
        (total, item) =>
          total +
          Number(
            item.quantity || 0,
          ),
        0,
      );
    }, [order]);

  async function handleStatusUpdate() {
    if (
      !order ||
      !selectedStatus
    ) {
      return;
    }

    if (
      selectedStatus ===
      order.status
    ) {
      return;
    }

    try {
      setUpdatingStatus(true);
      setError('');
      setSuccessMessage('');

      const response =
        await updateAdminOrderStatus(
          order._id,
          selectedStatus,
        );

      const updatedOrder =
        response?.order;

      setOrder(
        updatedOrder
          ? {
              ...order,
              ...updatedOrder,
            }
          : {
              ...order,
              status:
                selectedStatus,
            },
      );

      setSuccessMessage(
        response?.message ||
          'Order status updated successfully.',
      );
    } catch (err) {
      console.error(
        'Unable to update order status:',
        err,
      );

      setError(
        err?.message ||
          'Unable to update order status.',
      );

      setSelectedStatus(
        order.status,
      );
    } finally {
      setUpdatingStatus(false);
    }
  }

  if (loading) {
    return (
      <section
        className={
          styles.page
        }
      >
        <div
          className={
            styles.loadingState
          }
        >
          <span
            className={
              styles.spinner
            }
          />

          <strong>
            Loading order
          </strong>

          <p>
            Retrieving order
            information...
          </p>
        </div>
      </section>
    );
  }

  if (
    !order &&
    error
  ) {
    return (
      <section
        className={
          styles.page
        }
      >
        <Link
          href="/admin/orders"
          className={
            styles.backLink
          }
        >
          <BackIcon />
          Back to orders
        </Link>

        <div
          className={
            styles.notFound
          }
        >
          <PackageIcon />

          <h1>
            Order unavailable
          </h1>

          <p>
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              loadOrder()
            }
          >
            Try again
          </button>
        </div>
      </section>
    );
  }

  if (!order) {
    return null;
  }

  const customer =
    order.user || {};

  const shipping =
    order.shippingAddress ||
    {};

  const customerName =
    customer.fullName ||
    shipping.fullName ||
    'Customer';

  const inventoryDeducted =
    Boolean(
      order.inventoryDeducted,
    );

  return (
    <section
      className={styles.page}
    >
      {successMessage && (
        <div
          className={
            styles.toast
          }
        >
          {successMessage}
        </div>
      )}

      <div
        className={
          styles.topBar
        }
      >
        <Link
          href="/admin/orders"
          className={
            styles.backLink
          }
        >
          <BackIcon />
          Back to orders
        </Link>

        <button
          type="button"
          className={
            styles.refreshButton
          }
          disabled={refreshing}
          onClick={() =>
            loadOrder(true)
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
          styles.orderHeader
        }
      >
        <div>
          <span
            className={
              styles.eyebrow
            }
          >
            Order Details
          </span>

          <div
            className={
              styles.titleRow
            }
          >
            <h1>
              {order.orderNumber ||
                'Order'}
            </h1>

            <span
              className={`${styles.statusBadge} ${getOrderStatusClass(
                order.status,
              )}`}
            >
              {formatStatus(
                order.status,
              )}
            </span>
          </div>

          <p>
            Placed{' '}
            {formatDate(
              order.createdAt,
            )}
          </p>
        </div>

        <div
          className={
            styles.headerAmount
          }
        >
          <span>
            Order total
          </span>

          <strong>
            {formatCurrency(
              order.totalAmount,
            )}
          </strong>
        </div>
      </header>

      {error && (
        <div
          className={
            styles.errorMessage
          }
        >
          <div>
            <strong>
              Something went wrong
            </strong>

            <span>
              {error}
            </span>
          </div>

          <button
            type="button"
            onClick={() =>
              setError('')
            }
          >
            Dismiss
          </button>
        </div>
      )}

      <div
        className={
          styles.statusOverview
        }
      >
        <div>
          <span>
            Order status
          </span>

          <strong
            className={`${styles.statusBadge} ${getOrderStatusClass(
              order.status,
            )}`}
          >
            {formatStatus(
              order.status,
            )}
          </strong>
        </div>

        <div>
          <span>
            Payment status
          </span>

          <strong
            className={`${styles.statusBadge} ${getPaymentStatusClass(
              order.paymentStatus,
            )}`}
          >
            {formatStatus(
              order.paymentStatus,
            )}
          </strong>
        </div>

        <div>
          <span>
            Inventory
          </span>

          <strong
            className={`${styles.statusBadge} ${
              inventoryDeducted
                ? styles.successBadge
                : styles.neutralBadge
            }`}
          >
            {inventoryDeducted
              ? 'Deducted'
              : 'Not deducted'}
          </strong>
        </div>

        <div>
          <span>
            Items
          </span>

          <strong
            className={
              styles.overviewValue
            }
          >
            {itemCount}
          </strong>
        </div>
      </div>

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
          <article
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
                <PackageIcon />

                <div>
                  <h2>
                    Order items
                  </h2>

                  <p>
                    {itemCount}{' '}
                    {itemCount === 1
                      ? 'item'
                      : 'items'}{' '}
                    in this order
                  </p>
                </div>
              </div>
            </div>

            <div
              className={
                styles.items
              }
            >
              {Array.isArray(
                order.items,
              ) &&
              order.items.length >
                0 ? (
                order.items.map(
                  (
                    item,
                    index,
                  ) => (
                    <div
                      className={
                        styles.orderItem
                      }
                      key={
                        item._id ||
                        `${item.product}-${index}`
                      }
                    >
                      <div
                        className={
                          styles.productImage
                        }
                      >
                        {item.image ? (
                          <img
                            src={
                              item.image
                            }
                            alt={
                              item.name ||
                              'Product'
                            }
                          />
                        ) : (
                          <PackageIcon />
                        )}
                      </div>

                      <div
                        className={
                          styles.productInfo
                        }
                      >
                        <strong>
                          {item.name ||
                            'Product'}
                        </strong>

                        <div
                          className={
                            styles.productMeta
                          }
                        >
                          {item.size && (
                            <span>
                              Size:{' '}
                              <b>
                                {
                                  item.size
                                }
                              </b>
                            </span>
                          )}

                          {item.color && (
                            <span>
                              Color:{' '}
                              <b>
                                {
                                  item.color
                                }
                              </b>
                            </span>
                          )}

                          <span>
                            Qty:{' '}
                            <b>
                              {item.quantity ||
                                0}
                            </b>
                          </span>
                        </div>

                        <small>
                          {formatCurrency(
                            item.price,
                          )}{' '}
                          each
                        </small>
                      </div>

                      <strong
                        className={
                          styles.itemSubtotal
                        }
                      >
                        {formatCurrency(
                          item.subtotal ??
                            Number(
                              item.price ||
                                0,
                            ) *
                              Number(
                                item.quantity ||
                                  0,
                              ),
                        )}
                      </strong>
                    </div>
                  ),
                )
              ) : (
                <div
                  className={
                    styles.emptyItems
                  }
                >
                  No items found
                  for this order.
                </div>
              )}
            </div>

            <div
              className={
                styles.totals
              }
            >
              <div>
                <span>
                  Subtotal
                </span>

                <strong>
                  {formatCurrency(
                    order.subtotal,
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Shipping
                </span>

                <strong>
                  {Number(
                    order.shippingFee ||
                      0,
                  ) === 0
                    ? 'Free'
                    : formatCurrency(
                        order.shippingFee,
                      )}
                </strong>
              </div>

              <div>
                <span>
                  Discount
                </span>

                <strong>
                  {Number(
                    order.discount ||
                      0,
                  ) > 0
                    ? `-${formatCurrency(
                        order.discount,
                      )}`
                    : formatCurrency(
                        0,
                      )}
                </strong>
              </div>

              <div
                className={
                  styles.totalRow
                }
              >
                <span>
                  Total
                </span>

                <strong>
                  {formatCurrency(
                    order.totalAmount,
                  )}
                </strong>
              </div>
            </div>
          </article>

          <article
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
                <LocationIcon />

                <div>
                  <h2>
                    Shipping address
                  </h2>

                  <p>
                    Delivery
                    information
                  </p>
                </div>
              </div>
            </div>

            <div
              className={
                styles.addressContent
              }
            >
              <strong>
                {shipping.fullName ||
                  customerName}
              </strong>

              {shipping.phone && (
                <span>
                  {shipping.phone}
                </span>
              )}

              {shipping.addressLine1 && (
                <span>
                  {
                    shipping.addressLine1
                  }
                </span>
              )}

              {shipping.addressLine2 && (
                <span>
                  {
                    shipping.addressLine2
                  }
                </span>
              )}

              <span>
                {[
                  shipping.city,
                  shipping.state,
                  shipping.postalCode,
                ]
                  .filter(Boolean)
                  .join(', ') ||
                  '—'}
              </span>

              {shipping.country && (
                <span>
                  {
                    shipping.country
                  }
                </span>
              )}
            </div>
          </article>

          {order.notes && (
            <article
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
                  <div
                    className={
                      styles.textIcon
                    }
                  >
                    N
                  </div>

                  <div>
                    <h2>
                      Order notes
                    </h2>

                    <p>
                      Customer
                      instructions
                    </p>
                  </div>
                </div>
              </div>

              <p
                className={
                  styles.notes
                }
              >
                {order.notes}
              </p>
            </article>
          )}
        </main>

        <aside
          className={
            styles.sideColumn
          }
        >
          <article
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
                <PackageIcon />

                <div>
                  <h2>
                    Fulfilment
                  </h2>

                  <p>
                    Manage order
                    progress
                  </p>
                </div>
              </div>
            </div>

            <div
              className={
                styles.statusForm
              }
            >
              <label
                htmlFor="order-status"
              >
                Order status
              </label>

              <select
                id="order-status"
                value={
                  selectedStatus
                }
                disabled={
                  updatingStatus
                }
                onChange={(
                  event,
                ) =>
                  setSelectedStatus(
                    event.target
                      .value,
                  )
                }
              >
                {ORDER_STATUSES.map(
                  (status) => (
                    <option
                      key={
                        status.value
                      }
                      value={
                        status.value
                      }
                    >
                      {
                        status.label
                      }
                    </option>
                  ),
                )}
              </select>

              <button
                type="button"
                disabled={
                  updatingStatus ||
                  selectedStatus ===
                    order.status
                }
                onClick={
                  handleStatusUpdate
                }
              >
                {updatingStatus
                  ? 'Updating...'
                  : 'Update status'}
              </button>

              <p>
                Fulfilment status
                does not confirm
                customer payment.
              </p>
            </div>
          </article>

          <article
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
                <CustomerIcon />

                <div>
                  <h2>
                    Customer
                  </h2>

                  <p>
                    Account
                    information
                  </p>
                </div>
              </div>
            </div>

            <div
              className={
                styles.customerDetails
              }
            >
              <div>
                <span>
                  Name
                </span>

                <strong>
                  {customerName}
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
                    shipping.phone ||
                    '—'}
                </strong>
              </div>

              {customer._id && (
                <Link
                  href={`/admin/customers/${customer._id}`}
                  className={
                    styles.customerLink
                  }
                >
                  View customer
                </Link>
              )}
            </div>
          </article>

          <article
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
                    Payment
                  </h2>

                  <p>
                    Payment status
                  </p>
                </div>
              </div>
            </div>

            <div
              className={
                styles.paymentContent
              }
            >
              <div
                className={
                  styles.paymentStatusRow
                }
              >
                <span>
                  Status
                </span>

                <strong
                  className={`${styles.statusBadge} ${getPaymentStatusClass(
                    order.paymentStatus,
                  )}`}
                >
                  {formatStatus(
                    order.paymentStatus,
                  )}
                </strong>
              </div>

              <div
                className={
                  styles.paymentNotice
                }
              >
                {order.paymentStatus ===
                'PAID' ? (
                  <>
                    <strong>
                      Payment
                      confirmed
                    </strong>

                    <p>
                      This order has
                      been confirmed
                      as paid.
                    </p>
                  </>
                ) : (
                  <>
                    <strong>
                      Payment not
                      confirmed
                    </strong>

                    <p>
                      PAID status
                      must be
                      confirmed
                      through the
                      payment
                      verification
                      workflow.
                    </p>
                  </>
                )}
              </div>
            </div>
          </article>

          <article
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
                <InventoryIcon />

                <div>
                  <h2>
                    Inventory
                  </h2>

                  <p>
                    Stock deduction
                    record
                  </p>
                </div>
              </div>
            </div>

            <div
              className={
                styles.inventoryDetails
              }
            >
              <div>
                <span>
                  Deducted
                </span>

                <strong>
                  {inventoryDeducted
                    ? 'Yes'
                    : 'No'}
                </strong>
              </div>

              <div>
                <span>
                  Deducted at
                </span>

                <strong>
                  {formatDate(
                    order.inventoryDeductedAt,
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Payment
                  reference
                </span>

                <strong
                  className={
                    styles.reference
                  }
                >
                  {order.inventoryPaymentReference ||
                    '—'}
                </strong>
              </div>

              {!inventoryDeducted &&
                order.paymentStatus !==
                  'PAID' && (
                  <div
                    className={
                      styles.inventoryNotice
                    }
                  >
                    Stock remains
                    unchanged until
                    payment is
                    confirmed.
                  </div>
                )}
            </div>
          </article>

          <article
            className={
              styles.card
            }
          >
            <div
              className={
                styles.metadata
              }
            >
              <div>
                <span>
                  Order ID
                </span>

                <strong>
                  {order._id}
                </strong>
              </div>

              <div>
                <span>
                  Created
                </span>

                <strong>
                  {formatDate(
                    order.createdAt,
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Last updated
                </span>

                <strong>
                  {formatDate(
                    order.updatedAt,
                  )}
                </strong>
              </div>
            </div>
          </article>
        </aside>
      </div>
    </section>
  );
}