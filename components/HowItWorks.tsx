const steps = [
  {
    title: "A profile, built once",
    body: "The visitor creates a digital profile with their name, ID, photo and vehicle details — the last time they'll ever need to type most of it.",
  },
  {
    title: "The resident sends an invitation",
    body: "A student expecting a guest sends an invite to the visitor's email. First-time visitors fill in their profile from there.",
  },
  {
    title: "The resident authorizes this visit",
    body: "Having a profile on file never grants entry by itself. The resident still has to approve this specific visit, at this specific time.",
  },
  {
    title: "A QR pass is issued",
    body: "Once authorized, the visitor gets a QR code on their phone, tied to that one visit, that one resident, that one room.",
  },
  {
    title: "The guard scans at the gate",
    body: "ViFlow checks the code against the visitor, the visit, the resident and the room in one step, and the guard sees a clear go or no-go.",
  },
  {
    title: "Entry and exit are logged",
    body: "Check-in is recorded automatically. When the visitor leaves, the guard checks them out, closing the visit.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="border-t border-ink/10">
      <div className="mx-auto max-w-6xl px-6 py-20 md:px-10 md:py-28">
        <div className="max-w-[46ch]">
          <h2 className="font-display text-3xl italic text-ink sm:text-4xl">
            One visit, start to finish.
          </h2>
          <p className="mt-4 text-ink/75">
            The profile carries over. The authorization never does.
          </p>
        </div>

        <ol className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {steps.map((step, i) => (
            <li
              key={step.title}
              className="perf-edge-bottom relative rounded-card border border-ink/15 bg-parchment px-6 pb-8 pt-6"
            >
              <span className="font-mono text-sm text-brass-dark">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-3 font-display text-xl text-ink">{step.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-ink/70">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
