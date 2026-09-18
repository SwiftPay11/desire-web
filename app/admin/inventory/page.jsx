'use client';

import Link from 'next/link';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  adjustProductInventory,
  getAdminInventory,
} from '@/services/products.service';

import styles from './inventory.module.css';

function getProductId(product) {
  return (
    product?._id ||
    product?.id ||
    ''
  );
}

function normalizeInventory(response) {
  if (
    Array.isArray(
      response?.inventory,
    )
  ) {
    return response.inventory;
  }

  if (
    Array.isArray(
      response?.data?.inventory,
    )
  ) {
    return response.data.inventory;
  }

  return [];
}

function normalizeSummary(response) {
  return (
    response?.summary ||
    response?.data?.summary || {
      totalProducts: 0,
      totalStockUnits: 0,
      inStockProducts: 0,
      lowStockProducts: 0,
      outOfStockProducts: 0,
    }
  );
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        cx="11"
        cy="11"
        r="7"
      />

      <path d="m16 16 5 5" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M20 7v5h-5" />
      <path d="M4 17v-5h5" />
      <path d="M6.5 9a7 7 0 0 1 11.5-2" />
      <path d="M17.5 15a7 7 0 0 1-11.5 2" />
    </svg>
  );
}

function PackageIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="m3 7 9-4 9 4-9 4-9-4Z" />
      <path d="M3 7v10l9 4 9-4V7" />
      <path d="M12 11v10" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="m4 16 10-10 4 4L8 20H4v-4Z" />
      <path d="m13 7 4 4" />
    </svg>
  );
}

function MinusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M5 12h14" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

function InventorySkeleton() {
  return (
    <div
      className={
        styles.skeletonList
      }
    >
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
          </div>
        ),
      )}
    </div>
  );
}

