'use client';

import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  createAddress,
  deleteAddress,
  getAddresses,
  setDefaultAddress,
  updateAddress,
} from '@/services/addresses.service';

import styles from './addresses.module.css';

const EMPTY_FORM = {
  fullName: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  country: 'Nigeria',
  postalCode: '',
  isDefault: false,
};

function getAddressId(address) {
  return (
    address?._id ||
    address?.id ||
    ''
  );
}

function normalizeAddresses(response) {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.addresses)) {
    return response.addresses;
  }

  if (
    Array.isArray(
      response?.data?.addresses,
    )
  ) {
    return response.data.addresses;
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

function LocationIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M19 10c0 5-7 10-7 10S5 15 5 10a7 7 0 1 1 14 0Z" />
      <circle cx="12" cy="10" r="2.2" />
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
      <path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13" />
      <path d="M10 11v5M14 11v5" />
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

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

function AddressSkeleton() {
  return (
    <div className={styles.skeletonGrid}>
      {[1, 2, 3].map((item) => (
        <article
          key={item}
          className={styles.skeletonCard}
        >
          <span />
          <span />
          <span />
          <span />
        </article>
      ))}
    </div>
  );
}

export default function AddressesPage() {
  const [addresses, setAddresses] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const [successMessage, setSuccessMessage] =
    useState('');

  const [showForm, setShowForm] =
    useState(false);

  const [form, setForm] =
    useState(EMPTY_FORM);

  const [editingId, setEditingId] =
    useState('');

  const [saving, setSaving] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState('');

  const [defaultingId, setDefaultingId] =
    useState('');

  const loadAddresses =
    useCallback(async () => {
      try {
        setLoading(true);
        setError('');

        const response =
          await getAddresses();

        setAddresses(
          normalizeAddresses(response),
        );
      } catch (loadError) {
        console.error(
          'Unable to load addresses:',
          loadError,
        );

        setError(
          loadError?.message ||
            'We could not load your saved addresses.',
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  function showSuccess(message) {
    setSuccessMessage(message);

    window.setTimeout(() => {
      setSuccessMessage('');
    }, 3500);
  }

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

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId('');
    setShowForm(false);
  }

  function openCreateForm() {
    setEditingId('');
    setForm(EMPTY_FORM);
    setShowForm(true);
    setError('');
  }

  function openEditForm(address) {
    setEditingId(
      getAddressId(address),
    );

    setForm({
      fullName:
        address?.fullName || '',

      phone:
        address?.phone || '',

      addressLine1:
        address?.addressLine1 || '',

      addressLine2:
        address?.addressLine2 || '',

      city:
        address?.city || '',

      state:
        address?.state || '',

      country:
        address?.country ||
        'Nigeria',

      postalCode:
        address?.postalCode || '',

      isDefault:
        Boolean(
          address?.isDefault,
        ),
    });

    setShowForm(true);
    setError('');

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  function validateForm() {
    if (
      form.fullName.trim().length < 2
    ) {
      return 'Enter the recipient’s full name.';
    }

    if (
      form.phone.trim().length < 7
    ) {
      return 'Enter a valid phone number.';
    }

    if (
      form.addressLine1.trim()
        .length < 3
    ) {
      return 'Enter a valid street address.';
    }

    if (
      form.city.trim().length < 2
    ) {
      return 'Enter your city.';
    }

    if (
      form.state.trim().length < 2
    ) {
      return 'Enter your state.';
    }

    if (
      form.country.trim().length < 2
    ) {
      return 'Enter your country.';
    }

    return '';
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const validationError =
      validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    const payload = {
      fullName:
        form.fullName.trim(),

      phone:
        form.phone.trim(),

      addressLine1:
        form.addressLine1.trim(),

      addressLine2:
        form.addressLine2.trim() ||
        undefined,

      city:
        form.city.trim(),

      state:
        form.state.trim(),

      country:
        form.country.trim(),

      postalCode:
        form.postalCode.trim() ||
        undefined,

      isDefault:
        form.isDefault,
    };

    try {
      setSaving(true);
      setError('');

      if (editingId) {
        const response =
          await updateAddress(
            editingId,
            payload,
          );

        const updatedAddress =
          response?.address ||
          response?.data?.address;

        if (updatedAddress) {
          setAddresses(
            (current) =>
              current.map(
                (address) => {
                  if (
                    getAddressId(
                      address,
                    ) ===
                    editingId
                  ) {
                    return updatedAddress;
                  }

                  if (
                    updatedAddress
                      ?.isDefault
                  ) {
                    return {
                      ...address,
                      isDefault: false,
                    };
                  }

                  return address;
                },
              ),
          );
        } else {
          await loadAddresses();
        }

        showSuccess(
          'Address updated successfully.',
        );
      } else {
        const response =
          await createAddress(
            payload,
          );

        const createdAddress =
          response?.address ||
          response?.data?.address;

        if (createdAddress) {
          setAddresses(
            (current) => {
              const normalized =
                createdAddress
                  ?.isDefault
                  ? current.map(
                      (address) => ({
                        ...address,
                        isDefault:
                          false,
                      }),
                    )
                  : current;

              return [
                createdAddress,
                ...normalized,
              ];
            },
          );
        } else {
          await loadAddresses();
        }

        showSuccess(
          'Address added successfully.',
        );
      }

      resetForm();
    } catch (saveError) {
      console.error(
        'Unable to save address:',
        saveError,
      );

      setError(
        saveError?.message ||
          'We could not save this address.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleSetDefault(
    addressId,
  ) {
    if (!addressId) {
      return;
    }

    try {
      setDefaultingId(addressId);
      setError('');

      await setDefaultAddress(
        addressId,
      );

      setAddresses(
        (current) =>
          current.map(
            (address) => ({
              ...address,

              isDefault:
                getAddressId(
                  address,
                ) ===
                addressId,
            }),
          ),
      );

      showSuccess(
        'Default address updated.',
      );
    } catch (defaultError) {
      console.error(
        'Unable to set default address:',
        defaultError,
      );

      setError(
        defaultError?.message ||
          'We could not update your default address.',
      );
    } finally {
      setDefaultingId('');
    }
  }

  async function handleDelete(
    addressId,
  ) {
    if (!addressId) {
      return;
    }

    const confirmed =
      window.confirm(
        'Delete this address?',
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(addressId);
      setError('');

      await deleteAddress(
        addressId,
      );

      setAddresses(
        (current) =>
          current.filter(
            (address) =>
              getAddressId(
                address,
              ) !==
              addressId,
          ),
      );

      if (
        editingId ===
        addressId
      ) {
        resetForm();
      }

      showSuccess(
        'Address deleted.',
      );
    } catch (deleteError) {
      console.error(
        'Unable to delete address:',
        deleteError,
      );

      setError(
        deleteError?.message ||
          'We could not delete this address.',
      );
    } finally {
      setDeletingId('');
    }
  }

  return (
    <main className={styles.page}>
      {successMessage && (
        <div
          className={styles.toast}
          role="status"
        >
          <CheckIcon />

          {successMessage}
        </div>
      )}

      <section className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>
            My account
          </span>

          <h1>Address book</h1>

          <p>
            Manage your saved delivery
            addresses and choose which one
            DESIRE should use by default.
          </p>
        </div>

        <button
          type="button"
          className={styles.addButton}
          onClick={
            showForm
              ? resetForm
              : openCreateForm
          }
        >
          {showForm ? (
            <>
              Close
              <CloseIcon />
            </>
          ) : (
            <>
              Add new address
              <PlusIcon />
            </>
          )}
        </button>
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

      {showForm && (
        <section className={styles.formPanel}>
          <div className={styles.formHeader}>
            <span className={styles.eyebrow}>
              {editingId
                ? 'Edit address'
                : 'New address'}
            </span>

            <h2>
              {editingId
                ? 'Update delivery details'
                : 'Add delivery details'}
            </h2>
          </div>

          <form
            onSubmit={handleSubmit}
          >
            <div className={styles.formGrid}>
              <label>
                <span>Full name</span>

                <input
                  type="text"
                  value={
                    form.fullName
                  }
                  onChange={(event) =>
                    updateField(
                      'fullName',
                      event.target.value,
                    )
                  }
                  placeholder="Recipient’s full name"
                  required
                />
              </label>

              <label>
                <span>
                  Phone number
                </span>

                <input
                  type="tel"
                  value={form.phone}
                  onChange={(event) =>
                    updateField(
                      'phone',
                      event.target.value,
                    )
                  }
                  placeholder="+234 800 000 0000"
                  required
                />
              </label>

              <label
                className={
                  styles.fullWidth
                }
              >
                <span>
                  Address line 1
                </span>

                <input
                  type="text"
                  value={
                    form.addressLine1
                  }
                  onChange={(event) =>
                    updateField(
                      'addressLine1',
                      event.target.value,
                    )
                  }
                  placeholder="Street address"
                  required
                />
              </label>

              <label
                className={
                  styles.fullWidth
                }
              >
                <span>
                  Address line 2
                </span>

                <input
                  type="text"
                  value={
                    form.addressLine2
                  }
                  onChange={(event) =>
                    updateField(
                      'addressLine2',
                      event.target.value,
                    )
                  }
                  placeholder="Apartment, suite or landmark (optional)"
                />
              </label>

              <label>
                <span>City</span>

                <input
                  type="text"
                  value={form.city}
                  onChange={(event) =>
                    updateField(
                      'city',
                      event.target.value,
                    )
                  }
                  required
                />
              </label>

              <label>
                <span>State</span>

                <input
                  type="text"
                  value={form.state}
                  onChange={(event) =>
                    updateField(
                      'state',
                      event.target.value,
                    )
                  }
                  required
                />
              </label>

              <label>
                <span>Country</span>

                <input
                  type="text"
                  value={form.country}
                  onChange={(event) =>
                    updateField(
                      'country',
                      event.target.value,
                    )
                  }
                  required
                />
              </label>

              <label>
                <span>
                  Postal code
                </span>

                <input
                  type="text"
                  value={
                    form.postalCode
                  }
                  onChange={(event) =>
                    updateField(
                      'postalCode',
                      event.target.value,
                    )
                  }
                  placeholder="Optional"
                />
              </label>
            </div>

            <label
              className={
                styles.defaultCheckbox
              }
            >
              <input
                type="checkbox"
                checked={
                  form.isDefault
                }
                onChange={(event) =>
                  updateField(
                    'isDefault',
                    event.target.checked,
                  )
                }
              />

              <span />

              Make this my default
              delivery address
            </label>

            <div className={styles.formActions}>
              <button
                type="submit"
                disabled={saving}
                className={
                  styles.saveButton
                }
              >
                {saving
                  ? 'Saving...'
                  : editingId
                    ? 'Save changes'
                    : 'Save address'}
              </button>

              <button
                type="button"
                onClick={resetForm}
                className={
                  styles.cancelButton
                }
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}

      <section className={styles.addressSection}>
        <div className={styles.sectionHeader}>
          <div>
            <span className={styles.eyebrow}>
              Saved addresses
            </span>

            <h2>
              Delivery destinations
            </h2>
          </div>

          {!loading && (
            <span className={styles.addressCount}>
              {addresses.length}{' '}
              {addresses.length === 1
                ? 'address'
                : 'addresses'}
            </span>
          )}
        </div>

        {loading ? (
          <AddressSkeleton />
        ) : addresses.length === 0 ? (
          <div className={styles.emptyState}>
            <div
              className={
                styles.emptyIcon
              }
            >
              <LocationIcon />
            </div>

            <span className={styles.eyebrow}>
              No saved addresses
            </span>

            <h3>
              Add your first delivery
              address
            </h3>

            <p>
              Save an address now so
              checkout is faster the next
              time you shop with DESIRE.
            </p>

            <button
              type="button"
              onClick={
                openCreateForm
              }
              className={
                styles.emptyButton
              }
            >
              Add address
              <PlusIcon />
            </button>
          </div>
        ) : (
          <div className={styles.addressGrid}>
            {addresses.map(
              (address) => {
                const addressId =
                  getAddressId(
                    address,
                  );

                return (
                  <article
                    key={addressId}
                    className={`${styles.addressCard} ${
                      address.isDefault
                        ? styles.defaultAddress
                        : ''
                    }`}
                  >
                    <div
                      className={
                        styles.addressCardTop
                      }
                    >
                      <div
                        className={
                          styles.locationIcon
                        }
                      >
                        <LocationIcon />
                      </div>

                      {address.isDefault && (
                        <span
                          className={
                            styles.defaultBadge
                          }
                        >
                          Default
                        </span>
                      )}
                    </div>

                    <div
                      className={
                        styles.addressContent
                      }
                    >
                      <h3>
                        {
                          address.fullName
                        }
                      </h3>

                      <p>
                        {
                          address.addressLine1
                        }
                      </p>

                      {address.addressLine2 && (
                        <p>
                          {
                            address.addressLine2
                          }
                        </p>
                      )}

                      <p>
                        {address.city},{' '}
                        {address.state}
                      </p>

                      <p>
                        {address.country}
                        {address.postalCode
                          ? `, ${address.postalCode}`
                          : ''}
                      </p>

                      <p
                        className={
                          styles.phone
                        }
                      >
                        {address.phone}
                      </p>
                    </div>

                    <div
                      className={
                        styles.addressActions
                      }
                    >
                      <button
                        type="button"
                        onClick={() =>
                          openEditForm(
                            address,
                          )
                        }
                      >
                        <EditIcon />
                        Edit
                      </button>

                      {!address.isDefault && (
                        <button
                          type="button"
                          disabled={
                            defaultingId ===
                            addressId
                          }
                          onClick={() =>
                            handleSetDefault(
                              addressId,
                            )
                          }
                        >
                          <CheckIcon />

                          {defaultingId ===
                          addressId
                            ? 'Setting...'
                            : 'Set default'}
                        </button>
                      )}

                      <button
                        type="button"
                        disabled={
                          deletingId ===
                          addressId
                        }
                        onClick={() =>
                          handleDelete(
                            addressId,
                          )
                        }
                        className={
                          styles.deleteButton
                        }
                      >
                        <TrashIcon />

                        {deletingId ===
                        addressId
                          ? 'Deleting...'
                          : 'Delete'}
                      </button>
                    </div>
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