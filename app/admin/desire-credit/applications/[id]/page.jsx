'use client';

import Link from 'next/link';

import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  useParams,
} from 'next/navigation';

import apiFetch from '@/lib/api';
import { ENDPOINTS } from '@/lib/endpoints';

import styles from './application-details.module.css';

const INSTALLMENT_PLANS = [
  {
    value: 'TWO_WEEKS',
    label: '2 Weeks',
  },
  {
    value: 'FIFTEEN_DAYS',
    label: '15 Days',
  },
  {
    value: 'FOUR_WEEKS',
    label: '4 Weeks',
  },
  {
    value: 'ONE_MONTH',
    label: '1 Month',
  },
  {
    value: 'SIX_WEEKS',
    label: '6 Weeks',
  },
  {
    value: 'ONE_AND_HALF_MONTHS',
    label: '1½ Months',
  },
  {
    value: 'EIGHT_WEEKS',
    label: '8 Weeks',
  },
  {
    value: 'TWO_MONTHS',
    label: '2 Months',
  },
];

function formatCurrency(value) {
  return new Intl.NumberFormat(
    'en-NG',
    {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    },
  ).format(Number(value || 0));
}

function formatDate(value) {
  if (!value) {
    return '—';
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return '—';
  }

  return new Intl.DateTimeFormat(
    'en-NG',
    {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    },
  ).format(date);
}

function formatStatus(value) {
  if (!value) {
    return 'Not available';
  }

  return String(value)
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase(),
    );
}

function normalizeApplication(
  response,
) {
  if (
    !response ||
    typeof response !==
      'object'
  ) {
    return null;
  }

  return (
    response.application ||
    response.data?.application ||
    response.data ||
    response
  );
}

function getCustomer(
  application,
) {
  if (
    application?.user &&
    typeof application.user ===
      'object'
  ) {
    return application.user;
  }

  if (
    application?.customer &&
    typeof application.customer ===
      'object'
  ) {
    return application.customer;
  }

  return {};
}

function getCustomerName(
  application,
) {
  const customer =
    getCustomer(application);

  if (customer.fullName) {
    return customer.fullName;
  }

  const fullName = [
    customer.firstName,
    customer.lastName,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    fullName ||
    application?.fullName ||
    application?.name ||
    'Customer'
  );
}

function getCustomerEmail(
  application,
) {
  const customer =
    getCustomer(application);

  return (
    customer.email ||
    application?.email ||
    '—'
  );
}

function getCustomerPhone(
  application,
) {
  const customer =
    getCustomer(application);

  return (
    customer.phone ||
    application?.phone ||
    application?.phoneNumber ||
    '—'
  );
}

function getRequestedCredit(
  application,
) {
  return Number(
    application
      ?.requestedAmount ??
      application
        ?.requestedCreditLimit ??
      application
        ?.requestedCreditAmount ??
      application?.creditLimit ??
      0,
  );
}

function getPreferredPlan(
  application,
) {
  return (
    application
      ?.preferredInstallmentPlan ||
    application
      ?.installmentPlan ||
    ''
  );
}

function getStatusClass(
  status,
) {
  switch (
    String(
      status || '',
    ).toUpperCase()
  ) {
    case 'APPROVED':
      return styles.approved;

    case 'REJECTED':
      return styles.rejected;

    case 'UNDER_REVIEW':
      return styles.review;

    case 'MORE_INFORMATION_REQUIRED':
      return styles.information;

    case 'CANCELLED':
      return styles.cancelled;

    case 'PENDING':
    default:
      return styles.pending;
  }
}

