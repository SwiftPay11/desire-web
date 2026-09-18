import Link from 'next/link';

export default async function CreditApplicationDetailsPage({ params }) {
  const { id } = await params;

  return (
    <main className="min-h-screen bg-white px-4 py-8 text-black sm:px-6 sm:py-10 lg:px-10">
      <div className="mx-auto w-full max-w-5xl">
        <Link
          href="/account/desire-credit/applications"
          className="text-sm text-neutral-600 transition hover:text-black"
        >
          ← Back to applications
        </Link>

        <header className="mt-8 border-b border-neutral-200 pb-7">
          <p className="text-xs uppercase tracking-[0.25em] text-neutral-500">
            Application details
          </p>

          <h1 className="mt-3 break-all text-2xl font-semibold sm:text-4xl">
            Application {id}
          </h1>
        </header>

        <section className="mt-8 border border-neutral-200 p-5 sm:p-8">
          <p className="text-sm leading-7 text-neutral-600">
            The complete application details will be connected in Stage 6.
          </p>
        </section>
      </div>
    </main>
  );
}