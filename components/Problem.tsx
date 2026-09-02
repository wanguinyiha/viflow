const problems = [
  {
    title: "The same details, every visit",
    body: "A regular visitor — a parent, a tutor, a partner — re-enters their name, uploads an ID again, and poses for another photo, even if they were at the gate yesterday.",
  },
  {
    title: "Guards become data-entry clerks",
    body: "Instead of watching the gate, guards are typing names into a register or flipping through a paper book to find the last entry for a room.",
  },
  {
    title: "No real way to verify a visit",
    body: "A visitor can claim any room, any host, any reason. Without the resident confirming it in the moment, the gate has no way to check the claim.",
  },
  {
    title: "No record when it matters",
    body: "When a warden needs to know who visited Room 214 last Tuesday, the answer lives in a handwritten book that may not even be filled in correctly.",
  },
];

export default function Problem() {
  return (
    <section className="border-t border-ink/10 bg-parchment-dim">
      <div className="mx-auto max-w-6xl px-6 py-20 md:px-10 md:py-28">
        <div className="max-w-[46ch]">
          <h2 className="font-display text-3xl italic text-ink sm:text-4xl">
            The gate lodge routine hasn&apos;t changed in decades.
          </h2>
          <p className="mt-4 text-ink/75">
            Most hostels still run visitor entry the way they did before
            anyone carried a QR-code-reading phone in their pocket.
          </p>
        </div>

        <div className="mt-14 grid gap-px overflow-hidden rounded-card border border-ink/10 bg-ink/10 sm:grid-cols-2">
          {problems.map((p) => (
            <div key={p.title} className="bg-parchment-dim p-8">
              <h3 className="font-display text-xl text-ink">{p.title}</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-ink/70">{p.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
