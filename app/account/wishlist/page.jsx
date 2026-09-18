'use client';

import Link from 'next/link';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  addCartItem,
} from '@/services/cart.service';

import {
  clearWishlist,
  getWishlist,
  removeWishlistItem,
} from '@/services/wishlist.service';

import styles from './wishlist.module.css';

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

function getWishlistItems(response) {
  if (
    Array.isArray(response?.wishlist?.items)
  ) {
    return response.wishlist.items;
  }

  if (Array.isArray(response?.items)) {
    return response.items;
  }

  return [];
}

function getProduct(item) {
  if (
    item?.product &&
    typeof item.product === 'object'
  ) {
    return item.product;
  }

  return null;
}

function getProductId(product) {
  return (
    product?._id ||
    product?.id ||
    ''
  );
}

function getProductIdentifier(product) {
  return (
    product?.slug ||
    product?._id ||
    product?.id ||
    ''
  );
}

function getProductImage(product) {
  if (
    Array.isArray(product?.images) &&
    product.images.length > 0
  ) {
    return product.images[0];
  }

  return '/images/product-placeholder.jpg';
}

function getCategoryName(product) {
  if (
    product?.category &&
    typeof product.category === 'object'
  ) {
    return (
      product.category.name ||
      'DESIRE Collection'
    );
  }

  return (
    product?.category ||
    'DESIRE Collection'
  );
}

function hasDiscount(product) {
  const price = Number(
    product?.price || 0,
  );

  const compareAtPrice = Number(
    product?.compareAtPrice || 0,
  );

  return (
    compareAtPrice > 0 &&
    compareAtPrice > price
  );
}

function getDiscountPercentage(product) {
  const price = Number(
    product?.price || 0,
  );

  const compareAtPrice = Number(
    product?.compareAtPrice || 0,
  );

  if (
    compareAtPrice <= 0 ||
    compareAtPrice <= price
  ) {
    return 0;
  }

  return Math.round(
    ((compareAtPrice - price) /
      compareAtPrice) *
      100,
  );
}

function getDefaultSize(product) {
  if (
    Array.isArray(product?.sizes) &&
    product.sizes.length > 0
  ) {
    return product.sizes[0];
  }

  return 'One Size';
}

function getDefaultColor(product) {
  if (
    Array.isArray(product?.colors) &&
    product.colors.length > 0
  ) {
    return product.colors[0];
  }

  return 'Default';
}

function HeartIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />
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

function TrashIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13" />
      <path d="M10 11v5M14 11v5" />
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

function WishlistSkeleton() {
  return (
    <article className={styles.skeletonCard}>
      <div
        className={styles.skeletonImage}
      />

      <div
        className={styles.skeletonContent}
      >
        <span />
        <span />
        <span />
        <span />
      </div>
    </article>
  );
}

