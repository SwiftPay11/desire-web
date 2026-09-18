import apiFetch from '@/lib/api';
import { ENDPOINTS } from '@/lib/endpoints';

/*
|--------------------------------------------------------------------------
| DESIRE CREDIT ENUMS
|--------------------------------------------------------------------------
*/

export const CREDIT_APPLICATION_STATUSES = {
  PENDING: 'PENDING',
  UNDER_REVIEW: 'UNDER_REVIEW',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  MORE_INFORMATION_REQUIRED:
    'MORE_INFORMATION_REQUIRED',
  CANCELLED: 'CANCELLED',
};

export const CREDIT_ACCOUNT_STATUSES = {
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  FROZEN: 'FROZEN',
  CLOSED: 'CLOSED',
};

export const CREDIT_PURCHASE_STATUSES = {
  PENDING_COMMITMENT_PAYMENT:
    'PENDING_COMMITMENT_PAYMENT',

  ACTIVE: 'ACTIVE',

  FULLY_PAID: 'FULLY_PAID',

  COMPLETED: 'COMPLETED',

  OVERDUE: 'OVERDUE',

  DEFAULTED: 'DEFAULTED',

  CANCELLED: 'CANCELLED',
};

export const INSTALLMENT_STATUSES = {
  PENDING: 'PENDING',

  PARTIALLY_PAID:
    'PARTIALLY_PAID',

  PAID: 'PAID',

  OVERDUE: 'OVERDUE',

  WAIVED: 'WAIVED',

  CANCELLED: 'CANCELLED',
};

export const EMPLOYMENT_STATUSES = {
  EMPLOYED: 'EMPLOYED',

  SELF_EMPLOYED:
    'SELF_EMPLOYED',

  BUSINESS_OWNER:
    'BUSINESS_OWNER',

  STUDENT: 'STUDENT',

  UNEMPLOYED: 'UNEMPLOYED',

  OTHER: 'OTHER',
};

/*
|--------------------------------------------------------------------------
| INSTALLMENT PLANS
|--------------------------------------------------------------------------
*/

export const CREDIT_INSTALLMENT_PLANS = {
  TWO_WEEKS:
    'TWO_WEEKS',

  FIFTEEN_DAYS:
    'FIFTEEN_DAYS',

  FOUR_WEEKS:
    'FOUR_WEEKS',

  ONE_MONTH:
    'ONE_MONTH',

  SIX_WEEKS:
    'SIX_WEEKS',

  ONE_AND_HALF_MONTHS:
    'ONE_AND_HALF_MONTHS',

  EIGHT_WEEKS:
    'EIGHT_WEEKS',

  TWO_MONTHS:
    'TWO_MONTHS',
};

export const CREDIT_INSTALLMENT_PLAN_OPTIONS = [
  {
    value:
      CREDIT_INSTALLMENT_PLANS
        .TWO_WEEKS,

    label:
      '2 Weeks',

    days: 14,
  },

  {
    value:
      CREDIT_INSTALLMENT_PLANS
        .FIFTEEN_DAYS,

    label:
      '15 Days',

    days: 15,
  },

  {
    value:
      CREDIT_INSTALLMENT_PLANS
        .FOUR_WEEKS,

    label:
      '4 Weeks',

    days: 28,
  },

  {
    value:
      CREDIT_INSTALLMENT_PLANS
        .ONE_MONTH,

    label:
      '1 Month',

    days: 30,
  },

  {
    value:
      CREDIT_INSTALLMENT_PLANS
        .SIX_WEEKS,

    label:
      '6 Weeks',

    days: 42,
  },

  {
    value:
      CREDIT_INSTALLMENT_PLANS
        .ONE_AND_HALF_MONTHS,

    label:
      '1½ Months',

    days: 45,
  },

  {
    value:
      CREDIT_INSTALLMENT_PLANS
        .EIGHT_WEEKS,

    label:
      '8 Weeks',

    days: 56,
  },

  {
    value:
      CREDIT_INSTALLMENT_PLANS
        .TWO_MONTHS,

    label:
      '2 Months',

    days: 60,
  },
];

export const EMPLOYMENT_STATUS_OPTIONS = [
  {
    value:
      EMPLOYMENT_STATUSES
        .EMPLOYED,

    label:
      'Employed',
  },

  {
    value:
      EMPLOYMENT_STATUSES
        .SELF_EMPLOYED,

    label:
      'Self Employed',
  },

  {
    value:
      EMPLOYMENT_STATUSES
        .BUSINESS_OWNER,

    label:
      'Business Owner',
  },

  {
    value:
      EMPLOYMENT_STATUSES
        .STUDENT,

    label:
      'Student',
  },

  {
    value:
      EMPLOYMENT_STATUSES
        .UNEMPLOYED,

    label:
      'Unemployed',
  },

  {
    value:
      EMPLOYMENT_STATUSES
        .OTHER,

    label:
      'Other',
  },
];

/*
|--------------------------------------------------------------------------
| CREDIT APPLICATIONS
|--------------------------------------------------------------------------
*/

export async function applyForDesireCredit(
  payload,
) {
  return apiFetch(
    ENDPOINTS.DESIRE_CREDIT.APPLY,
    {
      method: 'POST',

      body:
        JSON.stringify(
          payload,
        ),
    },
  );
}

