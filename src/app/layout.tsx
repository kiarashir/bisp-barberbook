import type { Metadata } from 'next'
import { Fraunces, Hanken_Grotesk } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import Nav from '@/components/Nav'
import './globals.css'

const display = Fraunces({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-display',
})
const body = Hanken_Grotesk({ subsets: ['latin'], variable: '--font-body' })

export const metadata: Metadata = {
  title: 'BarberBook',
  description: 'Book your next haircut in Tashkent',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="min-h-screen bg-gray-50 text-gray-900 font-[family-name:var(--font-body)]">
        <Nav />
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  )
}
