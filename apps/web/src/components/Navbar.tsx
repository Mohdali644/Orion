'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Zap, GitBranch } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Navbar() {
  const pathname = usePathname()

  const navItems = [
    { label: 'Dashboard', href: '/' },
    { label: 'Runs', href: '/runs' },
    { label: 'Repos', href: '/repos' },
    { label: 'Docs', href: '#' },
  ]

  return (
    <nav className="sticky top-0 z-50 h-16 flex items-center justify-between px-4 md:px-8 w-full border-b border-blue-100/40 bg-white/60 backdrop-blur-md">
      <div className="flex items-center gap-8">
        <Link href="/" className="flex items-center gap-3 shrink-0 group">
          <div className="w-9 h-9 bg-gradient-to-br from-[#2563eb] to-[#1d4ed8] rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-all">
            <Zap className="w-5 h-5 text-white font-bold" />
          </div>
          <span className="font-bold text-xl bg-gradient-to-r from-[#1f2937] to-[#374151] bg-clip-text text-transparent">
            Orion
          </span>
        </Link>

        <div className="hidden lg:flex items-center gap-1">
          {navItems.map(({ label, href }) => {
            const isActive = pathname === href
            return (
              <Link
                key={label}
                href={href}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                  isActive
                    ? "text-[#2563eb] bg-blue-50"
                    : "text-[#6b7280] hover:text-[#374151] hover:bg-blue-50/50"
                )}
              >
                {label}
              </Link>
            )
          })}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <a
          href="https://github.com/settings/installations/119828065"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] text-white rounded-lg hover:shadow-lg hover:shadow-blue-500/30 transition-all hover:-translate-y-0.5"
        >
          <GitBranch className="w-4 h-4" />
          Connect GitHub
        </a>

        <button className="lg:hidden p-2 rounded-lg hover:bg-blue-50 transition-all">
          <svg className="w-5 h-5 text-[#6b7280]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
    </nav>
  )
}