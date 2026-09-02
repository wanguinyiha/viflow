const roles = [
  {
    name: "Visitors",
    body: "Build a profile once, respond to invitations, and carry your QR pass — no re-registering at the gate you've already visited a dozen times.",
  },
  {
    name: "Residents",
    body: "Invite the people you're expecting and authorize each visit from your phone. No walking down to the gate to vouch for a guest.",
  },
  {
    name: "Guards",
    body: "Scan a code, get a clear verdict. Visitor, visit, resident and room are checked together, so you're not making judgment calls on your own.",
  },
  {
    name: "Administrators",
    body: "Manage residents, rooms and policy in one place, and pull up any visit on record instead of paging through a logbook.",
  },
];

export default function Roles() {
  return (
    <section id="roles" className="border-t border-ink/10 bg-parchment-dim">
      <div className="mx-auto max-w-6xl px-6 py-20 md:px-10 md:py-28">
        <div className="max-w-[46ch]">
          <h2 className="font-display text-3xl italic text-ink sm:text-4xl">
            Built around four people at the gate.
          </h2>
        </div>

        <div className="mt-14 grid gap-8 sm:grid-cols-2">
          {roles.map((role) => (
            <div key={role.name} className="border-l-2 border-brass pl-6">
              <h3 className="font-display text-2xl text-ink">{role.name}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-ink/70">{role.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
