'use client';

import Link from 'next/link';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  deleteProduct,
  getAdminProducts,
} from '@/services/products.service';

import styles from './products.module.css';

function formatCurrency(value) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function getProductId(product) {
  return (
    product?._id ||
    product?.id ||
    ''
  );
}

function getProductImage(product) {
  const image =
    product?.images?.[0] ||
    '';

  if (!image) {
    return '';
  }

  return image;
}

function normalizeProducts(response) {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.products)) {
    return response.products;
  }

  if (
    Array.isArray(
      response?.data?.products,
    )
  ) {
    return response.data.products;
  }

  return [];
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m16 16 5 5" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m4 16 10-10 4 4L8 20H4v-4Z" />
      <path d="m13 7 4 4" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 7h16" />
      <path d="M9 7V4h6v3" />
      <path d="M7 7l1 13h8l1-13" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20 7v5h-5" />
      <path d="M4 17v-5h5" />
      <path d="M6.5 9a7 7 0 0 1 11.5-2" />
      <path d="M17.5 15a7 7 0 0 1-11.5 2" />
    </svg>
  );
}

function PackageIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m3 7 9-4 9 4-9 4-9-4Z" />
      <path d="M3 7v10l9 4 9-4V7" />
      <path d="M12 11v10" />
    </svg>
  );
}

function ProductsSkeleton() {
  return (
    <div className={styles.skeletonList}>
      {[1, 2, 3, 4, 5].map(
        (item) => (
          <div
            key={item}
            className={
              styles.skeletonRow
            }
          >
            <span />
            <div>
              <span />
              <span />
            </div>
            <span />
            <span />
            <span />
          </div>
        ),
      )}
    </div>
  );
}

