'use client';

import Link from 'next/link';

import {
  use,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  useRouter,
} from 'next/navigation';

import {
  addProductImages,
  deleteProduct,
  getAdminProduct,
  removeProductImage,
  updateProduct,
} from '@/services/products.service';

import {
  getAdminCategories,
} from '@/services/categories.service';

import {
  getUploadedFileUrls,
  uploadAdminImages,
} from '@/services/uploads.service';

import styles from './edit-product.module.css';

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

function normalizeProduct(response) {
  return (
    response?.product ||
    response?.data?.product ||
    response?.data ||
    response ||
    null
  );
}

function splitValues(value) {
  return String(value || '')
    .split(',')
    .map((item) =>
      item.trim(),
    )
    .filter(Boolean);
}

function getCategoryId(category) {
  if (
    category &&
    typeof category === 'object'
  ) {
    return (
      category._id ||
      category.id ||
      ''
    );
  }

  return category || '';
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M19 12H5" />
      <path d="m10 7-5 5 5 5" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 16V4" />
      <path d="m7 9 5-5 5 5" />
      <path d="M4 16v4h16v-4" />
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

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h14" />
      <path d="m14 7 5 5-5 5" />
    </svg>
  );
}

function ProductSkeleton() {
  return (
    <div className={styles.skeleton}>
      <span />
      <span />
      <span />
      <span />
    </div>
  );
}

