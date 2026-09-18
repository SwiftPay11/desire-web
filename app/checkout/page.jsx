'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  createAddress,
  getAddresses,
  setDefaultAddress,
} from '@/services/addresses.service';

import {
  getCart,
} from '@/services/cart.service';

import styles from './checkout.module.css';

const EMPTY_ADDRESS = {
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

function formatCurrency(value) {
  const amount = Number(value || 0);

  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function normalizeAddresses(response) {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.addresses)) {
    return response.addresses;
  }

  if (Array.isArray(response?.data?.addresses)) {
    return response.data.addresses;
  }

  return [];
}

function normalizeCart(response) {
  const cart =
    response?.cart ||
    response?.data?.cart;

  if (!cart) {
    return {
      id: '',
      items: [],
      totalItems: 0,
      totalAmount: 0,
    };
  }

  return {
    id: cart.id || '',
    items: Array.isArray(cart.items)
      ? cart.items
      : [],
    totalItems: Number(
      cart.totalItems || 0,
    ),
    totalAmount: Number(
      cart.totalAmount || 0,
    ),
  };
}

function getAddressId(address) {
  return (
    address?._id ||
    address?.id ||
    ''
  );
}

function getProduct(item) {
  if (
    item?.product &&
    typeof item.product === 'object'
  ) {
    return item.product;
  }

  return {};
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

function ArrowLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M19 12H5M10 17l-5-5 5-5" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h14M14 7l5 5-5 5" />
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

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 6v12M6 12h12" />
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

function BagIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 8h14l-1 12H6L5 8Z" />
      <path d="M9 9V6a3 3 0 0 1 6 0v3" />
    </svg>
  );
}

function CheckoutSkeleton() {
  return (
    <main className={styles.loadingPage}>
      <div className={styles.loadingMain}>
        <span />
        <span />
        <span />
        <span />
      </div>

      <div className={styles.loadingSummary}>
        <span />
        <span />
        <span />
        <span />
      </div>
    </main>
  );
}

