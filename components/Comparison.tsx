const rows = [
  ["Repeat visitors", "Re-enter details every time", "Profile reused after the first visit"],
  ["Entry speed", "Minutes of handwriting per guest", "One scan at the gate"],
  ["Approval", "Guard calls up or guesses", "Resident authorizes in the app"],
  ["ID checks", "Photocopies, easy to skip", "Verified once, kept on file"],
  ["Visit history", "Scattered across paper books", "Searchable by room, date or visitor"],
  ["Checkout", "Rarely tracked", "Closed out at the gate on exit"],
];

export default function Comparison() {
  return (
    <section className="border-t border-ink/10">
      <div className="mx-auto max-w-6xl px-6 py-20 md:px-10 md:py-28">
        <div className="max-w-[46ch]">
          <h2 className="font-display text-3xl italic text-ink sm:text-4xl">
            Compare it to the sign-in book.
          </h2>
        </div>

        <div className="mt-12 overflow-x-auto rounded-card border border-ink/15">
          <table className="w-full min-w-[560px] border-collapse text-left">
            <thead>
              <tr className="border-b border-ink/15 bg-parchment-dim">
                <th className="px-6 py-4 font-body text-sm font-medium text-ink/60">Gate operations</th>
                <th className="px-6 py-4 font-body text-sm font-medium text-ink/60">Sign-in book</th>
                <th className="px-6 py-4 font-body text-sm font-medium text-ink">ViFlow</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([label, before, after], i) => (
                <tr key={label} className={i !== rows.length - 1 ? "border-b border-ink/10" : ""}>
                  <td className="px-6 py-4 font-display text-[15px] text-ink">{label}</td>
                  <td className="px-6 py-4 text-[15px] text-ink/60">{before}</td>
                  <td className="px-6 py-4 text-[15px] text-sage-dim">{after}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