export default function EditProductPage({
  params,
}) {
  const resolvedParams =
    use(params);

  const productId =
    resolvedParams?.id;

  const router =
    useRouter();

  const [product, setProduct] =
    useState(null);

  const [categories, setCategories] =
    useState([]);

  const [form, setForm] =
    useState({
      name: '',
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
    });

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState('');

  const [
    successMessage,
    setSuccessMessage,
  ] = useState('');

  const [
    selectedFiles,
    setSelectedFiles,
  ] = useState([]);

  const [
    previews,
    setPreviews,
  ] = useState([]);

  const [
    uploadingImages,
    setUploadingImages,
  ] = useState(false);

  const [
    removingImage,
    setRemovingImage,
  ] = useState('');

  const [deleting, setDeleting] =
    useState(false);

  useEffect(() => {
    let active = true;

    async function loadPage() {
      try {
        setLoading(true);
        setError('');

        const [
          productResponse,
          categoryResponse,
        ] = await Promise.all([
          getAdminProduct(
            productId,
          ),

          getAdminCategories(),
        ]);

        if (!active) {
          return;
        }

        const loadedProduct =
          normalizeProduct(
            productResponse,
          );

        if (!loadedProduct) {
          throw new Error(
            'Product could not be loaded.',
          );
        }

        setProduct(
          loadedProduct,
        );

        setCategories(
          normalizeCategories(
            categoryResponse,
          ),
        );

        setForm({
          name:
            loadedProduct.name ||
            '',

          description:
            loadedProduct.description ||
            '',

          sku:
            loadedProduct.sku ||
            '',

          price:
            loadedProduct.price ??
            '',

          compareAtPrice:
            loadedProduct
              .compareAtPrice ??
            '',

          category:
            getCategoryId(
              loadedProduct.category,
            ),

          stock:
            loadedProduct.stock ??
            0,

          sizes:
            (
              loadedProduct.sizes ||
              []
            ).join(', '),

          colors:
            (
              loadedProduct.colors ||
              []
            ).join(', '),

          featured:
            Boolean(
              loadedProduct.featured,
            ),

          isActive:
            Boolean(
              loadedProduct.isActive,
            ),
        });
      } catch (loadError) {
        console.error(
          'Unable to load product:',
          loadError,
        );

        setError(
          loadError?.message ||
            'We could not load this product.',
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    if (productId) {
      loadPage();
    }

    return () => {
      active = false;
    };
  }, [productId]);

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
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setError('');
  }

  function showSuccess(message) {
    setSuccessMessage(
      message,
    );

    window.setTimeout(() => {
      setSuccessMessage('');
    }, 3000);
  }

  function validateForm() {
    if (
      form.name.trim().length <
      2
    ) {
      return 'Enter a product name.';
    }

    if (!form.sku.trim()) {
      return 'SKU is required.';
    }

    if (!form.category) {
      return 'Select a category.';
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
      form.compareAtPrice === ''
        ? 0
        : Number(
            form.compareAtPrice,
          );

    if (
      !Number.isFinite(
        compareAtPrice,
      ) ||
      compareAtPrice < 0
    ) {
      return 'Enter a valid compare-at price.';
    }

    if (
      compareAtPrice > 0 &&
      compareAtPrice < price
    ) {
      return 'Compare-at price cannot be lower than the selling price.';
    }

    const stock =
      Number(form.stock);

    if (
      !Number.isInteger(stock) ||
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

    return '';
  }

  async function handleSave(
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

      const response =
        await updateProduct(
          productId,
          {
            name:
              form.name.trim(),

            description:
              form.description.trim(),

            sku:
              form.sku
                .trim()
                .toUpperCase(),

            price:
              Number(form.price),

            compareAtPrice:
              form.compareAtPrice ===
              ''
                ? 0
                : Number(
                    form.compareAtPrice,
                  ),

            category:
              form.category,

            stock:
              Number(form.stock),

            sizes:
              splitValues(
                form.sizes,
              ),

            colors:
              splitValues(
                form.colors,
              ),

            featured:
              form.featured,

            isActive:
              form.isActive,
          },
        );

      const updated =
        normalizeProduct(
          response,
        );

      if (updated) {
        setProduct(
          updated,
        );
      }

      showSuccess(
        'Product updated successfully.',
      );
    } catch (saveError) {
      console.error(
        'Unable to update product:',
        saveError,
      );

      setError(
        saveError?.message ||
          'We could not update this product.',
      );
    } finally {
      setSaving(false);
    }
  }

  function handleFileSelection(
    event,
  ) {
    const incoming =
      Array.from(
        event.target.files ||
          [],
      );

    if (
      incoming.length === 0
    ) {
      return;
    }

    const currentCount =
      product?.images?.length ||
      0;

    if (
      currentCount +
        incoming.length >
      10
    ) {
      setError(
        `This product can have a maximum of 10 images. It currently has ${currentCount}.`,
      );

      event.target.value = '';

      return;
    }

    const allowed = [
      'image/jpeg',
      'image/png',
      'image/webp',
    ];

    const invalid =
      incoming.find(
        (file) =>
          !allowed.includes(
            file.type,
          ),
      );

    if (invalid) {
      setError(
        'Images must be JPG, PNG or WEBP.',
      );

      event.target.value = '';

      return;
    }

    const oversized =
      incoming.find(
        (file) =>
          file.size >
          5 * 1024 * 1024,
      );

    if (oversized) {
      setError(
        'Each image must not exceed 5 MB.',
      );

      event.target.value = '';

      return;
    }

    previews.forEach(
      (preview) =>
        URL.revokeObjectURL(
          preview,
        ),
    );

    setSelectedFiles(
      incoming,
    );

    setPreviews(
      incoming.map(
        (file) =>
          URL.createObjectURL(
            file,
          ),
      ),
    );

    event.target.value = '';
  }

  async function handleAddImages() {
    if (
      selectedFiles.length ===
      0
    ) {
      return;
    }

    try {
      setUploadingImages(
        true,
      );

      setError('');

      const uploadResponse =
        await uploadAdminImages(
          selectedFiles,
        );

      const imageUrls =
        getUploadedFileUrls(
          uploadResponse,
        );

      if (
        imageUrls.length ===
        0
      ) {
        throw new Error(
          'No image URLs were returned after upload.',
        );
      }

      const response =
        await addProductImages(
          productId,
          imageUrls,
        );

      const updated =
        normalizeProduct(
          response,
        );

      if (updated) {
        setProduct(
          updated,
        );
      } else {
        setProduct(
          (current) => ({
            ...current,
            images: [
              ...(current
                ?.images ||
                []),
              ...imageUrls,
            ],
          }),
        );
      }

      previews.forEach(
        (preview) =>
          URL.revokeObjectURL(
            preview,
          ),
      );

      setSelectedFiles([]);
      setPreviews([]);

      showSuccess(
        'Product images added.',
      );
    } catch (uploadError) {
      console.error(
        'Unable to add product images:',
        uploadError,
      );

      setError(
        uploadError?.message ||
          'We could not add these images.',
      );
    } finally {
      setUploadingImages(
        false,
      );
    }
  }

  async function handleRemoveImage(
    image,
  ) {
    if (!image) {
      return;
    }

    const confirmed =
      window.confirm(
        'Remove this product image?',
      );

    if (!confirmed) {
      return;
    }

    try {
      setRemovingImage(
        image,
      );

      setError('');

      const response =
        await removeProductImage(
          productId,
          image,
        );

      const updated =
        normalizeProduct(
          response,
        );

      if (updated) {
        setProduct(
          updated,
        );
      } else {
        setProduct(
          (current) => ({
            ...current,

            images:
              (
                current?.images ||
                []
              ).filter(
                (item) =>
                  item !== image,
              ),
          }),
        );
      }

      showSuccess(
        'Product image removed.',
      );
    } catch (removeError) {
      console.error(
        'Unable to remove product image:',
        removeError,
      );

      setError(
        removeError?.message ||
          'We could not remove this image.',
      );
    } finally {
      setRemovingImage('');
    }
  }

  async function handleDeleteProduct() {
    const confirmed =
      window.confirm(
        `Delete "${product?.name}" permanently?`,
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeleting(true);
      setError('');

      await deleteProduct(
        productId,
      );

      router.replace(
        '/admin/products',
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
      setDeleting(false);
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

  if (loading) {
    return (
      <ProductSkeleton />
    );
  }

  return (
    <div className={styles.page}>
      {successMessage && (
        <div
          className={styles.toast}
          role="status"
        >
          <CheckIcon />

          {successMessage}
        </div>
      )}

      <section className={styles.header}>
        <div>
          <Link
            href="/admin/products"
            className={styles.backLink}
          >
            <BackIcon />
            Products
          </Link>

          <span className={styles.eyebrow}>
            Product management
          </span>

          <h1>
            {product?.name ||
              'Edit product'}
          </h1>

          <p>
            Update product information,
            imagery, pricing, inventory
            and catalogue visibility.
          </p>
        </div>

        <span
          className={`${styles.productStatus} ${
            form.isActive
              ? styles.active
              : styles.inactive
          }`}
        >
          {form.isActive
            ? 'Active'
            : 'Inactive'}
        </span>
      </section>

      {error && (
        <div
          className={styles.errorBanner}
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
        className={styles.layout}
        onSubmit={handleSave}
      >
        <div className={styles.mainColumn}>
          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <span className={styles.eyebrow}>
                Product
              </span>

              <h2>
                Basic information
              </h2>
            </div>

            <div className={styles.formGrid}>
              <label className={styles.fullWidth}>
                <span>
                  Product name
                </span>

                <input
                  type="text"
                  value={form.name}
                  onChange={(event) =>
                    updateField(
                      'name',
                      event.target.value,
                    )
                  }
                  required
                />
              </label>

              <label>
                <span>SKU</span>

                <input
                  type="text"
                  value={form.sku}
                  onChange={(event) =>
                    updateField(
                      'sku',
                      event.target.value,
                    )
                  }
                  required
                />
              </label>

              <label>
                <span>
                  Current slug
                </span>

                <input
                  type="text"
                  value={
                    product?.slug ||
                    ''
                  }
                  readOnly
                  className={
                    styles.readOnly
                  }
                />

                <small>
                  Slug updates automatically
                  when the product name changes.
                </small>
              </label>

              <label className={styles.fullWidth}>
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
                />
              </label>
            </div>
          </section>

          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <span className={styles.eyebrow}>
                Media
              </span>

              <h2>
                Product images
              </h2>

              <p>
                Existing images can be
                removed individually.
                Add new images without
                replacing the others.
              </p>
            </div>

            {product?.images?.length >
            0 ? (
              <div
                className={
                  styles.existingImages
                }
              >
                {product.images.map(
                  (image, index) => (
                    <div
                      key={image}
                      className={
                        styles.imageCard
                      }
                    >
                      <img
                        src={image}
                        alt={`${product.name} ${
                          index + 1
                        }`}
                      />

                      {index === 0 && (
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
                        disabled={
                          removingImage ===
                          image
                        }
                        onClick={() =>
                          handleRemoveImage(
                            image,
                          )
                        }
                      >
                        <TrashIcon />

                        {removingImage ===
                        image
                          ? 'Removing...'
                          : 'Remove'}
                      </button>
                    </div>
                  ),
                )}
              </div>
            ) : (
              <div
                className={
                  styles.noImages
                }
              >
                No product images.
              </div>
            )}

            <label
              className={
                styles.uploadArea
              }
            >
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                onChange={
                  handleFileSelection
                }
              />

              <UploadIcon />

              <strong>
                Add more images
              </strong>

              <span>
                Maximum 10 images total
              </span>
            </label>

            {previews.length > 0 && (
              <>
                <div
                  className={
                    styles.previewGrid
                  }
                >
                  {previews.map(
                    (
                      preview,
                      index,
                    ) => (
                      <img
                        key={
                          preview
                        }
                        src={
                          preview
                        }
                        alt={`New image ${
                          index + 1
                        }`}
                      />
                    ),
                  )}
                </div>

                <button
                  type="button"
                  className={
                    styles.uploadButton
                  }
                  disabled={
                    uploadingImages
                  }
                  onClick={
                    handleAddImages
                  }
                >
                  <span>
                    {uploadingImages
                      ? 'Uploading images...'
                      : `Add ${selectedFiles.length} image${
                          selectedFiles.length ===
                          1
                            ? ''
                            : 's'
                        }`}
                  </span>

                  <ArrowIcon />
                </button>
              </>
            )}
          </section>

          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <span className={styles.eyebrow}>
                Variants
              </span>

              <h2>
                Size and colour
              </h2>
            </div>

            <div className={styles.formGrid}>
              <label>
                <span>Sizes</span>

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
                />

                <small>
                  Separate values with commas.
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
                />

                <small>
                  Separate values with commas.
                </small>
              </label>
            </div>

            <div
              className={
                styles.variantPreview
              }
            >
              <div>
                <span>
                  Sizes
                </span>

                <div>
                  {sizes.map(
                    (size) => (
                      <strong
                        key={size}
                      >
                        {size}
                      </strong>
                    ),
                  )}
                </div>
              </div>

              <div>
                <span>
                  Colours
                </span>

                <div>
                  {colors.map(
                    (color) => (
                      <strong
                        key={color}
                      >
                        {color}
                      </strong>
                    ),
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>

        <aside className={styles.sideColumn}>
          <section className={styles.sidePanel}>
            <span className={styles.eyebrow}>
              Organisation
            </span>

            <h3>Category</h3>

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
                required
              >
                <option value="">
                  Select category
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

          <section className={styles.sidePanel}>
            <span className={styles.eyebrow}>
              Pricing
            </span>

            <h3>Product price</h3>

            <label>
              <span>Price</span>

              <div className={styles.moneyInput}>
                <strong>₦</strong>

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

              <div className={styles.moneyInput}>
                <strong>₦</strong>

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
                />
              </div>
            </label>
          </section>

          <section className={styles.sidePanel}>
            <span className={styles.eyebrow}>
              Inventory
            </span>

            <h3>Stock</h3>

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

            <div
              className={`${styles.stockNotice} ${
                Number(
                  form.stock,
                ) === 0
                  ? styles.stockDanger
                  : Number(
                        form.stock,
                      ) <= 5
                    ? styles.stockWarning
                    : styles.stockGood
              }`}
            >
              {Number(
                form.stock,
              ) === 0
                ? 'Out of stock'
                : Number(
                      form.stock,
                    ) <= 5
                  ? 'Low stock'
                  : 'Stock level healthy'}
            </div>
          </section>

          <section className={styles.sidePanel}>
            <span className={styles.eyebrow}>
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
                  Customers can view
                  and purchase this
                  product.
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
                  Display in featured
                  product areas.
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

          <section className={styles.savePanel}>
            <span>
              Save changes
            </span>

            <p>
              Product information and
              catalogue status will be
              updated immediately.
            </p>

            <button
              type="submit"
              disabled={saving}
            >
              <span>
                {saving
                  ? 'Saving changes...'
                  : 'Save product'}
              </span>

              <ArrowIcon />
            </button>
          </section>

          <section className={styles.dangerPanel}>
            <span>
              Danger zone
            </span>

            <p>
              Permanently delete this
              product from DESIRE.
            </p>

            <button
              type="button"
              disabled={deleting}
              onClick={
                handleDeleteProduct
              }
            >
              <TrashIcon />

              {deleting
                ? 'Deleting...'
                : 'Delete product'}
            </button>
          </section>
        </aside>
      </form>
    </div>
  );
}