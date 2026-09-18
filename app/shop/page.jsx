'use client';

import Link from 'next/link';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  getCategories,
} from '@/services/categories.service';

import {
  getProducts,
} from '@/services/products.service';

import styles from './shop.module.css';

const PRODUCTS_PER_PAGE = 12;

const DEFAULT_FILTERS = {
  category: '',
  minPrice: '',
  maxPrice: '',
  featured: false,
};

const SORT_OPTIONS = [
  {
    value: 'newest',
    label: 'Newest arrivals',
  },
  {
    value: 'oldest',
    label: 'Oldest first',
  },
  {
    value: 'price-asc',
    label: 'Price: low to high',
  },
  {
    value: 'price-desc',
    label: 'Price: high to low',
  },
  {
    value: 'name-asc',
    label: 'Name: A to Z',
  },
  {
    value: 'name-desc',
    label: 'Name: Z to A',
  },
];

function normalizeCategories(response) {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.categories)) {
    return response.categories;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  return [];
}

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

function getProductIdentifier(product) {
  return (
    product?.slug ||
    product?._id ||
    product?.id
  );
}

function getCategoryName(product) {
  if (
    product?.category &&
    typeof product.category === 'object'
  ) {
    return (
      product.category.name ||
      'Collection'
    );
  }

  return 'Collection';
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

function getPrimaryImage(product) {
  if (
    Array.isArray(product?.images) &&
    product.images.length > 0
  ) {
    return getImageUrl(
      product.images[0],
    );
  }

  return '/images/product-placeholder.jpg';
}

function getSecondaryImage(product) {
  if (
    Array.isArray(product?.images) &&
    product.images.length > 1
  ) {
    return getImageUrl(
      product.images[1],
    );
  }

  return null;
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

      <path d="m20 20-4-4" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M4 6h16M7 12h10M10 18h4" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="m6 6 12 12M18 6 6 18" />
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

function ChevronIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="m8 10 4 4 4-4" />
    </svg>
  );
}

