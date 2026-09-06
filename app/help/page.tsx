import Header from "@/components/Header";
import CtaFooter from "@/components/CtaFooter";

const faqs = [
  {
    q: "How do I create an invitation?",
    a: "Log in to your resident dashboard and click \"Create Invitation.\" Enter the visitor's email, choose a date and time, and send the invitation. The visitor will receive an email with a link to confirm.",
  },
  {
    q: "How do visitors receive invitations?",
    a: "Visitors receive an email with a secure link. When they open the link, they see the invitation details and can accept or confirm the visit. If they are new to ViFlow, they will be prompted to register first.",
  },
  {
    q: "How do recurring visitors work?",
    a: "Once a visitor has registered with ViFlow, their profile is stored. When they receive a new invitation, they do not need to re-enter their personal information. They simply review the new invitation and receive a fresh QR pass.",
  },
  {
    q: "What happens when an invitation expires?",
    a: "Invitations have a validity period. If the visitor does not use the invitation before it expires, it becomes invalid. A new invitation must be created for a future visit.",
  },
  {
    q: "Why is a new invitation required for every visit?",
    a: "ViFlow does not grant permanent access. Each invitation is tied to a specific date, time, resident, and room. This ensures that every visit is explicitly authorized.",
  },
  {
    q: "How do QR codes work?",
    a: "After an invitation is accepted, the visitor receives a QR code tied to that specific visit. The guard scans this code at the gate to verify the visitor, the invitation, and the room.",
  },
  {
    q: "What happens during check-in?",
    a: "The guard scans the QR code or enters the visit code. ViFlow verifies the visitor against the invitation. If everything is valid, the guard confirms check-in and the visit is recorded.",
  },
  {
    q: "What happens during check-out?",
    a: "When the visitor leaves, the guard checks them out. The visit record is closed with a timestamp. The resident can see the completed visit in their history.",
  },
  {
    q: "Can I have more than 4 active visitors?",
    a: "No. A resident can have a maximum of 4 active visitors at any time. Once a visitor checks out, the slot becomes available for a new invitation.",
  },
  {
    q: "How do I contact hostel administration?",
    a: "Contact your hostel administrator directly. They can manage rooms, residents, and system settings through the admin dashboard.",
  },
];

export default function Help() {
  return (
    <>
      <Header />
      <main>
        <section className="border-b border-ink/10">
          <div className="mx-auto max-w-3xl px-6 py-20 md:px-10 md:py-28">
            <p className="font-mono text-[13px] text-brass-dark">Help &amp; Support</p>
            <h1 className="mt-4 font-display text-4xl italic text-ink sm:text-5xl">
              Frequently asked questions
            </h1>
            <p className="mt-6 text-lg text-ink/70">
              Common questions about using ViFlow.
            </p>
          </div>
        </section>

        <section className="border-b border-ink/10 bg-parchment-dim">
          <div className="mx-auto max-w-3xl px-6 py-20 md:px-10 md:py-28">
            <div className="divide-y divide-ink/10 border-t border-ink/10">
              {faqs.map((item) => (
                <details key={item.q} className="group py-5">
                  <summary className="focus-ring flex cursor-pointer list-none items-center justify-between gap-4 rounded-sm font-display text-lg text-ink">
                    {item.q}
                    <span className="shrink-0 text-xl text-brass-dark transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-3 max-w-[60ch] text-[15px] leading-relaxed text-ink/70">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-ink/10">
          <div className="mx-auto max-w-3xl px-6 py-20 text-center md:px-10 md:py-24">
            <h2 className="font-display text-3xl italic text-ink">Still need help?</h2>
            <p className="mx-auto mt-4 max-w-[46ch] text-ink/75">
              Contact your hostel administrator for account-specific issues or system configuration questions.
            </p>
          </div>
        </section>
      </main>
      <CtaFooter />
    </>
  );
}
