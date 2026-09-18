import apiFetch from '@/lib/api';
import { ENDPOINTS } from '@/lib/endpoints';

export async function getWishlist() {
  return apiFetch(
    ENDPOINTS.WISHLIST.GET,
    {
      method: 'GET',
    },
  );
}

export async function addWishlistItem(productId) {
  if (!productId) {
    throw new Error(
      'Product ID is required.',
    );
  }

  return apiFetch(
    ENDPOINTS.WISHLIST.ADD_ITEM,
    {
      method: 'POST',
      body: JSON.stringify({
        productId,
      }),
    },
  );
}

export async function checkWishlistItem(
  productId,
) {
  if (!productId) {
    throw new Error(
      'Product ID is required.',
    );
  }

  return apiFetch(
    ENDPOINTS.WISHLIST.CHECK_ITEM(
      productId,
    ),
    {
      method: 'GET',
    },
  );
}

export async function removeWishlistItem(
  productId,
) {
  if (!productId) {
    throw new Error(
      'Product ID is required.',
    );
  }

  return apiFetch(
    ENDPOINTS.WISHLIST.REMOVE_ITEM(
      productId,
    ),
    {
      method: 'DELETE',
    },
  );
}

export async function clearWishlist() {
  return apiFetch(
    ENDPOINTS.WISHLIST.CLEAR,
    {
      method: 'DELETE',
    },
  );
}