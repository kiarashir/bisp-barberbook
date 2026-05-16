'use client'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'

export default function Account() {
  const supabase = createClient()
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setEmail(user.email ?? '')
      const { data } = await supabase
        .from('profiles')
        .select('full_name,phone')
        .eq('id', user.id)
        .single()
      if (data) {
        setFullName(data.full_name ?? '')
        setPhone(data.phone ?? '')
      }
    }
    load()
  }, [])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName, phone })
      .eq('id', user.id)
    setLoading(false)
    if (error) { toast.error(error.message); return }
    toast.success('Saved')
  }

  // First letter for the avatar fallback.
  let initial = '?'
  if (fullName) initial = fullName.charAt(0).toUpperCase()
  else if (email) initial = email.charAt(0).toUpperCase()

  return (
    <div className="bg-white min-h-screen">
      <section className="bg-stone-50 border-b border-stone-200">
        <div className="max-w-5xl mx-auto px-4 py-10 flex items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-white border border-stone-200 shrink-0 flex items-center justify-center text-2xl text-stone-500 font-semibold">
            <span>{initial}</span>
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-stone-900 truncate">
              {fullName || 'Your profile'}
            </h1>
            <p className="text-stone-500 mt-1 truncate">{email || '—'}</p>
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-10 pb-20">
        <h2 className="text-xl font-semibold text-stone-900 mb-6">Profile details</h2>
        <form onSubmit={save} className="space-y-5 max-w-md">
          <div>
            <label className="block text-sm text-stone-700 mb-1.5">Email</label>
            <input
              className="w-full border border-stone-200 rounded-lg px-3 py-2 bg-stone-50 text-stone-500"
              value={email}
              disabled
            />
          </div>
          <div>
            <label className="block text-sm text-stone-700 mb-1.5">Full name</label>
            <input
              className="w-full border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:border-stone-400"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm text-stone-700 mb-1.5">Phone</label>
            <input
              className="w-full border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:border-stone-400"
              value={phone}
              onChange={e => setPhone(e.target.value)}
            />
          </div>
          <button
            disabled={loading}
            className="rounded-full bg-stone-900 text-white px-6 py-2.5 text-sm font-medium hover:bg-stone-800 transition disabled:opacity-40"
          >
            {loading ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      </section>
    </div>
  )
}
