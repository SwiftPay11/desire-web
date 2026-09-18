export const ENDPOINTS = {
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    PROFILE: '/auth/profile',
    ADMIN_CHECK: '/auth/admin',
    CHANGE_PASSWORD: '/auth/change-password',
  },

 USERS: {
  ME: '/users/me',

  UPDATE_ME:
    '/users/me',

  ADMIN_CUSTOMERS:
    '/users/admin/customers',

  ADMIN_CUSTOMER: (id) =>
    `/users/admin/customers/${id}`,
},

  ADMIN_DASHBOARD: {
    GET: '/admin-dashboard',
  },

  CATEGORIES: {
    GET_ACTIVE: '/categories',
    ADMIN_GET_ALL: '/categories/admin/all',
    FIND_ONE: (id) => `/categories/${id}`,
    CREATE: '/categories',
    UPDATE: (id) => `/categories/${id}`,
    DELETE: (id) => `/categories/${id}`,
  },

  PRODUCTS: {
    GET_ALL: '/products',

    GET_FEATURED:
      '/products/featured',

    ADMIN_GET_ALL:
      '/products/admin/all',

    ADMIN_INVENTORY:
      '/products/admin/inventory',

    ADMIN_FIND_ONE: (identifier) =>
      `/products/admin/${identifier}`,

    FIND_ONE: (identifier) =>
      `/products/${identifier}`,

    CREATE:
      '/products',

    UPDATE: (id) =>
      `/products/${id}`,

    DELETE: (id) =>
      `/products/${id}`,

    ADD_IMAGES: (id) =>
      `/products/${id}/images`,

    REMOVE_IMAGE: (id) =>
      `/products/${id}/images`,

    ADJUST_INVENTORY: (id) =>
      `/products/admin/${id}/inventory`,
  },

  UPLOADS: {
    SINGLE: '/uploads/single',
    MULTIPLE: '/uploads/multiple',
    PAYMENT_PROOF: '/uploads/payment-proof',
    DELETE: (filename) =>
      `/uploads/${filename}`,
  },

  ADDRESSES: {
    CREATE: '/addresses',
    GET_ALL: '/addresses',
    FIND_ONE: (id) =>
      `/addresses/${id}`,
    UPDATE: (id) =>
      `/addresses/${id}`,
    SET_DEFAULT: (id) =>
      `/addresses/${id}/default`,
    DELETE: (id) =>
      `/addresses/${id}`,
  },

  CART: {
    GET: '/cart',
    ADD_ITEM: '/cart/items',
    UPDATE_ITEM: (itemId) =>
      `/cart/items/${itemId}`,
    REMOVE_ITEM: (itemId) =>
      `/cart/items/${itemId}`,
    CLEAR: '/cart',
  },

  WISHLIST: {
    GET: '/wishlist',
    ADD_ITEM: '/wishlist/items',

    CHECK_ITEM: (productId) =>
      `/wishlist/items/${productId}/check`,

    REMOVE_ITEM: (productId) =>
      `/wishlist/items/${productId}`,

    CLEAR: '/wishlist',
  },

  ORDERS: {
  CREATE: '/orders',

  MY_ORDERS:
    '/orders/my-orders',

  MY_ORDER: (id) =>
    `/orders/my-orders/${id}`,

  ADMIN_GET_ALL:
    '/orders',

  ADMIN_FIND_ONE: (id) =>
    `/orders/admin/${id}`,

  ADMIN_UPDATE_STATUS: (id) =>
    `/orders/${id}/status`,

  ADMIN_UPDATE_PAYMENT_STATUS: (id) =>
    `/orders/${id}/payment-status`,
},

  REVIEWS: {
    PRODUCT_REVIEWS: (productId) =>
      `/reviews/product/${productId}`,

    CREATE:
      '/reviews',

    MY_REVIEWS:
      '/reviews/my-reviews',

    MY_REVIEW: (id) =>
      `/reviews/my-reviews/${id}`,

    UPDATE: (id) =>
      `/reviews/${id}`,

    DELETE: (id) =>
      `/reviews/${id}`,

    ADMIN_GET_ALL:
      '/reviews',

    ADMIN_UPDATE_STATUS: (id) =>
      `/reviews/${id}/status`,

    ADMIN_DELETE: (id) =>
      `/reviews/${id}/admin`,
  },

  PAYMENTS: {
    CREATE:
      '/payments',

    MY_PAYMENTS:
      '/payments/my-payments',

    MY_PAYMENT: (id) =>
      `/payments/my-payments/${id}`,

    SUBMIT_PROOF: (id) =>
      `/payments/${id}/submit-proof`,

    ADMIN_GET_ALL:
      '/payments',

    ADMIN_FIND_ONE: (id) =>
      `/payments/${id}`,

    ADMIN_VERIFY: (id) =>
      `/payments/${id}/verify`,

    ADMIN_UPDATE_STATUS: (id) =>
      `/payments/${id}/status`,
  },

  DESIRE_CREDIT: {
    APPLY:
      '/desire-credit/applications',

    MY_APPLICATIONS:
      '/desire-credit/applications/my',

    MY_APPLICATION: (applicationId) =>
      `/desire-credit/applications/my/${applicationId}`,

    CANCEL_APPLICATION: (applicationId) =>
      `/desire-credit/applications/my/${applicationId}/cancel`,

    MY_ACCOUNT:
      '/desire-credit/account/my',

    CREATE_PURCHASE:
      '/desire-credit/purchases',

    VERIFY_COMMITMENT_PAYMENT:
      '/desire-credit/purchases/verify-commitment-payment',

    PAY_INSTALLMENT:
      '/desire-credit/installments/pay',

    ADMIN_APPLICATIONS:
      '/desire-credit/admin/applications',

    ADMIN_APPLICATION: (applicationId) =>
      `/desire-credit/admin/applications/${applicationId}`,

    ADMIN_REVIEW_APPLICATION: (applicationId) =>
      `/desire-credit/admin/applications/${applicationId}/review`,

    ADMIN_ACCOUNTS:
      '/desire-credit/admin/accounts',

    ADMIN_ACCOUNT: (accountId) =>
      `/desire-credit/admin/accounts/${accountId}`,

    ADMIN_UPDATE_ACCOUNT: (accountId) =>
      `/desire-credit/admin/accounts/${accountId}`,

    ADMIN_DASHBOARD:
      '/desire-credit/admin/dashboard',

    MY_PURCHASES: '/desire-credit/purchases/my',

MY_PURCHASE: (purchaseId) =>
  `/desire-credit/purchases/my/${purchaseId}`,

MY_INSTALLMENTS: '/desire-credit/installments/my',

MY_INSTALLMENT: (installmentId) =>
  `/desire-credit/installments/my/${installmentId}`,
  },

  NOTIFICATIONS: {
    GET_ALL:
      '/notifications',

    UNREAD_COUNT:
      '/notifications/unread-count',

    MARK_READ: (id) =>
      `/notifications/${id}/read`,

    MARK_ALL_READ:
      '/notifications/read-all',
  },

  COLLECTIONS: {
    GET_ACTIVE:
      '/collections',

    GET_FEATURED:
      '/collections/featured',

    FIND_ONE: (identifier) =>
      `/collections/${identifier}`,

    ADMIN_GET_ALL:
      '/collections/admin/all',

    ADMIN_FIND_ONE: (identifier) =>
      `/collections/admin/${identifier}`,

    CREATE:
      '/collections',

    UPDATE: (id) =>
      `/collections/${id}`,

    DELETE: (id) =>
      `/collections/${id}`,
  },
};