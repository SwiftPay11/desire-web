'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  createCategory,
  deleteCategory,
  getAdminCategories,
  updateCategory,
} from '@/services/categories.service';

import styles from './categories.module.css';

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

  if (Array.isArray(response?.data?.categories)) {
    return response.data.categories;
  }

  return [];
}

function formatDate(value) {
  if (!value) {
    return '—';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return new Intl.DateTimeFormat('en-NG', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function getInitialForm() {
  return {
    name: '',
    description: '',
    isActive: true,
  };
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const [form, setForm] = useState(getInitialForm());
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const [deletingId, setDeletingId] = useState('');
  const [togglingId, setTogglingId] = useState('');

  const [successMessage, setSuccessMessage] = useState('');

  const showSuccess = useCallback((message) => {
    setSuccessMessage(message);

    window.setTimeout(() => {
      setSuccessMessage('');
    }, 3500);
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      setPageError('');

      const response =
        await getAdminCategories();

      setCategories(
        normalizeCategories(response),
      );
    } catch (error) {
      console.error(
        'Unable to load categories:',
        error,
      );

      setPageError(
        error?.message ||
          'We could not load the categories.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const statistics = useMemo(() => {
    const total = categories.length;

    const active = categories.filter(
      (category) => category?.isActive,
    ).length;

    const inactive = total - active;

    return {
      total,
      active,
      inactive,
    };
  }, [categories]);

  const filteredCategories = useMemo(() => {
    const normalizedSearch =
      search.trim().toLowerCase();

    return categories.filter((category) => {
      const name =
        String(category?.name || '').toLowerCase();

      const slug =
        String(category?.slug || '').toLowerCase();

      const description =
        String(
          category?.description || '',
        ).toLowerCase();

      const matchesSearch =
        !normalizedSearch ||
        name.includes(normalizedSearch) ||
        slug.includes(normalizedSearch) ||
        description.includes(normalizedSearch);

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' &&
          category?.isActive) ||
        (statusFilter === 'inactive' &&
          !category?.isActive);

      return (
        matchesSearch &&
        matchesStatus
      );
    });
  }, [
    categories,
    search,
    statusFilter,
  ]);

  function openCreateForm() {
    setEditingCategory(null);
    setForm(getInitialForm());
    setFormError('');
    setIsFormOpen(true);
  }

  function openEditForm(category) {
    setEditingCategory(category);

    setForm({
      name: category?.name || '',
      description:
        category?.description || '',
      isActive:
        category?.isActive !== false,
    });

    setFormError('');
    setIsFormOpen(true);
  }

  function closeForm() {
    if (saving) {
      return;
    }

    setIsFormOpen(false);
    setEditingCategory(null);
    setForm(getInitialForm());
    setFormError('');
  }

  function handleInputChange(event) {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setForm((current) => ({
      ...current,
      [name]:
        type === 'checkbox'
          ? checked
          : value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const name = form.name.trim();
    const description =
      form.description.trim();

    if (!name) {
      setFormError(
        'Category name is required.',
      );
      return;
    }

    try {
      setSaving(true);
      setFormError('');

      const payload = {
        name,
        description,
        isActive: form.isActive,
      };

      if (editingCategory?._id) {
        await updateCategory(
          editingCategory._id,
          payload,
        );

        showSuccess(
          'Category updated successfully.',
        );
      } else {
        await createCategory(payload);

        showSuccess(
          'Category created successfully.',
        );
      }

      closeForm();
      await loadCategories();
    } catch (error) {
      console.error(
        'Unable to save category:',
        error,
      );

      setFormError(
        error?.message ||
          'We could not save this category.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus(category) {
    if (!category?._id) {
      return;
    }

    try {
      setTogglingId(category._id);
      setPageError('');

      await updateCategory(
        category._id,
        {
          isActive: !category.isActive,
        },
      );

      showSuccess(
        category.isActive
          ? 'Category deactivated.'
          : 'Category activated.',
      );

      await loadCategories();
    } catch (error) {
      console.error(
        'Unable to change category status:',
        error,
      );

      setPageError(
        error?.message ||
          'We could not change the category status.',
      );
    } finally {
      setTogglingId('');
    }
  }

  async function handleDelete(category) {
    if (!category?._id) {
      return;
    }

    const confirmed =
      window.confirm(
        `Delete "${category.name}"? This action cannot be undone.`,
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(category._id);
      setPageError('');

      await deleteCategory(
        category._id,
      );

      showSuccess(
        'Category deleted successfully.',
      );

      await loadCategories();
    } catch (error) {
      console.error(
        'Unable to delete category:',
        error,
      );

      setPageError(
        error?.message ||
          'We could not delete this category.',
      );
    } finally {
      setDeletingId('');
    }
  }

  return (
    <div className={styles.page}>
      {successMessage ? (
        <div
          className={styles.successToast}
          role="status"
        >
          <span
            className={
              styles.successToastIcon
            }
          >
            ✓
          </span>

          <span>
            {successMessage}
          </span>
        </div>
      ) : null}

      <div className={styles.header}>
        <div>
          <div
            className={
              styles.eyebrow
            }
          >
            CATALOG MANAGEMENT
          </div>

          <h1
            className={
              styles.title
            }
          >
            Categories
          </h1>

          <p
            className={
              styles.subtitle
            }
          >
            Organize products into
            clean storefront categories
            and control which ones are
            visible to customers.
          </p>
        </div>

        <button
          type="button"
          className={
            styles.primaryButton
          }
          onClick={openCreateForm}
        >
          <span
            className={
              styles.buttonPlus
            }
          >
            +
          </span>

          Add Category
        </button>
      </div>

      <section
        className={
          styles.statsGrid
        }
      >
        <article
          className={
            styles.statCard
          }
        >
          <div
            className={
              styles.statTop
            }
          >
            <span
              className={
                styles.statLabel
              }
            >
              Total Categories
            </span>

            <span
              className={
                styles.statIcon
              }
            >
              01
            </span>
          </div>

          <strong
            className={
              styles.statValue
            }
          >
            {statistics.total}
          </strong>

          <span
            className={
              styles.statHint
            }
          >
            All catalog categories
          </span>
        </article>

        <article
          className={
            styles.statCard
          }
        >
          <div
            className={
              styles.statTop
            }
          >
            <span
              className={
                styles.statLabel
              }
            >
              Active
            </span>

            <span
              className={`${styles.statDot} ${styles.activeDot}`}
            />
          </div>

          <strong
            className={
              styles.statValue
            }
          >
            {statistics.active}
          </strong>

          <span
            className={
              styles.statHint
            }
          >
            Visible to customers
          </span>
        </article>

        <article
          className={
            styles.statCard
          }
        >
          <div
            className={
              styles.statTop
            }
          >
            <span
              className={
                styles.statLabel
              }
            >
              Inactive
            </span>

            <span
              className={`${styles.statDot} ${styles.inactiveDot}`}
            />
          </div>

          <strong
            className={
              styles.statValue
            }
          >
            {statistics.inactive}
          </strong>

          <span
            className={
              styles.statHint
            }
          >
            Hidden from storefront
          </span>
        </article>
      </section>

      <section
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
              styles.searchWrap
            }
          >
            <span
              className={
                styles.searchIcon
              }
            >
              ⌕
            </span>

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
              placeholder="Search categories..."
              className={
                styles.searchInput
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
              className={`${styles.filterButton} ${
                statusFilter === 'all'
                  ? styles.filterActive
                  : ''
              }`}
              onClick={() =>
                setStatusFilter('all')
              }
            >
              All
            </button>

            <button
              type="button"
              className={`${styles.filterButton} ${
                statusFilter ===
                'active'
                  ? styles.filterActive
                  : ''
              }`}
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
              className={`${styles.filterButton} ${
                statusFilter ===
                'inactive'
                  ? styles.filterActive
                  : ''
              }`}
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

        {pageError ? (
          <div
            className={
              styles.errorBox
            }
          >
            <div>
              <strong>
                Something went wrong
              </strong>

              <p>
                {pageError}
              </p>
            </div>

            <button
              type="button"
              onClick={
                loadCategories
              }
            >
              Retry
            </button>
          </div>
        ) : null}

        {loading ? (
          <div
            className={
              styles.loadingState
            }
          >
            <div
              className={
                styles.spinner
              }
            />

            <p>
              Loading categories...
            </p>
          </div>
        ) : filteredCategories.length ===
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
              C
            </div>

            <h3>
              No categories found
            </h3>

            <p>
              {categories.length === 0
                ? 'Create your first category to begin organizing products.'
                : 'No categories match the current search or filter.'}
            </p>

            {categories.length ===
            0 ? (
              <button
                type="button"
                className={
                  styles.primaryButton
                }
                onClick={
                  openCreateForm
                }
              >
                Add Category
              </button>
            ) : null}
          </div>
        ) : (
          <div
            className={
              styles.tableWrap
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
                    Category
                  </th>
                  <th>
                    Slug
                  </th>
                  <th>
                    Status
                  </th>
                  <th>
                    Created
                  </th>
                  <th
                    className={
                      styles.actionHeading
                    }
                  >
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredCategories.map(
                  (category) => {
                    const isToggling =
                      togglingId ===
                      category._id;

                    const isDeleting =
                      deletingId ===
                      category._id;

                    return (
                      <tr
                        key={
                          category._id
                        }
                      >
                        <td>
                          <div
                            className={
                              styles.categoryCell
                            }
                          >
                            <div
                              className={
                                styles.categoryAvatar
                              }
                            >
                              {String(
                                category?.name ||
                                  'C',
                              )
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <div
                              className={
                                styles.categoryInfo
                              }
                            >
                              <strong>
                                {
                                  category.name
                                }
                              </strong>

                              <span>
                                {category.description ||
                                  'No description'}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <code
                            className={
                              styles.slug
                            }
                          >
                            /
                            {
                              category.slug
                            }
                          </code>
                        </td>

                        <td>
                          <span
                            className={`${styles.statusBadge} ${
                              category.isActive
                                ? styles.statusActive
                                : styles.statusInactive
                            }`}
                          >
                            <span />

                            {category.isActive
                              ? 'Active'
                              : 'Inactive'}
                          </span>
                        </td>

                        <td>
                          <span
                            className={
                              styles.date
                            }
                          >
                            {formatDate(
                              category.createdAt,
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
                                styles.actionButton
                              }
                              onClick={() =>
                                openEditForm(
                                  category,
                                )
                              }
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              className={
                                styles.actionButton
                              }
                              disabled={
                                isToggling
                              }
                              onClick={() =>
                                handleToggleStatus(
                                  category,
                                )
                              }
                            >
                              {isToggling
                                ? 'Saving...'
                                : category.isActive
                                  ? 'Deactivate'
                                  : 'Activate'}
                            </button>

                            <button
                              type="button"
                              className={`${styles.actionButton} ${styles.deleteButton}`}
                              disabled={
                                isDeleting
                              }
                              onClick={() =>
                                handleDelete(
                                  category,
                                )
                              }
                            >
                              {isDeleting
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

        {!loading &&
        filteredCategories.length >
          0 ? (
          <div
            className={
              styles.tableFooter
            }
          >
            <span>
              Showing{' '}
              {
                filteredCategories.length
              }{' '}
              of {categories.length}{' '}
              categories
            </span>
          </div>
        ) : null}
      </section>

      {isFormOpen ? (
        <div
          className={
            styles.modalOverlay
          }
          onMouseDown={
            closeForm
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
                  {editingCategory
                    ? 'EDIT CATEGORY'
                    : 'NEW CATEGORY'}
                </span>

                <h2>
                  {editingCategory
                    ? 'Update category'
                    : 'Create category'}
                </h2>

                <p>
                  {editingCategory
                    ? 'Make changes to this category and its storefront visibility.'
                    : 'Create a new category for organizing DESIRE products.'}
                </p>
              </div>

              <button
                type="button"
                className={
                  styles.closeButton
                }
                onClick={
                  closeForm
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
              {formError ? (
                <div
                  className={
                    styles.formError
                  }
                >
                  {formError}
                </div>
              ) : null}

              <div
                className={
                  styles.field
                }
              >
                <label
                  htmlFor="name"
                >
                  Category name
                </label>

                <input
                  id="name"
                  name="name"
                  type="text"
                  maxLength={100}
                  value={form.name}
                  onChange={
                    handleInputChange
                  }
                  placeholder="e.g. T-Shirts"
                  autoFocus
                />

                <span
                  className={
                    styles.fieldHint
                  }
                >
                  The slug will be
                  generated automatically
                  by the backend.
                </span>
              </div>

              <div
                className={
                  styles.field
                }
              >
                <div
                  className={
                    styles.labelRow
                  }
                >
                  <label
                    htmlFor="description"
                  >
                    Description
                  </label>

                  <span>
                    {
                      form.description
                        .length
                    }
                    /500
                  </span>
                </div>

                <textarea
                  id="description"
                  name="description"
                  rows={5}
                  maxLength={500}
                  value={
                    form.description
                  }
                  onChange={
                    handleInputChange
                  }
                  placeholder="Short description of this category..."
                />
              </div>

              <label
                className={
                  styles.switchCard
                }
              >
                <div>
                  <strong>
                    Active category
                  </strong>

                  <span>
                    Active categories
                    can appear on the
                    customer storefront.
                  </span>
                </div>

                <input
                  type="checkbox"
                  name="isActive"
                  checked={
                    form.isActive
                  }
                  onChange={
                    handleInputChange
                  }
                />

                <span
                  className={
                    styles.switch
                  }
                >
                  <span />
                </span>
              </label>

              <div
                className={
                  styles.modalActions
                }
              >
                <button
                  type="button"
                  className={
                    styles.secondaryButton
                  }
                  onClick={
                    closeForm
                  }
                  disabled={
                    saving
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className={
                    styles.primaryButton
                  }
                  disabled={
                    saving
                  }
                >
                  {saving
                    ? editingCategory
                      ? 'Saving changes...'
                      : 'Creating...'
                    : editingCategory
                      ? 'Save Changes'
                      : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}