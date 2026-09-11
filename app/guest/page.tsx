import Link from "next/link";

export default function GuestPage() {
  return (
    <div className="min-h-screen bg-parchment">
      <header className="border-b border-ink/10 bg-parchment-dim/50">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <a href="/" className="flex items-center gap-2 focus-ring rounded-sm">
            <svg width="24" height="24" viewBox="0 0 26 26" fill="none" aria-hidden="true">
              <rect x="1" y="1" width="24" height="24" rx="3" stroke="#16233B" strokeWidth="1.5" />
              <path d="M6 9.5L13 17L20 6" stroke="#B8863B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="font-display text-lg italic text-ink">ViFlow</span>
          </a>
          <div className="flex items-center gap-3">
            <a href="/login" className="focus-ring rounded-sm px-4 py-2 text-sm font-medium text-ink hover:bg-ink/5">
              Log in
            </a>
            <a href="/register" className="focus-ring rounded-card bg-ink px-4 py-2 text-sm font-medium text-parchment hover:bg-ink-light">
              Register
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12 md:py-16">
        <h1 className="font-display text-4xl italic text-ink">How to Visit</h1>
        <p className="mt-3 text-lg text-ink/60">
          ViFlow makes it easy for residents to invite visitors and for guards to verify entries.
          Here&apos;s how the process works.
        </p>

        <div className="mt-12 space-y-10">
          {/* Step 1 */}
          <div className="flex gap-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brass/10 font-display text-lg text-brass-dark">
              1
            </div>
            <div>
              <h2 className="font-display text-xl text-ink">Get an Invitation</h2>
              <p className="mt-2 text-ink/60">
                A resident who lives in the hostel will send you an invitation link.
                You&apos;ll receive an email with a unique visit code and a link to register.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brass/10 font-display text-lg text-brass-dark">
              2
            </div>
            <div>
              <h2 className="font-display text-xl text-ink">Register Your Details</h2>
              <p className="mt-2 text-ink/60">
                Click the link in your email and fill in your details: name, phone, ID number, and a profile photo.
                If you&apos;re coming by vehicle, you can add your registration number too.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brass/10 font-display text-lg text-brass-dark">
              3
            </div>
            <div>
              <h2 className="font-display text-xl text-ink">Show Your Visit Code</h2>
              <p className="mt-2 text-ink/60">
                When you arrive at the hostel gate, show your visit code (e.g., <span className="font-mono text-ink">VF-A1B2</span>)
                to the guard. The guard will verify your identity against the invitation details.
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex gap-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brass/10 font-display text-lg text-brass-dark">
              4
            </div>
            <div>
              <h2 className="font-display text-xl text-ink">Check In &amp; Visit</h2>
              <p className="mt-2 text-ink/60">
                Once verified, the guard will check you in. Enjoy your visit!
                When you leave, the guard will check you out automatically.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-14 rounded-card border border-ink/15 bg-parchment-dim p-6">
          <h2 className="font-display text-lg text-ink">Don&apos;t have an invitation?</h2>
          <p className="mt-2 text-sm text-ink/60">
            You need to be invited by a resident before you can visit.
            If you know a resident, ask them to send you an invitation through ViFlow.
          </p>
          <div className="mt-4 flex gap-3">
            <Link href="/login" className="focus-ring rounded-card bg-ink px-5 py-2.5 text-sm font-medium text-parchment hover:bg-ink-light">
              Log In
            </Link>
            <Link href="/" className="focus-ring rounded-card border border-ink/20 px-5 py-2.5 text-sm text-ink hover:border-ink/40">
              Back to Home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
