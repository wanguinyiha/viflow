const steps = [
  {
    title: "Get an Invitation",
    body: "A resident creates a visitor invitation with the visitor's details and sends it to their email.",
  },
  {
    title: "Complete Your Details",
    body: "If you are a new visitor, simply complete the required information from the invitation. Returning visitors can use their existing information without repeating the entire process.",
  },
  {
    title: "Receive Your Visit Pass",
    body: "Once the visit is authorized, you receive your visit details and QR code, if required.",
  },
  {
    title: "Arrive at the Hostel",
    body: "Present your visit pass to the guard at the gate. The guard verifies your invitation, identity, and the resident you are visiting.",
  },
  {
    title: "Get Checked In",
    body: "Once everything is verified, the guard approves your visit and checks you in. Your visit is securely recorded.",
  },
  {
    title: "Check Out When You Leave",
    body: "When you leave the hostel, the guard checks you out, completing your visit record.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="border-t border-ink/10">
      <div className="mx-auto max-w-6xl px-6 py-20 md:px-10 md:py-28">
        <div className="max-w-[46ch]">
          <h2 className="font-display text-3xl italic text-ink sm:text-4xl">
            How It Works
          </h2>
          <p className="mt-4 text-ink/75">
            One visit, start to finish. The profile carries over. The authorization never does.
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
