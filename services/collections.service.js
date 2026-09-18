import apiFetch from '@/lib/api';

import {
  ENDPOINTS,
} from '@/lib/endpoints';

export async function getCollections() {
  return apiFetch(
    ENDPOINTS.COLLECTIONS.GET_ACTIVE,
    {
      method: 'GET',
    },
  );
}

export async function getFeaturedCollections(
  limit = 6,
) {
  const safeLimit =
    Number(limit) || 6;

  return apiFetch(
    `${ENDPOINTS.COLLECTIONS.GET_FEATURED}?limit=${safeLimit}`,
    {
      method: 'GET',
    },
  );
}

export async function getCollection(
  identifier,
) {
  if (!identifier) {
    throw new Error(
      'Collection identifier is required.',
    );
  }

  return apiFetch(
    ENDPOINTS.COLLECTIONS.FIND_ONE(
      identifier,
    ),
    {
      method: 'GET',
    },
  );
}

export async function getAdminCollections() {
  return apiFetch(
    ENDPOINTS.COLLECTIONS.ADMIN_GET_ALL,
    {
      method: 'GET',
    },
  );
}

export async function getAdminCollection(
  identifier,
) {
  if (!identifier) {
    throw new Error(
      'Collection identifier is required.',
    );
  }

  return apiFetch(
    ENDPOINTS.COLLECTIONS.ADMIN_FIND_ONE(
      identifier,
    ),
    {
      method: 'GET',
    },
  );
}

export async function createCollection(
  payload,
) {
  if (!payload) {
    throw new Error(
      'Collection data is required.',
    );
  }

  return apiFetch(
    ENDPOINTS.COLLECTIONS.CREATE,
    {
      method: 'POST',
      body: JSON.stringify(
        payload,
      ),
    },
  );
}

export async function updateCollection(
  id,
  payload,
) {
  if (!id) {
    throw new Error(
      'Collection ID is required.',
    );
  }

  if (!payload) {
    throw new Error(
      'Collection data is required.',
    );
  }

  return apiFetch(
    ENDPOINTS.COLLECTIONS.UPDATE(
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

export async function deleteCollection(
  id,
) {
  if (!id) {
    throw new Error(
      'Collection ID is required.',
    );
  }

  return apiFetch(
    ENDPOINTS.COLLECTIONS.DELETE(
      id,
    ),
    {
      method: 'DELETE',
    },
  );
}