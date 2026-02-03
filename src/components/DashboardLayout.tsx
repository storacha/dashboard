'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'
import { useW3 } from '@storacha/ui-react'

interface DashboardLayoutProps {
  children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()
  const [{ accounts }] = useW3()

  const account = accounts[0]
  const accountDID = account?.did()

  return (
    <div className="min-h-screen bg-gradient-to-b from-hot-blue-light to-white">
      {/* Header */}
      <header className="bg-gradient-to-r from-hot-blue to-hot-blue-dark text-white shadow-lg">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold font-sans">Storacha Customer Dashboard</h1>
            {accountDID && (
              <div className="text-sm font-mono text-hot-blue-light">
                {accountDID.slice(0, 20)}...{accountDID.slice(-10)}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b-2 border-gray-200 shadow-sm">
        <div className="container mx-auto px-6">
          <div className="flex space-x-8">
            <Link
              href="/"
              className={`py-4 px-2 border-b-4 font-semibold transition-colors ${
                pathname === '/'
                  ? 'border-hot-blue text-hot-blue'
                  : 'border-transparent text-gray-600 hover:text-hot-blue'
              }`}
            >
              Invoicing
            </Link>
            <Link
              href="/monitoring"
              className={`py-4 px-2 border-b-4 font-semibold transition-colors ${
                pathname === '/monitoring'
                  ? 'border-hot-blue text-hot-blue'
                  : 'border-transparent text-gray-600 hover:text-hot-blue'
              }`}
            >
              Monitoring
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="container mx-auto px-6 py-4">
          <p className="text-center text-sm text-gray-600">
            &copy; 2026 Storacha Network. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
