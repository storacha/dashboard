import type { Metadata } from 'next'
import { Toaster } from 'react-hot-toast'
import W3UIProvider from '../components/W3UIProvider'
import { AuthenticationEnsurer } from '../components/Authenticator'
import './globals.css'

export const metadata: Metadata = {
  title: 'Storacha Customer Dashboard',
  description: 'View your storage and egress usage, invoicing, and capacity metrics',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <W3UIProvider>
          <AuthenticationEnsurer>
            {children}
          </AuthenticationEnsurer>
        </W3UIProvider>
        <Toaster position="top-right" />
      </body>
    </html>
  )
}
