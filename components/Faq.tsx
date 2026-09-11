const faqs = [
  {
    q: "What is ViFlow?",
    a: "ViFlow is a secure visitor management system designed to make hostel visitor registration, verification, check-in, and check-out faster and more organized.",
  },
  {
    q: "Do I need to register every time I visit?",
    a: "No. Once your visitor information has been registered, you can avoid repeatedly entering the same basic information. However, every visit still requires a new invitation from the resident.",
  },
  {
    q: "Can I enter the hostel without an invitation?",
    a: "No. A valid invitation is required before a visitor can be approved for entry.",
  },
  {
    q: "Does being a previous visitor give me permanent access?",
    a: "No. Previous visits or being a favourite visitor does not give permanent access. A new invitation is required for every visit.",
  },
  {
    q: "How does the guard verify me?",
    a: "The guard checks your visit invitation and verifies the relevant visitor and resident information before approving your entry.",
  },
  {
    q: "What happens after I am approved?",
    a: "The guard checks you in, and your visit becomes an active visit in the system. The relevant resident and authorized hostel administrators can see the visit status.",
  },
  {
    q: "What happens when I leave?",
    a: "The guard checks you out, and the system records the check-out time and completes your visit history.",
  },
  {
    q: "Is my information secure?",
    a: "ViFlow is designed so that visitor information is only available to authorized users who need it for visitor management and verification.",
  },
  {
    q: "Can I visit a different resident using the same invitation?",
    a: "No. An invitation is created for a specific resident and visit. You need a new invitation for a different visit or resident.",
  },
  {
    q: "Can I have multiple visits?",
    a: "Yes. Your previous visits are retained as part of your visit history, while each new visit still requires its own invitation.",
  },
  {
    q: "Can I register my vehicle?",
    a: "Yes, where vehicle information is required. ViFlow keeps vehicle history so previous vehicle information does not have to be overwritten.",
  },
  {
    q: "Who can see my visitor information?",
    a: "Access to visitor information is restricted according to the user's role and what they need to perform their responsibilities within ViFlow.",
  },
];

export default function Faq() {
  return (
    <section id="faq" className="border-t border-ink/10 bg-parchment-dim">
      <div className="mx-auto max-w-3xl px-6 py-20 md:px-10 md:py-28">
        <h2 className="font-display text-3xl italic text-ink sm:text-4xl">Frequently Asked Questions</h2>

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
