'use client';

import Link from 'next/link';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  CREDIT_ACCOUNT_STATUSES,
  CREDIT_APPLICATION_STATUSES,
  CREDIT_INSTALLMENT_PLAN_OPTIONS,
  getMyCreditAccount,
  getMyCreditApplications,
  getMyCreditPurchases,
} from '@/services/desire-credit.service';

import styles from './desire-credit.module.css';

function formatNaira(value) {
  const amount =
    Number(value || 0);

  return new Intl.NumberFormat(
    'en-NG',
    {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    },
  ).format(amount);
}

function formatDate(value) {
  if (!value) {
    return 'Not available';
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return 'Not available';
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

function getInstallmentPlanLabel(
  value,
) {
  if (!value) {
    return 'Not selected';
  }

  const plan =
    CREDIT_INSTALLMENT_PLAN_OPTIONS.find(
      (option) =>
        option.value === value,
    );

  return (
    plan?.label ||
    formatStatus(value)
  );
}

function normalizeAccount(
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
    response.account ||
    response.creditAccount ||
    response
  );
}

function normalizeApplications(
  response,
) {
  if (
    Array.isArray(response)
  ) {
    return response;
  }

  if (
    Array.isArray(
      response?.applications,
    )
  ) {
    return response.applications;
  }

  return [];
}

function normalizePurchases(
  response,
) {
  if (
    Array.isArray(response)
  ) {
    return response;
  }

  if (
    Array.isArray(
      response?.purchases,
    )
  ) {
    return response.purchases;
  }

  return [];
}

function getLatestApplication(
  applications,
) {
  if (
    !applications.length
  ) {
    return null;
  }

  return [...applications].sort(
    (a, b) =>
      new Date(
        b.createdAt || 0,
      ).getTime() -
      new Date(
        a.createdAt || 0,
      ).getTime(),
  )[0];
}

function getApplicationMessage(
  application,
) {
  if (!application) {
    return null;
  }

  switch (
    application.status
  ) {
    case CREDIT_APPLICATION_STATUSES.PENDING:
      return {
        eyebrow:
          'Application submitted',

        title:
          'Your application is awaiting review.',

        description:
          'Your DESIRE CREDIT application has been received. You can review your application details here while it awaits review.',
      };

    case CREDIT_APPLICATION_STATUSES.UNDER_REVIEW:
      return {
        eyebrow:
          'Application under review',

        title:
          'Your application is being reviewed.',

        description:
          'Your DESIRE CREDIT application is currently under review. Your status will be updated here when the review changes.',
      };

    case CREDIT_APPLICATION_STATUSES.MORE_INFORMATION_REQUIRED:
      return {
        eyebrow:
          'Action required',

        title:
          'More information is required.',

        description:
          'Additional information has been requested for your DESIRE CREDIT application. Review the request below.',
      };

    case CREDIT_APPLICATION_STATUSES.APPROVED:
      return {
        eyebrow:
          'Application approved',

        title:
          'Your DESIRE CREDIT application has been approved.',

        description:
          'Your application has been approved. Your DESIRE CREDIT account details will appear here when the credit account is available.',
      };

    case CREDIT_APPLICATION_STATUSES.REJECTED:
      return {
        eyebrow:
          'Application reviewed',

        title:
          'Your application was not approved.',

        description:
          'Your DESIRE CREDIT application has completed review. Review the application information below.',
      };

    case CREDIT_APPLICATION_STATUSES.CANCELLED:
      return {
        eyebrow:
          'Application cancelled',

        title:
          'This application was cancelled.',

        description:
          'Your previous DESIRE CREDIT application is no longer active. You can submit a new application.',
      };

    default:
      return {
        eyebrow:
          'DESIRE CREDIT application',

        title:
          'Review your application.',

        description:
          'Your DESIRE CREDIT application information is available below.',
      };
  }
}

export default function DesireCreditPage() {
  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    account,
    setAccount,
  ] = useState(null);

  const [
    applications,
    setApplications,
  ] = useState([]);

  const [
    purchases,
    setPurchases,
  ] = useState([]);

  const [
    loadError,
    setLoadError,
  ] = useState('');

  useEffect(() => {
    let active = true;

    async function loadCredit() {
      setLoading(true);
      setLoadError('');

      const [
        accountResult,
        applicationsResult,
        purchasesResult,
      ] =
        await Promise.allSettled([
          getMyCreditAccount(),
          getMyCreditApplications(),
          getMyCreditPurchases(),
        ]);

      if (!active) {
        return;
      }

      if (
        accountResult.status ===
        'fulfilled'
      ) {
        setAccount(
          normalizeAccount(
            accountResult.value,
          ),
        );
      } else {
        /*
         * A missing credit account
         * is normal before approval,
         * so applications are still
         * loaded independently.
         */
        setAccount(null);
      }

      if (
        applicationsResult.status ===
        'fulfilled'
      ) {
        setApplications(
          normalizeApplications(
            applicationsResult.value,
          ),
        );
      } else {
        setApplications([]);

        setLoadError(
          applicationsResult
            .reason?.message ||
            'Unable to load your DESIRE CREDIT information.',
        );
      }

      if (
        purchasesResult.status ===
        'fulfilled'
      ) {
        setPurchases(
          normalizePurchases(
            purchasesResult.value,
          ),
        );
      } else {
        setPurchases([]);
      }

      setLoading(false);
    }

    loadCredit();

    return () => {
      active = false;
    };
  }, []);

  const latestApplication =
    useMemo(
      () =>
        getLatestApplication(
          applications,
        ),
      [applications],
    );

  if (loading) {
    return (
      <div
        className={
          styles.page
        }
      >
        <div
          className={
            styles.loadingState
          }
        >
          <span>
            DESIRE CREDIT
          </span>

          <h1>
            Loading your credit
            account...
          </h1>

          <p>
            Please wait while we
            retrieve your DESIRE
            CREDIT information.
          </p>
        </div>
      </div>
    );
  }

  if (
    account &&
    account._id
  ) {
    return (
      <CreditAccountView
        account={account}
        application={
          latestApplication
        }
        purchases={
          purchases
        }
      />
    );
  }

  if (
    latestApplication
  ) {
    return (
      <ApplicationView
        application={
          latestApplication
        }
        loadError={
          loadError
        }
      />
    );
  }

  return (
    <NoApplicationView
      loadError={loadError}
    />
  );
}