export default function WishlistPage() {
  const [items, setItems] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const [successMessage, setSuccessMessage] =
    useState('');

  const [removingProductId, setRemovingProductId] =
    useState('');

  const [movingProductId, setMovingProductId] =
    useState('');

  const [clearing, setClearing] =
    useState(false);

  const loadWishlist =
    useCallback(async () => {
      try {
        setLoading(true);
        setError('');

        const response =
          await getWishlist();

        setItems(
          getWishlistItems(response),
        );
      } catch (loadError) {
        console.error(
          'Unable to load wishlist:',
          loadError,
        );

        setItems([]);

        setError(
          loadError?.message ||
            'We could not load your wishlist.',
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    loadWishlist();
  }, [loadWishlist]);

  const availableItems =
    useMemo(() => {
      return items.filter((item) => {
        const product =
          getProduct(item);

        return (
          product &&
          product.isActive !== false
        );
      });
    }, [items]);

  function showSuccess(message) {
    setSuccessMessage(message);

    window.setTimeout(() => {
      setSuccessMessage('');
    }, 3500);
  }

  async function handleRemove(productId) {
    if (!productId) {
      return;
    }

    try {
      setRemovingProductId(productId);
      setError('');

      await removeWishlistItem(
        productId,
      );

      setItems((currentItems) =>
        currentItems.filter((item) => {
          const product =
            getProduct(item);

          return (
            getProductId(product) !==
            productId
          );
        }),
      );

      window.dispatchEvent(
        new CustomEvent(
          'desire-wishlist-updated',
        ),
      );

      showSuccess(
        'Product removed from wishlist.',
      );
    } catch (removeError) {
      console.error(
        'Unable to remove wishlist item:',
        removeError,
      );

      setError(
        removeError?.message ||
          'We could not remove this product.',
      );
    } finally {
      setRemovingProductId('');
    }
  }

  async function handleMoveToCart(product) {
    const productId =
      getProductId(product);

    if (!productId) {
      return;
    }

    if (
      Number(product?.stock || 0) <= 0
    ) {
      setError(
        'This product is currently sold out.',
      );

      return;
    }

    try {
      setMovingProductId(productId);
      setError('');

      await addCartItem({
        productId,
        quantity: 1,
        size:
          getDefaultSize(product),
        color:
          getDefaultColor(product),
      });

      await removeWishlistItem(
        productId,
      );

      setItems((currentItems) =>
        currentItems.filter((item) => {
          const currentProduct =
            getProduct(item);

          return (
            getProductId(
              currentProduct,
            ) !== productId
          );
        }),
      );

      window.dispatchEvent(
        new CustomEvent(
          'desire-cart-updated',
        ),
      );

      window.dispatchEvent(
        new CustomEvent(
          'desire-wishlist-updated',
        ),
      );

      showSuccess(
        'Product moved to cart.',
      );
    } catch (moveError) {
      console.error(
        'Unable to move product to cart:',
        moveError,
      );

      setError(
        moveError?.message ||
          'We could not move this product to your cart.',
      );
    } finally {
      setMovingProductId('');
    }
  }

  async function handleClearWishlist() {
    if (
      availableItems.length === 0 ||
      clearing
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        'Remove every product from your wishlist?',
      );

    if (!confirmed) {
      return;
    }

    try {
      setClearing(true);
      setError('');

      await clearWishlist();

      setItems([]);

      window.dispatchEvent(
        new CustomEvent(
          'desire-wishlist-updated',
        ),
      );

      showSuccess(
        'Wishlist cleared successfully.',
      );
    } catch (clearError) {
      console.error(
        'Unable to clear wishlist:',
        clearError,
      );

      setError(
        clearError?.message ||
          'We could not clear your wishlist.',
      );
    } finally {
      setClearing(false);
    }
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

      <section className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>
            Saved pieces
          </span>

          <h1>My wishlist</h1>

          <p>
            Keep track of the DESIRE pieces
            you love and move them to your cart
            whenever you are ready.
          </p>
        </div>

        {!loading &&
          availableItems.length > 0 && (
            <button
              type="button"
              onClick={
                handleClearWishlist
              }
              disabled={clearing}
              className={
                styles.clearButton
              }
            >
              <TrashIcon />

              {clearing
                ? 'Clearing...'
                : 'Clear wishlist'}
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
            onClick={() =>
              setError('')
            }
          >
            Dismiss
          </button>
        </div>
      )}

      <section className={styles.content}>
        <div className={styles.sectionHeading}>
          <div>
            <span className={styles.eyebrow}>
              Your selection
            </span>

            <h2>Saved products</h2>
          </div>

          {!loading && (
            <span className={styles.count}>
              {availableItems.length}{' '}
              {availableItems.length === 1
                ? 'item'
                : 'items'}
            </span>
          )}
        </div>

        {loading ? (
          <div className={styles.grid}>
            {Array.from({
              length: 4,
            }).map((_, index) => (
              <WishlistSkeleton
                key={index}
              />
            ))}
          </div>
        ) : availableItems.length === 0 ? (
          <section className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <HeartIcon />
            </div>

            <span className={styles.eyebrow}>
              Nothing saved yet
            </span>

            <h2>
              Your wishlist is waiting
            </h2>

            <p>
              Save products from the shop
              and they will appear here.
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
          <div className={styles.grid}>
            {availableItems.map((item) => {
              const product =
                getProduct(item);

              const productId =
                getProductId(product);

              const identifier =
                getProductIdentifier(
                  product,
                );

              const outOfStock =
                Number(
                  product?.stock || 0,
                ) <= 0;

              const discounted =
                hasDiscount(product);

              return (
                <article
                  key={
                    item?._id ||
                    productId
                  }
                  className={
                    styles.productCard
                  }
                >
                  <Link
                    href={`/products/${identifier}`}
                    className={
                      styles.imageLink
                    }
                  >
                    <div
                      className={
                        styles.imageWrapper
                      }
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
                    </div>

                    <div
                      className={
                        styles.badges
                      }
                    >
                      {discounted && (
                        <span>
                          {getDiscountPercentage(
                            product,
                          )}
                          % off
                        </span>
                      )}

                      {outOfStock && (
                        <span>
                          Sold out
                        </span>
                      )}
                    </div>
                  </Link>

                  <div
                    className={
                      styles.productInformation
                    }
                  >
                    <span
                      className={
                        styles.category
                      }
                    >
                      {getCategoryName(
                        product,
                      )}
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
                        styles.priceRow
                      }
                    >
                      <strong>
                        {formatCurrency(
                          product?.price,
                        )}
                      </strong>

                      {discounted && (
                        <del>
                          {formatCurrency(
                            product
                              ?.compareAtPrice,
                          )}
                        </del>
                      )}
                    </div>

                    <div
                      className={
                        styles.productMeta
                      }
                    >
                      <span>
                        {outOfStock
                          ? 'Currently unavailable'
                          : `${product.stock} in stock`}
                      </span>

                      {item?.addedAt && (
                        <span>
                          Saved{' '}
                          {new Intl.DateTimeFormat(
                            'en-NG',
                            {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            },
                          ).format(
                            new Date(
                              item.addedAt,
                            ),
                          )}
                        </span>
                      )}
                    </div>

                    <div
                      className={
                        styles.actions
                      }
                    >
                      <button
                        type="button"
                        onClick={() =>
                          handleMoveToCart(
                            product,
                          )
                        }
                        disabled={
                          outOfStock ||
                          movingProductId ===
                            productId
                        }
                        className={
                          styles.cartButton
                        }
                      >
                        <BagIcon />

                        {movingProductId ===
                        productId
                          ? 'Moving...'
                          : outOfStock
                            ? 'Sold out'
                            : 'Move to cart'}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleRemove(
                            productId,
                          )
                        }
                        disabled={
                          removingProductId ===
                          productId
                        }
                        className={
                          styles.removeButton
                        }
                        aria-label={`Remove ${product?.name || 'product'} from wishlist`}
                      >
                        <TrashIcon />

                        {removingProductId ===
                        productId
                          ? 'Removing...'
                          : 'Remove'}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}