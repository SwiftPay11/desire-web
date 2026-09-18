'use client';

import Link from 'next/link';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  useRouter,
} from 'next/navigation';

import {
  createProduct,
} from '@/services/products.service';

import {
  getAdminCategories,
} from '@/services/categories.service';

import {
  getUploadedFileUrls,
  uploadAdminImages,
} from '@/services/uploads.service';

import styles from './create-product.module.css';

const INITIAL_FORM = {
  name: '',
  slug: '',
  description: '',
  sku: '',
  price: '',
  compareAtPrice: '',
  category: '',
  stock: '',
  sizes: '',
  colors: '',
  featured: false,
  isActive: true,
};

function normalizeCategories(response) {
  if (Array.isArray(response)) {
    return response;
  }

  if (
    Array.isArray(
      response?.categories,
    )
  ) {
    return response.categories;
  }

  if (
    Array.isArray(
      response?.data?.categories,
    )
  ) {
    return response.data.categories;
  }

  return [];
}

function createSlug(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function splitValues(value) {
  return String(value || '')
    .split(',')
    .map((item) =>
      item.trim(),
    )
    .filter(Boolean);
}

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      <path d="m14 7 5 5-5 5" />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M19 12H5" />
      <path d="m10 7-5 5 5 5" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M12 16V4" />
      <path d="m7 9 5-5 5 5" />
      <path d="M4 16v4h16v-4" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M4 7h16" />
      <path d="M9 7V4h6v3" />
      <path d="M7 7l1 13h8l1-13" />
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

export default function CreateProductPage() {
  const router =
    useRouter();

  const [form, setForm] =
    useState(INITIAL_FORM);

  const [
    categories,
    setCategories,
  ] = useState([]);

  const [
    loadingCategories,
    setLoadingCategories,
  ] = useState(true);

  const [files, setFiles] =
    useState([]);

  const [
    previews,
    setPreviews,
  ] = useState([]);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState('');

  const [
    successMessage,
    setSuccessMessage,
  ] = useState('');

  useEffect(() => {
    let active = true;

    async function loadCategories() {
      try {
        setLoadingCategories(
          true,
        );

        const response =
          await getAdminCategories();

        if (!active) {
          return;
        }

        setCategories(
          normalizeCategories(
            response,
          ),
        );
      } catch (categoryError) {
        console.error(
          'Unable to load categories:',
          categoryError,
        );

        if (active) {
          setError(
            categoryError?.message ||
              'We could not load product categories.',
          );
        }
      } finally {
        if (active) {
          setLoadingCategories(
            false,
          );
        }
      }
    }

    loadCategories();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      previews.forEach(
        (preview) => {
          URL.revokeObjectURL(
            preview,
          );
        },
      );
    };
  }, [previews]);

  function updateField(
    field,
    value,
  ) {
    setForm((current) => {
      const next = {
        ...current,
        [field]: value,
      };

      if (
        field === 'name' &&
        !current.slug
      ) {
        next.slug =
          createSlug(value);
      }

      return next;
    });

    setError('');
  }

  function handleNameChange(
    value,
  ) {
    setForm((current) => {
      const previousAutoSlug =
        createSlug(
          current.name,
        );

      const shouldUpdateSlug =
        !current.slug ||
        current.slug ===
          previousAutoSlug;

      return {
        ...current,
        name: value,
        slug:
          shouldUpdateSlug
            ? createSlug(value)
            : current.slug,
      };
    });

    setError('');
  }

  function handleImages(
    event,
  ) {
    const selected =
      Array.from(
        event.target.files ||
          [],
      );

    if (
      selected.length === 0
    ) {
      return;
    }

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
    ];

    const invalidFile =
      selected.find(
        (file) =>
          !allowedTypes.includes(
            file.type,
          ),
      );

    if (invalidFile) {
      setError(
        'Product images must be JPG, PNG, or WEBP.',
      );

      event.target.value = '';

      return;
    }

    const maximumSize =
      5 * 1024 * 1024;

    const oversizedFile =
      selected.find(
        (file) =>
          file.size >
          maximumSize,
      );

    if (oversizedFile) {
      setError(
        'Each product image must not exceed 5 MB.',
      );

      event.target.value = '';

      return;
    }

    const combined = [
      ...files,
      ...selected,
    ];

    if (
      combined.length > 10
    ) {
      setError(
        'You can upload a maximum of 10 product images.',
      );

      event.target.value = '';

      return;
    }

    previews.forEach(
      (preview) => {
        URL.revokeObjectURL(
          preview,
        );
      },
    );

    setFiles(combined);

    setPreviews(
      combined.map(
        (file) =>
          URL.createObjectURL(
            file,
          ),
      ),
    );

    setError('');

    event.target.value = '';
  }

  function removeImage(index) {
    const nextFiles =
      files.filter(
        (_, fileIndex) =>
          fileIndex !== index,
      );

    previews.forEach(
      (preview) => {
        URL.revokeObjectURL(
          preview,
        );
      },
    );

    setFiles(nextFiles);

    setPreviews(
      nextFiles.map(
        (file) =>
          URL.createObjectURL(
            file,
          ),
      ),
    );
  }

  function validateForm() {
    if (
      form.name.trim().length <
      2
    ) {
      return 'Enter a product name.';
    }

    if (
      !form.slug.trim()
    ) {
      return 'Product slug is required.';
    }

    if (
      !form.sku.trim()
    ) {
      return 'SKU is required.';
    }

    const price =
      Number(form.price);

    if (
      !Number.isFinite(price) ||
      price < 0
    ) {
      return 'Enter a valid product price.';
    }

    const compareAtPrice =
      form.compareAtPrice
        ? Number(
            form.compareAtPrice,
          )
        : 0;

    if (
      !Number.isFinite(
        compareAtPrice,
      ) ||
      compareAtPrice < 0
    ) {
      return 'Enter a valid compare-at price.';
    }

    if (!form.category) {
      return 'Select a product category.';
    }

    const stock =
      Number(form.stock);

    if (
      !Number.isInteger(
        stock,
      ) ||
      stock < 0
    ) {
      return 'Stock must be zero or a positive whole number.';
    }

    if (
      splitValues(
        form.sizes,
      ).length === 0
    ) {
      return 'Add at least one size.';
    }

    if (
      splitValues(
        form.colors,
      ).length === 0
    ) {
      return 'Add at least one colour.';
    }

    if (
      files.length === 0
    ) {
      return 'Upload at least one product image.';
    }

    return '';
  }

  async function handleSubmit(
    event,
  ) {
    event.preventDefault();

    const validationError =
      validateForm();

    if (validationError) {
      setError(
        validationError,
      );

      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccessMessage('');

      /*
       * Upload the images first.
       */
      const uploadResponse =
        await uploadAdminImages(
          files,
        );

      const uploadedImages =
        getUploadedFileUrls(
          uploadResponse,
        );

      if (
        uploadedImages.length ===
        0
      ) {
        throw new Error(
          'Images were uploaded, but no image URLs were returned.',
        );
      }

      const payload = {
        name:
          form.name.trim(),

        slug:
          form.slug
            .trim()
            .toLowerCase(),

        description:
          form.description.trim(),

        sku:
          form.sku
            .trim()
            .toUpperCase(),

        price:
          Number(form.price),

        compareAtPrice:
          form.compareAtPrice
            ? Number(
                form.compareAtPrice,
              )
            : 0,

        category:
          form.category,

        images:
          uploadedImages,

        sizes:
          splitValues(
            form.sizes,
          ),

        colors:
          splitValues(
            form.colors,
          ),

        stock:
          Number(form.stock),

        featured:
          form.featured,

        isActive:
          form.isActive,
      };

      const response =
        await createProduct(
          payload,
        );

      const product =
        response?.product ||
        response?.data?.product ||
        response;

      setSuccessMessage(
        'Product created successfully.',
      );

      window.setTimeout(() => {
        const productId =
          product?._id ||
          product?.id;

        if (productId) {
          router.replace(
            `/admin/products/${productId}`,
          );
        } else {
          router.replace(
            '/admin/products',
          );
        }
      }, 900);
    } catch (saveError) {
      console.error(
        'Unable to create product:',
        saveError,
      );

      setError(
        saveError?.message ||
          'We could not create this product.',
      );
    } finally {
      setSaving(false);
    }
  }

  const sizes =
    useMemo(
      () =>
        splitValues(
          form.sizes,
        ),
      [form.sizes],
    );

  const colors =
    useMemo(
      () =>
        splitValues(
          form.colors,
        ),
      [form.colors],
    );

  return (
    <div className={styles.page}>
      {successMessage && (
        <div
          className={
            styles.toast
          }
          role="status"
        >
          <CheckIcon />

          {successMessage}
        </div>
      )}

      <section
        className={
          styles.header
        }
      >
        <div>
          <Link
            href="/admin/products"
            className={
              styles.backLink
            }
          >
            <BackIcon />
            Products
          </Link>

          <span
            className={
              styles.eyebrow
            }
          >
            Catalogue
          </span>

          <h1>
            Add product
          </h1>

          <p>
            Create a new DESIRE
            product, upload imagery
            and configure its pricing,
            stock and variants.
          </p>
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

      <form
        onSubmit={
          handleSubmit
        }
        className={
          styles.layout
        }
      >
        <div
          className={
            styles.mainColumn
          }
        >
          <section
            className={
              styles.panel
            }
          >
            <div
              className={
                styles.panelHeader
              }
            >
              <span
                className={
                  styles.eyebrow
                }
              >
                Product
              </span>

              <h2>
                Basic information
              </h2>
            </div>

            <div
              className={
                styles.formGrid
              }
            >
              <label
                className={
                  styles.fullWidth
                }
              >
                <span>
                  Product name
                </span>

                <input
                  type="text"
                  value={
                    form.name
                  }
                  onChange={(event) =>
                    handleNameChange(
                      event.target.value,
                    )
                  }
                  placeholder="DESIRE Signature Jacket"
                  required
                />
              </label>

              <label>
                <span>
                  Slug
                </span>

                <input
                  type="text"
                  value={
                    form.slug
                  }
                  onChange={(event) =>
                    updateField(
                      'slug',
                      createSlug(
                        event.target.value,
                      ),
                    )
                  }
                  placeholder="desire-signature-jacket"
                  required
                />
              </label>

              <label>
                <span>
                  SKU
                </span>

                <input
                  type="text"
                  value={
                    form.sku
                  }
                  onChange={(event) =>
                    updateField(
                      'sku',
                      event.target.value,
                    )
                  }
                  placeholder="DES-JKT-001"
                  required
                />
              </label>

              <label
                className={
                  styles.fullWidth
                }
              >
                <span>
                  Description
                </span>

                <textarea
                  value={
                    form.description
                  }
                  onChange={(event) =>
                    updateField(
                      'description',
                      event.target.value,
                    )
                  }
                  rows={7}
                  placeholder="Describe the product..."
                />
              </label>
            </div>
          </section>

          <section
            className={
              styles.panel
            }
          >
            <div
              className={
                styles.panelHeader
              }
            >
              <span
                className={
                  styles.eyebrow
                }
              >
                Media
              </span>

              <h2>
                Product images
              </h2>

              <p>
                Upload up to 10 JPG,
                PNG or WEBP images.
                The first image will
                be used as the primary
                catalogue image.
              </p>
            </div>

            <label
              className={
                styles.uploadArea
              }
            >
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={
                  handleImages
                }
              />

              <UploadIcon />

              <strong>
                Select product images
              </strong>

              <span>
                Up to 10 images,
                maximum 5 MB each
              </span>
            </label>

            {previews.length >
              0 && (
              <div
                className={
                  styles.imageGrid
                }
              >
                {previews.map(
                  (
                    preview,
                    index,
                  ) => (
                    <div
                      key={`${preview}-${index}`}
                      className={
                        styles.imagePreview
                      }
                    >
                      <img
                        src={
                          preview
                        }
                        alt={`Product preview ${
                          index + 1
                        }`}
                      />

                      {index ===
                        0 && (
                        <span
                          className={
                            styles.primaryBadge
                          }
                        >
                          Primary
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          removeImage(
                            index,
                          )
                        }
                        aria-label={`Remove image ${
                          index + 1
                        }`}
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  ),
                )}
              </div>
            )}
          </section>

          <section
            className={
              styles.panel
            }
          >
            <div
              className={
                styles.panelHeader
              }
            >
              <span
                className={
                  styles.eyebrow
                }
              >
                Variants
              </span>

              <h2>
                Size and colour
              </h2>
            </div>

            <div
              className={
                styles.formGrid
              }
            >
              <label>
                <span>
                  Sizes
                </span>

                <input
                  type="text"
                  value={
                    form.sizes
                  }
                  onChange={(event) =>
                    updateField(
                      'sizes',
                      event.target.value,
                    )
                  }
                  placeholder="S, M, L, XL"
                  required
                />

                <small>
                  Separate sizes with
                  commas.
                </small>
              </label>

              <label>
                <span>
                  Colours
                </span>

                <input
                  type="text"
                  value={
                    form.colors
                  }
                  onChange={(event) =>
                    updateField(
                      'colors',
                      event.target.value,
                    )
                  }
                  placeholder="Black, White, Cream"
                  required
                />

                <small>
                  Separate colours with
                  commas.
                </small>
              </label>
            </div>

            {(sizes.length > 0 ||
              colors.length >
                0) && (
              <div
                className={
                  styles.variantPreview
                }
              >
                {sizes.length >
                  0 && (
                  <div>
                    <span>
                      Sizes
                    </span>

                    <div>
                      {sizes.map(
                        (size) => (
                          <strong
                            key={
                              size
                            }
                          >
                            {
                              size
                            }
                          </strong>
                        ),
                      )}
                    </div>
                  </div>
                )}

                {colors.length >
                  0 && (
                  <div>
                    <span>
                      Colours
                    </span>

                    <div>
                      {colors.map(
                        (color) => (
                          <strong
                            key={
                              color
                            }
                          >
                            {
                              color
                            }
                          </strong>
                        ),
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>

        <aside
          className={
            styles.sideColumn
          }
        >
          <section
            className={
              styles.sidePanel
            }
          >
            <span
              className={
                styles.eyebrow
              }
            >
              Organisation
            </span>

            <h3>
              Category
            </h3>

            <label>
              <span>
                Product category
              </span>

              <select
                value={
                  form.category
                }
                onChange={(event) =>
                  updateField(
                    'category',
                    event.target.value,
                  )
                }
                disabled={
                  loadingCategories
                }
                required
              >
                <option value="">
                  {loadingCategories
                    ? 'Loading categories...'
                    : 'Select category'}
                </option>

                {categories.map(
                  (category) => (
                    <option
                      key={
                        category._id ||
                        category.id
                      }
                      value={
                        category._id ||
                        category.id
                      }
                    >
                      {
                        category.name
                      }
                    </option>
                  ),
                )}
              </select>
            </label>
          </section>

          <section
            className={
              styles.sidePanel
            }
          >
            <span
              className={
                styles.eyebrow
              }
            >
              Pricing
            </span>

            <h3>
              Product price
            </h3>

            <div
              className={
                styles.sideFields
              }
            >
              <label>
                <span>
                  Price
                </span>

                <div
                  className={
                    styles.moneyInput
                  }
                >
                  <strong>
                    ₦
                  </strong>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      form.price
                    }
                    onChange={(event) =>
                      updateField(
                        'price',
                        event.target.value,
                      )
                    }
                    required
                  />
                </div>
              </label>

              <label>
                <span>
                  Compare-at price
                </span>

                <div
                  className={
                    styles.moneyInput
                  }
                >
                  <strong>
                    ₦
                  </strong>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      form.compareAtPrice
                    }
                    onChange={(event) =>
                      updateField(
                        'compareAtPrice',
                        event.target.value,
                      )
                    }
                    placeholder="0"
                  />
                </div>
              </label>
            </div>
          </section>

          <section
            className={
              styles.sidePanel
            }
          >
            <span
              className={
                styles.eyebrow
              }
            >
              Inventory
            </span>

            <h3>
              Stock
            </h3>

            <label>
              <span>
                Quantity available
              </span>

              <input
                type="number"
                min="0"
                step="1"
                value={
                  form.stock
                }
                onChange={(event) =>
                  updateField(
                    'stock',
                    event.target.value,
                  )
                }
                required
              />
            </label>
          </section>

          <section
            className={
              styles.sidePanel
            }
          >
            <span
              className={
                styles.eyebrow
              }
            >
              Visibility
            </span>

            <h3>
              Catalogue status
            </h3>

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
                  Allow customers
                  to view and buy
                  this product.
                </span>
              </div>

              <input
                type="checkbox"
                checked={
                  form.isActive
                }
                onChange={(event) =>
                  updateField(
                    'isActive',
                    event.target.checked,
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
                  Include this product
                  in featured product
                  sections.
                </span>
              </div>

              <input
                type="checkbox"
                checked={
                  form.featured
                }
                onChange={(event) =>
                  updateField(
                    'featured',
                    event.target.checked,
                  )
                }
              />

              <span
                className={
                  styles.switch
                }
              />
            </label>
          </section>

          <section
            className={
              styles.publishPanel
            }
          >
            <span>
              Ready to publish?
            </span>

            <p>
              Images are uploaded
              first, then the product
              is created in the DESIRE
              catalogue.
            </p>

            <button
              type="submit"
              disabled={saving}
            >
              <span>
                {saving
                  ? 'Creating product...'
                  : 'Create product'}
              </span>

              <ArrowIcon />
            </button>
          </section>
        </aside>
      </form>
    </div>
  );
}