import Link from "next/link";

export default function AuthShell({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="flex flex-col justify-center px-6 py-16 sm:px-10 md:px-16 lg:px-24">
        <Link href="/" className="mb-10 flex items-center gap-2 focus-ring w-fit rounded-sm">
          <svg width="24" height="24" viewBox="0 0 26 26" fill="none" aria-hidden="true">
            <rect x="1" y="1" width="24" height="24" rx="3" stroke="#16233B" strokeWidth="1.5" />
            <path d="M6 9.5L13 17L20 6" stroke="#B8863B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="font-display text-lg italic text-ink">ViFlow</span>
        </Link>

        <p className="font-mono text-[13px] text-brass-dark">{eyebrow}</p>
        <h1 className="mt-2 font-display text-3xl italic text-ink sm:text-4xl">{title}</h1>
        <p className="mt-3 text-ink/70">{subtitle}</p>

        <div className="mt-9 max-w-sm">{children}</div>

        <p className="mt-8 text-sm text-ink/60">{footer}</p>
      </div>

      <div className="relative hidden items-center justify-center bg-ink md:flex">
        <div className="-rotate-3 w-[300px] rounded-card bg-ink-light text-parchment shadow-[0_20px_45px_-15px_rgba(0,0,0,0.5)]">
          <div className="flex justify-center pt-4">
            <div className="hole-punch bg-ink-light shadow-[inset_0_2px_3px_rgba(0,0,0,0.4)]" />
          </div>
          <div className="perf-edge-bottom px-6 pb-7 pt-3" style={{ ["--perf-bg" as string]: "#233555" }}>
            <p className="font-mono text-[11px] uppercase text-brass-light">Resident</p>
            <h2 className="mt-2 font-display text-2xl italic">Tendai Wanjiru</h2>
            <p className="mt-1 text-sm text-parchment/70">Room 214, Block C</p>
            <div className="mt-6 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-sage-light" />
              <span className="font-mono text-[11px] uppercase text-parchment/60">
                2 visits authorized today
              </span>
            </div>
          </div>
          <div className="bg-ink px-6 py-3 text-[11px] font-mono text-parchment/50">
            One profile. Access earned each visit.
          </div>
        </div>
      </div>
    </div>
  );
}
