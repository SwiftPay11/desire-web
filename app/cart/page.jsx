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
  clearCart,
  getCart,
  removeCartItem,
  updateCartItem,
} from '@/services/cart.service';

import styles from './cart.module.css';

function formatCurrency(value) {
  const amount = Number(value);

  if (Number.isNaN(amount)) {
    return '₦0';
  }

  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function normalizeCart(response) {
  const cart = response?.cart || response?.data?.cart;

  if (!cart || typeof cart !== 'object') {
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
    totalItems: Number(cart.totalItems || 0),
    totalAmount: Number(cart.totalAmount || 0),
  };
}

function getProduct(item) {
  return item?.product &&
    typeof item.product === 'object'
    ? item.product
    : {};
}

function getItemId(item) {
  return item?.id || item?._id || '';
}

function getProductIdentifier(product) {
  return (
    product?.slug ||
    product?.id ||
    product?._id ||
    ''
  );
}

function getProductImage(product) {
  if (
    Array.isArray(product?.images) &&
    product.images.length > 0
  ) {
    return getImageUrl(product.images[0]);
  }

  return '/images/product-placeholder.jpg';
}

function getImageUrl(image) {
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

function ArrowLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M19 12H5M10 17l-5-5 5-5" />
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

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13" />
      <path d="M10 11v5M14 11v5" />
    </svg>
  );
}

function MinusIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 12h12" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 6v12M6 12h12" />
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

function CartSkeleton() {
  return (
    <article className={styles.skeletonItem}>
      <div className={styles.skeletonImage} />

      <div className={styles.skeletonDetails}>
        <span />
        <span />
        <span />
        <span />
      </div>

      <div className={styles.skeletonPrice} />
    </article>
  );
}

