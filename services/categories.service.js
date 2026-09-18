import apiFetch from '@/lib/api';
import { ENDPOINTS } from '@/lib/endpoints';

export async function getCategories() {
  return apiFetch(
    ENDPOINTS.CATEGORIES.GET_ACTIVE,
    {
      method: 'GET',
    },
  );
}

export async function getCategory(identifier) {
  if (!identifier) {
    throw new Error(
      'Category identifier is required.',
    );
  }

  return apiFetch(
    ENDPOINTS.CATEGORIES.FIND_ONE(identifier),
    {
      method: 'GET',
    },
  );
}

export async function getAdminCategories() {
  return apiFetch(
    ENDPOINTS.CATEGORIES.ADMIN_GET_ALL,
    {
      method: 'GET',
    },
  );
}

export async function createCategory(payload) {
  return apiFetch(
    ENDPOINTS.CATEGORIES.CREATE,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );
}

export async function updateCategory(id, payload) {
  if (!id) {
    throw new Error(
      'Category ID is required.',
    );
  }

  return apiFetch(
    ENDPOINTS.CATEGORIES.UPDATE(id),
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
  );
}

export async function deleteCategory(id) {
  if (!id) {
    throw new Error(
      'Category ID is required.',
    );
  }

  return apiFetch(
    ENDPOINTS.CATEGORIES.DELETE(id),
    {
      method: 'DELETE',
    },
  );
}