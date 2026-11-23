import { Analytics } from '@vercel/analytics/next'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'If You Ask',
  description: 'Make a wishlist, birthday, or holiday list and share it by link. Lists are not shown in a public directory.',
  icons: { icon: '/if-you-ask-logo.jpeg', apple: '/if-you-ask-logo.jpeg' },
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
  generator: 'v0.app',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} bg-white`}>
      <body className="font-sans antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