function EmptyIcon() {
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

function ProductSkeleton() {
  return (
    <article
      className={styles.skeletonCard}
    >
      <div
        className={styles.skeletonImage}
      />

      <div
        className={
          styles.skeletonInformation
        }
      >
        <span />
        <span />
        <span />
      </div>
    </article>
  );
}

function ProductCard({ product }) {
  const identifier =
    getProductIdentifier(product);

  const primaryImage =
    getPrimaryImage(product);

  const secondaryImage =
    getSecondaryImage(product);

  const discounted =
    hasDiscount(product);

  const discountPercentage =
    getDiscountPercentage(product);

  const outOfStock =
    Number(product?.stock || 0) <= 0;

  return (
    <article
      className={styles.productCard}
    >
      <Link
        href={`/products/${identifier}`}
        className={styles.imageLink}
        aria-label={`View ${product?.name || 'product'}`}
      >
        <div
          className={styles.imageWrapper}
        >
          <img
            src={primaryImage}
            alt={
              product?.name ||
              'DESIRE product'
            }
            className={
              styles.primaryImage
            }
            onError={(event) => {
              event.currentTarget.src =
                '/images/product-placeholder.jpg';
            }}
          />

          {secondaryImage && (
            <img
              src={secondaryImage}
              alt=""
              className={
                styles.secondaryImage
              }
              onError={(event) => {
                event.currentTarget.style.display =
                  'none';
              }}
            />
          )}
        </div>

        <div className={styles.badges}>
          {product?.featured && (
            <span
              className={
                styles.featuredBadge
              }
            >
              Featured
            </span>
          )}

          {discounted && (
            <span
              className={
                styles.saleBadge
              }
            >
              {discountPercentage}% off
            </span>
          )}

          {outOfStock && (
            <span
              className={
                styles.stockBadge
              }
            >
              Sold out
            </span>
          )}
        </div>

        <span
          className={styles.viewProduct}
        >
          View product
          <ArrowIcon />
        </span>
      </Link>

      <div
        className={
          styles.productInformation
        }
      >
        <span
          className={styles.category}
        >
          {getCategoryName(product)}
        </span>

        <Link
          href={`/products/${identifier}`}
          className={styles.productName}
        >
          {product?.name ||
            'DESIRE Product'}
        </Link>

        <div className={styles.priceRow}>
          <span
            className={
              styles.currentPrice
            }
          >
            {formatCurrency(
              product?.price,
            )}
          </span>

          {discounted && (
            <span
              className={
                styles.comparePrice
              }
            >
              {formatCurrency(
                product?.compareAtPrice,
              )}
            </span>
          )}
        </div>

        <div
          className={styles.productMeta}
        >
          {Array.isArray(
            product?.colors,
          ) &&
            product.colors.length > 0 && (
              <span>
                {product.colors.length}{' '}
                {product.colors.length === 1
                  ? 'colour'
                  : 'colours'}
              </span>
            )}

          {Array.isArray(
            product?.sizes,
          ) &&
            product.sizes.length > 0 && (
              <span>
                {product.sizes.length}{' '}
                {product.sizes.length === 1
                  ? 'size'
                  : 'sizes'}
              </span>
            )}
        </div>
      </div>
    </article>
  );
}

function FilterContent({
  categories,
  draftFilters,
  setDraftFilters,
  applyFilters,
  resetFilters,
  closeMobileFilters,
}) {
  function updateFilter(name, value) {
    setDraftFilters((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    applyFilters();
    closeMobileFilters();
  }

  function handleReset() {
    resetFilters();
    closeMobileFilters();
  }

  return (
    <form
      className={styles.filterForm}
      onSubmit={handleSubmit}
    >
      <div
        className={styles.filterSection}
      >
        <span
          className={
            styles.filterSectionLabel
          }
        >
          Collection
        </span>

        <label
          className={
            styles.radioOption
          }
        >
          <input
            type="radio"
            name="category"
            value=""
            checked={
              draftFilters.category === ''
            }
            onChange={() =>
              updateFilter(
                'category',
                '',
              )
            }
          />

          <span>All collections</span>
        </label>

        {categories.map((category) => {
          const categoryId =
            category?._id ||
            category?.id;

          return (
            <label
              key={
                categoryId ||
                category?.slug
              }
              className={
                styles.radioOption
              }
            >
              <input
                type="radio"
                name="category"
                value={categoryId}
                checked={
                  String(
                    draftFilters.category,
                  ) ===
                  String(categoryId)
                }
                onChange={() =>
                  updateFilter(
                    'category',
                    categoryId,
                  )
                }
              />

              <span>
                {category?.name ||
                  'Untitled collection'}
              </span>
            </label>
          );
        })}
      </div>

      <div
        className={styles.filterSection}
      >
        <span
          className={
            styles.filterSectionLabel
          }
        >
          Price range
        </span>

        <div
          className={styles.priceInputs}
        >
          <label>
            <span>Minimum</span>

            <div
              className={
                styles.priceInput
              }
            >
              <span>₦</span>

              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0"
                value={
                  draftFilters.minPrice
                }
                onChange={(event) =>
                  updateFilter(
                    'minPrice',
                    event.target.value,
                  )
                }
              />
            </div>
          </label>

          <label>
            <span>Maximum</span>

            <div
              className={
                styles.priceInput
              }
            >
              <span>₦</span>

              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Any"
                value={
                  draftFilters.maxPrice
                }
                onChange={(event) =>
                  updateFilter(
                    'maxPrice',
                    event.target.value,
                  )
                }
              />
            </div>
          </label>
        </div>
      </div>

      <div
        className={styles.filterSection}
      >
        <span
          className={
            styles.filterSectionLabel
          }
        >
          Product type
        </span>

        <label
          className={
            styles.checkboxOption
          }
        >
          <input
            type="checkbox"
            checked={
              draftFilters.featured
            }
            onChange={(event) =>
              updateFilter(
                'featured',
                event.target.checked,
              )
            }
          />

          <span
            className={
              styles.customCheckbox
            }
          />

          <span>
            Featured products only
          </span>
        </label>
      </div>

      <div
        className={styles.filterActions}
      >
        <button
          type="submit"
          className={
            styles.applyFilterButton
          }
        >
          Apply filters
        </button>

        <button
          type="button"
          onClick={handleReset}
          className={
            styles.resetFilterButton
          }
        >
          Reset all
        </button>
      </div>
    </form>
  );
}

export default function ShopPage() {
  const [products, setProducts] =
    useState([]);

  const [categories, setCategories] =
    useState([]);

  const [pagination, setPagination] =
    useState({
      currentPage: 1,
      totalPages: 1,
      totalProducts: 0,
      limit: PRODUCTS_PER_PAGE,
      hasNextPage: false,
      hasPreviousPage: false,
    });

  const [page, setPage] =
    useState(1);

  const [sort, setSort] =
    useState('newest');

  const [searchInput, setSearchInput] =
    useState('');

  const [search, setSearch] =
    useState('');

  const [filters, setFilters] =
    useState(DEFAULT_FILTERS);

  const [draftFilters, setDraftFilters] =
    useState(DEFAULT_FILTERS);

  const [
    mobileFiltersOpen,
    setMobileFiltersOpen,
  ] = useState(false);

  const [loading, setLoading] =
    useState(true);

  const [
    categoriesLoading,
    setCategoriesLoading,
  ] = useState(true);

  const [error, setError] =
    useState('');

  const loadCategories =
    useCallback(async () => {
      try {
        setCategoriesLoading(true);

        const response =
          await getCategories();

        const returnedCategories =
          normalizeCategories(
            response,
          ).filter(
            (category) =>
              category?.isActive !==
              false,
          );

        setCategories(
          returnedCategories,
        );
      } catch (categoryError) {
        console.error(
          'Unable to load categories:',
          categoryError,
        );

        setCategories([]);
      } finally {
        setCategoriesLoading(false);
      }
    }, []);

  const loadProducts =
    useCallback(async () => {
      try {
        setLoading(true);
        setError('');

        const response =
          await getProducts({
            page,
            limit:
              PRODUCTS_PER_PAGE,
            sort,
            search,
            category:
              filters.category,
            minPrice:
              filters.minPrice,
            maxPrice:
              filters.maxPrice,
            featured:
              filters.featured
                ? true
                : undefined,
          });

        const returnedProducts =
          Array.isArray(
            response?.products,
          )
            ? response.products
            : [];

        const returnedPagination =
          response?.pagination || {};

        setProducts(
          returnedProducts,
        );

        setPagination({
          currentPage:
            Number(
              returnedPagination.currentPage,
            ) || page,

          totalPages:
            Number(
              returnedPagination.totalPages,
            ) || 1,

          totalProducts:
            Number(
              returnedPagination.totalProducts,
            ) ||
            returnedProducts.length,

          limit:
            Number(
              returnedPagination.limit,
            ) ||
            PRODUCTS_PER_PAGE,

          hasNextPage: Boolean(
            returnedPagination.hasNextPage,
          ),

          hasPreviousPage: Boolean(
            returnedPagination.hasPreviousPage,
          ),
        });
      } catch (loadError) {
        console.error(
          'Unable to load products:',
          loadError,
        );

        setProducts([]);

        setError(
          loadError?.message ||
            'We could not load the collection.',
        );
      } finally {
        setLoading(false);
      }
    }, [
      page,
      sort,
      search,
      filters,
    ]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    if (!mobileFiltersOpen) {
      document.body.style.overflow =
        '';
      return;
    }

    document.body.style.overflow =
      'hidden';

    return () => {
      document.body.style.overflow =
        '';
    };
  }, [mobileFiltersOpen]);

  const productCountText =
    useMemo(() => {
      const total =
        pagination.totalProducts;

      return `${total} ${
        total === 1
          ? 'product'
          : 'products'
      }`;
    }, [pagination.totalProducts]);

  const selectedCategory =
    useMemo(() => {
      return categories.find(
        (category) =>
          String(
            category?._id ||
              category?.id,
          ) ===
          String(filters.category),
      );
    }, [
      categories,
      filters.category,
    ]);

  const activeFilterCount =
    useMemo(() => {
      let count = 0;

      if (filters.category) {
        count += 1;
      }

      if (filters.minPrice !== '') {
        count += 1;
      }

      if (filters.maxPrice !== '') {
        count += 1;
      }

      if (filters.featured) {
        count += 1;
      }

      if (search) {
        count += 1;
      }

      return count;
    }, [filters, search]);

  const visiblePages =
    useMemo(() => {
      const total =
        pagination.totalPages;

      const current =
        pagination.currentPage;

      if (total <= 5) {
        return Array.from(
          {
            length: total,
          },
          (_, index) => index + 1,
        );
      }

      let start = Math.max(
        current - 2,
        1,
      );

      let end = Math.min(
        start + 4,
        total,
      );

      if (end - start < 4) {
        start = Math.max(
          end - 4,
          1,
        );
      }

      return Array.from(
        {
          length:
            end - start + 1,
        },
        (_, index) => start + index,
      );
    }, [
      pagination.currentPage,
      pagination.totalPages,
    ]);

  function handleSearchSubmit(event) {
    event.preventDefault();

    setSearch(
      searchInput.trim(),
    );

    setPage(1);
  }

  function clearSearch() {
    setSearchInput('');
    setSearch('');
    setPage(1);
  }

  function applyFilters() {
    const minimum =
      draftFilters.minPrice === ''
        ? ''
        : Number(
            draftFilters.minPrice,
          );

    const maximum =
      draftFilters.maxPrice === ''
        ? ''
        : Number(
            draftFilters.maxPrice,
          );

    if (
      minimum !== '' &&
      maximum !== '' &&
      minimum > maximum
    ) {
      setError(
        'Minimum price cannot be greater than maximum price.',
      );

      return;
    }

    setError('');

    setFilters({
      category:
        draftFilters.category,
      minPrice:
        draftFilters.minPrice,
      maxPrice:
        draftFilters.maxPrice,
      featured:
        draftFilters.featured,
    });

    setPage(1);
  }

  function resetFilters() {
    setFilters(DEFAULT_FILTERS);
    setDraftFilters(
      DEFAULT_FILTERS,
    );

    setSearch('');
    setSearchInput('');
    setPage(1);
    setError('');
  }

  function removeFilter(name) {
    if (name === 'search') {
      clearSearch();
      return;
    }

    const nextFilters = {
      ...filters,
      [name]:
        name === 'featured'
          ? false
          : '',
    };

    setFilters(nextFilters);
    setDraftFilters(nextFilters);
    setPage(1);
  }

  function changeSort(event) {
    setSort(event.target.value);
    setPage(1);
  }

  function goToPage(nextPage) {
    const safePage = Math.min(
      Math.max(nextPage, 1),
      pagination.totalPages,
    );

    setPage(safePage);

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div
          className={styles.heroInner}
        >
          <span
            className={styles.eyebrow}
          >
            The DESIRE collection
          </span>

          <h1>Shop</h1>

          <p>
            Explore distinctive pieces
            designed with confidence,
            simplicity and lasting style.
          </p>
        </div>
      </section>

      <section
        className={styles.shopSection}
      >
        <div className={styles.toolbar}>
          <div
            className={
              styles.resultsInformation
            }
          >
            <span
              className={
                styles.toolbarLabel
              }
            >
              Available collection
            </span>

            <strong>
              {loading
                ? 'Loading products'
                : productCountText}
            </strong>
          </div>

          <div
            className={
              styles.toolbarActions
            }
          >
            <form
              className={styles.searchForm}
              onSubmit={
                handleSearchSubmit
              }
            >
              <SearchIcon />

              <input
                type="search"
                value={searchInput}
                onChange={(event) =>
                  setSearchInput(
                    event.target.value,
                  )
                }
                placeholder="Search by name, description or SKU"
                aria-label="Search products"
              />

              {searchInput && (
                <button
                  type="button"
                  onClick={() =>
                    setSearchInput('')
                  }
                  className={
                    styles.clearSearch
                  }
                  aria-label="Clear search field"
                >
                  <CloseIcon />
                </button>
              )}

              <button
                type="submit"
                className={
                  styles.searchButton
                }
              >
                Search
              </button>
            </form>

            <button
              type="button"
              className={
                styles.mobileFilterButton
              }
              onClick={() =>
                setMobileFiltersOpen(
                  true,
                )
              }
            >
              <FilterIcon />

              Filters

              {activeFilterCount > 0 && (
                <span>
                  {activeFilterCount}
                </span>
              )}
            </button>

            <div
              className={
                styles.sortWrapper
              }
            >
              <label
                htmlFor="product-sort"
              >
                Sort by
              </label>

              <div
                className={
                  styles.selectControl
                }
              >
                <select
                  id="product-sort"
                  value={sort}
                  onChange={
                    changeSort
                  }
                >
                  {SORT_OPTIONS.map(
                    (option) => (
                      <option
                        key={
                          option.value
                        }
                        value={
                          option.value
                        }
                      >
                        {option.label}
                      </option>
                    ),
                  )}
                </select>

                <ChevronIcon />
              </div>
            </div>
          </div>
        </div>

        {activeFilterCount > 0 && (
          <div
            className={
              styles.activeFilters
            }
          >
            <span
              className={
                styles.activeFiltersLabel
              }
            >
              Active filters
            </span>

            <div
              className={
                styles.filterTags
              }
            >
              {search && (
                <button
                  type="button"
                  onClick={() =>
                    removeFilter(
                      'search',
                    )
                  }
                >
                  Search: {search}
                  <CloseIcon />
                </button>
              )}

              {filters.category && (
                <button
                  type="button"
                  onClick={() =>
                    removeFilter(
                      'category',
                    )
                  }
                >
                  {selectedCategory?.name ||
                    'Collection'}
                  <CloseIcon />
                </button>
              )}

              {filters.minPrice !==
                '' && (
                <button
                  type="button"
                  onClick={() =>
                    removeFilter(
                      'minPrice',
                    )
                  }
                >
                  From{' '}
                  {formatCurrency(
                    filters.minPrice,
                  )}
                  <CloseIcon />
                </button>
              )}

              {filters.maxPrice !==
                '' && (
                <button
                  type="button"
                  onClick={() =>
                    removeFilter(
                      'maxPrice',
                    )
                  }
                >
                  Up to{' '}
                  {formatCurrency(
                    filters.maxPrice,
                  )}
                  <CloseIcon />
                </button>
              )}

              {filters.featured && (
                <button
                  type="button"
                  onClick={() =>
                    removeFilter(
                      'featured',
                    )
                  }
                >
                  Featured
                  <CloseIcon />
                </button>
              )}

              <button
                type="button"
                onClick={resetFilters}
                className={
                  styles.clearAllButton
                }
              >
                Clear all
              </button>
            </div>
          </div>
        )}

        <div className={styles.shopLayout}>
          <aside
            className={
              styles.desktopFilters
            }
          >
            <div
              className={
                styles.filterHeader
              }
            >
              <div>
                <span
                  className={
                    styles.toolbarLabel
                  }
                >
                  Refine results
                </span>

                <h2>Filters</h2>
              </div>

              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={resetFilters}
                >
                  Reset
                </button>
              )}
            </div>

            {categoriesLoading ? (
              <div
                className={
                  styles.filterLoading
                }
              >
                <span />
                <span />
                <span />
                <span />
              </div>
            ) : (
              <FilterContent
                categories={
                  categories
                }
                draftFilters={
                  draftFilters
                }
                setDraftFilters={
                  setDraftFilters
                }
                applyFilters={
                  applyFilters
                }
                resetFilters={
                  resetFilters
                }
                closeMobileFilters={() => {}}
              />
            )}
          </aside>

          <div
            className={
              styles.productResults
            }
          >
            {loading ? (
              <div
                className={
                  styles.productGrid
                }
              >
                {Array.from({
                  length:
                    PRODUCTS_PER_PAGE,
                }).map(
                  (_, index) => (
                    <ProductSkeleton
                      key={index}
                    />
                  ),
                )}
              </div>
            ) : error ? (
              <section
                className={
                  styles.statePanel
                }
              >
                <div
                  className={
                    styles.stateIcon
                  }
                >
                  <EmptyIcon />
                </div>

                <span
                  className={
                    styles.eyebrow
                  }
                >
                  Collection unavailable
                </span>

                <h2>
                  We could not load the
                  shop
                </h2>

                <p>{error}</p>

                <button
                  type="button"
                  onClick={loadProducts}
                  className={
                    styles.primaryButton
                  }
                >
                  Try again
                </button>
              </section>
            ) : products.length ===
              0 ? (
              <section
                className={
                  styles.statePanel
                }
              >
                <div
                  className={
                    styles.stateIcon
                  }
                >
                  <EmptyIcon />
                </div>

                <span
                  className={
                    styles.eyebrow
                  }
                >
                  No products found
                </span>

                <h2>
                  No products match your
                  selection
                </h2>

                <p>
                  Adjust your search,
                  collection or price
                  filters to discover more
                  DESIRE products.
                </p>

                <button
                  type="button"
                  onClick={resetFilters}
                  className={
                    styles.primaryButton
                  }
                >
                  Reset all filters
                </button>
              </section>
            ) : (
              <>
                <div
                  className={
                    styles.productGrid
                  }
                >
                  {products.map(
                    (product) => (
                      <ProductCard
                        key={
                          product?._id ||
                          product?.slug
                        }
                        product={
                          product
                        }
                      />
                    ),
                  )}
                </div>

                {pagination.totalPages >
                  1 && (
                  <nav
                    className={
                      styles.pagination
                    }
                    aria-label="Product pages"
                  >
                    <button
                      type="button"
                      disabled={
                        !pagination.hasPreviousPage
                      }
                      onClick={() =>
                        goToPage(
                          page - 1,
                        )
                      }
                      className={
                        styles.paginationNavigation
                      }
                    >
                      Previous
                    </button>

                    <div
                      className={
                        styles.pageNumbers
                      }
                    >
                      {visiblePages.map(
                        (
                          pageNumber,
                        ) => (
                          <button
                            type="button"
                            key={
                              pageNumber
                            }
                            onClick={() =>
                              goToPage(
                                pageNumber,
                              )
                            }
                            className={
                              pageNumber ===
                              pagination.currentPage
                                ? styles.activePage
                                : ''
                            }
                            aria-current={
                              pageNumber ===
                              pagination.currentPage
                                ? 'page'
                                : undefined
                            }
                          >
                            {
                              pageNumber
                            }
                          </button>
                        ),
                      )}
                    </div>

                    <button
                      type="button"
                      disabled={
                        !pagination.hasNextPage
                      }
                      onClick={() =>
                        goToPage(
                          page + 1,
                        )
                      }
                      className={
                        styles.paginationNavigation
                      }
                    >
                      Next
                    </button>
                  </nav>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      {mobileFiltersOpen && (
        <div
          className={
            styles.mobileFilterOverlay
          }
          role="dialog"
          aria-modal="true"
          aria-label="Product filters"
        >
          <button
            type="button"
            className={
              styles.mobileFilterBackdrop
            }
            onClick={() =>
              setMobileFiltersOpen(
                false,
              )
            }
            aria-label="Close filters"
          />

          <aside
            className={
              styles.mobileFilterPanel
            }
          >
            <div
              className={
                styles.mobileFilterHeader
              }
            >
              <div>
                <span
                  className={
                    styles.toolbarLabel
                  }
                >
                  Refine results
                </span>

                <h2>Filters</h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setMobileFiltersOpen(
                    false,
                  )
                }
                aria-label="Close filters"
              >
                <CloseIcon />
              </button>
            </div>

            <div
              className={
                styles.mobileFilterBody
              }
            >
              <FilterContent
                categories={
                  categories
                }
                draftFilters={
                  draftFilters
                }
                setDraftFilters={
                  setDraftFilters
                }
                applyFilters={
                  applyFilters
                }
                resetFilters={
                  resetFilters
                }
                closeMobileFilters={() =>
                  setMobileFiltersOpen(
                    false,
                  )
                }
              />
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}