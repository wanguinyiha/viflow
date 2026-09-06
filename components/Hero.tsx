export default function Hero() {
  return (
    <section id="top" className="relative overflow-hidden">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 pb-20 pt-16 md:grid-cols-[1.1fr_0.9fr] md:px-10 md:pb-28 md:pt-24">
        <div>
          <p className="mb-5 font-mono text-[13px] text-brass-dark">
            Visitor management for student hostels
          </p>
          <h1 className="font-display text-[2.6rem] leading-[1.08] text-ink sm:text-[3.4rem]">
            Your visitor shouldn&apos;t have to sign in from scratch every single time.
          </h1>
          <p className="mt-6 max-w-[52ch] text-lg leading-relaxed text-ink/80">
            With ViFlow, a visitor builds one verified profile — name, ID, photo,
            vehicle — and reuses it for life. The resident still has to approve
            every visit before a QR pass is issued, so convenience never comes
            at the cost of control.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <a
              href="#how-it-works"
              className="focus-ring rounded-card bg-ink px-6 py-3.5 font-body text-[15px] font-medium text-parchment transition-colors hover:bg-ink-light"
            >
              See how a visit works
            </a>
          </div>
          <dl className="mt-12 grid max-w-md grid-cols-3 gap-6 border-t border-ink/10 pt-6">
            <div>
              <dt className="font-mono text-2xl text-ink">1</dt>
              <dd className="mt-1 text-sm text-ink/65">profile, reused forever</dd>
            </div>
            <div>
              <dt className="font-mono text-2xl text-ink">100%</dt>
              <dd className="mt-1 text-sm text-ink/65">of visits still authorized</dd>
            </div>
            <div>
              <dt className="font-mono text-2xl text-ink">0</dt>
              <dd className="mt-1 text-sm text-ink/65">paper logbooks needed</dd>
            </div>
          </dl>
        </div>

        {/* Visitor pass visual */}
        <div className="relative flex justify-center md:justify-end">
          <div className="animate-badge-in relative w-[300px] -rotate-3 rounded-card bg-ink text-parchment shadow-[0_20px_45px_-15px_rgba(22,35,59,0.55)]">
            <div className="flex justify-center pt-4">
              <div className="hole-punch" />
            </div>
            <div className="perf-edge-bottom px-6 pb-7 pt-3">
              <p className="font-mono text-[11px] uppercase text-brass-light">Visitor pass</p>
              <h2 className="mt-2 font-display text-2xl italic">Amara Kimani</h2>
              <p className="mt-1 text-sm text-parchment/75">Visiting Room 214, Block C</p>
              <p className="text-sm text-parchment/75">Host: Tendai Wanjiru</p>

              <div className="mt-5 flex items-end justify-between">
                <div className="grid grid-cols-5 gap-[3px]" aria-hidden="true">
                  {Array.from({ length: 25 }).map((_, i) => (
                    <span
                      key={i}
                      className={`h-[7px] w-[7px] ${
                        [0, 2, 4, 5, 9, 10, 14, 15, 19, 20, 22, 24, 12, 6, 8, 16, 18].includes(i)
                          ? "bg-parchment"
                          : "bg-transparent"
                      }`}
                    />
                  ))}
                </div>
                <span className="animate-stamp-in rounded-sm border border-sage-light px-2 py-1 font-mono text-[11px] uppercase text-sage-light">
                  Authorized
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between bg-ink-light px-6 py-3 text-[11px] font-mono text-parchment/60">
              <span>Visit VF-2941</span>
              <span>Valid today only</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
