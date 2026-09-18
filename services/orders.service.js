import apiFetch from '@/lib/api';

import { ENDPOINTS } from '@/lib/endpoints';

// ==========================
// CUSTOMER ORDERS
// ==========================

export async function getMyOrders() {
  return apiFetch(
    ENDPOINTS.ORDERS.MY_ORDERS,
  );
}

export async function getOrder(id) {
  return apiFetch(
    ENDPOINTS.ORDERS.MY_ORDER(id),
  );
}

export async function createOrder(data) {
  return apiFetch(
    ENDPOINTS.ORDERS.CREATE,
    {
      method: 'POST',

      body: JSON.stringify(data),
    },
  );
}

// ==========================
// ADMIN ORDERS
// ==========================

export async function getAdminOrders() {
  return apiFetch(
    ENDPOINTS.ORDERS.ADMIN_GET_ALL,
    {
      method: 'GET',
    },
  );
}

export async function getAdminOrder(id) {
  if (!id) {
    throw new Error(
      'Order ID is required.',
    );
  }

  return apiFetch(
    ENDPOINTS.ORDERS.ADMIN_FIND_ONE(
      id,
    ),
    {
      method: 'GET',
    },
  );
}

export async function updateAdminOrderStatus(
  id,
  status,
) {
  if (!id) {
    throw new Error(
      'Order ID is required.',
    );
  }

  if (!status) {
    throw new Error(
      'Order status is required.',
    );
  }

  return apiFetch(
    ENDPOINTS.ORDERS.ADMIN_UPDATE_STATUS(
      id,
    ),
    {
      method: 'PATCH',

      body: JSON.stringify({
        status,
      }),
    },
  );
}

export async function updateAdminOrderPaymentStatus(
  id,
  paymentStatus,
) {
  if (!id) {
    throw new Error(
      'Order ID is required.',
    );
  }

  if (!paymentStatus) {
    throw new Error(
      'Payment status is required.',
    );
  }

  return apiFetch(
    ENDPOINTS.ORDERS
      .ADMIN_UPDATE_PAYMENT_STATUS(
        id,
      ),
    {
      method: 'PATCH',

      body: JSON.stringify({
        paymentStatus,
      }),
    },
  );
}