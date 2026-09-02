const faqs = [
  {
    q: "Does a visitor need the app to enter?",
    a: "They need the QR pass sent to their phone after a resident authorizes their visit. Building a profile takes a few minutes the first time; after that, it's just responding to an invitation.",
  },
  {
    q: "Can a resident approve a visit without being at the gate?",
    a: "Yes. Authorization happens from the resident's phone before the visitor arrives, so the guard only needs to confirm the pass and check an ID.",
  },
  {
    q: "What stops someone from reusing an old QR pass?",
    a: "Each pass is tied to one visit, one visitor, one resident and one room, and expires after that visit. A scanned or expired pass won't verify again.",
  },
  {
    q: "Who can see a visitor's personal information?",
    a: "Visitor profiles are visible to administrators for verification and to guards only at the point of check-in. Residents see visit details, not the visitor's stored ID documents.",
  },
  {
    q: "What happens if a visitor never checks out?",
    a: "Administrators can see open visits on record and close them out, so the hostel's log stays accurate even if a guard misses a checkout at a busy gate.",
  },
];

export default function Faq() {
  return (
    <section id="faq" className="border-t border-ink/10 bg-parchment-dim">
      <div className="mx-auto max-w-3xl px-6 py-20 md:px-10 md:py-28">
        <h2 className="font-display text-3xl italic text-ink sm:text-4xl">Questions from wardens</h2>

        <div className="mt-10 divide-y divide-ink/10 border-t border-ink/10">
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
  );
}