function NoApplicationView({
  loadError,
}) {
  return (
    <div
      className={
        styles.page
      }
    >
      <div
        className={
          styles.backRow
        }
      >
        <Link href="/account">
          <ArrowLeftIcon />
          Back to account
        </Link>
      </div>

      <section
        className={
          styles.introHero
        }
      >
        <div
          className={
            styles.introContent
          }
        >
          <span
            className={
              styles.eyebrowLight
            }
          >
            DESIRE CREDIT
          </span>

          <h1>
            More flexibility
            <br />
            for your DESIRE.
          </h1>

          <p>
            Apply for DESIRE
            CREDIT from your
            customer account and,
            if approved, access a
            credit limit for
            eligible DESIRE
            purchases.
          </p>

          <div
            className={
              styles.heroActions
            }
          >
            <Link
              href="/account/desire-credit/apply"
              className={
                styles.lightButton
              }
            >
              Apply for DESIRE
              CREDIT
              <ArrowIcon />
            </Link>

            <Link
              href="/shop"
              className={
                styles.darkTextLink
              }
            >
              Browse collection
            </Link>
          </div>
        </div>

        <div
          className={
            styles.introSide
          }
        >
          <span>
            Current status
          </span>

          <strong>
            Not applied
          </strong>

          <p>
            Complete an application
            to begin your DESIRE
            CREDIT review.
          </p>
        </div>
      </section>

      {loadError && (
        <div
          className={
            styles.errorBanner
          }
        >
          {loadError}
        </div>
      )}

      <section
        className={
          styles.explainerGrid
        }
      >
        <article>
          <span>
            01
          </span>

          <h2>
            Apply
          </h2>

          <p>
            Submit your requested
            amount, contact,
            employment and
            repayment information.
          </p>
        </article>

        <article>
          <span>
            02
          </span>

          <h2>
            Review
          </h2>

          <p>
            Your application moves
            through the DESIRE
            CREDIT review process.
          </p>
        </article>

        <article>
          <span>
            03
          </span>

          <h2>
            Access credit
          </h2>

          <p>
            If approved, your
            credit limit and
            available credit are
            displayed in your
            account.
          </p>
        </article>
      </section>
    </div>
  );
}

