'use client';

import {
  useEffect,
  useState,
} from 'react';

import Link from 'next/link';

import {
  getFeaturedProducts,
} from '@/services/products.service';

import {
  getFeaturedCollections,
} from '@/services/collections.service';


function normalizeProducts(
  response,
) {
  if (Array.isArray(response)) {
    return response;
  }

  if (
    Array.isArray(
      response?.products,
    )
  ) {
    return response.products;
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
      response?.data?.products,
    )
  ) {
    return response.data.products;
  }

  return [];
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


function getCollectionIdentifier(
  collection,
) {
  return (
    collection?.slug ||
    collection?._id ||
    collection?.id ||
    ''
  );
}


export default function Home() {
  const [
    products,
    setProducts,
  ] = useState([]);

  const [
    collections,
    setCollections,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    mobileMenuOpen,
    setMobileMenuOpen,
  ] = useState(false);


  useEffect(() => {
    async function loadHomepage() {
      try {
        const [
          productsResponse,
          collectionsResponse,
        ] = await Promise.all([
          getFeaturedProducts(),
          getFeaturedCollections(6),
        ]);

        /*
         * NEW ARRIVALS
         *
         * This still uses your existing
         * featured-product system.
         *
         * Admin:
         * Featured = YES
         *
         * Product appears here.
         */
        setProducts(
          normalizeProducts(
            productsResponse,
          ),
        );

        /*
         * FEATURED COLLECTIONS
         *
         * Admin:
         * Active = YES
         * Featured = YES
         *
         * Collection appears here.
         */
        setCollections(
          normalizeCollections(
            collectionsResponse,
          ),
        );
      } catch (error) {
        console.error(
          'Unable to load homepage:',
          error,
        );

        setProducts([]);
        setCollections([]);
      } finally {
        setLoading(false);
      }
    }

    loadHomepage();
  }, []);


  function closeMobileMenu() {
    setMobileMenuOpen(false);
  }


  return (
    <div className="desire-page">

      {/* =========================
          NAVIGATION
      ========================= */}

      <nav className="home-nav">
        <Link
          href="/"
          className="logo"
          onClick={closeMobileMenu}
        >
          DESIRE
        </Link>

        <ul className="desktop-nav-links">
          <li>
            <Link href="/">
              HOME
            </Link>
          </li>

          <li>
            <Link href="/collections">
              COLLECTIONS
            </Link>
          </li>

          <li>
            <a href="#editorial">
              EDITORIAL
            </a>
          </li>

          <li>
            <Link href="/contact">
              CONTACT
            </Link>
          </li>
        </ul>


        {/* MOBILE MENU BUTTON */}

        <button
          type="button"
          className={`mobile-menu-button ${
            mobileMenuOpen
              ? 'mobile-menu-button-open'
              : ''
          }`}
          onClick={() =>
            setMobileMenuOpen(
              (current) =>
                !current,
            )
          }
          aria-label={
            mobileMenuOpen
              ? 'Close navigation menu'
              : 'Open navigation menu'
          }
          aria-expanded={
            mobileMenuOpen
          }
        >
          <span />
          <span />
          <span />
        </button>


        {/* MOBILE MENU */}

        <div
          className={`mobile-menu ${
            mobileMenuOpen
              ? 'mobile-menu-open'
              : ''
          }`}
        >
          <ul>
            <li>
              <Link
                href="/"
                onClick={
                  closeMobileMenu
                }
              >
                HOME
              </Link>
            </li>

            <li>
              <Link
                href="/collections"
                onClick={
                  closeMobileMenu
                }
              >
                COLLECTIONS
              </Link>
            </li>

            <li>
              <a
                href="#editorial"
                onClick={
                  closeMobileMenu
                }
              >
                EDITORIAL
              </a>
            </li>

            <li>
              <Link
                href="/contact"
                onClick={
                  closeMobileMenu
                }
              >
                CONTACT
              </Link>
            </li>
          </ul>

          <Link
            href="/shop"
            className="mobile-shop-link"
            onClick={
              closeMobileMenu
            }
          >
            SHOP COLLECTION
          </Link>
        </div>
      </nav>


      {/* =========================
          HERO
      ========================= */}

      <section className="hero">
        <div className="hero-content">
          <p className="hero-subtitle">
            CRAFTED FOR PRESENCE
          </p>

          <Link
            href="/collections"
            className="btn hero-button"
          >
            EXPLORE COLLECTIONS
          </Link>
        </div>
      </section>


      {/* =========================
          NEW ARRIVALS

          DO NOT CHANGE:
          This continues using
          getFeaturedProducts().
      ========================= */}

      <section className="section">
        <h2 className="title">
          NEW ARRIVALS
        </h2>

        {loading ? (
          <div className="loading-screen">
            <div className="loading-spinner" />

            <p>
              Loading collection
            </p>
          </div>
        ) : products.length === 0 ? (
          <div className="homepage-empty">
            <p>
              Featured products will
              appear here.
            </p>

            <Link
              href="/shop"
              className="btnn"
            >
              VIEW SHOP
            </Link>
          </div>
        ) : (
          <div className="grid">
            {products.map(
              (product) => {
                const identifier =
                  product?.slug ||
                  product?._id ||
                  product?.id;

                return (
                  <Link
                    href={`/products/${identifier}`}
                    className="card cursor-pointer"
                    key={
                      product?._id ||
                      product?.slug ||
                      product?.name
                    }
                  >
                    <img
                      src={
                        product
                          ?.images?.[0] ||
                        '/images/product-placeholder.jpg'
                      }
                      alt={
                        product?.name ||
                        'DESIRE product'
                      }
                    />

                    <div className="card-info">
                      <h3>
                        {
                          product.name
                        }
                      </h3>

                      <p>
                        {typeof product.category ===
                        'object'
                          ? product
                              .category
                              ?.name
                          : product.category ||
                            'DESIRE'}
                      </p>

                      <p>
                        ₦
                        {Number(
                          product.price ||
                            0,
                        ).toLocaleString(
                          'en-NG',
                        )}
                      </p>
                    </div>
                  </Link>
                );
              },
            )}
          </div>
        )}
      </section>


      {/* =========================
          FEATURED COLLECTIONS
      ========================= */}

      <section className="section homepage-categories">
        <div className="homepage-section-heading">
          <div>
            <span className="homepage-eyebrow">
              Explore DESIRE
            </span>

            <h2 className="title">
              FEATURED COLLECTIONS
            </h2>
          </div>

          <Link
            href="/collections"
            className="homepage-view-all"
          >
            VIEW ALL
          </Link>
        </div>


        {/* COLLECTION LOADING */}

        {loading ? (
          <div className="homepage-category-grid">
            {[1, 2, 3].map(
              (item) => (
                <div
                  key={item}
                  className="homepage-category-loading"
                />
              ),
            )}
          </div>
        ) : collections.length ===
          0 ? (

          /* EMPTY COLLECTIONS */

          <div className="homepage-empty">
            <p>
              Featured collections
              created by the
              administrator will
              appear here.
            </p>

            <Link
              href="/collections"
              className="btnn"
            >
              VIEW COLLECTIONS
            </Link>
          </div>
        ) : (

          /* COLLECTION GRID */

          <div className="homepage-category-grid">
            {collections.map(
              (
                collection,
                index,
              ) => {
                const identifier =
                  getCollectionIdentifier(
                    collection,
                  );

                return (
                  <Link
                    key={
                      collection?._id ||
                      collection?.slug ||
                      collection?.name
                    }
                    href={`/collections/${identifier}`}
                    className="homepage-category-card"
                  >

                    {/* ADMIN COVER IMAGE */}

                    <div className="homepage-collection-image">
                      {collection?.coverImage ? (
                        <img
                          src={
                            collection.coverImage
                          }
                          alt={
                            collection?.name ||
                            'DESIRE collection'
                          }
                        />
                      ) : (
                        <div className="homepage-collection-placeholder">
                          DESIRE
                        </div>
                      )}
                    </div>


                    {/* IMAGE OVERLAY */}

                    <div className="homepage-collection-overlay" />


                    {/* COLLECTION NUMBER */}

                    <span className="homepage-category-number">
                      {String(
                        index + 1,
                      ).padStart(
                        2,
                        '0',
                      )}
                    </span>


                    {/* COLLECTION INFORMATION */}

                    <div className="homepage-collection-content">
                      <h3>
                        {collection?.name ||
                          'DESIRE Collection'}
                      </h3>

                      <p>
                        {collection?.description ||
                          'Explore the latest pieces in this collection.'}
                      </p>

                      <span className="homepage-category-link">
                        EXPLORE COLLECTION →
                      </span>
                    </div>
                  </Link>
                );
              },
            )}
          </div>
        )}
      </section>


      {/* =========================
          EDITORIAL
      ========================= */}

      <section
        id="editorial"
        className="section editorial"
      >
        <img
          src="/images/desire.png"
          alt="DESIRE editorial"
        />

        <div className="editorial-text">
          <h2>
            THE ESSENCE OF DESIRE
          </h2>

          <p>
            DESIRE is built on
            precision, identity, and
            bold simplicity. Every
            piece is designed to stand
            out without noise —
            refined, confident, and
            intentional.
          </p>

          <Link
            href="/about"
            className="btn editorial-button"
          >
            READ STORY
          </Link>
        </div>
      </section>


      {/* =========================
          RUNWAY
      ========================= */}

      <section className="section">
        <h2 className="title">
          RUNWAY
        </h2>

        <div className="runway">
          <img
            src="https://images.unsplash.com/photo-1529139574466-a303027c1d8b"
            alt="DESIRE runway look"
          />

          <img
            src="https://images.unsplash.com/photo-1509631179647-0177331693ae"
            alt="DESIRE runway look"
          />

          <img
            src="https://images.unsplash.com/photo-1483985988355-763728e1935b"
            alt="DESIRE runway look"
          />

          <img
            src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d"
            alt="DESIRE runway look"
          />
        </div>
      </section>


      {/* =========================
          CTA
      ========================= */}

      <section className="cta">
        <h2>
          JOIN THE MOVEMENT
        </h2>

        <Link
          href="/shop"
          className="btnn"
        >
          SHOP NOW
        </Link>
      </section>


      {/* =========================
          FOOTER
      ========================= */}

      <footer>
        <div className="footer-grid">
          <div>
            <h4>
              DESIRE
            </h4>

            <p>
              Luxury fashion redefined
              through simplicity and
              bold identity.
            </p>
          </div>

          <div>
            <h4>
              SHOP
            </h4>

            <p>
              New Arrivals
              <br />
              Men
              <br />
              Women
            </p>
          </div>

          <div>
            <h4>
              INFO
            </h4>

            <p>
              About
              <br />
              Contact
              <br />
              Privacy
            </p>
          </div>
        </div>

        <div className="copy">
          © 2026 DESIRE. ALL RIGHTS
          RESERVED.
        </div>
      </footer>
    </div>
  );
}