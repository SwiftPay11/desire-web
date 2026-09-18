'use client';

import Link from 'next/link';
import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  CREDIT_INSTALLMENT_PLAN_OPTIONS,
  getMyCreditPurchases,
} from '@/services/desire-credit.service';

import styles from './purchases.module.css';

function formatNaira(value) {
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
    return 'Not available';
  }

  const date = new Date(value);

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
      month: 'short',
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

  const option =
    CREDIT_INSTALLMENT_PLAN_OPTIONS.find(
      (item) =>
        item.value === value,
    );

  return (
    option?.label ||
    formatStatus(value)
  );
}

function normalizePurchases(
  response,
) {
  if (Array.isArray(response)) {
    return response;
  }

  if (
    Array.isArray(
      response?.purchases,
    )
  ) {
    return response.purchases;
  }

  if (
    Array.isArray(
      response?.creditPurchases,
    )
  ) {
    return response.creditPurchases;
  }

  return [];
}

function getOrderNumber(
  purchase,
) {
  const order =
    purchase?.order &&
    typeof purchase.order ===
      'object'
      ? purchase.order
      : null;

  if (order?.orderNumber) {
    return order.orderNumber;
  }

  if (purchase?._id) {
    return `#${purchase._id
      .slice(-8)
      .toUpperCase()}`;
  }

  return 'DESIRE CREDIT';
}

