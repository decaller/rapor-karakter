import { Link, useRouterState } from '@tanstack/react-router'
import ThemeToggle from './ThemeToggle'

export default function Header() {
  const { pathname, search } = useRouterState({ select: (s) => s.location })
  const isDashboard = pathname.startsWith('/dashboard')
  const tab = isDashboard ? (search as any).tab || 'home' : undefined

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[var(--header-bg)] px-4 backdrop-blur-lg">
      <nav className="page-wrap flex flex-wrap items-center gap-x-3 gap-y-2 py-3 sm:py-4">
        <h2 className="m-0 flex-shrink-0 text-base font-semibold tracking-tight">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-3 py-1.5 text-sm text-[var(--sea-ink)] no-underline shadow-[0_8px_24px_rgba(30,90,72,0.08)] sm:px-4 sm:py-2"
          >
            <span className="h-2 w-2 rounded-full bg-[linear-gradient(90deg,#56c6be,#7ed3bf)]" />
            Rapor Karakter
          </Link>
        </h2>

        {isDashboard && (
          <div className="flex gap-6 ml-4 sm:ml-8 mt-2 sm:mt-0 items-center">
            <Link
              to="/dashboard"
              search={{ tab: 'home' }}
              className={`text-sm font-semibold transition-colors ${tab === 'home' ? 'text-[var(--sea-ink)]' : 'text-[var(--sea-ink-soft)] hover:text-[var(--sea-ink)]'}`}
            >
              Home
            </Link>
            <Link
              to="/dashboard"
              search={{ tab: 'data' }}
              className={`text-sm font-semibold transition-colors ${tab === 'data' ? 'text-[var(--sea-ink)]' : 'text-[var(--sea-ink-soft)] hover:text-[var(--sea-ink)]'}`}
            >
              Data
            </Link>
            <Link
              to="/dashboard"
              search={{ tab: 'monitoring' }}
              className={`text-sm font-semibold transition-colors ${tab === 'monitoring' ? 'text-[var(--sea-ink)]' : 'text-[var(--sea-ink-soft)] hover:text-[var(--sea-ink)]'}`}
            >
              Monitoring
            </Link>
          </div>
        )}

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <ThemeToggle />
        </div>
      </nav>
    </header>
  )
}
