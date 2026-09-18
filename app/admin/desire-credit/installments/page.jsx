import Link from 'next/link';

export default function AdminCreditInstallmentsPage() {
  return (
    <main className="min-h-screen bg-neutral-950 px-4 py-8 text-white sm:px-6 sm:py-10 lg:px-10">
      <div className="mx-auto w-full max-w-7xl">
        <Link
          href="/admin/desire-credit"
          className="text-sm text-neutral-400 transition hover:text-white"
        >
          ← Back to DESIRE CREDIT admin
        </Link>

        <header className="mt-8 border-b border-neutral-800 pb-7">
          <p className="text-xs uppercase tracking-[0.25em] text-neutral-500">
            DESIRE CREDIT
          </p>

          <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">
            Installments
          </h1>

          <p className="mt-4 text-sm leading-7 text-neutral-400 sm:text-base">
            Track installment schedules, repayments, partial payments, and due
            dates.
          </p>
        </header>

        <section className="mt-8 border border-dashed border-neutral-700 bg-neutral-900 p-6 text-center sm:p-10">
          <h2 className="text-lg font-medium">
            No installments loaded yet
          </h2>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-neutral-400">
            Installment records will be connected during Stage 14.
          </p>
        </section>
      </div>
    </main>
  );
}