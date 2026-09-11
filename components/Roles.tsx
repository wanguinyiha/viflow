const roles = [
  {
    name: "Residents",
    body: "Invite visitors quickly without repeatedly entering the same information. Track your active visitors and view your visit history.",
  },
  {
    name: "Visitors",
    body: "Receive invitations by email, provide your information once, and enjoy a faster and more organized entry process on future visits.",
  },
  {
    name: "Guards",
    body: "Verify visitors quickly, confirm their invitation and resident details, and manage check-ins and check-outs from one place.",
  },
  {
    name: "Hostel Administrators",
    body: "Manage residents, rooms, visitors, guards, invitations, visits, and security activity while maintaining a clear record of what happens at the gate.",
  },
];

export default function Roles() {
  return (
    <section id="roles" className="border-t border-ink/10 bg-parchment-dim">
      <div className="mx-auto max-w-6xl px-6 py-20 md:px-10 md:py-28">
        <div className="max-w-[46ch]">
          <h2 className="font-display text-3xl italic text-ink sm:text-4xl">
            Who Is ViFlow For?
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
