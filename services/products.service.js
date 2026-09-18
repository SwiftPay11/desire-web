import apiFetch from '@/lib/api';
import { ENDPOINTS } from '@/lib/endpoints';

function buildQueryString(params = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (
      value !== undefined &&
      value !== null &&
      value !== ''
    ) {
      searchParams.set(key, String(value));
    }
  });

  const queryString = searchParams.toString();

  return queryString ? `?${queryString}` : '';
}

export async function getProducts(params = {}) {
  const queryString = buildQueryString(params);

  return apiFetch(
    `${ENDPOINTS.PRODUCTS.GET_ALL}${queryString}`,
    {
      method: 'GET',
    },
  );
}

export async function getFeaturedProducts(limit = 8) {
  return apiFetch(
    `${ENDPOINTS.PRODUCTS.GET_FEATURED}?limit=${limit}`,
    {
      method: 'GET',
    },
  );
}

export async function getProduct(identifier) {
  if (!identifier) {
    throw new Error(
      'Product identifier is required.',
    );
  }

  return apiFetch(
    ENDPOINTS.PRODUCTS.FIND_ONE(identifier),
    {
      method: 'GET',
    },
  );
}

export async function getAdminProducts(params = {}) {
  const queryString = buildQueryString(params);

  return apiFetch(
    `${ENDPOINTS.PRODUCTS.ADMIN_GET_ALL}${queryString}`,
    {
      method: 'GET',
    },
  );
}

export async function createProduct(payload) {
  return apiFetch(
    ENDPOINTS.PRODUCTS.CREATE,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );
}

export async function updateProduct(id, payload) {
  if (!id) {
    throw new Error('Product ID is required.');
  }

  return apiFetch(
    ENDPOINTS.PRODUCTS.UPDATE(id),
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
  );
}

export async function deleteProduct(id) {
  if (!id) {
    throw new Error('Product ID is required.');
  }

  return apiFetch(
    ENDPOINTS.PRODUCTS.DELETE(id),
    {
      method: 'DELETE',
    },
  );
}

export async function addProductImages(
  id,
  images,
) {
  if (!id) {
    throw new Error('Product ID is required.');
  }

  if (!Array.isArray(images) || images.length === 0) {
    throw new Error(
      'At least one product image is required.',
    );
  }

  return apiFetch(
    ENDPOINTS.PRODUCTS.ADD_IMAGES(id),
    {
      method: 'PATCH',
      body: JSON.stringify({
        images,
      }),
    },
  );
}

export async function removeProductImage(
  id,
  image,
) {
  if (!id) {
    throw new Error('Product ID is required.');
  }

  if (!image) {
    throw new Error('Image URL is required.');
  }

  return apiFetch(
    ENDPOINTS.PRODUCTS.REMOVE_IMAGE(id),
    {
      method: 'DELETE',
      body: JSON.stringify({
        image,
      }),
    },
  );
}

export async function getAdminProduct(
  identifier,
) {
  if (!identifier) {
    throw new Error(
      'Product identifier is required.',
    );
  }

  return apiFetch(
    ENDPOINTS.PRODUCTS.ADMIN_FIND_ONE(
      identifier,
    ),
    {
      method: 'GET',
    },
  );
}

export async function getAdminInventory() {
  return apiFetch(
    ENDPOINTS.PRODUCTS.ADMIN_INVENTORY,
    {
      method: 'GET',
    },
  );
}

export async function adjustProductInventory(
  id,
  payload,
) {
  if (!id) {
    throw new Error(
      'Product ID is required.',
    );
  }

  if (!payload?.action) {
    throw new Error(
      'Inventory action is required.',
    );
  }

  return apiFetch(
    ENDPOINTS.PRODUCTS.ADJUST_INVENTORY(
      id,
    ),
    {
      method: 'PATCH',

      body: JSON.stringify(
        payload,
      ),
    },
  );
}