export default function AdminProductsPage() {
  const [products, setProducts] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState('');

  const [search, setSearch] =
    useState('');

  const [stockFilter, setStockFilter] =
    useState('ALL');

  const [statusFilter, setStatusFilter] =
    useState('ALL');

  const [deletingId, setDeletingId] =
    useState('');

  const [
    successMessage,
    setSuccessMessage,
  ] = useState('');

  const loadProducts =
    useCallback(
      async (
        isRefresh = false,
      ) => {
        try {
          if (isRefresh) {
            setRefreshing(true);
          } else {
            setLoading(true);
          }

          setError('');

          const response =
            await getAdminProducts();

          setProducts(
            normalizeProducts(
              response,
            ),
          );
        } catch (loadError) {
          console.error(
            'Unable to load admin products:',
            loadError,
          );

          setError(
            loadError?.message ||
              'We could not load the product catalogue.',
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [],
    );

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  function showSuccess(message) {
    setSuccessMessage(message);

    window.setTimeout(() => {
      setSuccessMessage('');
    }, 3000);
  }

  async function handleDelete(
    product,
  ) {
    const productId =
      getProductId(product);

    if (!productId) {
      return;
    }

    const confirmed =
      window.confirm(
        `Delete "${product.name}"? This action cannot be undone.`,
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(productId);
      setError('');

      await deleteProduct(
        productId,
      );

      setProducts(
        (current) =>
          current.filter(
            (item) =>
              getProductId(
                item,
              ) !==
              productId,
          ),
      );

      showSuccess(
        'Product deleted successfully.',
      );
    } catch (deleteError) {
      console.error(
        'Unable to delete product:',
        deleteError,
      );

      setError(
        deleteError?.message ||
          'We could not delete this product.',
      );
    } finally {
      setDeletingId('');
    }
  }

  const filteredProducts =
    useMemo(() => {
      const normalizedSearch =
        search.trim().toLowerCase();

      return products.filter(
        (product) => {
          const matchesSearch =
            !normalizedSearch ||
            product?.name
              ?.toLowerCase()
              .includes(
                normalizedSearch,
              ) ||
            product?.sku
              ?.toLowerCase()
              .includes(
                normalizedSearch,
              ) ||
            product?.slug
              ?.toLowerCase()
              .includes(
                normalizedSearch,
              );

          const matchesStatus =
            statusFilter === 'ALL' ||
            (statusFilter ===
              'ACTIVE' &&
              product?.isActive) ||
            (statusFilter ===
              'INACTIVE' &&
              !product?.isActive);

          const stock =
            Number(
              product?.stock ||
              0,
            );

          const matchesStock =
            stockFilter === 'ALL' ||
            (stockFilter ===
              'IN_STOCK' &&
              stock > 5) ||
            (stockFilter ===
              'LOW_STOCK' &&
              stock > 0 &&
              stock <= 5) ||
            (stockFilter ===
              'OUT_OF_STOCK' &&
              stock === 0);

          return (
            matchesSearch &&
            matchesStatus &&
            matchesStock
          );
        },
      );
    }, [
      products,
      search,
      statusFilter,
      stockFilter,
    ]);

  const totalProducts =
    products.length;

  const activeProducts =
    products.filter(
      (product) =>
        product?.isActive,
    ).length;

  const lowStockProducts =
    products.filter(
      (product) => {
        const stock =
          Number(
            product?.stock ||
            0,
          );

        return (
          stock > 0 &&
          stock <= 5
        );
      },
    ).length;

  const outOfStockProducts =
    products.filter(
      (product) =>
        Number(
          product?.stock ||
          0,
        ) === 0,
    ).length;

  return (
    <div className={styles.page}>
      {successMessage && (
        <div
          className={styles.toast}
          role="status"
        >
          {successMessage}
        </div>
      )}

      <section
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
            Catalogue
          </span>

          <h1>
            Products
          </h1>

          <p>
            Manage DESIRE products,
            stock levels, availability
            and catalogue information.
          </p>
        </div>

        <div
          className={
            styles.headerActions
          }
        >
          <button
            type="button"
            className={
              styles.refreshButton
            }
            disabled={refreshing}
            onClick={() =>
              loadProducts(true)
            }
          >
            <RefreshIcon />

            {refreshing
              ? 'Refreshing...'
              : 'Refresh'}
          </button>

          <Link
            href="/admin/products/create"
            className={
              styles.createButton
            }
          >
            Add product
            <PlusIcon />
          </Link>
        </div>
      </section>

      {error && (
        <div
          className={
            styles.errorBanner
          }
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

      <section
        className={
          styles.statsGrid
        }
      >
        <article>
          <span>
            Total products
          </span>

          <strong>
            {totalProducts}
          </strong>
        </article>

        <article>
          <span>
            Active
          </span>

          <strong>
            {activeProducts}
          </strong>
        </article>

        <article>
          <span>
            Low stock
          </span>

          <strong>
            {lowStockProducts}
          </strong>
        </article>

        <article>
          <span>
            Out of stock
          </span>

          <strong>
            {outOfStockProducts}
          </strong>
        </article>
      </section>

      <section
        className={
          styles.toolbar
        }
      >
        <div
          className={
            styles.searchWrapper
          }
        >
          <SearchIcon />

          <input
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value,
              )
            }
            placeholder="Search product, SKU or slug"
          />
        </div>

        <select
          value={
            statusFilter
          }
          onChange={(event) =>
            setStatusFilter(
              event.target.value,
            )
          }
        >
          <option value="ALL">
            All statuses
          </option>

          <option value="ACTIVE">
            Active
          </option>

          <option value="INACTIVE">
            Inactive
          </option>
        </select>

        <select
          value={
            stockFilter
          }
          onChange={(event) =>
            setStockFilter(
              event.target.value,
            )
          }
        >
          <option value="ALL">
            All inventory
          </option>

          <option value="IN_STOCK">
            In stock
          </option>

          <option value="LOW_STOCK">
            Low stock
          </option>

          <option value="OUT_OF_STOCK">
            Out of stock
          </option>
        </select>
      </section>

      <div
        className={
          styles.resultsHeader
        }
      >
        <span>
          Showing{' '}
          {filteredProducts.length}{' '}
          of {products.length}
        </span>
      </div>

      {loading ? (
        <ProductsSkeleton />
      ) : filteredProducts.length ===
        0 ? (
        <section
          className={
            styles.emptyState
          }
        >
          <div
            className={
              styles.emptyIcon
            }
          >
            <PackageIcon />
          </div>

          <span
            className={
              styles.eyebrow
            }
          >
            Catalogue
          </span>

          <h2>
            No products found
          </h2>

          <p>
            {products.length ===
            0
              ? 'Your DESIRE catalogue is empty. Add your first product to get started.'
              : 'No products match the filters you selected.'}
          </p>

          {products.length ===
            0 && (
            <Link
              href="/admin/products/create"
              className={
                styles.emptyButton
              }
            >
              Add first product
              <PlusIcon />
            </Link>
          )}
        </section>
      ) : (
        <section
          className={
            styles.productList
          }
        >
          {filteredProducts.map(
            (product) => {
              const productId =
                getProductId(
                  product,
                );

              const image =
                getProductImage(
                  product,
                );

              const stock =
                Number(
                  product?.stock ||
                  0,
                );

              const stockClass =
                stock === 0
                  ? styles.outOfStock
                  : stock <= 5
                    ? styles.lowStock
                    : styles.inStock;

              const stockLabel =
                stock === 0
                  ? 'Out of stock'
                  : stock <= 5
                    ? 'Low stock'
                    : 'In stock';

              const category =
                typeof product?.category ===
                'object'
                  ? product.category
                      ?.name
                  : 'Category';

              return (
                <article
                  key={productId}
                  className={
                    styles.productRow
                  }
                >
                  <div
                    className={
                      styles.productImage
                    }
                  >
                    {image ? (
                      <img
                        src={image}
                        alt={
                          product?.name ||
                          'DESIRE product'
                        }
                      />
                    ) : (
                      <PackageIcon />
                    )}

                    {product?.featured && (
                      <span
                        className={
                          styles.featuredBadge
                        }
                      >
                        Featured
                      </span>
                    )}
                  </div>

                  <div
                    className={
                      styles.productInfo
                    }
                  >
                    <div
                      className={
                        styles.productTitle
                      }
                    >
                      <div>
                        <span>
                          {product?.sku ||
                            'NO SKU'}
                        </span>

                        <h3>
                          {product?.name ||
                            'Untitled product'}
                        </h3>
                      </div>

                      <span
                        className={`${styles.statusBadge} ${
                          product
                            ?.isActive
                            ? styles.activeBadge
                            : styles.inactiveBadge
                        }`}
                      >
                        {product?.isActive
                          ? 'Active'
                          : 'Inactive'}
                      </span>
                    </div>

                    <div
                      className={
                        styles.productMeta
                      }
                    >
                      <div>
                        <span>
                          Price
                        </span>

                        <strong>
                          {formatCurrency(
                            product
                              ?.price,
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Category
                        </span>

                        <strong>
                          {category}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Stock
                        </span>

                        <strong>
                          {stock}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Variants
                        </span>

                        <strong>
                          {
                            product
                              ?.sizes
                              ?.length ||
                            0
                          }{' '}
                          sizes /{' '}
                          {
                            product
                              ?.colors
                              ?.length ||
                            0
                          }{' '}
                          colours
                        </strong>
                      </div>
                    </div>

                    <div
                      className={
                        styles.productFooter
                      }
                    >
                      <span
                        className={`${styles.stockBadge} ${stockClass}`}
                      >
                        {stockLabel}
                      </span>

                      <div
                        className={
                          styles.rowActions
                        }
                      >
                        <Link
                          href={`/admin/products/${productId}`}
                        >
                          <EditIcon />
                          Edit
                        </Link>

                        <button
                          type="button"
                          disabled={
                            deletingId ===
                            productId
                          }
                          onClick={() =>
                            handleDelete(
                              product,
                            )
                          }
                        >
                          <TrashIcon />

                          {deletingId ===
                          productId
                            ? 'Deleting...'
                            : 'Delete'}
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            },
          )}
        </section>
      )}
    </div>
  );
}