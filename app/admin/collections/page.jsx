'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  createCollection,
  deleteCollection,
  getAdminCollections,
  updateCollection,
} from '@/services/collections.service';

import {
  getAdminProducts,
} from '@/services/products.service';

import {
  getUploadedFileUrl,
  uploadAdminImage,
} from '@/services/uploads.service';

import styles from './collections.module.css';

const EMPTY_FORM = {
  name: '',
  description: '',
  coverImage: '',
  products: [],
  featured: false,
  isActive: true,
  sortOrder: 0,
};

function normalizeCollectionsResponse(
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

function normalizeProductsResponse(
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

function normalizeCollectionProducts(
  products,
) {
  if (!Array.isArray(products)) {
    return [];
  }

  return products
    .map((product) => {
      if (
        typeof product ===
        'string'
      ) {
        return product;
      }

      return (
        product?._id ||
        product?.id ||
        ''
      );
    })
    .filter(Boolean);
}

function getCollectionId(
  collection,
) {
  return (
    collection?._id ||
    collection?.id ||
    ''
  );
}

function getProductId(
  product,
) {
  return (
    product?._id ||
    product?.id ||
    ''
  );
}

function getProductImage(
  product,
) {
  if (
    Array.isArray(product?.images) &&
    product.images.length > 0
  ) {
    return product.images[0];
  }

  return '';
}

function formatCurrency(
  value,
) {
  return new Intl.NumberFormat(
    'en-NG',
    {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0,
    },
  ).format(
    Number(value) || 0,
  );
}

function formatDate(
  value,
) {
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
    },
  ).format(date);
}

function getErrorMessage(
  error,
  fallback =
    'Something went wrong.',
) {
  return (
    error?.message ||
    error?.response?.data?.message ||
    error?.data?.message ||
    fallback
  );
}

