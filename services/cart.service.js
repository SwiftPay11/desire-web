import apiFetch from '@/lib/api';
import { ENDPOINTS } from '@/lib/endpoints';

export async function getCart() {
  return apiFetch(
    ENDPOINTS.CART.GET,
    {
      method: 'GET',
    },
  );
}

export async function addCartItem(payload) {
  if (!payload?.productId) {
    throw new Error(
      'Product ID is required.',
    );
  }

  return apiFetch(
    ENDPOINTS.CART.ADD_ITEM,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );
}

export async function updateCartItem(
  itemId,
  payload,
) {
  if (!itemId) {
    throw new Error(
      'Cart item ID is required.',
    );
  }

  return apiFetch(
    ENDPOINTS.CART.UPDATE_ITEM(itemId),
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
  );
}

export async function removeCartItem(itemId) {
  if (!itemId) {
    throw new Error(
      'Cart item ID is required.',
    );
  }

  return apiFetch(
    ENDPOINTS.CART.REMOVE_ITEM(itemId),
    {
      method: 'DELETE',
    },
  );
}

export async function clearCart() {
  return apiFetch(
    ENDPOINTS.CART.CLEAR,
    {
      method: 'DELETE',
    },
  );
}