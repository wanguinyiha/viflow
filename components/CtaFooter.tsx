export default function CtaFooter() {
  return (
    <>
      <section id="get-started" className="border-t border-ink/10">
        <div className="mx-auto max-w-6xl px-6 py-20 text-center md:px-10 md:py-24">
          <h2 className="font-display text-3xl italic text-ink sm:text-4xl">
            Ready to retire the gate book?
          </h2>
          <p className="mx-auto mt-4 max-w-[46ch] text-ink/75">
            Set up ViFlow for your hostel and give residents, guards and
            visitors a faster, better-recorded way through the gate.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <a
              href="/dashboard/resident"
              className="focus-ring rounded-card bg-ink px-6 py-3.5 font-body text-[15px] font-medium text-parchment transition-colors hover:bg-ink-light"
            >
              Open Dashboard
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t border-ink/10 bg-ink text-parchment/70">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-12 md:flex-row md:items-start md:justify-between md:px-10">
          <div>
            <span className="font-display text-xl italic text-parchment">ViFlow</span>
            <p className="mt-3 max-w-[36ch] text-sm">
              Reusable visitor profiles. Per-visit authorization. One QR pass
              at the hostel gate.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm sm:grid-cols-3">
            <a href="/#how-it-works" className="focus-ring rounded-sm hover:text-parchment">How it works</a>
            <a href="/#roles" className="focus-ring rounded-sm hover:text-parchment">Who it&apos;s for</a>
            <a href="/#faq" className="focus-ring rounded-sm hover:text-parchment">Questions</a>
            <a href="/dashboard/admin" className="focus-ring rounded-sm hover:text-parchment">Admin</a>
            <a href="/dashboard/resident" className="focus-ring rounded-sm hover:text-parchment">Resident</a>
            <a href="/dashboard/guard" className="focus-ring rounded-sm hover:text-parchment">Guard</a>
          </div>
        </div>
        <div className="border-t border-parchment/10 px-6 py-5 text-xs text-parchment/50 md:px-10">
          &copy; {new Date().getFullYear()} ViFlow.
        </div>
      </footer>
    </>
  );
}