export default function CheckoutInformationPage() {
  const router = useRouter();

  const [cart, setCart] = useState({
    id: '',
    items: [],
    totalItems: 0,
    totalAmount: 0,
  });

  const [addresses, setAddresses] =
    useState([]);

  const [
    selectedAddressId,
    setSelectedAddressId,
  ] = useState('');

  const [notes, setNotes] =
    useState('');

  const [
    showAddressForm,
    setShowAddressForm,
  ] = useState(false);

  const [
    addressForm,
    setAddressForm,
  ] = useState(EMPTY_ADDRESS);

  const [loading, setLoading] =
    useState(true);

  const [savingAddress, setSavingAddress] =
    useState(false);

  const [
    settingDefaultId,
    setSettingDefaultId,
  ] = useState('');

  const [error, setError] =
    useState('');

  const [formError, setFormError] =
    useState('');

  const [successMessage, setSuccessMessage] =
    useState('');

  const loadCheckout = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const [
        cartResult,
        addressesResult,
      ] = await Promise.allSettled([
        getCart(),
        getAddresses(),
      ]);

      if (cartResult.status === 'rejected') {
        if (
          cartResult.reason?.status === 401
        ) {
          router.push(
            `/login?redirect=${encodeURIComponent(
              '/checkout',
            )}`,
          );

          return;
        }

        throw cartResult.reason;
      }

      const loadedCart =
        normalizeCart(cartResult.value);

      setCart(loadedCart);

      if (loadedCart.items.length === 0) {
        router.replace('/cart');
        return;
      }

      if (
        addressesResult.status === 'fulfilled'
      ) {
        const loadedAddresses =
          normalizeAddresses(
            addressesResult.value,
          );

        setAddresses(loadedAddresses);

        const defaultAddress =
          loadedAddresses.find(
            (address) =>
              address?.isDefault === true,
          );

        const firstAddress =
          defaultAddress ||
          loadedAddresses[0];

        if (firstAddress) {
          setSelectedAddressId(
            getAddressId(firstAddress),
          );
        } else {
          setShowAddressForm(true);
        }
      } else {
        console.error(
          'Unable to load addresses:',
          addressesResult.reason,
        );

        setAddresses([]);
        setShowAddressForm(true);
      }
    } catch (loadError) {
      console.error(
        'Unable to load checkout:',
        loadError,
      );

      setError(
        loadError?.message ||
          'We could not load checkout information.',
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadCheckout();
  }, [loadCheckout]);

  const selectedAddress = useMemo(() => {
    return addresses.find(
      (address) =>
        String(getAddressId(address)) ===
        String(selectedAddressId),
    );
  }, [
    addresses,
    selectedAddressId,
  ]);

  const cartSubtotal =
    Number(cart.totalAmount || 0);

  const shippingFee = 0;

  const estimatedTotal =
    cartSubtotal + shippingFee;

  function showSuccess(message) {
    setSuccessMessage(message);

    window.setTimeout(() => {
      setSuccessMessage('');
    }, 3500);
  }

  function updateAddressField(
    field,
    value,
  ) {
    setAddressForm((current) => ({
      ...current,
      [field]: value,
    }));

    setFormError('');
  }

  function validateAddressForm() {
    if (
      addressForm.fullName.trim().length < 2
    ) {
      return 'Enter the recipient’s full name.';
    }

    if (
      addressForm.phone.trim().length < 7
    ) {
      return 'Enter a valid phone number, preferably with the country code.';
    }

    if (
      addressForm.addressLine1.trim()
        .length < 3
    ) {
      return 'Enter a valid delivery address.';
    }

    if (
      addressForm.city.trim().length < 2
    ) {
      return 'Enter the delivery city.';
    }

    if (
      addressForm.state.trim().length < 2
    ) {
      return 'Enter the delivery state.';
    }

    if (
      addressForm.country.trim().length < 2
    ) {
      return 'Enter the delivery country.';
    }

    return '';
  }

  async function handleCreateAddress(event) {
    event.preventDefault();

    const validationError =
      validateAddressForm();

    if (validationError) {
      setFormError(validationError);
      return;
    }

    try {
      setSavingAddress(true);
      setFormError('');
      setError('');

      const response =
        await createAddress({
          fullName:
            addressForm.fullName.trim(),

          phone:
            addressForm.phone.trim(),

          addressLine1:
            addressForm.addressLine1.trim(),

          addressLine2:
            addressForm.addressLine2.trim() ||
            undefined,

          city:
            addressForm.city.trim(),

          state:
            addressForm.state.trim(),

          country:
            addressForm.country.trim(),

          postalCode:
            addressForm.postalCode.trim() ||
            undefined,

          isDefault:
            addressForm.isDefault,
        });

      const createdAddress =
        response?.address ||
        response?.data?.address;

      if (!createdAddress) {
        throw new Error(
          'The address was created, but its details were not returned.',
        );
      }

      setAddresses((current) => {
        const updated = addressForm.isDefault
          ? current.map((address) => ({
              ...address,
              isDefault: false,
            }))
          : current;

        return [
          createdAddress,
          ...updated,
        ];
      });

      setSelectedAddressId(
        getAddressId(createdAddress),
      );

      setAddressForm(EMPTY_ADDRESS);
      setShowAddressForm(false);

      showSuccess(
        'Delivery address added successfully.',
      );
    } catch (createError) {
      console.error(
        'Unable to create address:',
        createError,
      );

      setFormError(
        createError?.message ||
          'We could not save this address.',
      );
    } finally {
      setSavingAddress(false);
    }
  }

  async function handleSetDefault(
    addressId,
  ) {
    if (!addressId) {
      return;
    }

    try {
      setSettingDefaultId(addressId);
      setError('');

      await setDefaultAddress(
        addressId,
      );

      setAddresses((current) =>
        current.map((address) => ({
          ...address,
          isDefault:
            getAddressId(address) ===
            addressId,
        })),
      );

      setSelectedAddressId(
        addressId,
      );

      showSuccess(
        'Default delivery address updated.',
      );
    } catch (defaultError) {
      console.error(
        'Unable to update default address:',
        defaultError,
      );

      setError(
        defaultError?.message ||
          'We could not update the default address.',
      );
    } finally {
      setSettingDefaultId('');
    }
  }

  function handleContinueToReview() {
    setError('');

    if (cart.items.length === 0) {
      router.push('/cart');
      return;
    }

    if (!selectedAddressId) {
      setError(
        'Select or create a delivery address before continuing.',
      );

      return;
    }

    if (notes.length > 500) {
      setError(
        'Order notes cannot exceed 500 characters.',
      );

      return;
    }

    const checkoutInformation = {
      addressId: selectedAddressId,
      notes: notes.trim(),
    };

    sessionStorage.setItem(
      'desire_checkout_information',
      JSON.stringify(
        checkoutInformation,
      ),
    );

    router.push('/checkout/review');
  }

  if (loading) {
    return <CheckoutSkeleton />;
  }

  return (
    <main className={styles.page}>
      {successMessage && (
        <div
          className={styles.successToast}
          role="status"
        >
          <CheckIcon />
          {successMessage}
        </div>
      )}

      <div className={styles.topNavigation}>
        <Link
          href="/cart"
          className={styles.backLink}
        >
          <ArrowLeftIcon />
          Back to cart
        </Link>

        <div className={styles.steps}>
          <span className={styles.activeStep}>
            01 Information
          </span>

          <span>02 Review</span>

          <span>03 Payment</span>
        </div>
      </div>

      <section className={styles.hero}>
        <span className={styles.eyebrow}>
          Secure checkout
        </span>

        <h1>Delivery information</h1>

        <p>
          Select where your order should be
          delivered and add any instructions
          for the DESIRE team.
        </p>
      </section>

      {error && (
        <div
          className={styles.errorBanner}
          role="alert"
        >
          <p>{error}</p>

          <button
            type="button"
            onClick={() => setError('')}
          >
            Dismiss
          </button>
        </div>
      )}

      <section className={styles.checkoutLayout}>
        <div className={styles.mainColumn}>
          <article className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <span className={styles.eyebrow}>
                  Delivery address
                </span>

                <h2>
                  Choose an address
                </h2>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowAddressForm(
                    (current) => !current,
                  );

                  setFormError('');
                }}
                className={styles.addAddressButton}
              >
                <PlusIcon />

                {showAddressForm
                  ? 'Close form'
                  : 'Add address'}
              </button>
            </div>

            {addresses.length > 0 ? (
              <div className={styles.addressGrid}>
                {addresses.map((address) => {
                  const addressId =
                    getAddressId(address);

                  const selected =
                    String(addressId) ===
                    String(selectedAddressId);

                  return (
                    <article
                      key={addressId}
                      className={`${styles.addressCard} ${
                        selected
                          ? styles.selectedAddress
                          : ''
                      }`}
                    >
                      <button
                        type="button"
                        className={
                          styles.addressSelector
                        }
                        onClick={() =>
                          setSelectedAddressId(
                            addressId,
                          )
                        }
                      >
                        <span
                          className={
                            styles.radioCircle
                          }
                        />

                        <div
                          className={
                            styles.addressContent
                          }
                        >
                          <div
                            className={
                              styles.addressTop
                            }
                          >
                            <strong>
                              {address.fullName}
                            </strong>

                            {address.isDefault && (
                              <span>
                                Default
                              </span>
                            )}
                          </div>

                          <p>
                            {address.addressLine1}
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

                          <p>
                            {address.phone}
                          </p>
                        </div>
                      </button>

                      {!address.isDefault && (
                        <button
                          type="button"
                          onClick={() =>
                            handleSetDefault(
                              addressId,
                            )
                          }
                          disabled={
                            settingDefaultId ===
                            addressId
                          }
                          className={
                            styles.defaultButton
                          }
                        >
                          {settingDefaultId ===
                          addressId
                            ? 'Updating...'
                            : 'Set as default'}
                        </button>
                      )}
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className={styles.noAddresses}>
                <LocationIcon />

                <h3>
                  No delivery address yet
                </h3>

                <p>
                  Add an address to continue
                  with checkout.
                </p>
              </div>
            )}

            {showAddressForm && (
              <form
                className={styles.addressForm}
                onSubmit={handleCreateAddress}
              >
                <div className={styles.formHeading}>
                  <span className={styles.eyebrow}>
                    New address
                  </span>

                  <h3>
                    Delivery details
                  </h3>
                </div>

                {formError && (
                  <p
                    className={styles.formError}
                    role="alert"
                  >
                    {formError}
                  </p>
                )}

                <div className={styles.formGrid}>
                  <label>
                    <span>Full name</span>

                    <input
                      type="text"
                      value={
                        addressForm.fullName
                      }
                      onChange={(event) =>
                        updateAddressField(
                          'fullName',
                          event.target.value,
                        )
                      }
                      placeholder="Recipient’s full name"
                      required
                    />
                  </label>

                  <label>
                    <span>Phone number</span>

                    <input
                      type="tel"
                      value={
                        addressForm.phone
                      }
                      onChange={(event) =>
                        updateAddressField(
                          'phone',
                          event.target.value,
                        )
                      }
                      placeholder="+234 800 000 0000"
                      required
                    />
                  </label>

                  <label
                    className={styles.fullWidth}
                  >
                    <span>
                      Address line 1
                    </span>

                    <input
                      type="text"
                      value={
                        addressForm.addressLine1
                      }
                      onChange={(event) =>
                        updateAddressField(
                          'addressLine1',
                          event.target.value,
                        )
                      }
                      placeholder="Street address"
                      required
                    />
                  </label>

                  <label
                    className={styles.fullWidth}
                  >
                    <span>
                      Address line 2
                    </span>

                    <input
                      type="text"
                      value={
                        addressForm.addressLine2
                      }
                      onChange={(event) =>
                        updateAddressField(
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
                      value={
                        addressForm.city
                      }
                      onChange={(event) =>
                        updateAddressField(
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
                      value={
                        addressForm.state
                      }
                      onChange={(event) =>
                        updateAddressField(
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
                      value={
                        addressForm.country
                      }
                      onChange={(event) =>
                        updateAddressField(
                          'country',
                          event.target.value,
                        )
                      }
                      required
                    />
                  </label>

                  <label>
                    <span>Postal code</span>

                    <input
                      type="text"
                      value={
                        addressForm.postalCode
                      }
                      onChange={(event) =>
                        updateAddressField(
                          'postalCode',
                          event.target.value,
                        )
                      }
                      placeholder="Optional"
                    />
                  </label>
                </div>

                <label
                  className={styles.defaultCheckbox}
                >
                  <input
                    type="checkbox"
                    checked={
                      addressForm.isDefault
                    }
                    onChange={(event) =>
                      updateAddressField(
                        'isDefault',
                        event.target.checked,
                      )
                    }
                  />

                  <span />

                  Make this my default address
                </label>

                <button
                  type="submit"
                  disabled={savingAddress}
                  className={styles.saveAddressButton}
                >
                  {savingAddress
                    ? 'Saving address...'
                    : 'Save delivery address'}
                </button>
              </form>
            )}
          </article>

          <article className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <span className={styles.eyebrow}>
                  Order instructions
                </span>

                <h2>Delivery notes</h2>
              </div>

              <span className={styles.characterCount}>
                {notes.length}/500
              </span>
            </div>

            <textarea
              value={notes}
              onChange={(event) =>
                setNotes(
                  event.target.value.slice(
                    0,
                    500,
                  ),
                )
              }
              className={styles.notesInput}
              placeholder="Add delivery instructions or other notes for your order (optional)."
              maxLength={500}
            />
          </article>
        </div>

        <aside className={styles.summaryPanel}>
          <span className={styles.eyebrow}>
            Your order
          </span>

          <h2>Checkout summary</h2>

          <div className={styles.itemList}>
            {cart.items.map((item) => {
              const product =
                getProduct(item);

              return (
                <article
                  key={item.id}
                  className={styles.summaryItem}
                >
                  <div
                    className={
                      styles.summaryImage
                    }
                  >
                    <img
                      src={getProductImage(
                        product,
                      )}
                      alt={
                        product?.name ||
                        'DESIRE product'
                      }
                      onError={(event) => {
                        event.currentTarget.src =
                          '/images/product-placeholder.jpg';
                      }}
                    />

                    <span>
                      {item.quantity}
                    </span>
                  </div>

                  <div
                    className={
                      styles.summaryItemInfo
                    }
                  >
                    <strong>
                      {product?.name ||
                        'DESIRE Product'}
                    </strong>

                    <p>
                      {item.size} /{' '}
                      {item.color}
                    </p>
                  </div>

                  <span
                    className={
                      styles.summaryItemPrice
                    }
                  >
                    {formatCurrency(
                      item.subtotal,
                    )}
                  </span>
                </article>
              );
            })}
          </div>

          <div className={styles.summaryRows}>
            <div>
              <span>
                Subtotal
              </span>

              <strong>
                {formatCurrency(
                  cartSubtotal,
                )}
              </strong>
            </div>

            <div>
              <span>Shipping</span>

              <strong>
                Calculated later
              </strong>
            </div>
          </div>

          <div className={styles.totalRow}>
            <span>
              Estimated total
            </span>

            <strong>
              {formatCurrency(
                estimatedTotal,
              )}
            </strong>
          </div>

          {selectedAddress && (
            <div
              className={
                styles.selectedAddressSummary
              }
            >
              <span>
                Delivering to
              </span>

              <strong>
                {selectedAddress.fullName}
              </strong>

              <p>
                {selectedAddress.addressLine1},{' '}
                {selectedAddress.city},{' '}
                {selectedAddress.state}
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={
              handleContinueToReview
            }
            className={
              styles.continueButton
            }
          >
            Continue to review
            <ArrowIcon />
          </button>

          <div className={styles.securityNote}>
            <BagIcon />

            <p>
              Your order will not be created
              until you review and confirm it
              on the next page.
            </p>
          </div>
        </aside>
      </section>
    </main>
  );
}