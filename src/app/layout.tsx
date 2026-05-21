import type { Metadata } from 'next'
import { Toaster } from 'react-hot-toast'
import Nav from '@/components/Nav'
import './globals.css'

export const metadata: Metadata = {
  title: 'BarberBook',
  description: 'Book your next haircut in Tashkent',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <Nav />
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  )
}
