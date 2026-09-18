'use client';

import Link from 'next/link';
import {
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  useParams,
  useRouter,
} from 'next/navigation';

import { useAuth } from '@/hooks/useAuth';

import {
  getProduct,
} from '@/services/products.service';

import {
  addCartItem,
} from '@/services/cart.service';

import styles from './product.module.css';

import {
  addWishlistItem,
  checkWishlistItem,
  removeWishlistItem,
} from '@/services/wishlist.service';

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

function getProductImages(product) {
  if (
    Array.isArray(product?.images) &&
    product.images.length > 0
  ) {
    return product.images;
  }

  return [
    '/images/product-placeholder.jpg',
  ];
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

  return 'DESIRE Collection';
}

function getCategorySlug(product) {
  if (
    product?.category &&
    typeof product.category === 'object'
  ) {
    return (
      product.category.slug ||
      product.category._id ||
      ''
    );
  }

  return '';
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

function ProductIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="m4 7 8-4 8 4v10l-8 4-8-4V7Z" />
      <path d="m4 7 8 4 8-4M12 11v10" />
    </svg>
  );
}

function MinusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M6 12h12" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M12 6v12M6 12h12" />
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

function LoadingState() {
  return (
    <main className={styles.loadingPage}>
      <div className={styles.loadingGallery}>
        <div className={styles.loadingImage} />
        <div className={styles.loadingImage} />
      </div>

      <div className={styles.loadingInformation}>
        <span className={styles.skeleton} />
        <span className={styles.skeleton} />
        <span className={styles.skeleton} />
        <span className={styles.skeleton} />
        <span className={styles.skeleton} />
      </div>
    </main>
  );
}

export default function ProductDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const {
    isAuthenticated,
  } = useAuth();

  const identifier =
    params?.identifier;

  const [product, setProduct] =
    useState(null);

  const [selectedImage, setSelectedImage] =
    useState(0);

  const [selectedSize, setSelectedSize] =
    useState('');

  const [selectedColor, setSelectedColor] =
    useState('');

  const [quantity, setQuantity] =
    useState(1);

  const [loading, setLoading] =
    useState(true);

  const [addingToCart, setAddingToCart] =
    useState(false);

    const [inWishlist, setInWishlist] =
  useState(false);