export default function AdminCreditApplicationDetailsPage() {
  const params = useParams();

  const applicationId =
    Array.isArray(params?.id)
      ? params.id[0]
      : params?.id;

  const [
    application,
    setApplication,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState('');

  const [
    modal,
    setModal,
  ] = useState(null);

  const [
    adminNote,
    setAdminNote,
  ] = useState('');

  const [
    approvedAmount,
    setApprovedAmount,
  ] = useState('');

  const [
    approvedInstallmentPlan,
    setApprovedInstallmentPlan,
  ] = useState('');

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    actionError,
    setActionError,
  ] = useState('');

  const [
    successMessage,
    setSuccessMessage,
  ] = useState('');

  const loadApplication =
    useCallback(
      async (
        isRefresh = false,
      ) => {
        if (!applicationId) {
          setError(
            'Application ID is missing.',
          );

          setLoading(false);
          return;
        }

        try {
          if (isRefresh) {
            setRefreshing(true);
          } else {
            setLoading(true);
          }

          setError('');

          const response =
            await apiFetch(
              ENDPOINTS
                .DESIRE_CREDIT
                .ADMIN_APPLICATION(
                  applicationId,
                ),
            );

          const normalized =
            normalizeApplication(
              response,
            );

          if (
            !normalized ||
            !(
              normalized._id ||
              normalized.id
            )
          ) {
            throw new Error(
              'Credit application was not found.',
            );
          }

          setApplication(
            normalized,
          );
        } catch (loadError) {
          console.error(
            'Unable to load DESIRE CREDIT application:',
            loadError,
          );

          setError(
            loadError?.message ||
              'Unable to load this credit application.',
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [applicationId],
    );

  useEffect(() => {
    loadApplication();
  }, [loadApplication]);

  function openReviewModal(
    status,
  ) {
    setActionError('');
    setSuccessMessage('');
    setAdminNote('');

    if (
      status === 'APPROVED'
    ) {
      const requestedAmount =
        getRequestedCredit(
          application,
        );

      setApprovedAmount(
        requestedAmount >= 5000 &&
          requestedAmount <= 1000000
          ? String(
              requestedAmount,
            )
          : '',
      );

      const preferredPlan =
        getPreferredPlan(
          application,
        );

      const validPreferredPlan =
        INSTALLMENT_PLANS.some(
          (plan) =>
            plan.value ===
            preferredPlan,
        );

      setApprovedInstallmentPlan(
        validPreferredPlan
          ? preferredPlan
          : '',
      );
    } else {
      setApprovedAmount('');
      setApprovedInstallmentPlan(
        '',
      );
    }

    setModal(status);
  }

  function closeModal() {
    if (submitting) {
      return;
    }

    setModal(null);
    setActionError('');
  }

  async function handleReview(
    event,
  ) {
    event.preventDefault();

    if (
      !modal ||
      !applicationId
    ) {
      return;
    }

    if (
      modal === 'APPROVED'
    ) {
      const amount =
        Number(
          approvedAmount,
        );

      if (
        !Number.isFinite(
          amount,
        )
      ) {
        setActionError(
          'Approved amount must be a valid number.',
        );

        return;
      }

      if (amount < 5000) {
        setActionError(
          'Approved amount cannot be less than ₦5,000.',
        );

        return;
      }

      if (
        amount > 1000000
      ) {
        setActionError(
          'Approved amount cannot be greater than ₦1,000,000.',
        );

        return;
      }

      if (
        !approvedInstallmentPlan
      ) {
        setActionError(
          'Select an approved installment plan.',
        );

        return;
      }

      const validPlan =
        INSTALLMENT_PLANS.some(
          (plan) =>
            plan.value ===
            approvedInstallmentPlan,
        );

      if (!validPlan) {
        setActionError(
          'Select a valid installment plan.',
        );

        return;
      }
    }

    setSubmitting(true);
    setActionError('');
    setSuccessMessage('');

    try {
      const payload = {
        status: modal,
      };

      if (
        adminNote.trim()
      ) {
        payload.adminNote =
          adminNote.trim();
      }

      if (
        modal === 'APPROVED'
      ) {
        payload.approvedAmount =
          Number(
            approvedAmount,
          );

        payload.approvedInstallmentPlan =
          approvedInstallmentPlan;
      }

      await apiFetch(
        ENDPOINTS
          .DESIRE_CREDIT
          .ADMIN_REVIEW_APPLICATION(
            applicationId,
          ),
        {
          method: 'PATCH',
          body: JSON.stringify(
            payload,
          ),
        },
      );

      const completedStatus =
        modal;

      setModal(null);

      setSuccessMessage(
        `Application updated to ${formatStatus(
          completedStatus,
        )}.`,
      );

      await loadApplication(
        true,
      );
    } catch (reviewError) {
      console.error(
        'Unable to review DESIRE CREDIT application:',
        reviewError,
      );

      setActionError(
        reviewError?.message ||
          'Unable to update this application.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div
        className={
          styles.loadingPage
        }
      >
        <div
          className={
            styles.loadingHeader
          }
        />

        <div
          className={
            styles.loadingGrid
          }
        >
          <span />
          <span />
        </div>
      </div>
    );
  }

  if (
    error ||
    !application
  ) {
    return (
      <div
        className={styles.page}
      >
        <div
          className={
            styles.breadcrumb
          }
        >
          <Link href="/admin/desire-credit/applications">
            Applications
          </Link>

          <span>/</span>

          <strong>
            Details
          </strong>
        </div>

        <section
          className={
            styles.errorState
          }
        >
          <ApplicationIcon />

          <h1>
            Application unavailable
          </h1>

          <p>
            {error ||
              'Unable to retrieve this application.'}
          </p>

          <button
            type="button"
            onClick={() =>
              loadApplication(true)
            }
          >
            Try again
          </button>
        </section>
      </div>
    );
  }

  const customer =
    getCustomer(application);

  const status =
    application.status ||
    'PENDING';

  const canReview =
    ![
      'APPROVED',
      'REJECTED',
      'CANCELLED',
    ].includes(status);

  return (
    <div
      className={styles.page}
    >
      <div
        className={
          styles.breadcrumb
        }
      >
        <Link href="/admin/desire-credit">
          DESIRE CREDIT
        </Link>

        <span>/</span>

        <Link href="/admin/desire-credit/applications">
          Applications
        </Link>

        <span>/</span>

        <strong>
          Details
        </strong>
      </div>

      <section
        className={
          styles.header
        }
      >
        <div>
          <span
            className={
              styles.eyebrow
            }
          >
            CREDIT APPLICATION
          </span>

          <h1>
            {getCustomerName(
              application,
            )}
          </h1>

          <p>
            Review the customer's
            DESIRE CREDIT application
            and supporting information.
          </p>
        </div>

        <div
          className={
            styles.headerRight
          }
        >
          <span
            className={`${styles.statusBadge} ${getStatusClass(
              status,
            )}`}
          >
            {formatStatus(
              status,
            )}
          </span>

          <button
            type="button"
            className={
              styles.refreshButton
            }
            disabled={
              refreshing
            }
            onClick={() =>
              loadApplication(true)
            }
          >
            <RefreshIcon />

            {refreshing
              ? 'Refreshing...'
              : 'Refresh'}
          </button>
        </div>
      </section>

      {successMessage && (
        <div
          className={
            styles.successBanner
          }
        >
          <CheckIcon />

          <div>
            <strong>
              Application updated
            </strong>

            <p>
              {successMessage}
            </p>
          </div>
        </div>
      )}

      <section
        className={
          styles.summaryGrid
        }
      >
        <SummaryCard
          label="Requested credit"
          value={formatCurrency(
            getRequestedCredit(
              application,
            ),
          )}
        />

        <SummaryCard
          label="Preferred plan"
          value={formatStatus(
            getPreferredPlan(
              application,
            ),
          )}
        />

        <SummaryCard
          label="Application status"
          value={formatStatus(
            status,
          )}
        />

        <SummaryCard
          label="Applied"
          value={formatDate(
            application.createdAt,
          )}
        />
      </section>

      <section
        className={
          styles.layout
        }
      >
        <div
          className={
            styles.mainColumn
          }
        >
          <DetailsSection
            eyebrow="CUSTOMER"
            title="Customer information"
          >
            <DetailsGrid>
              <Detail
                label="Full name"
                value={getCustomerName(
                  application,
                )}
              />

              <Detail
                label="Email"
                value={getCustomerEmail(
                  application,
                )}
              />

              <Detail
                label="Phone"
                value={getCustomerPhone(
                  application,
                )}
              />

              <Detail
                label="Country"
                value={
                  customer.country ||
                  application
                    ?.country ||
                  '—'
                }
              />
            </DetailsGrid>
          </DetailsSection>

          <DetailsSection
            eyebrow="APPLICATION"
            title="Credit request"
          >
            <DetailsGrid>
              <Detail
                label="Requested credit limit"
                value={formatCurrency(
                  getRequestedCredit(
                    application,
                  ),
                )}
              />

              <Detail
                label="Preferred installment plan"
                value={formatStatus(
                  getPreferredPlan(
                    application,
                  ),
                )}
              />

              <Detail
                label="Employment status"
                value={formatStatus(
                  application
                    ?.employmentStatus,
                )}
              />

              <Detail
                label="Monthly income"
                value={
                  application
                    ?.monthlyIncome !==
                    undefined
                    ? formatCurrency(
                        application
                          .monthlyIncome,
                      )
                    : '—'
                }
              />
            </DetailsGrid>
          </DetailsSection>

          <DetailsSection
            eyebrow="EMPLOYMENT"
            title="Employment and financial information"
          >
            <DetailsGrid>
              <Detail
                label="Employer / business"
                value={
                  application
                    ?.employerName ||
                  application
                    ?.businessName ||
                  '—'
                }
              />

              <Detail
                label="Occupation"
                value={
                  application
                    ?.occupation ||
                  application
                    ?.jobTitle ||
                  '—'
                }
              />

              <Detail
                label="Employment duration"
                value={
                  application
                    ?.employmentDuration ||
                  application
                    ?.yearsEmployed ||
                  '—'
                }
              />

              <Detail
                label="Other income"
                value={
                  application
                    ?.otherIncome !==
                    undefined
                    ? formatCurrency(
                        application
                          .otherIncome,
                      )
                    : '—'
                }
              />
            </DetailsGrid>
          </DetailsSection>

          {(application
            ?.address ||
            application
              ?.residentialAddress ||
            application?.city ||
            application?.state) && (
            <DetailsSection
              eyebrow="ADDRESS"
              title="Residential information"
            >
              <DetailsGrid>
                <Detail
                  label="Address"
                  value={
                    application
                      ?.residentialAddress ||
                    application
                      ?.address ||
                    '—'
                  }
                />

                <Detail
                  label="City"
                  value={
                    application
                      ?.city ||
                    '—'
                  }
                />

                <Detail
                  label="State"
                  value={
                    application
                      ?.state ||
                    '—'
                  }
                />

                <Detail
                  label="Country"
                  value={
                    application
                      ?.country ||
                    customer.country ||
                    '—'
                  }
                />
              </DetailsGrid>
            </DetailsSection>
          )}

          {(application
            ?.reason ||
            application
              ?.purpose ||
            application
              ?.additionalInformation) && (
            <DetailsSection
              eyebrow="ADDITIONAL"
              title="Additional information"
            >
              <div
                className={
                  styles.longText
                }
              >
                {application
                  ?.reason ||
                  application
                    ?.purpose ||
                  application
                    ?.additionalInformation}
              </div>
            </DetailsSection>
          )}

          {(application
            ?.adminNote ||
            application
              ?.reviewNote) && (
            <DetailsSection
              eyebrow="ADMIN"
              title="Review note"
            >
              <div
                className={
                  styles.adminNote
                }
              >
                {application
                  ?.adminNote ||
                  application
                    ?.reviewNote}
              </div>
            </DetailsSection>
          )}
        </div>

        <aside
          className={
            styles.sidebar
          }
        >
          <section
            className={
              styles.actionCard
            }
          >
            <span
              className={
                styles.eyebrow
              }
            >
              REVIEW
            </span>

            <h2>
              Application decision
            </h2>

            <p>
              Update the review status
              after checking the
              customer's application.
            </p>

            {canReview ? (
              <div
                className={
                  styles.actions
                }
              >
                {status !==
                  'UNDER_REVIEW' && (
                  <button
                    type="button"
                    className={
                      styles.secondaryAction
                    }
                    onClick={() =>
                      openReviewModal(
                        'UNDER_REVIEW',
                      )
                    }
                  >
                    Mark under review
                  </button>
                )}

                <button
                  type="button"
                  className={
                    styles.approveAction
                  }
                  onClick={() =>
                    openReviewModal(
                      'APPROVED',
                    )
                  }
                >
                  <CheckIcon />

                  Approve application
                </button>

                <button
                  type="button"
                  className={
                    styles.informationAction
                  }
                  onClick={() =>
                    openReviewModal(
                      'MORE_INFORMATION_REQUIRED',
                    )
                  }
                >
                  Request information
                </button>

                <button
                  type="button"
                  className={
                    styles.rejectAction
                  }
                  onClick={() =>
                    openReviewModal(
                      'REJECTED',
                    )
                  }
                >
                  Reject application
                </button>
              </div>
            ) : (
              <div
                className={
                  styles.finalState
                }
              >
                <strong>
                  Review completed
                </strong>

                <p>
                  This application is
                  currently{' '}
                  {formatStatus(
                    status,
                  )}.
                </p>
              </div>
            )}
          </section>

          <section
            className={
              styles.metaCard
            }
          >
            <span
              className={
                styles.eyebrow
              }
            >
              APPLICATION
            </span>

            <MetaRow
              label="Application ID"
              value={
                application._id ||
                application.id
              }
            />

            <MetaRow
              label="Created"
              value={formatDate(
                application.createdAt,
              )}
            />

            <MetaRow
              label="Updated"
              value={formatDate(
                application.updatedAt,
              )}
            />

            {application
              ?.reviewedAt && (
              <MetaRow
                label="Reviewed"
                value={formatDate(
                  application
                    .reviewedAt,
                )}
              />
            )}

            {application
              ?.approvedAmount !==
              undefined && (
              <MetaRow
                label="Approved amount"
                value={formatCurrency(
                  application
                    .approvedAmount,
                )}
              />
            )}

            {application
              ?.approvedInstallmentPlan && (
              <MetaRow
                label="Approved plan"
                value={formatStatus(
                  application
                    .approvedInstallmentPlan,
                )}
              />
            )}
          </section>
        </aside>
      </section>

      {modal && (
        <div
          className={
            styles.modalBackdrop
          }
          role="presentation"
          onMouseDown={(
            event,
          ) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeModal();
            }
          }}
        >
          <div
            className={
              styles.modal
            }
            role="dialog"
            aria-modal="true"
            aria-labelledby="review-title"
          >
            <div
              className={
                styles.modalHeader
              }
            >
              <div>
                <span
                  className={
                    styles.eyebrow
                  }
                >
                  DESIRE CREDIT
                </span>

                <h2
                  id="review-title"
                >
                  {getModalTitle(
                    modal,
                  )}
                </h2>
              </div>

              <button
                type="button"
                className={
                  styles.closeButton
                }
                disabled={
                  submitting
                }
                onClick={
                  closeModal
                }
                aria-label="Close"
              >
                <CloseIcon />
              </button>
            </div>

            <form
              onSubmit={
                handleReview
              }
            >
              {modal ===
                'APPROVED' && (
                <>
                  <div
                    className={
                      styles.field
                    }
                  >
                    <label
                      htmlFor="approvedAmount"
                    >
                      Approved amount
                    </label>

                    <div
                      className={
                        styles.currencyInput
                      }
                    >
                      <span>
                        ₦
                      </span>

                      <input
                        id="approvedAmount"
                        type="number"
                        min="5000"
                        max="1000000"
                        step="1"
                        value={
                          approvedAmount
                        }
                        onChange={(
                          event,
                        ) =>
                          setApprovedAmount(
                            event
                              .target
                              .value,
                          )
                        }
                        required
                      />
                    </div>

                    <small>
                      Minimum ₦5,000.
                      Maximum
                      ₦1,000,000.
                    </small>
                  </div>

                  <div
                    className={
                      styles.field
                    }
                  >
                    <label
                      htmlFor="approvedInstallmentPlan"
                    >
                      Approved
                      installment plan
                    </label>

                    <select
                      id="approvedInstallmentPlan"
                      value={
                        approvedInstallmentPlan
                      }
                      onChange={(
                        event,
                      ) =>
                        setApprovedInstallmentPlan(
                          event
                            .target
                            .value,
                        )
                      }
                      required
                    >
                      <option value="">
                        Select a plan
                      </option>

                      {INSTALLMENT_PLANS.map(
                        (plan) => (
                          <option
                            key={
                              plan.value
                            }
                            value={
                              plan.value
                            }
                          >
                            {
                              plan.label
                            }
                          </option>
                        ),
                      )}
                    </select>
                  </div>
                </>
              )}

              <div
                className={
                  styles.field
                }
              >
                <label
                  htmlFor="adminNote"
                >
                  Admin note
                  {modal ===
                    'REJECTED' ||
                  modal ===
                    'MORE_INFORMATION_REQUIRED'
                    ? ' *'
                    : ''}
                </label>

                <textarea
                  id="adminNote"
                  rows="5"
                  value={
                    adminNote
                  }
                  onChange={(
                    event,
                  ) =>
                    setAdminNote(
                      event
                        .target
                        .value,
                    )
                  }
                  placeholder={
                    getNotePlaceholder(
                      modal,
                    )
                  }
                  required={
                    modal ===
                      'REJECTED' ||
                    modal ===
                      'MORE_INFORMATION_REQUIRED'
                  }
                />
              </div>

              {actionError && (
                <div
                  className={
                    styles.modalError
                  }
                >
                  {actionError}
                </div>
              )}

              <div
                className={
                  styles.modalActions
                }
              >
                <button
                  type="button"
                  className={
                    styles.cancelButton
                  }
                  disabled={
                    submitting
                  }
                  onClick={
                    closeModal
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className={`${styles.confirmButton} ${
                    modal ===
                    'REJECTED'
                      ? styles.confirmReject
                      : ''
                  }`}
                  disabled={
                    submitting
                  }
                >
                  {submitting
                    ? 'Saving...'
                    : getSubmitLabel(
                        modal,
                      )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailsSection({
  eyebrow,
  title,
  children,
}) {
  return (
    <section
      className={
        styles.detailsCard
      }
    >
      <div
        className={
          styles.sectionHeader
        }
      >
        <span
          className={
            styles.eyebrow
          }
        >
          {eyebrow}
        </span>

        <h2>
          {title}
        </h2>
      </div>

      {children}
    </section>
  );
}

function DetailsGrid({
  children,
}) {
  return (
    <div
      className={
        styles.detailsGrid
      }
    >
      {children}
    </div>
  );
}

function Detail({
  label,
  value,
}) {
  return (
    <div
      className={
        styles.detail
      }
    >
      <span>
        {label}
      </span>

      <strong>
        {value || '—'}
      </strong>
    </div>
  );
}

function SummaryCard({
  label,
  value,
}) {
  return (
    <article
      className={
        styles.summaryCard
      }
    >
      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>
    </article>
  );
}

function MetaRow({
  label,
  value,
}) {
  return (
    <div
      className={
        styles.metaRow
      }
    >
      <span>
        {label}
      </span>

      <strong>
        {value || '—'}
      </strong>
    </div>
  );
}

function getModalTitle(
  status,
) {
  switch (status) {
    case 'APPROVED':
      return 'Approve application';

    case 'REJECTED':
      return 'Reject application';

    case 'UNDER_REVIEW':
      return 'Mark under review';

    case 'MORE_INFORMATION_REQUIRED':
      return 'Request more information';

    default:
      return 'Review application';
  }
}

function getSubmitLabel(
  status,
) {
  switch (status) {
    case 'APPROVED':
      return 'Approve';

    case 'REJECTED':
      return 'Reject';

    case 'UNDER_REVIEW':
      return 'Update status';

    case 'MORE_INFORMATION_REQUIRED':
      return 'Request information';

    default:
      return 'Save';
  }
}

function getNotePlaceholder(
  status,
) {
  switch (status) {
    case 'APPROVED':
      return 'Optional internal approval note...';

    case 'REJECTED':
      return 'Enter the reason for rejecting this application...';

    case 'UNDER_REVIEW':
      return 'Optional note about the review...';

    case 'MORE_INFORMATION_REQUIRED':
      return 'Explain what additional information is required...';

    default:
      return 'Add an admin note...';
  }
}

function ApplicationIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M6 3h9l4 4v14H6V3Z" />
      <path d="M15 3v5h5" />
      <path d="M9 12h6" />
      <path d="M9 16h6" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M20 7v5h-5" />
      <path d="M4 17v-5h5" />
      <path d="M6.5 9a7 7 0 0 1 11.5-2" />
      <path d="M17.5 15a7 7 0 0 1-11.5 2" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M6 6l12 12" />
      <path d="M18 6 6 18" />
    </svg>
  );
}
