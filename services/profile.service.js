import apiFetch from '@/lib/api';

import { ENDPOINTS } from '@/lib/endpoints';

// ==========================
// CUSTOMER PROFILE
// ==========================

export async function getMyProfile() {
  return apiFetch(
    ENDPOINTS.USERS.ME,
    {
      method: 'GET',
    },
  );
}

export async function updateMyProfile(
  payload,
) {
  if (!payload) {
    throw new Error(
      'Profile information is required.',
    );
  }

  return apiFetch(
    ENDPOINTS.USERS.UPDATE_ME,
    {
      method: 'PATCH',

      body: JSON.stringify({
        fullName:
          payload.fullName?.trim(),

        phone:
          payload.phone?.trim(),
      }),
    },
  );
}

// ==========================
// ADMIN CUSTOMERS
// ==========================

export async function getAdminCustomers() {
  return apiFetch(
    ENDPOINTS.USERS.ADMIN_CUSTOMERS,
    {
      method: 'GET',
    },
  );
}

export async function getAdminCustomer(id) {
  if (!id) {
    throw new Error(
      'Customer ID is required.',
    );
  }

  return apiFetch(
    ENDPOINTS.USERS.ADMIN_CUSTOMER(
      id,
    ),
    {
      method: 'GET',
    },
  );
}