function ApplicationView({
  application,
  loadError,
}) {
  const statusContent =
    getApplicationMessage(
      application,
    );

  const canReapply =
    application.status ===
      CREDIT_APPLICATION_STATUSES.REJECTED ||
    application.status ===
      CREDIT_APPLICATION_STATUSES.CANCELLED;

  const needsInformation =
    application.status ===
    CREDIT_APPLICATION_STATUSES.MORE_INFORMATION_REQUIRED;

  const approved =
    application.status ===
    CREDIT_APPLICATION_STATUSES.APPROVED;

  return (
    <div
      className={
        styles.page
      }
    >
      <div
        className={
          styles.backRow
        }
      >
        <Link href="/account">
          <ArrowLeftIcon />
          Back to account
        </Link>
      </div>

      <section
        className={
          styles.statusHero
        }
      >
        <div>
          <span
            className={
              styles.eyebrow
            }
          >
            {
              statusContent.eyebrow
            }
          </span>

          <h1>
            {
              statusContent.title
            }
          </h1>

          <p>
            {
              statusContent.description
            }
          </p>
        </div>

        <span
          className={
            styles.statusBadge
          }
        >
          {formatStatus(
            application.status,
          )}
        </span>
      </section>

      {loadError && (
        <div
          className={
            styles.errorBanner
          }
        >
          {loadError}
        </div>
      )}

      {needsInformation &&
        application
          .informationRequest && (
          <section
            className={
              styles.noticeCard
            }
          >
            <span>
              Information requested
            </span>

            <h2>
              Additional
              information is
              needed.
            </h2>

            <p>
              {
                application
                  .informationRequest
              }
            </p>
          </section>
        )}

      {application.status ===
        CREDIT_APPLICATION_STATUSES.REJECTED &&
        application
          .rejectionReason && (
          <section
            className={
              styles.noticeCard
            }
          >
            <span>
              Review information
            </span>

            <h2>
              Application result
            </h2>

            <p>
              {
                application
                  .rejectionReason
              }
            </p>
          </section>
        )}

      {approved && (
        <section
          className={
            styles.approvedNotice
          }
        >
          <div>
            <span>
              Approved credit
            </span>

            <strong>
              {formatNaira(
                application
                  .approvedAmount,
              )}
            </strong>
          </div>

          <div>
            <span>
              Approved plan
            </span>

            <strong>
              {getInstallmentPlanLabel(
                application
                  .approvedInstallmentPlan,
              )}
            </strong>
          </div>
        </section>
      )}

      <section
        className={
          styles.applicationLayout
        }
      >
        <div
          className={
            styles.applicationCard
          }
        >
          <div
            className={
              styles.sectionHeader
            }
          >
            <div>
              <span
                className={
                  styles.eyebrow
                }
              >
                Application
                overview
              </span>

              <h2>
                Your credit
                request
              </h2>
            </div>

            <span
              className={
                styles.applicationNumber
              }
            >
              {application._id
                ? `#${application._id
                    .slice(-8)
                    .toUpperCase()}`
                : 'DESIRE CREDIT'}
            </span>
          </div>

          <div
            className={
              styles.detailGrid
            }
          >
            <DetailItem
              label="Requested amount"
              value={formatNaira(
                application
                  .requestedAmount,
              )}
            />

            <DetailItem
              label="Preferred plan"
              value={getInstallmentPlanLabel(
                application
                  .preferredInstallmentPlan,
              )}
            />

            <DetailItem
              label="Application status"
              value={formatStatus(
                application.status,
              )}
            />

            <DetailItem
              label="Submitted"
              value={formatDate(
                application.createdAt,
              )}
            />

            <DetailItem
              label="Employment"
              value={formatStatus(
                application
                  .employmentStatus,
              )}
            />

            <DetailItem
              label="Monthly income"
              value={formatNaira(
                application
                  .monthlyIncome,
              )}
            />
          </div>
        </div>

        <aside
          className={
            styles.sideCard
          }
        >
          <span
            className={
              styles.eyebrow
            }
          >
            Application status
          </span>

          <h2>
            What happens next?
          </h2>

          {application.status ===
            CREDIT_APPLICATION_STATUSES.PENDING && (
            <p>
              Your application has
              been submitted and is
              waiting to enter
              review. You do not
              need to submit
              another application.
            </p>
          )}

          {application.status ===
            CREDIT_APPLICATION_STATUSES.UNDER_REVIEW && (
            <p>
              Your application is
              currently being
              reviewed. Return to
              this page to view
              changes to its
              status.
            </p>
          )}

          {needsInformation && (
            <p>
              Review the
              information request
              shown above. The
              application remains
              active while more
              information is
              required.
            </p>
          )}

          {approved && (
            <p>
              Your application has
              been approved. Once
              your DESIRE CREDIT
              account is available,
              this page will show
              your credit balance
              and account details.
            </p>
          )}

          {application.status ===
            CREDIT_APPLICATION_STATUSES.REJECTED && (
            <p>
              This application has
              completed review and
              was not approved.
              Review any reason
              provided above.
            </p>
          )}

          {application.status ===
            CREDIT_APPLICATION_STATUSES.CANCELLED && (
            <p>
              This application is
              no longer active. You
              can start another
              application when
              ready.
            </p>
          )}

          {canReapply && (
            <Link
              href="/account/desire-credit/apply"
              className={
                styles.primaryButton
              }
            >
              Apply again
              <ArrowIcon />
            </Link>
          )}

          {!canReapply && (
            <Link
              href="/shop"
              className={
                styles.outlineButton
              }
            >
              Browse DESIRE
            </Link>
          )}
        </aside>
      </section>
    </div>
  );
}