export default function AdminCollectionsPage() {
  const [
    collections,
    setCollections,
  ] = useState([]);

  const [
    products,
    setProducts,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    productsLoading,
    setProductsLoading,
  ] = useState(true);

  const [
    pageError,
    setPageError,
  ] = useState('');

  const [
    search,
    setSearch,
  ] = useState('');

  const [
    statusFilter,
    setStatusFilter,
  ] = useState('all');

  const [
    modalOpen,
    setModalOpen,
  ] = useState(false);

  const [
    editingCollection,
    setEditingCollection,
  ] = useState(null);

  const [
    form,
    setForm,
  ] = useState(
    EMPTY_FORM,
  );

  const [
    formError,
    setFormError,
  ] = useState('');

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    uploadingCover,
    setUploadingCover,
  ] = useState(false);

  const [
    deletingId,
    setDeletingId,
  ] = useState('');

  const [
    togglingId,
    setTogglingId,
  ] = useState('');

  const [
    productSearch,
    setProductSearch,
  ] = useState('');

  const [
    toast,
    setToast,
  ] = useState('');

  const loadCollections =
    useCallback(async () => {
      try {
        setPageError('');

        const response =
          await getAdminCollections();

        setCollections(
          normalizeCollectionsResponse(
            response,
          ),
        );
      } catch (error) {
        setPageError(
          getErrorMessage(
            error,
            'Unable to load collections.',
          ),
        );
      }
    }, []);

  const loadProducts =
    useCallback(async () => {
      try {
        setProductsLoading(true);

        /*
         * Request a large admin page so the
         * collection editor can select products.
         * If your backend caps the limit, it
         * will simply return its maximum.
         */
        const response =
          await getAdminProducts({
            page: 1,
            limit: 100,
          });

        setProducts(
          normalizeProductsResponse(
            response,
          ),
        );
      } catch (error) {
        console.error(
          'Unable to load products:',
          error,
        );
      } finally {
        setProductsLoading(false);
      }
    }, []);

  useEffect(() => {
    async function loadPage() {
      setLoading(true);

      await Promise.all([
        loadCollections(),
        loadProducts(),
      ]);

      setLoading(false);
    }

    loadPage();
  }, [
    loadCollections,
    loadProducts,
  ]);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timeout =
      setTimeout(() => {
        setToast('');
      }, 3000);

    return () =>
      clearTimeout(timeout);
  }, [toast]);

  const filteredCollections =
    useMemo(() => {
      const normalizedSearch =
        search
          .trim()
          .toLowerCase();

      return collections.filter(
        (collection) => {
          const matchesSearch =
            !normalizedSearch ||
            collection?.name
              ?.toLowerCase()
              .includes(
                normalizedSearch,
              ) ||
            collection?.slug
              ?.toLowerCase()
              .includes(
                normalizedSearch,
              ) ||
            collection?.description
              ?.toLowerCase()
              .includes(
                normalizedSearch,
              );

          const matchesStatus =
            statusFilter === 'all' ||
            (
              statusFilter ===
                'active' &&
              collection?.isActive
            ) ||
            (
              statusFilter ===
                'inactive' &&
              !collection?.isActive
            );

          return (
            matchesSearch &&
            matchesStatus
          );
        },
      );
    }, [
      collections,
      search,
      statusFilter,
    ]);

  const filteredProducts =
    useMemo(() => {
      const normalizedSearch =
        productSearch
          .trim()
          .toLowerCase();

      if (!normalizedSearch) {
        return products;
      }

      return products.filter(
        (product) =>
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
            ),
      );
    }, [
      products,
      productSearch,
    ]);

  const stats =
    useMemo(() => {
      const total =
        collections.length;

      const active =
        collections.filter(
          (collection) =>
            collection?.isActive,
        ).length;

      const inactive =
        total - active;

      const featured =
        collections.filter(
          (collection) =>
            collection?.featured,
        ).length;

      return {
        total,
        active,
        inactive,
        featured,
      };
    }, [collections]);

  function updateForm(
    field,
    value,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function openCreateModal() {
    setEditingCollection(
      null,
    );

    setForm({
      ...EMPTY_FORM,
      products: [],
    });

    setProductSearch('');
    setFormError('');
    setModalOpen(true);
  }

  function openEditModal(
    collection,
  ) {
    setEditingCollection(
      collection,
    );

    setForm({
      name:
        collection?.name ||
        '',
      description:
        collection?.description ||
        '',
      coverImage:
        collection?.coverImage ||
        '',
      products:
        normalizeCollectionProducts(
          collection?.products,
        ),
      featured:
        Boolean(
          collection?.featured,
        ),
      isActive:
        collection?.isActive !==
        false,
      sortOrder:
        Number(
          collection?.sortOrder,
        ) || 0,
    });

    setProductSearch('');
    setFormError('');
    setModalOpen(true);
  }

  function closeModal() {
    if (
      saving ||
      uploadingCover
    ) {
      return;
    }

    setModalOpen(false);
    setEditingCollection(
      null,
    );
    setFormError('');
    setProductSearch('');
  }

  function toggleProduct(
    productId,
  ) {
    if (!productId) {
      return;
    }

    setForm((current) => {
      const selected =
        current.products.includes(
          productId,
        );

      return {
        ...current,
        products: selected
          ? current.products.filter(
              (id) =>
                id !== productId,
            )
          : [
              ...current.products,
              productId,
            ],
      };
    });
  }

  function selectAllVisibleProducts() {
    const visibleIds =
      filteredProducts
        .map(getProductId)
        .filter(Boolean);

    setForm((current) => ({
      ...current,
      products: [
        ...new Set([
          ...current.products,
          ...visibleIds,
        ]),
      ],
    }));
  }

  function clearProducts() {
    updateForm(
      'products',
      [],
    );
  }

  async function handleCoverUpload(
    event,
  ) {
    const file =
      event.target.files?.[0];

    event.target.value = '';

    if (!file) {
      return;
    }

    if (
      !file.type.startsWith(
        'image/',
      )
    ) {
      setFormError(
        'Please select a valid image file.',
      );
      return;
    }

    try {
      setUploadingCover(true);
      setFormError('');

      const response =
        await uploadAdminImage(
          file,
        );

      const uploadedUrl =
        getUploadedFileUrl(
          response,
        );

      if (!uploadedUrl) {
        throw new Error(
          'The image uploaded, but no image URL was returned.',
        );
      }

      updateForm(
        'coverImage',
        uploadedUrl,
      );

      setToast(
        'Cover image uploaded.',
      );
    } catch (error) {
      setFormError(
        getErrorMessage(
          error,
          'Unable to upload cover image.',
        ),
      );
    } finally {
      setUploadingCover(
        false,
      );
    }
  }

  async function handleSubmit(
    event,
  ) {
    event.preventDefault();

    if (!form.name.trim()) {
      setFormError(
        'Collection name is required.',
      );
      return;
    }

    try {
      setSaving(true);
      setFormError('');

      const payload = {
        name:
          form.name.trim(),
        description:
          form.description.trim(),
        coverImage:
          form.coverImage.trim(),
        products:
          form.products,
        featured:
          Boolean(
            form.featured,
          ),
        isActive:
          Boolean(
            form.isActive,
          ),
        sortOrder:
          Math.max(
            0,
            Number(
              form.sortOrder,
            ) || 0,
          ),
      };

      if (
        editingCollection
      ) {
        const id =
          getCollectionId(
            editingCollection,
          );

        await updateCollection(
          id,
          payload,
        );

        setToast(
          'Collection updated successfully.',
        );
      } else {
        await createCollection(
          payload,
        );

        setToast(
          'Collection created successfully.',
        );
      }

      setModalOpen(false);
      setEditingCollection(
        null,
      );

      await loadCollections();
    } catch (error) {
      setFormError(
        getErrorMessage(
          error,
          'Unable to save collection.',
        ),
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus(
    collection,
  ) {
    const id =
      getCollectionId(
        collection,
      );

    if (!id) {
      return;
    }

    try {
      setTogglingId(id);

      await updateCollection(
        id,
        {
          isActive:
            !collection.isActive,
        },
      );

      setToast(
        collection.isActive
          ? 'Collection deactivated.'
          : 'Collection activated.',
      );

      await loadCollections();
    } catch (error) {
      setPageError(
        getErrorMessage(
          error,
          'Unable to update collection status.',
        ),
      );
    } finally {
      setTogglingId('');
    }
  }

  async function handleDelete(
    collection,
  ) {
    const id =
      getCollectionId(
        collection,
      );

    if (!id) {
      return;
    }

    const confirmed =
      window.confirm(
        `Delete "${collection.name}"? This will remove the collection, but it will not delete its products.`,
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(id);
      setPageError('');

      await deleteCollection(
        id,
      );

      setToast(
        'Collection deleted successfully.',
      );

      await loadCollections();
    } catch (error) {
      setPageError(
        getErrorMessage(
          error,
          'Unable to delete collection.',
        ),
      );
    } finally {
      setDeletingId('');
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
            styles.pageHeader
          }
        >
          <div>
            <span
              className={
                styles.eyebrow
              }
            >
              Catalog Management
            </span>

            <h1>
              Collections
            </h1>

            <p>
              Manage curated DESIRE
              collections.
            </p>
          </div>
        </div>

        <div
          className={
            styles.loadingGrid
          }
        >
          {[1, 2, 3, 4].map(
            (item) => (
              <div
                key={item}
                className={
                  styles.loadingCard
                }
              />
            ),
          )}
        </div>

        <div
          className={
            styles.loadingTable
          }
        />
      </section>
    );
  }

  return (
    <section
      className={styles.page}
    >
      {toast && (
        <div
          className={
            styles.toast
          }
          role="status"
        >
          <span
            className={
              styles.toastDot
            }
          />

          {toast}
        </div>
      )}

      <div
        className={
          styles.pageHeader
        }
      >
        <div>
          <span
            className={
              styles.eyebrow
            }
          >
            Catalog Management
          </span>

          <h1>
            Collections
          </h1>

          <p>
            Curate products into
            premium storefront
            collections and control
            how they appear to
            customers.
          </p>
        </div>

        <button
          type="button"
          className={
            styles.primaryButton
          }
          onClick={
            openCreateModal
          }
        >
          <span>+</span>
          New Collection
        </button>
      </div>

      {pageError && (
        <div
          className={
            styles.errorBanner
          }
        >
          <div>
            <strong>
              Something went wrong
            </strong>

            <span>
              {pageError}
            </span>
          </div>

          <button
            type="button"
            onClick={() =>
              setPageError('')
            }
          >
            ×
          </button>
        </div>
      )}

      <div
        className={
          styles.statsGrid
        }
      >
        <div
          className={
            styles.statCard
          }
        >
          <span>
            Total Collections
          </span>

          <strong>
            {stats.total}
          </strong>

          <small>
            All curated groups
          </small>
        </div>

        <div
          className={
            styles.statCard
          }
        >
          <span>
            Active
          </span>

          <strong>
            {stats.active}
          </strong>

          <small>
            Visible to customers
          </small>
        </div>

        <div
          className={
            styles.statCard
          }
        >
          <span>
            Featured
          </span>

          <strong>
            {stats.featured}
          </strong>

          <small>
            Promoted collections
          </small>
        </div>

        <div
          className={
            styles.statCard
          }
        >
          <span>
            Inactive
          </span>

          <strong>
            {stats.inactive}
          </strong>

          <small>
            Hidden from storefront
          </small>
        </div>
      </div>

      <div
        className={
          styles.contentCard
        }
      >
        <div
          className={
            styles.toolbar
          }
        >
          <div
            className={
              styles.searchBox
            }
          >
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

            <input
              type="search"
              placeholder="Search collections..."
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
            />
          </div>

          <div
            className={
              styles.filters
            }
          >
            <button
              type="button"
              className={
                statusFilter ===
                'all'
                  ? styles.filterActive
                  : ''
              }
              onClick={() =>
                setStatusFilter(
                  'all',
                )
              }
            >
              All
            </button>

            <button
              type="button"
              className={
                statusFilter ===
                'active'
                  ? styles.filterActive
                  : ''
              }
              onClick={() =>
                setStatusFilter(
                  'active',
                )
              }
            >
              Active
            </button>

            <button
              type="button"
              className={
                statusFilter ===
                'inactive'
                  ? styles.filterActive
                  : ''
              }
              onClick={() =>
                setStatusFilter(
                  'inactive',
                )
              }
            >
              Inactive
            </button>
          </div>
        </div>

        {filteredCollections.length ===
        0 ? (
          <div
            className={
              styles.emptyState
            }
          >
            <div
              className={
                styles.emptyIcon
              }
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <rect
                  x="4"
                  y="4"
                  width="16"
                  height="12"
                />

                <path d="M8 20h8" />
              </svg>
            </div>

            <h2>
              No collections found
            </h2>

            <p>
              {collections.length ===
              0
                ? 'Create your first curated DESIRE collection.'
                : 'Try adjusting your search or filter.'}
            </p>

            {collections.length ===
              0 && (
              <button
                type="button"
                className={
                  styles.primaryButton
                }
                onClick={
                  openCreateModal
                }
              >
                Create Collection
              </button>
            )}
          </div>
        ) : (
          <div
            className={
              styles.tableWrapper
            }
          >
            <table
              className={
                styles.table
              }
            >
              <thead>
                <tr>
                  <th>
                    Collection
                  </th>

                  <th>
                    Products
                  </th>

                  <th>
                    Position
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Featured
                  </th>

                  <th>
                    Created
                  </th>

                  <th>
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredCollections.map(
                  (
                    collection,
                  ) => {
                    const id =
                      getCollectionId(
                        collection,
                      );

                    const productCount =
                      Array.isArray(
                        collection
                          ?.products,
                      )
                        ? collection
                            .products
                            .length
                        : 0;

                    return (
                      <tr key={id}>
                        <td>
                          <div
                            className={
                              styles.collectionCell
                            }
                          >
                            <div
                              className={
                                styles.collectionImage
                              }
                            >
                              {collection?.coverImage ? (
                                <img
                                  src={
                                    collection.coverImage
                                  }
                                  alt=""
                                />
                              ) : (
                                <span>
                                  DESIRE
                                </span>
                              )}
                            </div>

                            <div>
                              <strong>
                                {
                                  collection.name
                                }
                              </strong>

                              <span>
                                /
                                {
                                  collection.slug
                                }
                              </span>

                              {collection?.description && (
                                <small>
                                  {
                                    collection.description
                                  }
                                </small>
                              )}
                            </div>
                          </div>
                        </td>

                        <td>
                          <span
                            className={
                              styles.productCount
                            }
                          >
                            {
                              productCount
                            }{' '}
                            {productCount ===
                            1
                              ? 'product'
                              : 'products'}
                          </span>
                        </td>

                        <td>
                          <span
                            className={
                              styles.sortOrder
                            }
                          >
                            {Number(
                              collection?.sortOrder,
                            ) || 0}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`${styles.statusBadge} ${
                              collection?.isActive
                                ? styles.activeBadge
                                : styles.inactiveBadge
                            }`}
                          >
                            <span />

                            {collection?.isActive
                              ? 'Active'
                              : 'Inactive'}
                          </span>
                        </td>

                        <td>
                          {collection?.featured ? (
                            <span
                              className={
                                styles.featuredBadge
                              }
                            >
                              Featured
                            </span>
                          ) : (
                            <span
                              className={
                                styles.mutedText
                              }
                            >
                              —
                            </span>
                          )}
                        </td>

                        <td>
                          <span
                            className={
                              styles.dateText
                            }
                          >
                            {formatDate(
                              collection?.createdAt,
                            )}
                          </span>
                        </td>

                        <td>
                          <div
                            className={
                              styles.actions
                            }
                          >
                            <button
                              type="button"
                              className={
                                styles.editButton
                              }
                              onClick={() =>
                                openEditModal(
                                  collection,
                                )
                              }
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              className={
                                styles.statusButton
                              }
                              disabled={
                                togglingId ===
                                id
                              }
                              onClick={() =>
                                handleToggleStatus(
                                  collection,
                                )
                              }
                            >
                              {togglingId ===
                              id
                                ? 'Saving...'
                                : collection?.isActive
                                  ? 'Deactivate'
                                  : 'Activate'}
                            </button>

                            <button
                              type="button"
                              className={
                                styles.deleteButton
                              }
                              disabled={
                                deletingId ===
                                id
                              }
                              onClick={() =>
                                handleDelete(
                                  collection,
                                )
                              }
                            >
                              {deletingId ===
                              id
                                ? 'Deleting...'
                                : 'Delete'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  },
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <div
          className={
            styles.modalBackdrop
          }
          role="presentation"
          onMouseDown={(
            event,
          ) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeModal();
            }
          }}
        >
          <div
            className={
              styles.modal
            }
            role="dialog"
            aria-modal="true"
            aria-labelledby="collection-modal-title"
          >
            <div
              className={
                styles.modalHeader
              }
            >
              <div>
                <span
                  className={
                    styles.modalEyebrow
                  }
                >
                  {editingCollection
                    ? 'Edit Collection'
                    : 'New Collection'}
                </span>

                <h2
                  id="collection-modal-title"
                >
                  {editingCollection
                    ? editingCollection.name
                    : 'Create collection'}
                </h2>

                <p>
                  Build a curated
                  storefront group
                  with its own cover
                  image and selected
                  products.
                </p>
              </div>

              <button
                type="button"
                className={
                  styles.closeButton
                }
                onClick={
                  closeModal
                }
                disabled={
                  saving ||
                  uploadingCover
                }
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={
                handleSubmit
              }
              className={
                styles.form
              }
            >
              {formError && (
                <div
                  className={
                    styles.formError
                  }
                >
                  {formError}
                </div>
              )}

              <div
                className={
                  styles.formGrid
                }
              >
                <div
                  className={
                    styles.formMain
                  }
                >
                  <div
                    className={
                      styles.formSection
                    }
                  >
                    <div
                      className={
                        styles.sectionHeading
                      }
                    >
                      <div>
                        <h3>
                          Collection
                          information
                        </h3>

                        <p>
                          Name and
                          describe this
                          collection.
                        </p>
                      </div>
                    </div>

                    <div
                      className={
                        styles.field
                      }
                    >
                      <label
                        htmlFor="collection-name"
                      >
                        Collection name
                        <span>*</span>
                      </label>

                      <input
                        id="collection-name"
                        type="text"
                        value={
                          form.name
                        }
                        onChange={(
                          event,
                        ) =>
                          updateForm(
                            'name',
                            event
                              .target
                              .value,
                          )
                        }
                        placeholder="e.g. Luxury Jackets"
                        maxLength={
                          150
                        }
                        required
                      />

                      <small>
                        The slug will
                        be generated
                        automatically
                        by the backend.
                      </small>
                    </div>

                    <div
                      className={
                        styles.field
                      }
                    >
                      <label
                        htmlFor="collection-description"
                      >
                        Description
                      </label>

                      <textarea
                        id="collection-description"
                        value={
                          form.description
                        }
                        onChange={(
                          event,
                        ) =>
                          updateForm(
                            'description',
                            event
                              .target
                              .value,
                          )
                        }
                        placeholder="Describe what makes this collection unique..."
                        maxLength={
                          1000
                        }
                        rows={5}
                      />

                      <div
                        className={
                          styles.characterCount
                        }
                      >
                        {
                          form
                            .description
                            .length
                        }
                        /1000
                      </div>
                    </div>
                  </div>

                  <div
                    className={
                      styles.formSection
                    }
                  >
                    <div
                      className={
                        styles.sectionHeading
                      }
                    >
                      <div>
                        <h3>
                          Products
                        </h3>

                        <p>
                          Choose the
                          products that
                          belong to this
                          collection.
                        </p>
                      </div>

                      <span
                        className={
                          styles.selectionCount
                        }
                      >
                        {
                          form
                            .products
                            .length
                        }{' '}
                        selected
                      </span>
                    </div>

                    <div
                      className={
                        styles.productToolbar
                      }
                    >
                      <div
                        className={
                          styles.productSearch
                        }
                      >
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

                        <input
                          type="search"
                          value={
                            productSearch
                          }
                          onChange={(
                            event,
                          ) =>
                            setProductSearch(
                              event
                                .target
                                .value,
                            )
                          }
                          placeholder="Search products..."
                        />
                      </div>

                      <div
                        className={
                          styles.productToolbarActions
                        }
                      >
                        <button
                          type="button"
                          onClick={
                            selectAllVisibleProducts
                          }
                        >
                          Select visible
                        </button>

                        <button
                          type="button"
                          onClick={
                            clearProducts
                          }
                        >
                          Clear
                        </button>
                      </div>
                    </div>

                    <div
                      className={
                        styles.productList
                      }
                    >
                      {productsLoading ? (
                        <div
                          className={
                            styles.productListMessage
                          }
                        >
                          Loading
                          products...
                        </div>
                      ) : filteredProducts.length ===
                        0 ? (
                        <div
                          className={
                            styles.productListMessage
                          }
                        >
                          No products
                          found.
                        </div>
                      ) : (
                        filteredProducts.map(
                          (
                            product,
                          ) => {
                            const productId =
                              getProductId(
                                product,
                              );

                            const selected =
                              form.products.includes(
                                productId,
                              );

                            const image =
                              getProductImage(
                                product,
                              );

                            return (
                              <button
                                type="button"
                                key={
                                  productId
                                }
                                className={`${styles.productOption} ${
                                  selected
                                    ? styles.productOptionSelected
                                    : ''
                                }`}
                                onClick={() =>
                                  toggleProduct(
                                    productId,
                                  )
                                }
                              >
                                <div
                                  className={
                                    styles.productThumbnail
                                  }
                                >
                                  {image ? (
                                    <img
                                      src={
                                        image
                                      }
                                      alt=""
                                    />
                                  ) : (
                                    <span>
                                      D
                                    </span>
                                  )}
                                </div>

                                <div
                                  className={
                                    styles.productInfo
                                  }
                                >
                                  <strong>
                                    {
                                      product?.name
                                    }
                                  </strong>

                                  <span>
                                    {formatCurrency(
                                      product?.price,
                                    )}
                                  </span>

                                  {product?.sku && (
                                    <small>
                                      {
                                        product.sku
                                      }
                                    </small>
                                  )}
                                </div>

                                <span
                                  className={
                                    styles.checkbox
                                  }
                                >
                                  {selected &&
                                    '✓'}
                                </span>
                              </button>
                            );
                          },
                        )
                      )}
                    </div>
                  </div>
                </div>

                <aside
                  className={
                    styles.formSidebar
                  }
                >
                  <div
                    className={
                      styles.formSection
                    }
                  >
                    <div
                      className={
                        styles.sectionHeading
                      }
                    >
                      <div>
                        <h3>
                          Cover image
                        </h3>

                        <p>
                          Used on the
                          customer
                          collections
                          page.
                        </p>
                      </div>
                    </div>

                    <div
                      className={
                        styles.coverPreview
                      }
                    >
                      {form.coverImage ? (
                        <img
                          src={
                            form.coverImage
                          }
                          alt="Collection cover preview"
                        />
                      ) : (
                        <div
                          className={
                            styles.coverPlaceholder
                          }
                        >
                          <span>
                            DESIRE
                          </span>

                          <small>
                            Collection
                            cover
                          </small>
                        </div>
                      )}
                    </div>

                    <label
                      className={`${styles.uploadButton} ${
                        uploadingCover
                          ? styles.uploadButtonDisabled
                          : ''
                      }`}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        onChange={
                          handleCoverUpload
                        }
                        disabled={
                          uploadingCover ||
                          saving
                        }
                      />

                      {uploadingCover
                        ? 'Uploading...'
                        : form.coverImage
                          ? 'Replace Image'
                          : 'Upload Cover Image'}
                    </label>

                    {form.coverImage && (
                      <button
                        type="button"
                        className={
                          styles.removeImageButton
                        }
                        onClick={() =>
                          updateForm(
                            'coverImage',
                            '',
                          )
                        }
                        disabled={
                          uploadingCover ||
                          saving
                        }
                      >
                        Remove from
                        collection
                      </button>
                    )}

                    <small
                      className={
                        styles.helperText
                      }
                    >
                      Removing it here
                      only clears the
                      collection cover
                      reference. It
                      does not delete
                      the uploaded file
                      from the server.
                    </small>
                  </div>

                  <div
                    className={
                      styles.formSection
                    }
                  >
                    <div
                      className={
                        styles.sectionHeading
                      }
                    >
                      <div>
                        <h3>
                          Visibility
                        </h3>

                        <p>
                          Control where
                          the collection
                          appears.
                        </p>
                      </div>
                    </div>

                    <label
                      className={
                        styles.switchRow
                      }
                    >
                      <div>
                        <strong>
                          Active
                        </strong>

                        <span>
                          Show this
                          collection to
                          customers.
                        </span>
                      </div>

                      <input
                        type="checkbox"
                        checked={
                          form.isActive
                        }
                        onChange={(
                          event,
                        ) =>
                          updateForm(
                            'isActive',
                            event
                              .target
                              .checked,
                          )
                        }
                      />

                      <span
                        className={
                          styles.switch
                        }
                      />
                    </label>

                    <label
                      className={
                        styles.switchRow
                      }
                    >
                      <div>
                        <strong>
                          Featured
                        </strong>

                        <span>
                          Allow this
                          collection in
                          featured
                          storefront
                          sections.
                        </span>
                      </div>

                      <input
                        type="checkbox"
                        checked={
                          form.featured
                        }
                        onChange={(
                          event,
                        ) =>
                          updateForm(
                            'featured',
                            event
                              .target
                              .checked,
                          )
                        }
                      />

                      <span
                        className={
                          styles.switch
                        }
                      />
                    </label>

                    <div
                      className={
                        styles.field
                      }
                    >
                      <label
                        htmlFor="sort-order"
                      >
                        Display order
                      </label>

                      <input
                        id="sort-order"
                        type="number"
                        min="0"
                        step="1"
                        value={
                          form.sortOrder
                        }
                        onChange={(
                          event,
                        ) =>
                          updateForm(
                            'sortOrder',
                            event
                              .target
                              .value,
                          )
                        }
                      />

                      <small>
                        Lower numbers
                        appear first.
                      </small>
                    </div>
                  </div>
                </aside>
              </div>

              <div
                className={
                  styles.modalFooter
                }
              >
                <button
                  type="button"
                  className={
                    styles.cancelButton
                  }
                  onClick={
                    closeModal
                  }
                  disabled={
                    saving ||
                    uploadingCover
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className={
                    styles.saveButton
                  }
                  disabled={
                    saving ||
                    uploadingCover
                  }
                >
                  {saving
                    ? 'Saving...'
                    : editingCollection
                      ? 'Save Changes'
                      : 'Create Collection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}