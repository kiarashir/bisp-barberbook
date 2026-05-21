'use client'
import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  // Keep one client for the whole app; cached data stays fresh for a minute.
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 60_000 } },
      }),
  )
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
