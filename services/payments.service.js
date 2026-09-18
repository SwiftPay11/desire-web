import apiFetch from '@/lib/api';
import { ENDPOINTS } from '@/lib/endpoints';

export const PAYMENT_PROVIDERS = {
  MANUAL: 'MANUAL',
  PAYSTACK: 'PAYSTACK',
  FLUTTERWAVE: 'FLUTTERWAVE',
  STRIPE: 'STRIPE',
  PAYPAL: 'PAYPAL',
  CRYPTO: 'CRYPTO',
};

export const PAYMENT_PURPOSES = {
  ORDER: 'ORDER',

  DESIRE_CREDIT_COMMITMENT:
    'DESIRE_CREDIT_COMMITMENT',

  DESIRE_CREDIT_INSTALLMENT:
    'DESIRE_CREDIT_INSTALLMENT',
};

export const PAYMENT_STATUSES = {
  PENDING: 'PENDING',
  SUBMITTED: 'SUBMITTED',
  PROCESSING: 'PROCESSING',
  PAID: 'PAID',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
  REFUNDED: 'REFUNDED',
};

// ==========================
// CUSTOMER PAYMENTS
// ==========================

export async function createPayment(
  payload,
) {
  if (!payload?.orderId) {
    throw new Error(
      'Order ID is required.',
    );
  }

  if (!payload?.provider) {
    throw new Error(
      'Payment provider is required.',
    );
  }

  const purpose =
    payload.purpose ||
    PAYMENT_PURPOSES.ORDER;

  if (
    purpose ===
      PAYMENT_PURPOSES
        .DESIRE_CREDIT_COMMITMENT &&
    !payload.creditPurchaseId
  ) {
    throw new Error(
      'Credit purchase ID is required for a commitment payment.',
    );
  }

  if (
    purpose ===
      PAYMENT_PURPOSES
        .DESIRE_CREDIT_INSTALLMENT &&
    !payload.installmentId
  ) {
    throw new Error(
      'Installment ID is required for an installment payment.',
    );
  }

  return apiFetch(
    ENDPOINTS.PAYMENTS.CREATE,
    {
      method: 'POST',

      body: JSON.stringify({
        orderId:
          payload.orderId,

        provider:
          payload.provider,

        currency:
          payload.currency ||
          'NGN',

        purpose,

        ...(payload.creditPurchaseId
          ? {
              creditPurchaseId:
                payload.creditPurchaseId,
            }
          : {}),

        ...(payload.installmentId
          ? {
              installmentId:
                payload.installmentId,
            }
          : {}),
      }),
    },
  );
}

export async function createInstallmentPayment(
  payload,
) {
  if (!payload?.orderId) {
    throw new Error(
      'Order ID is required.',
    );
  }

  if (!payload?.installmentId) {
    throw new Error(
      'Installment ID is required.',
    );
  }

  return createPayment({
    orderId:
      payload.orderId,

    installmentId:
      payload.installmentId,

    provider:
      payload.provider ||
      PAYMENT_PROVIDERS.MANUAL,

    currency:
      payload.currency ||
      'NGN',

    purpose:
      PAYMENT_PURPOSES
        .DESIRE_CREDIT_INSTALLMENT,
  });
}

export async function getMyPayments() {
  return apiFetch(
    ENDPOINTS.PAYMENTS.MY_PAYMENTS,
    {
      method: 'GET',
    },
  );
}

export async function getMyPayment(
  paymentId,
) {
  if (!paymentId) {
    throw new Error(
      'Payment ID is required.',
    );
  }

  return apiFetch(
    ENDPOINTS.PAYMENTS.MY_PAYMENT(
      paymentId,
    ),
    {
      method: 'GET',
    },
  );
}

export async function submitPaymentProof(
  paymentId,
  payload,
) {
  if (!paymentId) {
    throw new Error(
      'Payment ID is required.',
    );
  }

  if (
    !payload?.proofOfPaymentUrl
  ) {
    throw new Error(
      'Payment proof is required.',
    );
  }

  if (
    !payload?.senderName?.trim()
  ) {
    throw new Error(
      'Sender name is required.',
    );
  }

  if (
    !payload?.transferReference?.trim()
  ) {
    throw new Error(
      'Transfer reference is required.',
    );
  }

  if (!payload?.transferDate) {
    throw new Error(
      'Transfer date is required.',
    );
  }

  const submittedAmount =
    Number(
      payload?.submittedAmount,
    );

  if (
    !Number.isFinite(
      submittedAmount,
    ) ||
    submittedAmount <= 0
  ) {
    throw new Error(
      'Enter a valid transferred amount.',
    );
  }

  return apiFetch(
    ENDPOINTS.PAYMENTS.SUBMIT_PROOF(
      paymentId,
    ),
    {
      method: 'PATCH',

      body: JSON.stringify({
        proofOfPaymentUrl:
          payload.proofOfPaymentUrl,

        senderName:
          payload.senderName.trim(),

        transferReference:
          payload.transferReference.trim(),

        transferDate:
          payload.transferDate,

        submittedAmount,

        customerNote:
          payload.customerNote?.trim() ||
          undefined,
      }),
    },
  );
}

// ==========================
// ADMIN PAYMENTS
// ==========================

export async function getAdminPayments() {
  return apiFetch(
    ENDPOINTS.PAYMENTS.ADMIN_GET_ALL,
    {
      method: 'GET',
    },
  );
}

export async function getAdminPayment(
  paymentId,
) {
  if (!paymentId) {
    throw new Error(
      'Payment ID is required.',
    );
  }

  return apiFetch(
    ENDPOINTS.PAYMENTS.ADMIN_FIND_ONE(
      paymentId,
    ),
    {
      method: 'GET',
    },
  );
}

export async function verifyAdminPayment(
  paymentId,
  payload = {},
) {
  if (!paymentId) {
    throw new Error(
      'Payment ID is required.',
    );
  }

  return apiFetch(
    ENDPOINTS.PAYMENTS.ADMIN_VERIFY(
      paymentId,
    ),
    {
      method: 'PATCH',

      body: JSON.stringify({
        ...(payload
          ?.providerReference
          ?.trim()
          ? {
              providerReference:
                payload.providerReference.trim(),
            }
          : {}),

        ...(payload
          ?.failureReason
          ?.trim()
          ? {
              failureReason:
                payload.failureReason.trim(),
            }
          : {}),
      }),
    },
  );
}

export async function updateAdminPaymentStatus(
  paymentId,
  status,
) {
  if (!paymentId) {
    throw new Error(
      'Payment ID is required.',
    );
  }

  if (!status) {
    throw new Error(
      'Payment status is required.',
    );
  }

  return apiFetch(
    ENDPOINTS.PAYMENTS.ADMIN_UPDATE_STATUS(
      paymentId,
    ),
    {
      method: 'PATCH',

      body: JSON.stringify({
        status,
      }),
    },
  );
}