const [wishlistLoading, setWishlistLoading] =
  useState(false);

  const [error, setError] =
    useState('');

  const [formError, setFormError] =
    useState('');

  const [successMessage, setSuccessMessage] =
    useState('');

    useEffect(() => {
  let mounted = true;

  async function loadWishlistStatus() {
    if (
      !product?._id ||
      !isAuthenticated
    ) {
      return;
    }

    try {
      const response =
        await checkWishlistItem(
          product._id,
        );

      if (mounted) {
        setInWishlist(
          Boolean(
            response?.inWishlist,
          ),
        );
      }
    } catch (wishlistError) {
      console.error(
        'Unable to check wishlist status:',
        wishlistError,
      );
    }
  }

  loadWishlistStatus();

  return () => {
    mounted = false;
  };
}, [
  product?._id,
  isAuthenticated,
]);

  useEffect(() => {
    let mounted = true;

    async function loadProduct() {
      if (!identifier) {
        return;
      }

      try {
        setLoading(true);
        setError('');

        const response =
          await getProduct(identifier);

        const loadedProduct =
          response?.product ||
          response?.data?.product ||
          response?.data ||
          response;

        if (
          !loadedProduct ||
          typeof loadedProduct !== 'object'
        ) {
          throw new Error(
            'Product not found.',
          );
        }

        if (!mounted) {
          return;
        }

        setProduct(loadedProduct);

        const productSizes =
          Array.isArray(
            loadedProduct.sizes,
          )
            ? loadedProduct.sizes
            : [];

        const productColors =
          Array.isArray(
            loadedProduct.colors,
          )
            ? loadedProduct.colors
            : [];

        setSelectedSize(
          productSizes[0] || 'One Size',
        );

        setSelectedColor(
          productColors[0] || 'Default',
        );
      } catch (loadError) {
        console.error(
          'Unable to load product:',
          loadError,
        );

        if (mounted) {
          setError(
            loadError?.message ||
              'We could not load this product.',
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadProduct();

    return () => {
      mounted = false;
    };
  }, [identifier]);

  const images = useMemo(
    () => getProductImages(product),
    [product],
  );

  const sizes = useMemo(() => {
    if (
      Array.isArray(product?.sizes) &&
      product.sizes.length > 0
    ) {
      return product.sizes;
    }

    return ['One Size'];
  }, [product]);

  const colors = useMemo(() => {
    if (
      Array.isArray(product?.colors) &&
      product.colors.length > 0
    ) {
      return product.colors;
    }

    return ['Default'];
  }, [product]);

  const stock = Number(
    product?.stock || 0,
  );

  const outOfStock =
    stock <= 0;

  const maximumQuantity =
    Math.min(stock, 20);

  const discounted =
    hasDiscount(product);

  const discountPercentage =
    getDiscountPercentage(product);

  function decreaseQuantity() {
    setQuantity((current) =>
      Math.max(current - 1, 1),
    );
  }

  function increaseQuantity() {
    setQuantity((current) =>
      Math.min(
        current + 1,
        maximumQuantity,
      ),
    );
  }

  async function handleWishlistToggle() {
  if (!product?._id) {
    return;
  }

  if (!isAuthenticated) {
    router.push(
      `/login?redirect=${encodeURIComponent(
        `/products/${identifier}`,
      )}`,
    );

    return;
  }

  try {
    setWishlistLoading(true);
    setFormError('');

    if (inWishlist) {
      await removeWishlistItem(
        product._id,
      );

      setInWishlist(false);

      setSuccessMessage(
        'Removed from wishlist.',
      );
    } else {
      await addWishlistItem(
        product._id,
      );

      setInWishlist(true);

      setSuccessMessage(
        'Added to wishlist.',
      );
    }

    window.dispatchEvent(
      new CustomEvent(
        'desire-wishlist-updated',
      ),
    );

    window.setTimeout(() => {
      setSuccessMessage('');
    }, 3500);
  } catch (wishlistError) {
    console.error(
      'Unable to update wishlist:',
      wishlistError,
    );

    setFormError(
      wishlistError?.message ||
        'We could not update your wishlist.',
    );
  } finally {
    setWishlistLoading(false);
  }
}

  async function handleAddToCart() {
    if (!product?._id) {
      setFormError(
        'Product information is unavailable.',
      );

      return;
    }

    if (outOfStock) {
      setFormError(
        'This product is currently sold out.',
      );

      return;
    }

    if (!selectedSize) {
      setFormError(
        'Please select a size.',
      );

      return;
    }

    if (!selectedColor) {
      setFormError(
        'Please select a colour.',
      );

      return;
    }

    if (!isAuthenticated) {
      router.push(
        `/login?redirect=${encodeURIComponent(
          `/products/${identifier}`,
        )}`,
      );

      return;
    }

    try {
      setAddingToCart(true);
      setFormError('');
      setSuccessMessage('');

      await addCartItem({
        productId: product._id,
        quantity,
        size: selectedSize,
        color: selectedColor,
      });

      setSuccessMessage(
        'Added to cart successfully.',
      );

      window.dispatchEvent(
        new CustomEvent(
          'desire-cart-updated',
        ),
      );

      window.setTimeout(() => {
        setSuccessMessage('');
      }, 3500);
    } catch (addError) {
      console.error(
        'Unable to add product to cart:',
        addError,
      );

      if (
        addError?.status === 401
      ) {
        router.push(
          `/login?redirect=${encodeURIComponent(
            `/products/${identifier}`,
          )}`,
        );

        return;
      }

      setFormError(
        addError?.message ||
          'We could not add this product to your cart.',
      );
    } finally {
      setAddingToCart(false);
    }
  }

  if (loading) {
    return <LoadingState />;
  }

  if (error || !product) {
    return (
      <main className={styles.errorPage}>
        <div className={styles.errorIcon}>
          <ProductIcon />
        </div>

        <span className={styles.eyebrow}>
          Product unavailable
        </span>

        <h1>
          We could not open this product
        </h1>

        <p>
          {error ||
            'The product may have been removed or made unavailable.'}
        </p>

        <div className={styles.errorActions}>
          <Link
            href="/shop"
            className={styles.primaryButton}
          >
            Browse shop
          </Link>

          <button
            type="button"
            onClick={() =>
              window.location.reload()
            }
            className={styles.secondaryButton}
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  const categorySlug =
    getCategorySlug(product);

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

      <div className={styles.topBar}>
        <Link
          href="/shop"
          className={styles.backLink}
        >
          <ArrowLeftIcon />
          Back to shop
        </Link>

        <nav className={styles.breadcrumbs}>
          <Link href="/">Home</Link>
          <span>/</span>
          <Link href="/shop">Shop</Link>
          <span>/</span>
          <strong>{product.name}</strong>
        </nav>
      </div>

      <section className={styles.productLayout}>
        <div className={styles.gallery}>
          <div className={styles.thumbnailList}>
            {images.map((image, index) => (
              <button
                type="button"
                key={`${image}-${index}`}
                className={`${styles.thumbnailButton} ${
                  selectedImage === index
                    ? styles.thumbnailActive
                    : ''
                }`}
                onClick={() =>
                  setSelectedImage(index)
                }
                aria-label={`View image ${index + 1}`}
              >
                <img
                  src={getImageUrl(image)}
                  alt=""
                  onError={(event) => {
                    event.currentTarget.src =
                      '/images/product-placeholder.jpg';
                  }}
                />
              </button>
            ))}
          </div>

          <div className={styles.mainImage}>
            <img
              src={getImageUrl(
                images[selectedImage],
              )}
              alt={product.name}
              onError={(event) => {
                event.currentTarget.src =
                  '/images/product-placeholder.jpg';
              }}
            />

            <div className={styles.imageBadges}>
              {product.featured && (
                <span>Featured</span>
              )}

              {discounted && (
                <span>
                  {discountPercentage}% off
                </span>
              )}

              {outOfStock && (
                <span>Sold out</span>
              )}
            </div>
          </div>
        </div>

        <aside className={styles.productInformation}>
          <div className={styles.productHeading}>
            {categorySlug ? (
              <Link
                href={`/collections/${categorySlug}`}
                className={styles.category}
              >
                {getCategoryName(product)}
              </Link>
            ) : (
              <span className={styles.category}>
                {getCategoryName(product)}
              </span>
            )}

            <h1>{product.name}</h1>

            <div className={styles.priceRow}>
              <strong>
                {formatCurrency(product.price)}
              </strong>

              {discounted && (
                <>
                  <del>
                    {formatCurrency(
                      product.compareAtPrice,
                    )}
                  </del>

                  <span>
                    Save {discountPercentage}%
                  </span>
                </>
              )}
            </div>
          </div>

          <div className={styles.productMeta}>
            <div>
              <span>SKU</span>
              <strong>
                {product.sku ||
                  'Unavailable'}
              </strong>
            </div>

            <div>
              <span>Availability</span>
              <strong>
                {outOfStock
                  ? 'Sold out'
                  : `${stock} in stock`}
              </strong>
            </div>
          </div>

          {product.description && (
            <div className={styles.description}>
              <span className={styles.sectionLabel}>
                Description
              </span>

              <p>{product.description}</p>
            </div>
          )}

          <div className={styles.selectorSection}>
            <div className={styles.selectorHeading}>
              <span className={styles.sectionLabel}>
                Select size
              </span>

              <strong>{selectedSize}</strong>
            </div>

            <div className={styles.optionGrid}>
              {sizes.map((size) => (
                <button
                  type="button"
                  key={size}
                  className={
                    selectedSize === size
                      ? styles.optionActive
                      : ''
                  }
                  onClick={() => {
                    setSelectedSize(size);
                    setFormError('');
                  }}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.selectorSection}>
            <div className={styles.selectorHeading}>
              <span className={styles.sectionLabel}>
                Select colour
              </span>

              <strong>
                {selectedColor}
              </strong>
            </div>

            <div className={styles.optionGrid}>
              {colors.map((color) => (
                <button
                  type="button"
                  key={color}
                  className={
                    selectedColor === color
                      ? styles.optionActive
                      : ''
                  }
                  onClick={() => {
                    setSelectedColor(color);
                    setFormError('');
                  }}
                >
                  {color}
                </button>
              ))}
            </div>
          </div>

          <button
  type="button"
  onClick={handleWishlistToggle}
  disabled={wishlistLoading}
  className={`${styles.wishlistButton} ${
    inWishlist
      ? styles.wishlistButtonActive
      : ''
  }`}
>
  {wishlistLoading
    ? 'Updating wishlist...'
    : inWishlist
      ? 'Remove from wishlist'
      : 'Add to wishlist'}
</button>

          <div className={styles.purchaseSection}>
            <div className={styles.quantitySelector}>
              <button
                type="button"
                onClick={decreaseQuantity}
                disabled={
                  quantity <= 1 ||
                  outOfStock
                }
                aria-label="Decrease quantity"
              >
                <MinusIcon />
              </button>

              <span>{quantity}</span>

              <button
                type="button"
                onClick={increaseQuantity}
                disabled={
                  outOfStock ||
                  quantity >=
                    maximumQuantity
                }
                aria-label="Increase quantity"
              >
                <PlusIcon />
              </button>
            </div>

            <button
              type="button"
              onClick={handleAddToCart}
              disabled={
                outOfStock ||
                addingToCart
              }
              className={styles.addToCartButton}
            >
              <BagIcon />

              {outOfStock
                ? 'Sold out'
                : addingToCart
                  ? 'Adding to cart...'
                  : 'Add to cart'}
            </button>
          </div>

          {formError && (
            <p
              className={styles.formError}
              role="alert"
            >
              {formError}
            </p>
          )}

          <div className={styles.purchaseNotes}>
            <div>
              <strong>Secure checkout</strong>
              <span>
                Complete your purchase safely.
              </span>
            </div>

            <div>
              <strong>Order support</strong>
              <span>
                Track purchases from your account.
              </span>
            </div>

            <div>
              <strong>DESIRE quality</strong>
              <span>
                Carefully selected fashion pieces.
              </span>
            </div>
          </div>

          <Link
            href="/cart"
            className={styles.viewCartLink}
          >
            View shopping cart
            <ArrowIcon />
          </Link>
        </aside>
      </section>
    </main>
  );
}