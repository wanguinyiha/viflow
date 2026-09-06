export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-ink/10 bg-parchment/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 md:px-10">
        <a href="#top" className="flex items-center gap-2 focus-ring rounded-sm">
          <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true">
            <rect x="1" y="1" width="24" height="24" rx="3" stroke="#16233B" strokeWidth="1.5" />
            <path d="M6 9.5L13 17L20 6" stroke="#B8863B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="font-display text-xl italic tracking-tight text-ink">ViFlow</span>
        </a>

        <nav className="hidden items-center gap-8 font-body text-[15px] text-ink/80 md:flex">
          <a href="#how-it-works" className="hover:text-ink focus-ring rounded-sm">How it works</a>
          <a href="#roles" className="hover:text-ink focus-ring rounded-sm">Who it&apos;s for</a>
          <a href="#faq" className="hover:text-ink focus-ring rounded-sm">Questions</a>
        </nav>

        <div className="flex items-center gap-3">
          <a
            href="/dashboard/resident"
            className="hidden font-body text-[15px] text-ink/80 hover:text-ink focus-ring rounded-sm sm:inline-block"
          >
            Dashboard
          </a>
        </div>
      </div>
    </header>
  );
}
