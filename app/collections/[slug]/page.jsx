'use client';

import Link from 'next/link';

import {
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  getCollection,
} from '@/services/collections.service';

import styles from './collection-details.module.css';

const PRODUCTS_PER_PAGE = 12;

const SORT_OPTIONS = [
  {
    value: 'newest',
    label: 'Newest',
  },
  {
    value: 'oldest',
    label: 'Oldest',
  },
  {
    value: 'price-asc',
    label: 'Price: Low to High',
  },
  {
    value: 'price-desc',
    label: 'Price: High to Low',
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


function normalizeCollection(
  response,
) {
  return (
    response?.collection ||
    response?.data?.collection ||
    response?.data ||
    response ||
    null
  );
}


function formatCurrency(value) {
  const amount = Number(value);

  if (Number.isNaN(amount)) {
    return '₦0';
  }

  return new Intl.NumberFormat(
    'en-NG',
    {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    },
  ).format(amount);
}


function getCollectionImage(
  collection,
) {
  return (
    collection?.coverImage ||
    collection?.image ||
    collection?.imageUrl ||
    collection?.banner ||
    collection?.bannerImage ||
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


function getProductIdentifier(
  product,
) {
  return (
    product?.slug ||
    product?._id ||
    product?.id
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


function getDiscountPercentage(
  product,
) {
  const price = Number(
    product?.price || 0,
  );

  const compareAtPrice = Number(
    product?.compareAtPrice || 0,
  );

  if (
    compareAtPrice <= price ||
    compareAtPrice <= 0
  ) {
    return 0;
  }

  return Math.round(
    ((compareAtPrice - price) /
      compareAtPrice) *
      100,
  );
}


function sortProducts(
  products,
  sort,
) {
  const sortedProducts = [
    ...products,
  ];

  switch (sort) {
    case 'oldest':
      return sortedProducts.sort(
        (a, b) =>
          new Date(
            a?.createdAt || 0,
          ).getTime() -
          new Date(
            b?.createdAt || 0,
          ).getTime(),
      );

    case 'price-asc':
      return sortedProducts.sort(
        (a, b) =>
          Number(a?.price || 0) -
          Number(b?.price || 0),
      );

    case 'price-desc':
      return sortedProducts.sort(
        (a, b) =>
          Number(b?.price || 0) -
          Number(a?.price || 0),
      );

    case 'name-asc':
      return sortedProducts.sort(
        (a, b) =>
          String(
            a?.name || '',
          ).localeCompare(
            String(
              b?.name || '',
            ),
          ),
      );

    case 'name-desc':
      return sortedProducts.sort(
        (a, b) =>
          String(
            b?.name || '',
          ).localeCompare(
            String(
              a?.name || '',
            ),
          ),
      );

    case 'newest':
    default:
      return sortedProducts.sort(
        (a, b) =>
          new Date(
            b?.createdAt || 0,
          ).getTime() -
          new Date(
            a?.createdAt || 0,
          ).getTime(),
      );
  }
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


function CollectionIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5v-9Z" />
      <path d="m4 7.5 8 4.5 8-4.5M12 12v9" />
    </svg>
  );
}


function ProductSkeleton() {
  return (
    <article
      className={
        styles.skeletonCard
      }
    >
      <div
        className={
          styles.skeletonImage
        }
      />

      <div
        className={
          styles.skeletonDetails
        }
      >
        <span />
        <span />
        <span />
      </div>
    </article>
  );
}


function ProductCard({
  product,
}) {
  const identifier =
    getProductIdentifier(
      product,
    );

  const discounted =
    hasDiscount(product);

  const outOfStock =
    Number(
      product?.stock || 0,
    ) <= 0;

  return (
    <article
      className={
        styles.productCard
      }
    >
      <Link
        href={`/products/${identifier}`}
        className={
          styles.productImageLink
        }
      >
        <div
          className={
            styles.productImage
          }
        >
          <img
            src={
              getProductImage(
                product,
              )
            }
            alt={
              product?.name ||
              'DESIRE product'
            }
            onError={(
              event,
            ) => {
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
          {product?.featured && (
            <span>
              Featured
            </span>
          )}

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

        <div
          className={
            styles.viewProduct
          }
        >
          View product
          <ArrowIcon />
        </div>
      </Link>

      <div
        className={
          styles.productInformation
        }
      >
        <span
          className={
            styles.sku
          }
        >
          {product?.sku ||
            'DESIRE'}
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
          <span>
            {formatCurrency(
              product?.price,
            )}
          </span>

          {discounted && (
            <del>
              {formatCurrency(
                product
                  ?.compareAtPrice,
              )}
            </del>
          )}
        </div>
      </div>
    </article>
  );
}


export default function CollectionDetailsPage({
  params,
}) {
  const resolvedParams =
    use(params);

  const slug =
    resolvedParams?.slug;

  const [
    collection,
    setCollection,
  ] = useState(null);

  const [
    page,
    setPage,
  ] = useState(1);

  const [
    sort,
    setSort,
  ] = useState('newest');

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState('');


  const loadCollection =
    useCallback(
      async () => {
        if (!slug) {
          return;
        }

        try {
          setLoading(true);
          setError('');

          const response =
            await getCollection(
              slug,
            );

          const loadedCollection =
            normalizeCollection(
              response,
            );

          if (
            !loadedCollection ||
            !loadedCollection
              ?._id
          ) {
            throw new Error(
              'Collection not found.',
            );
          }

          setCollection(
            loadedCollection,
          );
        } catch (
          loadError
        ) {
          console.error(
            'Unable to load collection:',
            loadError,
          );

          setCollection(null);

          setError(
            loadError?.message ||
              'We could not load this collection.',
          );
        } finally {
          setLoading(false);
        }
      },
      [slug],
    );


  useEffect(() => {
    loadCollection();
  }, [loadCollection]);


  /*
   * Products are populated directly
   * from the Collection document.
   *
   * These are exactly the products
   * selected by the administrator.
   */

  const collectionProducts =
    useMemo(() => {
      if (
        !Array.isArray(
          collection?.products,
        )
      ) {
        return [];
      }

      return collection.products.filter(
        (product) =>
          product &&
          typeof product ===
            'object' &&
          product?.isActive !==
            false,
      );
    }, [collection]);


  /*
   * Apply customer-selected sorting
   * locally.
   */

  const sortedProducts =
    useMemo(
      () =>
        sortProducts(
          collectionProducts,
          sort,
        ),
      [
        collectionProducts,
        sort,
      ],
    );


  /*
   * Local pagination because the
   * collection already contains its
   * populated products.
   */

  const totalProducts =
    sortedProducts.length;

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        totalProducts /
          PRODUCTS_PER_PAGE,
      ),
    );

  const safePage =
    Math.min(
      page,
      totalPages,
    );

  const products =
    useMemo(() => {
      const start =
        (safePage - 1) *
        PRODUCTS_PER_PAGE;

      const end =
        start +
        PRODUCTS_PER_PAGE;

      return sortedProducts.slice(
        start,
        end,
      );
    }, [
      sortedProducts,
      safePage,
    ]);


  const collectionImage =
    useMemo(
      () =>
        getCollectionImage(
          collection,
        ),
      [collection],
    );


  function changePage(
    nextPage,
  ) {
    const nextSafePage =
      Math.min(
        Math.max(
          nextPage,
          1,
        ),
        totalPages,
      );

    setPage(
      nextSafePage,
    );

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }


  if (loading) {
    return (
      <main
        className={
          styles.page
        }
      >
        <section
          className={
            styles.loadingHero
          }
        />

        <section
          className={
            styles.content
          }
        >
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
        </section>
      </main>
    );
  }


  if (
    error ||
    !collection
  ) {
    return (
      <main
        className={
          styles.page
        }
      >
        <section
          className={
            styles.errorPage
          }
        >
          <div
            className={
              styles.stateIcon
            }
          >
            <CollectionIcon />
          </div>

          <span
            className={
              styles.eyebrow
            }
          >
            Collection unavailable
          </span>

          <h1>
            {error ||
              'Collection not found'}
          </h1>

          <p>
            The collection may have
            been removed, renamed or
            made inactive.
          </p>

          <div
            className={
              styles.errorActions
            }
          >
            <Link
              href="/collections"
              className={
                styles.primaryButton
              }
            >
              View collections
            </Link>

            <Link
              href="/shop"
              className={
                styles.secondaryButton
              }
            >
              Browse shop
            </Link>
          </div>
        </section>
      </main>
    );
  }


  return (
    <main
      className={styles.page}
    >

      {/* ======================
          COLLECTION HERO
      ====================== */}

      <section
        className={`${styles.hero} ${
          collectionImage
            ? styles.heroWithImage
            : ''
        }`}
      >
        {collectionImage && (
          <img
            src={
              collectionImage
            }
            alt={
              collection?.name ||
              'DESIRE collection'
            }
            className={
              styles.heroImage
            }
          />
        )}

        <div
          className={
            styles.heroOverlay
          }
        />

        <div
          className={
            styles.heroContent
          }
        >
          <nav
            className={
              styles.breadcrumbs
            }
          >
            <Link href="/">
              Home
            </Link>

            <span>
              /
            </span>

            <Link href="/collections">
              Collections
            </Link>

            <span>
              /
            </span>

            <strong>
              {
                collection.name
              }
            </strong>
          </nav>

          <span
            className={
              styles.eyebrow
            }
          >
            DESIRE collection
          </span>

          <h1>
            {
              collection.name
            }
          </h1>

          {collection
            ?.description && (
            <p>
              {
                collection.description
              }
            </p>
          )}
        </div>
      </section>


      {/* ======================
          COLLECTION PRODUCTS
      ====================== */}

      <section
        className={
          styles.content
        }
      >
        <div
          className={
            styles.toolbar
          }
        >
          <div>
            <span
              className={
                styles.toolbarLabel
              }
            >
              Collection products
            </span>

            <strong>
              {totalProducts}{' '}
              {totalProducts === 1
                ? 'product'
                : 'products'}
            </strong>
          </div>

          <div
            className={
              styles.sortWrapper
            }
          >
            <label
              htmlFor="collection-sort"
            >
              Sort by
            </label>

            <div
              className={
                styles.selectControl
              }
            >
              <select
                id="collection-sort"
                value={sort}
                onChange={(
                  event,
                ) => {
                  setSort(
                    event
                      .target
                      .value,
                  );

                  setPage(1);
                }}
              >
                {SORT_OPTIONS.map(
                  (
                    option,
                  ) => (
                    <option
                      key={
                        option.value
                      }
                      value={
                        option.value
                      }
                    >
                      {
                        option.label
                      }
                    </option>
                  ),
                )}
              </select>

              <ChevronIcon />
            </div>
          </div>
        </div>


        {/* EMPTY COLLECTION */}

        {products.length ===
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
              <CollectionIcon />
            </div>

            <span
              className={
                styles.eyebrow
              }
            >
              Collection empty
            </span>

            <h2>
              No products are
              available in this
              collection
            </h2>

            <p>
              Products will appear
              here when the
              administrator adds
              active products to this
              collection.
            </p>

            <Link
              href="/shop"
              className={
                styles.primaryButton
              }
            >
              Browse all products
            </Link>
          </section>
        ) : (
          <>

            {/* PRODUCT GRID */}

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


            {/* PAGINATION */}

            {totalPages > 1 && (
              <nav
                className={
                  styles.pagination
                }
                aria-label="Collection product pages"
              >
                <button
                  type="button"
                  disabled={
                    safePage <= 1
                  }
                  onClick={() =>
                    changePage(
                      safePage -
                        1,
                    )
                  }
                >
                  Previous
                </button>

                <span>
                  Page{' '}
                  {safePage}{' '}
                  of{' '}
                  {totalPages}
                </span>

                <button
                  type="button"
                  disabled={
                    safePage >=
                    totalPages
                  }
                  onClick={() =>
                    changePage(
                      safePage +
                        1,
                    )
                  }
                >
                  Next
                </button>
              </nav>
            )}
          </>
        )}
      </section>
    </main>
  );
}