export default function AdminInventoryPage() {
  const [
    inventory,
    setInventory,
  ] = useState([]);

  const [
    summary,
    setSummary,
  ] = useState({
    totalProducts: 0,
    totalStockUnits: 0,
    inStockProducts: 0,
    lowStockProducts: 0,
    outOfStockProducts: 0,
  });

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
    successMessage,
    setSuccessMessage,
  ] = useState('');

  const [
    search,
    setSearch,
  ] = useState('');

  const [
    stockFilter,
    setStockFilter,
  ] = useState('ALL');

  const [
    adjustmentProduct,
    setAdjustmentProduct,
  ] = useState(null);

  const [
    adjustmentAction,
    setAdjustmentAction,
  ] = useState('ADD');

  const [
    adjustmentQuantity,
    setAdjustmentQuantity,
  ] = useState('');

  const [
    updating,
    setUpdating,
  ] = useState(false);

  const loadInventory =
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
            await getAdminInventory();

          setInventory(
            normalizeInventory(
              response,
            ),
          );

          setSummary(
            normalizeSummary(
              response,
            ),
          );
        } catch (loadError) {
          console.error(
            'Unable to load inventory:',
            loadError,
          );

          setError(
            loadError?.message ||
              'We could not load inventory.',
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [],
    );

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  function showSuccess(
    message,
  ) {
    setSuccessMessage(
      message,
    );

    window.setTimeout(() => {
      setSuccessMessage('');
    }, 3000);
  }

  function openAdjustment(
    product,
    action,
  ) {
    setAdjustmentProduct(
      product,
    );

    setAdjustmentAction(
      action,
    );

    setAdjustmentQuantity('');

    setError('');
  }

  function closeAdjustment() {
    if (updating) {
      return;
    }

    setAdjustmentProduct(null);
    setAdjustmentQuantity('');
  }

  async function handleAdjustment(
    event,
  ) {
    event.preventDefault();

    if (
      !adjustmentProduct
    ) {
      return;
    }

    const quantity =
      Number(
        adjustmentQuantity,
      );

    if (
      !Number.isInteger(
        quantity,
      ) ||
      quantity < 0
    ) {
      setError(
        'Enter a valid whole-number quantity.',
      );

      return;
    }

    if (
      adjustmentAction !==
        'SET' &&
      quantity === 0
    ) {
      setError(
        'Quantity must be greater than zero.',
      );

      return;
    }

    const productId =
      getProductId(
        adjustmentProduct,
      );

    try {
      setUpdating(true);
      setError('');

      const response =
        await adjustProductInventory(
          productId,
          {
            action:
              adjustmentAction,

            quantity,
          },
        );

      const updatedProduct =
        response?.product ||
        response?.data?.product;

      const inventoryInfo =
        response?.inventory ||
        response?.data?.inventory;

      setInventory(
        (current) =>
          current.map(
            (product) => {
              if (
                getProductId(
                  product,
                ) !==
                productId
              ) {
                return product;
              }

              const nextStock =
                inventoryInfo
                  ?.currentStock ??
                updatedProduct
                  ?.stock ??
                product.stock;

              const stockStatus =
                inventoryInfo
                  ?.stockStatus ||
                (nextStock === 0
                  ? 'OUT_OF_STOCK'
                  : nextStock <= 5
                    ? 'LOW_STOCK'
                    : 'IN_STOCK');

              return {
                ...product,
                ...updatedProduct,
                stock:
                  nextStock,
                stockStatus,
              };
            },
          ),
      );

      setAdjustmentProduct(null);
setAdjustmentQuantity('');

showSuccess(
  'Inventory updated successfully.',
);

await loadInventory(
  true,
);
    } catch (updateError) {
      console.error(
        'Unable to update inventory:',
        updateError,
      );

      setError(
        updateError?.message ||
          'We could not update inventory.',
      );
    } finally {
      setUpdating(false);
    }
  }

  const filteredInventory =
    useMemo(() => {
      const normalizedSearch =
        search
          .trim()
          .toLowerCase();

      return inventory.filter(
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

          const stock =
            Number(
              product?.stock ||
              0,
            );

          let status =
            product?.stockStatus;

          if (!status) {
            if (stock === 0) {
              status =
                'OUT_OF_STOCK';
            } else if (
              stock <= 5
            ) {
              status =
                'LOW_STOCK';
            } else {
              status =
                'IN_STOCK';
            }
          }

          const matchesStock =
            stockFilter ===
              'ALL' ||
            status ===
              stockFilter;

          return (
            matchesSearch &&
            matchesStock
          );
        },
      );
    }, [
      inventory,
      search,
      stockFilter,
    ]);

  return (
    <div
      className={
        styles.page
      }
    >
      {successMessage && (
        <div
          className={
            styles.toast
          }
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
            Stock control
          </span>

          <h1>
            Inventory
          </h1>

          <p>
            Monitor DESIRE stock
            levels and make manual
            inventory adjustments.
            Paid orders continue to
            deduct inventory
            automatically.
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
            disabled={
              refreshing
            }
            onClick={() =>
              loadInventory(
                true,
              )
            }
          >
            <RefreshIcon />

            {refreshing
              ? 'Refreshing...'
              : 'Refresh'}
          </button>

          <Link
            href="/admin/products"
            className={
              styles.productsButton
            }
          >
            Products
            <PackageIcon />
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
            Products
          </span>

          <strong>
            {summary.totalProducts}
          </strong>
        </article>

        <article>
          <span>
            Stock units
          </span>

          <strong>
            {summary.totalStockUnits}
          </strong>
        </article>

        <article>
          <span>
            In stock
          </span>

          <strong>
            {summary.inStockProducts}
          </strong>
        </article>

        <article>
          <span>
            Low stock
          </span>

          <strong>
            {summary.lowStockProducts}
          </strong>
        </article>

        <article>
          <span>
            Out of stock
          </span>

          <strong>
            {summary.outOfStockProducts}
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
            onChange={(
              event,
            ) =>
              setSearch(
                event.target.value,
              )
            }
            placeholder="Search product, SKU or slug"
          />
        </div>

        <select
          value={
            stockFilter
          }
          onChange={(
            event,
          ) =>
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
        Showing{' '}
        {filteredInventory.length}{' '}
        of {inventory.length}
      </div>

      {loading ? (
        <InventorySkeleton />
      ) : filteredInventory.length ===
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
            Inventory
          </span>

          <h2>
            No inventory found
          </h2>

          <p>
            No products match the
            inventory filters you
            selected.
          </p>
        </section>
      ) : (
        <section
          className={
            styles.inventoryList
          }
        >
          {filteredInventory.map(
            (product) => {
              const productId =
                getProductId(
                  product,
                );

              const stock =
                Number(
                  product?.stock ||
                  0,
                );

              const image =
                product
                  ?.images?.[0] ||
                '';

              const stockStatus =
                product
                  ?.stockStatus ||
                (stock === 0
                  ? 'OUT_OF_STOCK'
                  : stock <= 5
                    ? 'LOW_STOCK'
                    : 'IN_STOCK');

              const statusLabel =
                stockStatus ===
                'OUT_OF_STOCK'
                  ? 'Out of stock'
                  : stockStatus ===
                      'LOW_STOCK'
                    ? 'Low stock'
                    : 'In stock';

              const stockClass =
                stockStatus ===
                'OUT_OF_STOCK'
                  ? styles.outOfStock
                  : stockStatus ===
                      'LOW_STOCK'
                    ? styles.lowStock
                    : styles.inStock;

              const category =
                typeof product
                  ?.category ===
                'object'
                  ? product
                      ?.category
                      ?.name
                  : 'Category';

              return (
                <article
                  key={
                    productId
                  }
                  className={
                    styles.inventoryRow
                  }
                >
                  <div
                    className={
                      styles.productIdentity
                    }
                  >
                    <div
                      className={
                        styles.productImage
                      }
                    >
                      {image ? (
                        <img
                          src={
                            image
                          }
                          alt={
                            product
                              ?.name ||
                            'DESIRE product'
                          }
                        />
                      ) : (
                        <PackageIcon />
                      )}
                    </div>

                    <div>
                      <span>
                        {product?.sku ||
                          'NO SKU'}
                      </span>

                      <h3>
                        {product?.name ||
                          'Untitled product'}
                      </h3>

                      <p>
                        {category}
                      </p>
                    </div>
                  </div>

                  <div
                    className={
                      styles.stockColumn
                    }
                  >
                    <span>
                      Current stock
                    </span>

                    <strong>
                      {stock}
                    </strong>

                    <small>
                      units
                    </small>
                  </div>

                  <div
                    className={
                      styles.statusColumn
                    }
                  >
                    <span
                      className={`${styles.stockBadge} ${stockClass}`}
                    >
                      {
                        statusLabel
                      }
                    </span>

                    <span
                      className={`${styles.productStatus} ${
                        product
                          ?.isActive
                          ? styles.activeStatus
                          : styles.inactiveStatus
                      }`}
                    >
                      {product
                        ?.isActive
                        ? 'Active'
                        : 'Inactive'}
                    </span>
                  </div>

                  <div
                    className={
                      styles.inventoryActions
                    }
                  >
                    <button
                      type="button"
                      onClick={() =>
                        openAdjustment(
                          product,
                          'ADD',
                        )
                      }
                    >
                      <PlusIcon />
                      Add
                    </button>

                    <button
                      type="button"
                      disabled={
                        stock ===
                        0
                      }
                      onClick={() =>
                        openAdjustment(
                          product,
                          'SUBTRACT',
                        )
                      }
                    >
                      <MinusIcon />
                      Remove
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        openAdjustment(
                          product,
                          'SET',
                        )
                      }
                    >
                      Set stock
                    </button>

                    <Link
                      href={`/admin/products/${productId}`}
                    >
                      <EditIcon />
                      Product
                    </Link>
                  </div>
                </article>
              );
            },
          )}
        </section>
      )}

      {adjustmentProduct && (
        <div
          className={
            styles.modalBackdrop
          }
          onMouseDown={
            closeAdjustment
          }
        >
          <div
            className={
              styles.modal
            }
            onMouseDown={(
              event,
            ) =>
              event.stopPropagation()
            }
          >
            <span
              className={
                styles.eyebrow
              }
            >
              Inventory adjustment
            </span>

            <h2>
              {adjustmentAction ===
              'ADD'
                ? 'Add stock'
                : adjustmentAction ===
                    'SUBTRACT'
                  ? 'Remove stock'
                  : 'Set stock'}
            </h2>

            <p>
              {
                adjustmentProduct.name
              }
            </p>

            <div
              className={
                styles.currentStockBox
              }
            >
              <span>
                Current inventory
              </span>

              <strong>
                {Number(
                  adjustmentProduct
                    ?.stock ||
                    0,
                )}
              </strong>

              <small>
                units
              </small>
            </div>

            <form
              onSubmit={
                handleAdjustment
              }
            >
              <label>
                <span>
                  {adjustmentAction ===
                  'SET'
                    ? 'New stock quantity'
                    : 'Quantity'}
                </span>

                <input
                  type="number"
                  min="0"
                  step="1"
                  autoFocus
                  value={
                    adjustmentQuantity
                  }
                  onChange={(
                    event,
                  ) =>
                    setAdjustmentQuantity(
                      event
                        .target
                        .value,
                    )
                  }
                  required
                />
              </label>

              <div
                className={
                  styles.modalActions
                }
              >
                <button
                  type="button"
                  className={
                    styles.cancelButton
                  }
                  disabled={
                    updating
                  }
                  onClick={
                    closeAdjustment
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className={
                    styles.confirmButton
                  }
                  disabled={
                    updating
                  }
                >
                  {updating
                    ? 'Updating...'
                    : 'Confirm adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}