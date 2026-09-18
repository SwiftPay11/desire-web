import Link from 'next/link';

export default function CreditApplicationsPage() {
  return (
    <main className="min-h-screen bg-white px-4 py-8 text-black sm:px-6 sm:py-10 lg:px-10">
      <div className="mx-auto w-full max-w-7xl">
        <Link
          href="/account/desire-credit"
          className="text-sm text-neutral-600 transition hover:text-black"
        >
          ← Back to DESIRE CREDIT
        </Link>

        <header className="mt-8 border-b border-neutral-200 pb-7">
          <p className="text-xs uppercase tracking-[0.25em] text-neutral-500">
            History
          </p>

          <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">
            My Applications
          </h1>

          <p className="mt-4 text-sm leading-7 text-neutral-600 sm:text-base">
            Your submitted DESIRE CREDIT applications will appear here.
          </p>
        </header>

        <section className="mt-8 border border-dashed border-neutral-300 p-6 text-center sm:p-10">
          <h2 className="text-lg font-medium">No applications loaded yet</h2>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-neutral-600">
            Application data will be connected to the backend during Stage 6.
          </p>

          <Link
            href="/account/desire-credit/apply"
            className="mt-6 inline-flex min-h-11 items-center justify-center bg-black px-5 text-sm font-medium text-white transition hover:bg-neutral-800"
          >
            Start application
          </Link>
        </section>
      </div>
    </main>
  );
}