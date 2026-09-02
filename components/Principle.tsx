export default function Principle() {
  return (
    <section className="border-t border-ink/10 bg-ink text-parchment">
      <div className="mx-auto max-w-4xl px-6 py-24 text-center md:px-10 md:py-32">
        <p className="font-mono text-[13px] text-brass-light">The idea behind ViFlow</p>
        <p className="mt-6 font-display text-[1.9rem] italic leading-snug sm:text-[2.4rem]">
          A visitor&apos;s identity is reusable.
          <br className="hidden sm:block" /> Their access to your hostel never is —
          it&apos;s earned again with every visit.
        </p>
        <p className="mx-auto mt-8 max-w-[50ch] text-parchment/70">
          ViFlow isn&apos;t a database of visitors sitting behind a gate. It&apos;s identity,
          authorization, verification and record-keeping working as one system,
          so speed and control stop being a trade-off.
        </p>
      </div>
    </section>
  );
}