function CreditAccountView({
  account,
  application,
  purchases,
}) {
  const active =
    account.status ===
    CREDIT_ACCOUNT_STATUSES.ACTIVE;

  return (
    <div
      className={
        styles.page
      }
    >
      <div
        className={
          styles.backRow
        }
      >
        <Link href="/account">
          <ArrowLeftIcon />
          Back to account
        </Link>
      </div>

      <section
        className={
          styles.accountHero
        }
      >
        <div
          className={
            styles.accountHeroTop
          }
        >
          <div>
            <span
              className={
                styles.eyebrowLight
              }
            >
              DESIRE CREDIT
            </span>

            <h1>
              Your credit,
              <br />
              your flexibility.
            </h1>

            <p>
              Review your available
              credit, account
              balance and repayment
              information.
            </p>
          </div>

          <span
            className={
              styles.accountStatus
            }
          >
            {formatStatus(
              account.status,
            )}
          </span>
        </div>

        <div
          className={
            styles.balanceGrid
          }
        >
          <div
            className={
              styles.mainBalance
            }
          >
            <span>
              Available credit
            </span>

            <strong>
              {formatNaira(
                account.availableCredit,
              )}
            </strong>
          </div>

          <div>
            <span>
              Credit limit
            </span>

            <strong>
              {formatNaira(
                account.creditLimit,
              )}
            </strong>
          </div>

          <div>
            <span>
              Used credit
            </span>

            <strong>
              {formatNaira(
                account.usedCredit,
              )}
            </strong>
          </div>
        </div>

        {active && (
          <div
            className={
              styles.accountActions
            }
          >
            <Link
              href="/shop"
              className={
                styles.lightButton
              }
            >
              Shop DESIRE
              <ArrowIcon />
            </Link>
          </div>
        )}
      </section>

      {!active && (
        <section
          className={
            styles.restrictionNotice
          }
        >
          <div>
            <span>
              Account status
            </span>

            <h2>
              Your DESIRE CREDIT
              account is currently{' '}
              {formatStatus(
                account.status,
              ).toLowerCase()}.
            </h2>
          </div>

          <p>
            {account.statusReason ||
              'Credit purchases are currently unavailable on this account.'}
          </p>
        </section>
      )}

      <section
        className={
          styles.accountDetailsGrid
        }
      >
        <article
          className={
            styles.accountDetailsCard
          }
        >
          <div
            className={
              styles.sectionHeader
            }
          >
            <div>
              <span
                className={
                  styles.eyebrow
                }
              >
                Credit overview
              </span>

              <h2>
                Account details
              </h2>
            </div>
          </div>

          <div
            className={
              styles.detailGrid
            }
          >
            <DetailItem
              label="Outstanding balance"
              value={formatNaira(
                account
                  .outstandingBalance,
              )}
            />

            <DetailItem
              label="Total borrowed"
              value={formatNaira(
                account
                  .totalBorrowed,
              )}
            />

            <DetailItem
              label="Total repaid"
              value={formatNaira(
                account
                  .totalRepaid,
              )}
            />

            <DetailItem
              label="Commitment payment"
              value={formatNaira(
                account
                  .commitmentPayment,
              )}
            />

            <DetailItem
              label="Repayment plan"
              value={getInstallmentPlanLabel(
                account
                  .installmentPlan,
              )}
            />

            <DetailItem
              label="Account status"
              value={formatStatus(
                account.status,
              )}
            />
          </div>
        </article>

        <article
          className={
            styles.nextPaymentCard
          }
        >
          <span
            className={
              styles.eyebrow
            }
          >
            Repayment
          </span>

          <h2>
            Next payment
          </h2>

          <strong
            className={
              styles.nextPaymentAmount
            }
          >
            {formatNaira(
              account
                .nextPaymentAmount,
            )}
          </strong>

          <dl>
            <div>
              <dt>
                Due date
              </dt>

              <dd>
                {formatDate(
                  account
                    .nextPaymentDueDate,
                )}
              </dd>
            </div>

            <div>
              <dt>
                Overdue balance
              </dt>

              <dd>
                {formatNaira(
                  account
                    .overdueBalance,
                )}
              </dd>
            </div>

            <div>
              <dt>
                Missed payments
              </dt>

              <dd>
                {Number(
                  account
                    .missedPayments ||
                    0,
                )}
              </dd>
            </div>
          </dl>
        </article>
      </section>

      {application && (
        <section
          className={
            styles.approvalSummary
          }
        >
          <div>
            <span>
              Original request
            </span>

            <strong>
              {formatNaira(
                application
                  .requestedAmount,
              )}
            </strong>
          </div>

          <div>
            <span>
              Approved amount
            </span>

            <strong>
              {formatNaira(
                application
                  .approvedAmount ||
                  account.creditLimit,
              )}
            </strong>
          </div>

          <div>
            <span>
              Approved plan
            </span>

            <strong>
              {getInstallmentPlanLabel(
                application
                  .approvedInstallmentPlan ||
                  account
                    .installmentPlan,
              )}
            </strong>
          </div>
        </section>
      )}

      <section
        className={
          styles.purchasesSection
        }
      >
        <div
          className={
            styles.sectionHeader
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

            <h2>
              Your purchases
            </h2>
          </div>

          <span
            className={
              styles.purchaseCount
            }
          >
            {purchases.length}{' '}
            {purchases.length === 1
              ? 'purchase'
              : 'purchases'}
          </span>
        </div>

        {purchases.length ===
        0 ? (
          <div
            className={
              styles.emptyPurchases
            }
          >
            <h3>
              No credit purchases
              yet.
            </h3>

            <p>
              Purchases made with
              DESIRE CREDIT will
              appear here with
              their repayment
              information.
            </p>

            {active && (
              <Link
                href="/shop"
                className={
                  styles.primaryButton
                }
              >
                Shop DESIRE
                <ArrowIcon />
              </Link>
            )}
          </div>
        ) : (
          <div
            className={
              styles.purchaseList
            }
          >
            {purchases.map(
              (purchase) => {
                const order =
                  purchase.order &&
                  typeof purchase.order ===
                    'object'
                    ? purchase.order
                    : null;

                return (
                  <article
                    key={
                      purchase._id
                    }
                    className={
                      styles.purchaseCard
                    }
                  >
                    <div
                      className={
                        styles.purchaseCardTop
                      }
                    >
                      <div>
                        <span>
                          {order?.orderNumber ||
                            `Credit purchase #${purchase._id
                              ?.slice(-8)
                              .toUpperCase()}`}
                        </span>

                        <strong>
                          {formatNaira(
                            purchase
                              .orderAmount,
                          )}
                        </strong>
                      </div>

                      <span
                        className={
                          styles.purchaseStatus
                        }
                      >
                        {formatStatus(
                          purchase.status,
                        )}
                      </span>
                    </div>

                    <div
                      className={
                        styles.purchaseDetails
                      }
                    >
                      <div>
                        <span>
                          Financed
                        </span>

                        <strong>
                          {formatNaira(
                            purchase
                              .financedAmount,
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Repaid
                        </span>

                        <strong>
                          {formatNaira(
                            purchase
                              .amountRepaid,
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Outstanding
                        </span>

                        <strong>
                          {formatNaira(
                            purchase
                              .outstandingBalance,
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Plan
                        </span>

                        <strong>
                          {getInstallmentPlanLabel(
                            purchase
                              .installmentPlan,
                          )}
                        </strong>
                      </div>
                    </div>

                    <div
                      className={
                        styles.purchaseFooter
                      }
                    >
                      <span>
                        {purchase
                          .finalPaymentDueDate
                          ? `Final payment ${formatDate(
                              purchase
                                .finalPaymentDueDate,
                            )}`
                          : 'Repayment schedule pending'}
                      </span>

                      <Link
                        href={`/account/desire-credit/purchases/${purchase._id}`}
                      >
                        View purchase
                        <ArrowIcon />
                      </Link>
                    </div>
                  </article>
                );
              },
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function DetailItem({
  label,
  value,
}) {
  return (
    <div
      className={
        styles.detailItem
      }
    >
      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>
    </div>
  );
}

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M5 12h14M14 7l5 5-5 5" />
    </svg>
  );
}

function ArrowLeftIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M19 12H5M10 7l-5 5 5 5" />
    </svg>
  );
}