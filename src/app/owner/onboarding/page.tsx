'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'

export default function Onboarding() {
  const supabase = createClient()
  const router = useRouter()
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data } = await supabase
        .from('shops')
        .select('id')
        .eq('owner_id', user.id)
        .limit(1)
        .maybeSingle()
      if (data) router.push('/owner')
    })()
  }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name || !address) { toast.error('Name and address required'); return }
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    const { error } = await supabase.from('shops').insert({
      owner_id: user.id,
      name,
      address,
      description: description || null,
    })
    setLoading(false)
    if (error) { toast.error(error.message); return }
    toast.success('Shop created')
    router.push('/owner')
  }

  return (
    <div className="bg-white min-h-screen">
      <section className="max-w-5xl mx-auto px-4 pt-10 pb-6">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-stone-900 mb-2">
          Set up your shop
        </h1>
        <p className="text-stone-500">Tell customers about your barbershop. You can edit this later.</p>
      </section>

      <div className="border-t border-stone-200" />

      <section className="max-w-5xl mx-auto px-4 py-10 pb-20">
        <form onSubmit={submit} className="space-y-5 max-w-md">
          <div>
            <label className="block text-sm text-stone-700 mb-1.5">Shop name</label>
            <input
              className="w-full border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:border-stone-400"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm text-stone-700 mb-1.5">Address</label>
            <input
              className="w-full border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:border-stone-400"
              value={address}
              onChange={e => setAddress(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm text-stone-700 mb-1.5">Short description (optional)</label>
            <textarea
              className="w-full border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:border-stone-400"
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>
          <button
            disabled={loading}
            className="rounded-full bg-stone-900 text-white px-6 py-2.5 text-sm font-medium hover:bg-stone-800 transition disabled:opacity-40"
          >
            {loading ? 'Creating…' : 'Create shop'}
          </button>
        </form>
      </section>
    </div>
  )
}
