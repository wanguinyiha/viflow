import Header from "@/components/Header";
import CtaFooter from "@/components/CtaFooter";

const steps = [
  {
    title: "Resident invites a visitor",
    description: "The resident opens ViFlow, selects or enters the visitor's information, and sends an invitation. They choose the visit date and time, and the visitor receives an email.",
    roles: ["Resident"],
  },
  {
    title: "Visitor receives the invitation",
    description: "The visitor checks their email and opens the invitation link. They can see who invited them, which hostel and room, and when the visit is scheduled.",
    roles: ["Visitor"],
  },
  {
    title: "New visitors register",
    description: "If the visitor has never used ViFlow, they complete a short registration process: personal information, identity document, profile photo, and vehicle details if applicable.",
    roles: ["Visitor"],
  },
  {
    title: "Recurring visitors confirm",
    description: "If the visitor already has a ViFlow profile, they do not need to re-register. They review the invitation details and receive a QR pass for this specific visit.",
    roles: ["Visitor"],
  },
  {
    title: "Guard verifies at the gate",
    description: "When the visitor arrives, the guard scans the QR code or enters the visit code. ViFlow checks the visitor, the invitation, the resident, and the room in one step.",
    roles: ["Guard"],
  },
  {
    title: "Visitor is checked in",
    description: "If everything is valid, the guard confirms check-in. The visit is recorded with a timestamp. The visitor is now inside the hostel.",
    roles: ["Guard"],
  },
  {
    title: "Visitor is checked out",
    description: "When the visitor leaves, the guard checks them out. The visit record is closed. The resident can see the visit in their history.",
    roles: ["Guard"],
  },
];

const roleExplanations = [
  {
    role: "Resident",
    items: [
      "Create invitations for visitors",
      "Mark frequent visitors as favourites for faster invitations",
      "View active visitors and visit history",
      "Maximum 4 active visitors at any time",
      "Each visit requires a new invitation — no permanent access",
    ],
  },
  {
    role: "Visitor",
    items: [
      "Receive invitations by email",
      "Register once and reuse your profile",
      "View invitation details and QR pass",
      "Present the QR pass at the hostel gate",
      "Previous visits do not authorize future ones",
    ],
  },
  {
    role: "Guard",
    items: [
      "Scan QR codes or enter visit codes",
      "Verify visitor identity against the invitation",
      "Check visitors in and out",
      "View today's activity log",
      "Flag unusual activity for review",
    ],
  },
  {
    role: "Administrator",
    items: [
      "Manage residents, visitors, and guards",
      "Configure hostels and rooms",
      "Review all invitations and visits",
      "Monitor activity and audit logs",
      "Generate reports and analytics",
    ],
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <Header />
      <main>
        <section className="border-b border-ink/10">
          <div className="mx-auto max-w-3xl px-6 py-20 md:px-10 md:py-28">
            <p className="font-mono text-[13px] text-brass-dark">How it works</p>
            <h1 className="mt-4 font-display text-4xl italic text-ink sm:text-5xl">
              From invitation to check-in, step by step.
            </h1>
            <p className="mt-6 text-lg text-ink/70">
              ViFlow connects residents, visitors, guards, and administrators through
              a single system. Here is how a visit works from start to finish.
            </p>
          </div>
        </section>

        <section className="border-b border-ink/10 bg-parchment-dim">
          <div className="mx-auto max-w-4xl px-6 py-20 md:px-10 md:py-28">
            <h2 className="font-display text-3xl italic text-ink">The visit lifecycle</h2>
            <div className="mt-12 space-y-8">
              {steps.map((step, i) => (
                <div key={i} className="flex gap-6">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink font-mono text-sm text-parchment">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div>
                    <h3 className="font-display text-xl text-ink">{step.title}</h3>
                    <p className="mt-2 text-ink/70">{step.description}</p>
                    <div className="mt-2 flex gap-2">
                      {step.roles.map((r) => (
                        <span key={r} className="rounded-full bg-brass/10 border border-brass/20 px-2.5 py-0.5 text-xs text-brass-dark">
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-ink/10">
          <div className="mx-auto max-w-4xl px-6 py-20 md:px-10 md:py-28">
            <h2 className="font-display text-3xl italic text-ink">What each role does</h2>
            <div className="mt-12 grid gap-8 sm:grid-cols-2">
              {roleExplanations.map((r) => (
                <div key={r.role} className="rounded-card border border-ink/15 bg-parchment-dim p-6">
                  <h3 className="font-display text-2xl text-ink">{r.role}</h3>
                  <ul className="mt-4 space-y-3 text-ink/70">
                    {r.items.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brass" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-ink/10 bg-parchment-dim">
          <div className="mx-auto max-w-3xl px-6 py-20 md:px-10 md:py-28">
            <h2 className="font-display text-3xl italic text-ink">Important rules</h2>
            <div className="mt-8 space-y-4 text-ink/70">
              <p>Every visit requires a new invitation — previous verification does not authorize future visits.</p>
              <p>A QR code belongs to one specific invitation and cannot be reused.</p>
              <p>A resident can have a maximum of 4 active visitors at any time.</p>
              <p>Favourite visitors are a convenience feature — they do not bypass the invitation process.</p>
              <p>Guards make the final access-control decision at the gate.</p>
            </div>
          </div>
        </section>
      </main>
      <CtaFooter />
    </>
  );
}
