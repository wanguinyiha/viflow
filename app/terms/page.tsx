import Header from "@/components/Header";
import CtaFooter from "@/components/CtaFooter";

export default function Terms() {
  return (
    <>
      <Header />
      <main>
        <section className="border-b border-ink/10">
          <div className="mx-auto max-w-3xl px-6 py-20 md:px-10 md:py-28">
            <p className="font-mono text-[13px] text-brass-dark">Legal</p>
            <h1 className="mt-4 font-display text-4xl italic text-ink">Terms of Service</h1>
            <p className="mt-4 text-sm text-ink/50">Last updated: September 2026</p>
          </div>
        </section>

        <section className="border-b border-ink/10 bg-parchment-dim">
          <div className="mx-auto max-w-3xl px-6 py-16 md:px-10 md:py-20">
            <div className="space-y-8 text-ink/70">
              <div>
                <h2 className="font-display text-xl text-ink">Acceptance of terms</h2>
                <p className="mt-3">
                  By accessing or using ViFlow, you agree to these terms of service. If you do not agree,
                  do not use the system.
                </p>
              </div>
              <div>
                <h2 className="font-display text-xl text-ink">System usage</h2>
                <p className="mt-3">
                  ViFlow is designed for authorized use within student hostels. Residents, visitors, guards,
                  and administrators must use the system in accordance with their assigned roles and their
                  hostel&apos;s policies.
                </p>
              </div>
              <div>
                <h2 className="font-display text-xl text-ink">Visitor responsibilities</h2>
                <p className="mt-3">
                  Visitors are responsible for providing accurate registration information. Misrepresenting
                  identity or providing false information is grounds for denial of access and account suspension.
                </p>
              </div>
              <div>
                <h2 className="font-display text-xl text-ink">Access control</h2>
                <p className="mt-3">
                  ViFlow provides verification and record-keeping. The final decision to allow or deny entry
                  rests with the hostel guard. ViFlow is a tool to support, not replace, human judgment at
                  the gate.
                </p>
              </div>
              <div>
                <h2 className="font-display text-xl text-ink">Limitation of liability</h2>
                <p className="mt-3">
                  ViFlow is provided as-is for hostel visitor management. The system operators are not liable
                  for unauthorized access that occurs through means outside the system&aposs controls.
                </p>
              </div>
              <div>
                <p className="text-sm text-ink/40">
                  This is a placeholder terms of service. It should be reviewed and replaced with legally
                  approved content before production deployment.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <CtaFooter />
    </>
  );
}