export default function CartPage() {
  const router = useRouter();

  const [cart, setCart] = useState({
    id: '',
    items: [],
    totalItems: 0,
    totalAmount: 0,
  });

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const [successMessage, setSuccessMessage] =
    useState('');

  const [updatingItemId, setUpdatingItemId] =
    useState('');

  const [removingItemId, setRemovingItemId] =
    useState('');

  const [clearing, setClearing] =
    useState(false);

  const loadCart = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const response = await getCart();

      setCart(normalizeCart(response));
    } catch (loadError) {
      console.error(
        'Unable to load cart:',
        loadError,
      );

      if (loadError?.status === 401) {
        router.push(
          `/login?redirect=${encodeURIComponent(
            '/cart',
          )}`,
        );

        return;
      }

      setError(
        loadError?.message ||
          'We could not load your cart.',
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  useEffect(() => {
    function refreshCart() {
      loadCart();
    }

    window.addEventListener(
      'desire-cart-updated',
      refreshCart,
    );

    return () => {
      window.removeEventListener(
        'desire-cart-updated',
        refreshCart,
      );
    };
  }, [loadCart]);

  const items = useMemo(
    () => cart.items || [],
    [cart.items],
  );

  const calculatedSubtotal = useMemo(() => {
    return items.reduce(
      (total, item) =>
        total + Number(item?.subtotal || 0),
      0,
    );
  }, [items]);

  const subtotal =
    Number(cart.totalAmount) ||
    calculatedSubtotal;

  const shippingFee = 0;
  const discount = 0;

  const finalTotal =
    subtotal + shippingFee - discount;

  function showSuccess(message) {
    setSuccessMessage(message);

    window.setTimeout(() => {
      setSuccessMessage('');
    }, 3500);
  }

  function updateLocalCart(response) {
    setCart(normalizeCart(response));

    window.dispatchEvent(
      new CustomEvent(
        'desire-cart-updated',
      ),
    );
  }

  async function handleQuantityChange(
    item,
    nextQuantity,
  ) {
    const itemId = getItemId(item);
    const product = getProduct(item);

    if (!itemId) {
      setError(
        'This cart item does not have a valid ID. Remove and add the product again after fixing the cart schema.',
      );

      return;
    }

    const stock = Number(
      product?.stock || 0,
    );

    const safeQuantity = Math.min(
      Math.max(nextQuantity, 1),
      Math.min(stock, 20),
    );

    if (safeQuantity === item.quantity) {
      return;
    }

    try {
      setUpdatingItemId(itemId);
      setError('');

      const response =
        await updateCartItem(itemId, {
          quantity: safeQuantity,
        });

      updateLocalCart(response);
    } catch (updateError) {
      console.error(
        'Unable to update cart item:',
        updateError,
      );

      setError(
        updateError?.message ||
          'We could not update this cart item.',
      );
    } finally {
      setUpdatingItemId('');
    }
  }

  async function handleRemove(itemId) {
    if (!itemId) {
      setError(
        'This cart item does not have a valid ID.',
      );

      return;
    }

    try {
      setRemovingItemId(itemId);
      setError('');

      const response =
        await removeCartItem(itemId);

      updateLocalCart(response);

      showSuccess(
        'Product removed from cart.',
      );
    } catch (removeError) {
      console.error(
        'Unable to remove cart item:',
        removeError,
      );

      setError(
        removeError?.message ||
          'We could not remove this product.',
      );
    } finally {
      setRemovingItemId('');
    }
  }

  async function handleClearCart() {
    if (items.length === 0 || clearing) {
      return;
    }

    const confirmed = window.confirm(
      'Remove every product from your cart?',
    );

    if (!confirmed) {
      return;
    }

    try {
      setClearing(true);
      setError('');

      const response = await clearCart();

      updateLocalCart(response);

      showSuccess(
        'Cart cleared successfully.',
      );
    } catch (clearError) {
      console.error(
        'Unable to clear cart:',
        clearError,
      );

      setError(
        clearError?.message ||
          'We could not clear your cart.',
      );
    } finally {
      setClearing(false);
    }
  }

  function handleCheckout() {
    if (items.length === 0) {
      return;
    }

    router.push('/checkout');
  }

  return (
    <main className={styles.page}>
      {successMessage && (
        <div
          className={styles.successToast}
          role="status"
        >
          <CheckIcon />
          {successMessage}
        </div>
      )}

      <div className={styles.topNavigation}>
        <Link
          href="/shop"
          className={styles.backLink}
        >
          <ArrowLeftIcon />
          Continue shopping
        </Link>
      </div>

      <section className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>
            Your selection
          </span>

          <h1>Shopping cart</h1>

          <p>
            Review your selected DESIRE pieces
            before continuing to checkout.
          </p>
        </div>

        {!loading && items.length > 0 && (
          <button
            type="button"
            onClick={handleClearCart}
            disabled={clearing}
            className={styles.clearButton}
          >
            <TrashIcon />

            {clearing
              ? 'Clearing...'
              : 'Clear cart'}
          </button>
        )}
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

      {loading ? (
        <section className={styles.cartLayout}>
          <div className={styles.itemsPanel}>
            {[1, 2, 3].map((item) => (
              <CartSkeleton key={item} />
            ))}
          </div>

          <aside
            className={styles.summarySkeleton}
          >
            <span />
            <span />
            <span />
            <span />
          </aside>
        </section>
      ) : items.length === 0 ? (
        <section className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <BagIcon />
          </div>

          <span className={styles.eyebrow}>
            Your cart is empty
          </span>

          <h2>
            Discover your next DESIRE
          </h2>

          <p>
            Explore the latest collection and
            add your favourite pieces to your cart.
          </p>

          <Link
            href="/shop"
            className={styles.primaryButton}
          >
            Explore the shop
            <ArrowIcon />
          </Link>
        </section>
      ) : (
        <section className={styles.cartLayout}>
          <div className={styles.itemsPanel}>
            <div className={styles.itemsHeader}>
              <div>
                <span className={styles.eyebrow}>
                  Cart products
                </span>

                <h2>Your items</h2>
              </div>

              <span className={styles.itemCount}>
                {cart.totalItems}{' '}
                {cart.totalItems === 1
                  ? 'item'
                  : 'items'}
              </span>
            </div>

            <div className={styles.itemsList}>
              {items.map((item) => {
                const itemId =
                  getItemId(item);

                const product =
                  getProduct(item);

                const identifier =
                  getProductIdentifier(product);

                const stock = Number(
                  product?.stock || 0,
                );

                const unavailable =
                  product?.isActive === false ||
                  stock <= 0;

                const isUpdating =
                  updatingItemId === itemId;

                const isRemoving =
                  removingItemId === itemId;

                return (
                  <article
                    key={
                      itemId ||
                      `${product?.id}-${item?.size}-${item?.color}`
                    }
                    className={styles.cartItem}
                  >
                    <Link
                      href={`/products/${identifier}`}
                      className={styles.imageLink}
                    >
                      <img
                        src={getProductImage(
                          product,
                        )}
                        alt={
                          product?.name ||
                          'DESIRE product'
                        }
                        onError={(event) => {
                          event.currentTarget.src =
                            '/images/product-placeholder.jpg';
                        }}
                      />
                    </Link>

                    <div
                      className={
                        styles.itemInformation
                      }
                    >
                      <span
                        className={
                          styles.productLabel
                        }
                      >
                        DESIRE
                      </span>

                      <Link
                        href={`/products/${identifier}`}
                        className={
                          styles.productName
                        }
                      >
                        {product?.name ||
                          'DESIRE Product'}
                      </Link>

                      <div
                        className={
                          styles.variantDetails
                        }
                      >
                        <span>
                          Size:{' '}
                          <strong>
                            {item?.size ||
                              'Not specified'}
                          </strong>
                        </span>

                        <span>
                          Colour:{' '}
                          <strong>
                            {item?.color ||
                              'Not specified'}
                          </strong>
                        </span>
                      </div>

                      <span
                        className={
                          styles.unitPrice
                        }
                      >
                        {formatCurrency(
                          product?.price,
                        )}{' '}
                        each
                      </span>

                      {unavailable && (
                        <p
                          className={
                            styles.unavailable
                          }
                        >
                          This product is currently
                          unavailable.
                        </p>
                      )}

                      {!itemId && (
                        <p
                          className={
                            styles.unavailable
                          }
                        >
                          Remove and add this product
                          again so it receives a cart
                          item ID.
                        </p>
                      )}
                    </div>

                    <div
                      className={
                        styles.quantityColumn
                      }
                    >
                      <span>Quantity</span>

                      <div
                        className={
                          styles.quantitySelector
                        }
                      >
                        <button
                          type="button"
                          onClick={() =>
                            handleQuantityChange(
                              item,
                              item.quantity - 1,
                            )
                          }
                          disabled={
                            unavailable ||
                            isUpdating ||
                            item.quantity <= 1 ||
                            !itemId
                          }
                          aria-label="Decrease quantity"
                        >
                          <MinusIcon />
                        </button>

                        <strong>
                          {isUpdating
                            ? '…'
                            : item.quantity}
                        </strong>

                        <button
                          type="button"
                          onClick={() =>
                            handleQuantityChange(
                              item,
                              item.quantity + 1,
                            )
                          }
                          disabled={
                            unavailable ||
                            isUpdating ||
                            item.quantity >= stock ||
                            item.quantity >= 20 ||
                            !itemId
                          }
                          aria-label="Increase quantity"
                        >
                          <PlusIcon />
                        </button>
                      </div>

                      <small>
                        {stock > 0
                          ? `${stock} available`
                          : 'Out of stock'}
                      </small>
                    </div>

                    <div
                      className={
                        styles.priceColumn
                      }
                    >
                      <strong>
                        {formatCurrency(
                          item?.subtotal,
                        )}
                      </strong>

                      <button
                        type="button"
                        onClick={() =>
                          handleRemove(itemId)
                        }
                        disabled={
                          isRemoving || !itemId
                        }
                        className={
                          styles.removeButton
                        }
                      >
                        <TrashIcon />

                        {isRemoving
                          ? 'Removing...'
                          : 'Remove'}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          <aside className={styles.summaryPanel}>
            <span className={styles.eyebrow}>
              Order summary
            </span>

            <h2>Cart total</h2>

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
                  Calculated at checkout
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
                    −{formatCurrency(discount)}
                  </strong>
                </div>
              )}
            </div>

            <div className={styles.totalRow}>
              <span>Total</span>

              <strong>
                {formatCurrency(finalTotal)}
              </strong>
            </div>

            <button
              type="button"
              onClick={handleCheckout}
              className={styles.checkoutButton}
            >
              Proceed to checkout
              <ArrowIcon />
            </button>

            <Link
              href="/shop"
              className={styles.continueLink}
            >
              Continue shopping
            </Link>

            <div className={styles.summaryNotes}>
              <p>
                Final shipping costs and discounts
                will be confirmed during checkout.
              </p>

              <p>
                Products are revalidated against
                current stock before an order is
                created.
              </p>
            </div>
          </aside>
        </section>
      )}
    </main>
  );
}