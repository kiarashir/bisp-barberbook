'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'

export default function OwnerSignup() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!fullName || !email || password.length < 8) {
      toast.error('Fill all fields, password 8+ chars')
      return
    }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role: 'shop_owner' } },
    })
    setLoading(false)
    if (error) { toast.error(error.message); return }
    toast.success('Account created.')
    router.push('/owner/onboarding')
    router.refresh()
  }

  return (
    <div className="bg-white min-h-screen">
      <section className="max-w-5xl mx-auto px-4 pt-10 pb-6">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-stone-900 mb-2">
          Register your barbershop
        </h1>
        <p className="text-stone-500">Create an owner account to start taking bookings.</p>
      </section>

      <div className="border-t border-stone-200" />

      <section className="max-w-5xl mx-auto px-4 py-10 pb-20">
        <form onSubmit={handleSubmit} className="space-y-5 max-w-md">
          <div>
            <label className="block text-sm text-stone-700 mb-1.5">Your full name</label>
            <input
              className="w-full border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:border-stone-400"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
            />
          </div>
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
            <label className="block text-sm text-stone-700 mb-1.5">Password (8+ characters)</label>
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
            {loading ? 'Creating…' : 'Create owner account'}
          </button>
        </form>
      </section>
    </div>
  )
}