export default function DesireCreditPurchasesPage() {
  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    purchases,
    setPurchases,
  ] = useState([]);

  const [
    error,
    setError,
  ] = useState('');

  const [
    filter,
    setFilter,
  ] = useState('ALL');

  useEffect(() => {
    let active = true;

    async function loadPurchases() {
      setLoading(true);
      setError('');

      try {
        const response =
          await getMyCreditPurchases();

        if (!active) {
          return;
        }

        setPurchases(
          normalizePurchases(
            response,
          ),
        );
      } catch (requestError) {
        if (!active) {
          return;
        }

        setPurchases([]);

        setError(
          requestError?.message ||
            'Unable to load your DESIRE CREDIT purchases.',
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadPurchases();

    return () => {
      active = false;
    };
  }, []);

 const filteredPurchases =
  useMemo(() => {
    if (filter === 'ALL') {
      return purchases;
    }

    if (filter === 'COMPLETED') {
      return purchases.filter(
        (purchase) =>
          purchase.status ===
            'FULLY_PAID' ||
          purchase.status ===
            'COMPLETED',
      );
    }

    return purchases.filter(
      (purchase) =>
        purchase.status ===
        filter,
    );
  }, [purchases, filter]);

  const activeCount =
    purchases.filter(
      (purchase) =>
        purchase.status ===
          'ACTIVE' ||
        purchase.status ===
          'OVERDUE',
    ).length;

  const completedCount =
    purchases.filter(
      (purchase) =>
        purchase.status ===
          'FULLY_PAID' ||
        purchase.status ===
          'COMPLETED',
    ).length;

  const totalOutstanding =
    purchases.reduce(
      (total, purchase) =>
        total +
        Number(
          purchase
            .outstandingBalance ||
            0,
        ),
      0,
    );

  if (loading) {
    return (
      <main
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
            Loading purchases...
          </h1>

          <p>
            Retrieving your
            DESIRE CREDIT purchase
            history.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main
      className={
        styles.page
      }
    >
      <div
        className={
          styles.backRow
        }
      >
        <Link href="/account/desire-credit">
          <ArrowLeftIcon />
          Back to DESIRE CREDIT
        </Link>
      </div>

      <section
        className={
          styles.hero
        }
      >
        <div
          className={
            styles.heroContent
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
            Your purchases
          </h1>

          <p>
            Review every purchase
            made with DESIRE CREDIT,
            track your repayment
            progress and manage
            outstanding installments.
          </p>
        </div>

        <div
          className={
            styles.heroSide
          }
        >
          <span>
            Total purchases
          </span>

          <strong>
            {purchases.length}
          </strong>

          <p>
            Your complete DESIRE
            CREDIT purchase history.
          </p>
        </div>
      </section>

      <section
        className={
          styles.summaryGrid
        }
      >
        <div>
          <span>
            Active purchases
          </span>

          <strong>
            {activeCount}
          </strong>
        </div>

        <div>
          <span>
            Completed
          </span>

          <strong>
            {completedCount}
          </strong>
        </div>

        <div>
          <span>
            Total outstanding
          </span>

          <strong>
            {formatNaira(
              totalOutstanding,
            )}
          </strong>
        </div>
      </section>

      {error ? (
        <div
          className={
            styles.errorBanner
          }
        >
          {error}
        </div>
      ) : null}

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
              PURCHASE HISTORY
            </span>

            <h2>
              DESIRE CREDIT
              purchases
            </h2>

            <p>
              Select a purchase to
              view its complete
              installment schedule
              and repayment details.
            </p>
          </div>

          <span
            className={
              styles.resultCount
            }
          >
            {
              filteredPurchases.length
            }{' '}
            {filteredPurchases.length ===
            1
              ? 'Purchase'
              : 'Purchases'}
          </span>
        </div>

        <div
          className={
            styles.filters
          }
        >
          <button
            type="button"
            className={
              filter === 'ALL'
                ? styles.activeFilter
                : ''
            }
            onClick={() =>
              setFilter('ALL')
            }
          >
            All
          </button>

          <button
            type="button"
            className={
              filter === 'ACTIVE'
                ? styles.activeFilter
                : ''
            }
            onClick={() =>
              setFilter('ACTIVE')
            }
          >
            Active
          </button>

          <button
            type="button"
            className={
              filter ===
              'PENDING_COMMITMENT_PAYMENT'
                ? styles.activeFilter
                : ''
            }
            onClick={() =>
              setFilter(
                'PENDING_COMMITMENT_PAYMENT',
              )
            }
          >
            Pending
          </button>

          <button
            type="button"
            className={
              filter === 'OVERDUE'
                ? styles.activeFilter
                : ''
            }
            onClick={() =>
              setFilter(
                'OVERDUE',
              )
            }
          >
            Overdue
          </button>

          <button
            type="button"
            className={
              filter ===
                'FULLY_PAID' ||
              filter ===
                'COMPLETED'
                ? styles.activeFilter
                : ''
            }
            onClick={() =>
              setFilter(
                'COMPLETED',
              )
            }
          >
            Completed
          </button>
        </div>

        {filteredPurchases.length ===
        0 ? (
          <div
            className={
              styles.emptyState
            }
          >
            <span>
              DESIRE CREDIT
            </span>

            <h3>
              {purchases.length ===
              0
                ? 'No purchases yet.'
                : 'No purchases found.'}
            </h3>

            <p>
              {purchases.length ===
              0
                ? 'Your DESIRE CREDIT purchases will appear here after you complete an eligible purchase.'
                : 'There are no purchases matching this filter.'}
            </p>

            {purchases.length ===
            0 ? (
              <Link
                href="/products"
                className={
                  styles.shopButton
                }
              >
                Shop DESIRE
                <ArrowIcon />
              </Link>
            ) : null}
          </div>
        ) : (
          <div
            className={
              styles.purchaseList
            }
          >
            {filteredPurchases.map(
              (purchase) => (
                <PurchaseCard
                  key={
                    purchase._id
                  }
                  purchase={
                    purchase
                  }
                />
              ),
            )}
          </div>
        )}
      </section>
    </main>
  );
}

function PurchaseCard({
  purchase,
}) {
  const progress =
    Number(
      purchase.financedAmount ||
        0,
    ) > 0
      ? Math.min(
          100,
          Math.max(
            0,
            (Number(
              purchase.amountRepaid ||
                0,
            ) /
              Number(
                purchase.financedAmount,
              )) *
              100,
          ),
        )
      : 0;

  return (
    <article
      className={
        styles.purchaseCard
      }
    >
      <div
        className={
          styles.purchaseTop
        }
      >
        <div>
          <span>
            Purchase
          </span>

          <strong>
            {getOrderNumber(
              purchase,
            )}
          </strong>

          <small>
            {formatDate(
              purchase.createdAt,
            )}
          </small>
        </div>

        <span
          className={
            styles.statusBadge
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
            Order amount
          </span>

          <strong>
            {formatNaira(
              purchase.orderAmount,
            )}
          </strong>
        </div>

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
      </div>

      <div
        className={
          styles.planRow
        }
      >
        <div>
          <span>
            Repayment plan
          </span>

          <strong>
            {getInstallmentPlanLabel(
              purchase
                .installmentPlan,
            )}
          </strong>
        </div>

        <div>
          <span>
            Final payment
          </span>

          <strong>
            {formatDate(
              purchase
                .finalPaymentDueDate,
            )}
          </strong>
        </div>
      </div>

      <div
        className={
          styles.progressArea
        }
      >
        <div
          className={
            styles.progressHeader
          }
        >
          <span>
            Repayment progress
          </span>

          <strong>
            {Math.round(
              progress,
            )}
            %
          </strong>
        </div>

        <div
          className={
            styles.progressTrack
          }
        >
          <div
            className={
              styles.progressFill
            }
            style={{
              width: `${progress}%`,
            }}
          />
        </div>
      </div>

      <div
        className={
          styles.purchaseFooter
        }
      >
        <span>
          View the repayment
          schedule and installment
          details for this
          purchase.
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