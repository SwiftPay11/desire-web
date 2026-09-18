'use client';

import Link from 'next/link';
import {
  useEffect,
  useState,
} from 'react';
import {
  useRouter,
} from 'next/navigation';

import { useAuth } from '@/hooks/useAuth';

import {
  applyForDesireCredit,
  CREDIT_INSTALLMENT_PLAN_OPTIONS,
  EMPLOYMENT_STATUS_OPTIONS,
  getMyCreditAccount,
  getMyCreditApplications,
} from '@/services/desire-credit.service';

import styles from './apply.module.css';

const INITIAL_FORM = {
  requestedAmount: '',
  employmentStatus: '',
  employerName: '',
  occupation: '',
  monthlyIncome: '',
  phone: '',
  email: '',
  residentialAddress: '',
  city: '',
  state: '',
  country: 'Nigeria',
  nextOfKinName: '',
  nextOfKinPhone: '',
  nextOfKinRelationship: '',
  preferredInstallmentPlan: '',
  reason: '',
};

const BLOCKING_APPLICATION_STATUSES =
  new Set([
    'PENDING',
    'UNDER_REVIEW',
    'MORE_INFORMATION_REQUIRED',
    'APPROVED',
  ]);

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

function normalizeApplications(
  response,
) {
  if (Array.isArray(response)) {
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

function getLatestApplication(
  applications,
) {
  if (!applications.length) {
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

export default function DesireCreditApplyPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [
    form,
    setForm,
  ] = useState(
    INITIAL_FORM,
  );

  const [
    checkingEligibility,
    setCheckingEligibility,
  ] = useState(true);

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState('');

  const [
    fieldErrors,
    setFieldErrors,
  ] = useState({});

  useEffect(() => {
    setForm((current) => ({
      ...current,

      phone:
        current.phone ||
        user?.phone ||
        '',

      email:
        current.email ||
        user?.email ||
        '',
    }));
  }, [
    user?.phone,
    user?.email,
  ]);

  useEffect(() => {
    let active = true;

    async function checkEligibility() {
      try {
        /*
         * Customers who already
         * have a DESIRE CREDIT
         * account should use their
         * existing account instead
         * of applying again.
         */
        try {
          const accountResponse =
            await getMyCreditAccount();

          const account =
            accountResponse?.account ||
            accountResponse?.creditAccount ||
            null;

          if (
            active &&
            account
          ) {
            router.replace(
              '/account/desire-credit',
            );

            return;
          }
        } catch (
          accountError
        ) {
          /*
           * No account is expected
           * for a new applicant.
           */
        }

        const applicationsResponse =
          await getMyCreditApplications();

        if (!active) {
          return;
        }

        const applications =
          normalizeApplications(
            applicationsResponse,
          );

        const latestApplication =
          getLatestApplication(
            applications,
          );

        if (
          latestApplication &&
          BLOCKING_APPLICATION_STATUSES.has(
            latestApplication.status,
          )
        ) {
          router.replace(
            '/account/desire-credit',
          );

          return;
        }
      } catch (eligibilityError) {
        console.error(
          'Unable to check DESIRE CREDIT eligibility:',
          eligibilityError,
        );

        if (active) {
          setError(
            eligibilityError?.message ||
              'Unable to verify your DESIRE CREDIT application status.',
          );
        }
      } finally {
        if (active) {
          setCheckingEligibility(
            false,
          );
        }
      }
    }

    checkEligibility();

    return () => {
      active = false;
    };
  }, [router]);

  function updateField(
    event,
  ) {
    const {
      name,
      value,
    } = event.target;

    setForm(
      (current) => ({
        ...current,
        [name]: value,
      }),
    );

    setFieldErrors(
      (current) => ({
        ...current,
        [name]: '',
      }),
    );

    if (error) {
      setError('');
    }
  }

  function validateForm() {
    const errors = {};

    const requestedAmount =
      Number(
        form.requestedAmount,
      );

    const monthlyIncome =
      Number(
        form.monthlyIncome,
      );

    if (
      !Number.isFinite(
        requestedAmount,
      ) ||
      requestedAmount < 5000 ||
      requestedAmount >
        1000000
    ) {
      errors.requestedAmount =
        'Enter an amount between ₦5,000 and ₦1,000,000.';
    }

    if (
      !form.employmentStatus
    ) {
      errors.employmentStatus =
        'Select your employment status.';
    }

    if (
      !Number.isFinite(
        monthlyIncome,
      ) ||
      monthlyIncome < 0 ||
      monthlyIncome >
        100000000
    ) {
      errors.monthlyIncome =
        'Enter a valid monthly income.';
    }

    if (!form.phone.trim()) {
      errors.phone =
        'Phone number is required.';
    }

    if (!form.email.trim()) {
      errors.email =
        'Email address is required.';
    }

    if (
      !form.residentialAddress
        .trim()
    ) {
      errors.residentialAddress =
        'Residential address is required.';
    }

    if (!form.city.trim()) {
      errors.city =
        'City is required.';
    }

    if (!form.state.trim()) {
      errors.state =
        'State is required.';
    }

    if (
      !form.nextOfKinName
        .trim()
    ) {
      errors.nextOfKinName =
        'Next of kin name is required.';
    }

    if (
      !form.nextOfKinPhone
        .trim()
    ) {
      errors.nextOfKinPhone =
        'Next of kin phone number is required.';
    }

    if (
      !form.nextOfKinRelationship
        .trim()
    ) {
      errors.nextOfKinRelationship =
        'Relationship is required.';
    }

    if (
      !form.preferredInstallmentPlan
    ) {
      errors.preferredInstallmentPlan =
        'Select a preferred repayment plan.';
    }

    setFieldErrors(errors);

    return (
      Object.keys(errors)
        .length === 0
    );
  }

  async function handleSubmit(
    event,
  ) {
    event.preventDefault();

    setError('');

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        requestedAmount:
          Number(
            form.requestedAmount,
          ),

        employmentStatus:
          form.employmentStatus,

        monthlyIncome:
          Number(
            form.monthlyIncome,
          ),

        phone:
          form.phone.trim(),

        email:
          form.email.trim(),

        residentialAddress:
          form.residentialAddress.trim(),

        city:
          form.city.trim(),

        state:
          form.state.trim(),

        nextOfKinName:
          form.nextOfKinName.trim(),

        nextOfKinPhone:
          form.nextOfKinPhone.trim(),

        nextOfKinRelationship:
          form.nextOfKinRelationship.trim(),

        preferredInstallmentPlan:
          form.preferredInstallmentPlan,

        ...(form.employerName
          .trim()
          ? {
              employerName:
                form.employerName.trim(),
            }
          : {}),

        ...(form.occupation
          .trim()
          ? {
              occupation:
                form.occupation.trim(),
            }
          : {}),

        ...(form.country
          .trim()
          ? {
              country:
                form.country.trim(),
            }
          : {}),

        ...(form.reason
          .trim()
          ? {
              reason:
                form.reason.trim(),
            }
          : {}),
      };

      await applyForDesireCredit(
        payload,
      );

      router.push(
        '/account/desire-credit',
      );

      router.refresh();
    } catch (
      submitError
    ) {
      console.error(
        'Unable to submit DESIRE CREDIT application:',
        submitError,
      );

      setError(
        submitError?.message ||
          'Unable to submit your DESIRE CREDIT application.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (
    checkingEligibility
  ) {
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

          <p>
            Preparing your
            application...
          </p>
        </div>
      </div>
    );
  }

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
        <Link
          href="/account/desire-credit"
        >
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
              styles.eyebrow
            }
          >
            DESIRE CREDIT
          </span>

          <h1>
            Apply for
            <br />
            DESIRE CREDIT.
          </h1>

          <p>
            Complete your
            application with your
            personal, income and
            repayment information.
            Your application will
            be reviewed before a
            credit account is
            activated.
          </p>
        </div>

        <div
          className={
            styles.heroAside
          }
        >
          <span>
            Credit request
          </span>

          <strong>
            {form.requestedAmount
              ? formatNaira(
                  form.requestedAmount,
                )
              : '₦0'}
          </strong>
        </div>
      </section>

      {error && (
        <div
          className={
            styles.errorBanner
          }
          role="alert"
        >
          <strong>
            Application could not
            be submitted
          </strong>

          <p>{error}</p>
        </div>
      )}

      <form
        className={
          styles.form
        }
        onSubmit={
          handleSubmit
        }
        noValidate
      >
        <section
          className={
            styles.formSection
          }
        >
          <div
            className={
              styles.sectionIntro
            }
          >
            <span>
              01
            </span>

            <div>
              <h2>
                Credit request
              </h2>

              <p>
                Tell us the amount
                you would like to
                request and your
                preferred repayment
                period.
              </p>
            </div>
          </div>

          <div
            className={
              styles.fields
            }
          >
            <Field
              label="Requested amount"
              error={
                fieldErrors
                  .requestedAmount
              }
            >
              <div
                className={
                  styles.moneyInput
                }
              >
                <span>
                  ₦
                </span>

                <input
                  type="number"
                  name="requestedAmount"
                  min="5000"
                  max="1000000"
                  step="1000"
                  value={
                    form.requestedAmount
                  }
                  onChange={
                    updateField
                  }
                  placeholder="50000"
                  required
                />
              </div>

              <small>
                Minimum ₦5,000 —
                maximum
                ₦1,000,000.
              </small>
            </Field>

            <Field
              label="Preferred repayment plan"
              error={
                fieldErrors
                  .preferredInstallmentPlan
              }
            >
              <select
                name="preferredInstallmentPlan"
                value={
                  form.preferredInstallmentPlan
                }
                onChange={
                  updateField
                }
                required
              >
                <option value="">
                  Select repayment
                  plan
                </option>

                {CREDIT_INSTALLMENT_PLAN_OPTIONS.map(
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
            </Field>

            <Field
              label="Reason for credit"
              className={
                styles.fullField
              }
            >
              <textarea
                name="reason"
                value={
                  form.reason
                }
                onChange={
                  updateField
                }
                maxLength={1000}
                rows={4}
                placeholder="Tell us briefly what you plan to use DESIRE CREDIT for."
              />
            </Field>
          </div>
        </section>

        <section
          className={
            styles.formSection
          }
        >
          <div
            className={
              styles.sectionIntro
            }
          >
            <span>
              02
            </span>

            <div>
              <h2>
                Employment &
                income
              </h2>

              <p>
                Provide your
                current employment
                and monthly income
                information.
              </p>
            </div>
          </div>

          <div
            className={
              styles.fields
            }
          >
            <Field
              label="Employment status"
              error={
                fieldErrors
                  .employmentStatus
              }
            >
              <select
                name="employmentStatus"
                value={
                  form.employmentStatus
                }
                onChange={
                  updateField
                }
                required
              >
                <option value="">
                  Select status
                </option>

                {EMPLOYMENT_STATUS_OPTIONS.map(
                  (option) => (
                    <option
                      key={
                        option.value
                      }
                      value={
                        option.value
                      }
                    >
                      {
                        option.label
                      }
                    </option>
                  ),
                )}
              </select>
            </Field>

            <Field
              label="Monthly income"
              error={
                fieldErrors
                  .monthlyIncome
              }
            >
              <div
                className={
                  styles.moneyInput
                }
              >
                <span>
                  ₦
                </span>

                <input
                  type="number"
                  name="monthlyIncome"
                  min="0"
                  max="100000000"
                  step="1000"
                  value={
                    form.monthlyIncome
                  }
                  onChange={
                    updateField
                  }
                  placeholder="150000"
                  required
                />
              </div>
            </Field>

            <Field
              label="Employer name"
            >
              <input
                type="text"
                name="employerName"
                value={
                  form.employerName
                }
                onChange={
                  updateField
                }
                maxLength={150}
                placeholder="Employer or business name"
              />
            </Field>

            <Field
              label="Occupation"
            >
              <input
                type="text"
                name="occupation"
                value={
                  form.occupation
                }
                onChange={
                  updateField
                }
                maxLength={150}
                placeholder="Your occupation"
              />
            </Field>
          </div>
        </section>

        <section
          className={
            styles.formSection
          }
        >
          <div
            className={
              styles.sectionIntro
            }
          >
            <span>
              03
            </span>

            <div>
              <h2>
                Contact &
                residence
              </h2>

              <p>
                Confirm your
                contact information
                and current
                residential
                address.
              </p>
            </div>
          </div>

          <div
            className={
              styles.fields
            }
          >
            <Field
              label="Phone number"
              error={
                fieldErrors.phone
              }
            >
              <input
                type="tel"
                name="phone"
                value={
                  form.phone
                }
                onChange={
                  updateField
                }
                maxLength={30}
                placeholder="Phone number"
                required
              />
            </Field>

            <Field
              label="Email address"
              error={
                fieldErrors.email
              }
            >
              <input
                type="email"
                name="email"
                value={
                  form.email
                }
                onChange={
                  updateField
                }
                maxLength={150}
                placeholder="Email address"
                required
              />
            </Field>

            <Field
              label="Residential address"
              error={
                fieldErrors
                  .residentialAddress
              }
              className={
                styles.fullField
              }
            >
              <input
                type="text"
                name="residentialAddress"
                value={
                  form.residentialAddress
                }
                onChange={
                  updateField
                }
                maxLength={250}
                placeholder="Street address"
                required
              />
            </Field>

            <Field
              label="City"
              error={
                fieldErrors.city
              }
            >
              <input
                type="text"
                name="city"
                value={
                  form.city
                }
                onChange={
                  updateField
                }
                maxLength={100}
                placeholder="City"
                required
              />
            </Field>

            <Field
              label="State"
              error={
                fieldErrors.state
              }
            >
              <input
                type="text"
                name="state"
                value={
                  form.state
                }
                onChange={
                  updateField
                }
                maxLength={100}
                placeholder="State"
                required
              />
            </Field>

            <Field
              label="Country"
            >
              <input
                type="text"
                name="country"
                value={
                  form.country
                }
                onChange={
                  updateField
                }
                maxLength={100}
                placeholder="Country"
              />
            </Field>
          </div>
        </section>

        <section
          className={
            styles.formSection
          }
        >
          <div
            className={
              styles.sectionIntro
            }
          >
            <span>
              04
            </span>

            <div>
              <h2>
                Next of kin
              </h2>

              <p>
                Provide the contact
                details of your
                next of kin.
              </p>
            </div>
          </div>

          <div
            className={
              styles.fields
            }
          >
            <Field
              label="Full name"
              error={
                fieldErrors
                  .nextOfKinName
              }
            >
              <input
                type="text"
                name="nextOfKinName"
                value={
                  form.nextOfKinName
                }
                onChange={
                  updateField
                }
                maxLength={150}
                placeholder="Next of kin full name"
                required
              />
            </Field>

            <Field
              label="Phone number"
              error={
                fieldErrors
                  .nextOfKinPhone
              }
            >
              <input
                type="tel"
                name="nextOfKinPhone"
                value={
                  form.nextOfKinPhone
                }
                onChange={
                  updateField
                }
                maxLength={30}
                placeholder="Next of kin phone"
                required
              />
            </Field>

            <Field
              label="Relationship"
              error={
                fieldErrors
                  .nextOfKinRelationship
              }
            >
              <input
                type="text"
                name="nextOfKinRelationship"
                value={
                  form.nextOfKinRelationship
                }
                onChange={
                  updateField
                }
                maxLength={100}
                placeholder="e.g. Parent, sibling"
                required
              />
            </Field>
          </div>
        </section>

        <section
          className={
            styles.submitSection
          }
        >
          <div>
            <span
              className={
                styles.eyebrow
              }
            >
              Final step
            </span>

            <h2>
              Review your details
              before submitting.
            </h2>

            <p>
              Submitting this form
              creates a DESIRE
              CREDIT application.
              Approval and the
              final credit limit
              are determined during
              review.
            </p>
          </div>

          <button
            type="submit"
            disabled={
              submitting
            }
          >
            {submitting
              ? 'Submitting...'
              : 'Submit application'}

            {!submitting && (
              <ArrowIcon />
            )}
          </button>
        </section>
      </form>
    </div>
  );
}

function Field({
  label,
  error,
  className = '',
  children,
}) {
  return (
    <label
      className={`${styles.field} ${className}`}
    >
      <span
        className={
          styles.fieldLabel
        }
      >
        {label}
      </span>

      {children}

      {error && (
        <span
          className={
            styles.fieldError
          }
        >
          {error}
        </span>
      )}
    </label>
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