import Header from "@/components/Header";
import CtaFooter from "@/components/CtaFooter";

export default function About() {
  return (
    <>
      <Header />
      <main>
        <section className="border-b border-ink/10">
          <div className="mx-auto max-w-3xl px-6 py-20 md:px-10 md:py-28">
            <p className="font-mono text-[13px] text-brass-dark">About ViFlow</p>
            <h1 className="mt-4 font-display text-4xl italic text-ink sm:text-5xl">
              Visitor access, rethought for modern hostels.
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-ink/70">
              ViFlow is a secure visitor management and access-control system designed
              for student hostels. It replaces paper sign-in books, manual ID checks,
              and guesswork at the gate with a digital system that works for residents,
              visitors, guards, and administrators.
            </p>
          </div>
        </section>

        <section className="border-b border-ink/10 bg-parchment-dim">
          <div className="mx-auto max-w-3xl px-6 py-20 md:px-10 md:py-28">
            <h2 className="font-display text-3xl italic text-ink">The problem</h2>
            <div className="mt-8 space-y-6 text-ink/70">
              <p>
                Most hostels still manage visitors with a handwritten logbook at the gate.
                Every visitor — whether it is a parent visiting for the tenth time or a
                first-time delivery — has to stop, write down their details, show their ID,
                and wait while the guard tries to reach the resident.
              </p>
              <p>
                This creates long queues, repeated data entry, and no reliable way to verify
                whether a visitor is actually expected. When something goes wrong, there is
                often no clear record of who was in the building and when.
              </p>
            </div>
          </div>
        </section>

        <section className="border-b border-ink/10">
          <div className="mx-auto max-w-3xl px-6 py-20 md:px-10 md:py-28">
            <h2 className="font-display text-3xl italic text-ink">How ViFlow helps</h2>
            <div className="mt-8 space-y-6 text-ink/70">
              <p>
                ViFlow gives every visitor a reusable digital profile. Once a visitor has
                registered — providing their name, identification, and photo — they do not
                need to repeat that process for future visits. The resident sends an
                invitation, the visitor confirms, and a QR pass is issued for that specific
                visit.
              </p>
              <p>
                The guard scans the code at the gate, verifies the visitor against the
                invitation, and checks them in. When the visit is over, the guard checks
                them out. Every step is recorded.
              </p>
              <p>
                Recurring visitors move through the gate faster. Residents can invite
                visitors from their phone. Guards get a clear verification screen instead
                of a handwritten name. Administrators can pull up any visit on record.
              </p>
            </div>
          </div>
        </section>

        <section className="border-b border-ink/10 bg-parchment-dim">
          <div className="mx-auto max-w-3xl px-6 py-20 md:px-10 md:py-28">
            <h2 className="font-display text-3xl italic text-ink">Security and accountability</h2>
            <div className="mt-8 space-y-6 text-ink/70">
              <p>
                Every visit requires a new invitation. A visitor&apos;s previous verification
                does not automatically authorize future access. Invitations have validity
                periods, and QR codes are tied to a single visit, a single resident, and a
                single room.
              </p>
              <p>
                Guards make the final access-control decision at the gate. The system
                provides information and verification, but the guard remains in control of
                who enters.
              </p>
              <p>
                Sensitive visitor information — such as identity documents — is only shown
                to authorized users. Visit history and vehicle records are maintained for
                accountability without being exposed unnecessarily.
              </p>
            </div>
          </div>
        </section>

        <section className="border-b border-ink/10">
          <div className="mx-auto max-w-3xl px-6 py-20 md:px-10 md:py-28">
            <h2 className="font-display text-3xl italic text-ink">Built for four people at the gate</h2>
            <div className="mt-8 space-y-8">
              {[
                { title: "Residents", text: "Invite visitors from your phone. Authorize each visit. Track who is coming and going without walking down to the gate." },
                { title: "Visitors", text: "Register once, reuse your profile forever. Receive invitations by email and present your QR pass at the gate. No more re-entering the same details every time." },
                { title: "Guards", text: "Scan a code, get a clear verdict. Visitor, visit, resident, and room are checked together. No more guessing or flipping through a paper book." },
                { title: "Administrators", text: "Manage residents, rooms, guards, and policies in one place. Pull up any visit, any visitor, any time. Replace scattered paper records with a searchable system." },
              ].map((role) => (
                <div key={role.title} className="border-l-2 border-brass pl-6">
                  <h3 className="font-display text-2xl text-ink">{role.title}</h3>
                  <p className="mt-2 text-ink/70">{role.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <CtaFooter />
    </>
  );
}
