'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'
import { useW3 } from '@storacha/ui-react'

interface DashboardLayoutProps {
  children: ReactNode
}

/**
 * Parse did:mailto format to extract email
 * Format: did:mailto:domain:username -> username@domain
 */
function parseEmailFromDID(did: string): string {
  if (!did) return ''

  // Handle did:mailto:domain:username format
  const parts = did.split(':')
  if (parts.length >= 4 && parts[1] === 'mailto') {
    const domain = parts[2]
    const username = parts.slice(3).join(':') // Handle usernames with colons
    return `${username}@${domain}`
  }

  // Fallback: truncate DID
  return `${did.slice(0, 16)}...${did.slice(-8)}`
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()
  const [{ accounts }] = useW3()

  const account = accounts[0]
  const accountDID = account?.did()
  const displayEmail = accountDID ? parseEmailFromDID(accountDID) : ''

  const navItems = [
    { href: '/monitoring', label: 'Monitoring', icon: '/icons/monitoring.svg' },
    { href: '/invoicing', label: 'Invoicing', icon: '/icons/invoicing.svg' },
  ]

  const partnerLogos = [
    { src: '/logos/magic-eden.svg', alt: 'Magic Eden' },
    { src: '/logos/recall.svg', alt: 'Recall' },
    { src: '/logos/filecoin.svg', alt: 'Filecoin' },
    { src: '/logos/harvard.svg', alt: 'Harvard' },
  ]

  return (
    <div className="min-h-screen bg-[#F0F7FF] flex">
      {/* Sidebar - Blue theme */}
      <aside className="w-60 bg-hot-blue flex flex-col fixed h-full rounded-tr-[32px]">
        {/* Logo */}
        <div className="px-5 py-6">
          <Link href="/" className="flex items-center">
            <Image
              src="/icons/logo.svg"
              alt="Storacha Forge"
              width={160}
              height={40}
              className="h-10 w-auto brightness-0 invert"
            />
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
                      transition-all duration-200
                      ${isActive
                        ? 'bg-[#005DA3] text-white'
                        : 'text-white/80 hover:bg-white/10 hover:text-white'
                      }
                    `}
                  >
                    <Image
                      src={item.icon}
                      alt=""
                      width={20}
                      height={20}
                      className={`w-5 h-5 ${isActive ? '' : 'brightness-0 invert'}`}
                    />
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Trusted by section */}
        <div className="px-5 py-5">
          <p className="text-[11px] text-white/50 uppercase tracking-wider mb-4">Trusted by</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            {partnerLogos.map((logo, index) => (
              <Image
                key={index}
                src={logo.src}
                alt={logo.alt}
                width={80}
                height={24}
                className="h-5 w-auto object-contain  opacity-60 hover:opacity-100 transition-opacity"
              />
            ))}
          </div>
        </div>

        {/* Footer links */}
        <div className="px-5 py-4 border-t border-white/10">
          <div className="flex gap-5 text-xs text-white/50">
            <a href="https://docs.storacha.network/terms/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
              Terms
            </a>
            <a href="https://docs.storacha.network/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
              Docs
            </a>
            <a href="mailto:support@storacha.network" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
              Support
            </a>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 ml-60">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
          <div className="flex items-center justify-between px-8 py-4">
            {/* Search placeholder */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-hot-blue/20 focus:border-hot-blue transition-all"
                />
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* User email */}
            {displayEmail && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-hot-blue-light flex items-center justify-center">
                  <span className="text-hot-blue text-sm font-medium">
                    {displayEmail.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-sm text-gray-700 font-medium">
                  {displayEmail}
                </span>
              </div>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  )
}