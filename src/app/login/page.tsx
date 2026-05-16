'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setLoading(false)
      toast.error(error.message)
      return
    }

    // Look up the role so we can send the user to the right page.
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .maybeSingle()

    setLoading(false)
    toast.success('Logged in')

    let destination = '/'
    if (profile?.role === 'shop_owner') destination = '/owner'
    if (profile?.role === 'admin') destination = '/admin/shops'

    router.push(destination)
    router.refresh()
  }

  return (
    <div className="bg-white min-h-screen">
      <section className="max-w-5xl mx-auto px-4 pt-10 pb-6">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-stone-900 mb-2">
          Welcome back
        </h1>
        <p className="text-stone-500">Log in to manage your bookings.</p>
      </section>

      <div className="border-t border-stone-200" />

      <section className="max-w-5xl mx-auto px-4 py-10 pb-20">
        <form onSubmit={handleSubmit} className="space-y-5 max-w-md">
          <div>
            <label className="block text-sm text-stone-700 mb-1.5">Email</label>
            <input
              type="email"
              className="w-full border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:border-stone-400"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm text-stone-700 mb-1.5">Password</label>
            <input
              type="password"
              className="w-full border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:border-stone-400"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>
          <button
            disabled={loading}
            className="rounded-full bg-stone-900 text-white px-6 py-2.5 text-sm font-medium hover:bg-stone-800 transition disabled:opacity-40"
          >
            {loading ? 'Logging in…' : 'Log in'}
          </button>
          <p className="text-sm text-stone-500">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-stone-900 hover:underline">
              Sign up
            </Link>
            .
          </p>
        </form>
      </section>
    </div>
  )
}
