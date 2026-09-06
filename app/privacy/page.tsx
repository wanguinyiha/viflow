import Header from "@/components/Header";
import CtaFooter from "@/components/CtaFooter";

export default function Privacy() {
  return (
    <>
      <Header />
      <main>
        <section className="border-b border-ink/10">
          <div className="mx-auto max-w-3xl px-6 py-20 md:px-10 md:py-28">
            <p className="font-mono text-[13px] text-brass-dark">Legal</p>
            <h1 className="mt-4 font-display text-4xl italic text-ink">Privacy Policy</h1>
            <p className="mt-4 text-sm text-ink/50">Last updated: September 2026</p>
          </div>
        </section>

        <section className="border-b border-ink/10 bg-parchment-dim">
          <div className="mx-auto max-w-3xl px-6 py-16 md:px-10 md:py-20">
            <div className="space-y-8 text-ink/70">
              <div>
                <h2 className="font-display text-xl text-ink">Information we collect</h2>
                <p className="mt-3">
                  ViFlow collects information necessary for visitor management: visitor names, email addresses,
                  phone numbers, identity document details, profile photographs, and vehicle registration information.
                  We also collect resident account information including name, email, and room assignment.
                </p>
              </div>
              <div>
                <h2 className="font-display text-xl text-ink">How information is used</h2>
                <p className="mt-3">
                  Visitor information is used solely for the purpose of managing hostel access: verifying identity
                  at the gate, recording visits, and maintaining security logs. Resident information is used for
                  account management and invitation delivery.
                </p>
              </div>
              <div>
                <h2 className="font-display text-xl text-ink">Who can see visitor information</h2>
                <p className="mt-3">
                  Visitor profiles are visible to administrators for verification purposes. Guards can view visitor
                  information at the point of check-in. Residents see visit details but do not have access to stored
                  identity documents.
                </p>
              </div>
              <div>
                <h2 className="font-display text-xl text-ink">Data retention</h2>
                <p className="mt-3">
                  Visit records and audit logs are maintained for security and accountability purposes. Visitor
                  profile information is retained as long as the visitor&apos;s account is active. Identity documents
                  are stored securely and are only accessible to authorized administrators.
                </p>
              </div>
              <div>
                <h2 className="font-display text-xl text-ink">Data security</h2>
                <p className="mt-3">
                  ViFlow uses industry-standard encryption for data in transit and at rest. Access to sensitive
                  information is restricted by role-based access controls. Regular security audits are conducted
                  to ensure data protection.
                </p>
              </div>
              <div>
                <p className="text-sm text-ink/40">
                  This is a placeholder privacy policy. It should be reviewed and replaced with legally approved
                  content before production deployment.
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
