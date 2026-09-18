'use client';

import Link from 'next/link';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  getCollections,
} from '@/services/collections.service';

import styles from './collections.module.css';

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

function normalizeCollections(
  response,
) {
  if (Array.isArray(response)) {
    return response;
  }

  if (
    Array.isArray(
      response?.collections,
    )
  ) {
    return response.collections;
  }

  if (
    Array.isArray(
      response?.data,
    )
  ) {
    return response.data;
  }

  if (
    Array.isArray(
      response?.data?.collections,
    )
  ) {
    return response.data.collections;
  }

  return [];
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

function getCollectionSlug(
  collection,
) {
  return (
    collection?.slug ||
    collection?._id ||
    collection?.id
  );
}

function CollectionSkeleton() {
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
      </div>
    </article>
  );
}

export default function CollectionsPage() {
  const [
    collections,
    setCollections,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState('');

  async function loadCollections() {
    try {
      setLoading(true);
      setError('');

      const response =
        await getCollections();

      setCollections(
        normalizeCollections(
          response,
        ),
      );
    } catch (loadError) {
      console.error(
        'Unable to load collections:',
        loadError,
      );

      setCollections([]);

      setError(
        loadError?.message ||
          'We could not load the collections.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCollections();
  }, []);

  const activeCollections =
    useMemo(() => {
      return collections
        .filter(
          (collection) =>
            collection?.isActive !==
            false,
        )
        .sort(
          (a, b) =>
            (
              Number(
                a?.sortOrder,
              ) || 0
            ) -
            (
              Number(
                b?.sortOrder,
              ) || 0
            ),
        );
    }, [collections]);

  return (
    <main
      className={styles.page}
    >
      <section
        className={styles.hero}
      >
        <div
          className={
            styles.heroContent
          }
        >
          <span
            className={
              styles.eyebrow
            }
          >
            Explore DESIRE
          </span>

          <h1>
            Collections
          </h1>

          <p>
            Discover curated DESIRE
            collections built around
            distinctive moods,
            silhouettes and pieces
            selected to complement
            your personal style.
          </p>
        </div>
      </section>

      <section
        className={
          styles.content
        }
      >
        <div
          className={
            styles.sectionHeading
          }
        >
          <div>
            <span
              className={
                styles.eyebrow
              }
            >
              Curated collections
            </span>

            <h2>
              Find your next DESIRE
            </h2>
          </div>

          {!loading && (
            <span
              className={
                styles.count
              }
            >
              {
                activeCollections.length
              }{' '}
              {activeCollections.length ===
              1
                ? 'collection'
                : 'collections'}
            </span>
          )}
        </div>

        {loading ? (
          <div
            className={
              styles.grid
            }
          >
            {Array.from({
              length: 6,
            }).map(
              (_, index) => (
                <CollectionSkeleton
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
              <CollectionIcon />
            </div>

            <span
              className={
                styles.eyebrow
              }
            >
              Collections unavailable
            </span>

            <h2>
              We could not load the
              collections
            </h2>

            <p>
              {error}
            </p>

            <button
              type="button"
              onClick={
                loadCollections
              }
              className={
                styles.primaryButton
              }
            >
              Try again
            </button>
          </section>
        ) : activeCollections.length ===
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
              Coming soon
            </span>

            <h2>
              No collections are
              available yet
            </h2>

            <p>
              Active collections
              created by the
              administrator will
              appear here.
            </p>

            <Link
              href="/shop"
              className={
                styles.primaryButton
              }
            >
              Browse the shop
            </Link>
          </section>
        ) : (
          <div
            className={
              styles.grid
            }
          >
            {activeCollections.map(
              (
                collection,
                index,
              ) => {
                const slug =
                  getCollectionSlug(
                    collection,
                  );

                const image =
                  getCollectionImage(
                    collection,
                  );

                const productCount =
                  Array.isArray(
                    collection?.products,
                  )
                    ? collection
                        .products
                        .length
                    : 0;

                return (
                  <article
                    key={
                      collection?._id ||
                      collection?.slug ||
                      index
                    }
                    className={
                      styles.collectionCard
                    }
                  >
                    <Link
                      href={`/collections/${slug}`}
                      className={
                        styles.collectionLink
                      }
                    >
                      <div
                        className={
                          styles.imageWrapper
                        }
                      >
                        {image ? (
                          <img
                            src={
                              image
                            }
                            alt={
                              collection?.name ||
                              'DESIRE collection'
                            }
                            onError={(
                              event,
                            ) => {
                              event.currentTarget.style.display =
                                'none';
                            }}
                          />
                        ) : (
                          <div
                            className={
                              styles.placeholder
                            }
                          >
                            <span>
                              DESIRE
                            </span>
                          </div>
                        )}

                        <div
                          className={
                            styles.imageOverlay
                          }
                        />

                        <div
                          className={
                            styles.cardContent
                          }
                        >
                          <span>
                            Collection{' '}
                            {String(
                              index + 1,
                            ).padStart(
                              2,
                              '0',
                            )}
                          </span>

                          <h3>
                            {collection?.name ||
                              'Untitled Collection'}
                          </h3>

                          {productCount >
                            0 && (
                            <small>
                              {
                                productCount
                              }{' '}
                              {productCount ===
                              1
                                ? 'piece'
                                : 'pieces'}
                            </small>
                          )}

                          <div
                            className={
                              styles.exploreLink
                            }
                          >
                            Explore
                            collection

                            <ArrowIcon />
                          </div>
                        </div>
                      </div>
                    </Link>

                    {collection?.description && (
                      <p
                        className={
                          styles.description
                        }
                      >
                        {
                          collection.description
                        }
                      </p>
                    )}
                  </article>
                );
              },
            )}
          </div>
        )}
      </section>
    </main>
  );
}