export async function getMyCreditApplications() {
  return apiFetch(
    ENDPOINTS.DESIRE_CREDIT
      .MY_APPLICATIONS,
    {
      method: 'GET',
    },
  );
}

export async function getMyCreditApplication(
  applicationId,
) {
  if (!applicationId) {
    throw new Error(
      'Credit application ID is required.',
    );
  }

  return apiFetch(
    ENDPOINTS.DESIRE_CREDIT
      .MY_APPLICATION(
        applicationId,
      ),
    {
      method: 'GET',
    },
  );
}

export async function cancelMyCreditApplication(
  applicationId,
) {
  if (!applicationId) {
    throw new Error(
      'Credit application ID is required.',
    );
  }

  return apiFetch(
    ENDPOINTS.DESIRE_CREDIT
      .CANCEL_APPLICATION(
        applicationId,
      ),
    {
      method: 'PATCH',
    },
  );
}

/*
|--------------------------------------------------------------------------
| CREDIT ACCOUNT
|--------------------------------------------------------------------------
*/

export async function getMyCreditAccount() {
  return apiFetch(
    ENDPOINTS.DESIRE_CREDIT
      .MY_ACCOUNT,
    {
      method: 'GET',
    },
  );
}

/*
|--------------------------------------------------------------------------
| CREDIT PURCHASES
|--------------------------------------------------------------------------
*/

export async function createCreditPurchase(
  {
    orderId,
    installmentPlan,
    notes = '',
  },
) {
  if (!orderId) {
    throw new Error(
      'Order ID is required.',
    );
  }

  if (!installmentPlan) {
    throw new Error(
      'Installment plan is required.',
    );
  }

  return apiFetch(
    ENDPOINTS.DESIRE_CREDIT
      .CREATE_PURCHASE,
    {
      method: 'POST',

      body:
        JSON.stringify({
          orderId,

          installmentPlan,

          ...(notes?.trim()
            ? {
                notes:
                  notes.trim(),
              }
            : {}),
        }),
    },
  );
}

/*
|--------------------------------------------------------------------------
| COMMITMENT PAYMENT
|--------------------------------------------------------------------------
*/

export async function verifyCreditCommitmentPayment(
  {
    creditPurchaseId,
    paymentId,
    paymentReference = '',
    adminNote = '',
  },
) {
  if (!creditPurchaseId) {
    throw new Error(
      'Credit purchase ID is required.',
    );
  }

  if (!paymentId) {
    throw new Error(
      'Payment ID is required.',
    );
  }

  return apiFetch(
    ENDPOINTS.DESIRE_CREDIT
      .VERIFY_COMMITMENT_PAYMENT,
    {
      method: 'POST',

      body:
        JSON.stringify({
          creditPurchaseId,

          paymentId,

          ...(paymentReference?.trim()
            ? {
                paymentReference:
                  paymentReference.trim(),
              }
            : {}),

          ...(adminNote?.trim()
            ? {
                adminNote:
                  adminNote.trim(),
              }
            : {}),
        }),
    },
  );
}

/*
|--------------------------------------------------------------------------
| INSTALLMENT PAYMENTS
|--------------------------------------------------------------------------
*/

export async function recordCreditInstallmentPayment(
  {
    installmentId,
    amount,
    paymentId = '',
    paymentReference = '',
    note = '',
  },
) {
  if (!installmentId) {
    throw new Error(
      'Installment ID is required.',
    );
  }

  const numericAmount =
    Number(amount);

  if (
    !Number.isFinite(
      numericAmount,
    ) ||
    numericAmount < 1
  ) {
    throw new Error(
      'A valid repayment amount is required.',
    );
  }

  return apiFetch(
    ENDPOINTS.DESIRE_CREDIT
      .PAY_INSTALLMENT,
    {
      method: 'POST',

      body:
        JSON.stringify({
          installmentId,

          amount:
            numericAmount,

          ...(paymentId
            ? {
                paymentId,
              }
            : {}),

          ...(paymentReference?.trim()
            ? {
                paymentReference:
                  paymentReference.trim(),
              }
            : {}),

          ...(note?.trim()
            ? {
                note:
                  note.trim(),
              }
            : {}),
        }),
    },
  );
}

export async function getMyCreditPurchases() {
  return apiFetch(
    ENDPOINTS.DESIRE_CREDIT.MY_PURCHASES,
    {
      method: 'GET',
    },
  );
}

export async function getMyCreditPurchase(
  purchaseId,
) {
  if (!purchaseId) {
    throw new Error(
      'Credit purchase ID is required.',
    );
  }

  return apiFetch(
    ENDPOINTS.DESIRE_CREDIT.MY_PURCHASE(
      purchaseId,
    ),
    {
      method: 'GET',
    },
  );
}

export async function getMyCreditInstallments() {
  return apiFetch(
    ENDPOINTS.DESIRE_CREDIT.MY_INSTALLMENTS,
    {
      method: 'GET',
    },
  );
}

export async function getMyCreditInstallment(
  installmentId,
) {
  if (!installmentId) {
    throw new Error(
      'Installment ID is required.',
    );
  }

  return apiFetch(
    ENDPOINTS.DESIRE_CREDIT.MY_INSTALLMENT(
      installmentId,
    ),
    {
      method: 'GET',
    },
  );
}