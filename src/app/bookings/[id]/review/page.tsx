'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'

type BookingRow = {
  shop_id: string
  status: string
  start_time: string
  shops: { name: string } | null
}

export default function ReviewPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()
  const [shopId, setShopId] = useState<string | null>(null)
  const [shopName, setShopName] = useState('')
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('bookings')
        .select('shop_id,status,start_time,shops(name)')
        .eq('id', id)
        .single<BookingRow>()
      if (!data) return
      if (new Date(data.start_time) > new Date()) {
        toast.error('You can only review past appointments.')
        router.push('/bookings')
        return
      }
      if (data.status === 'confirmed') {
        await supabase.from('bookings').update({ status: 'completed' }).eq('id', id)
      }
      setShopId(data.shop_id)
      setShopName(data.shops?.name ?? '')
    })()
  }, [id])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!shopId) return
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    const { error } = await supabase.from('reviews').insert({
      customer_id: user.id,
      shop_id: shopId,
      rating,
      comment: comment.trim() || null,
    })
    setLoading(false)
    if (error) { toast.error(error.message); return }
    toast.success('Review submitted')
    router.push('/bookings')
  }

  return (
    <div className="bg-white min-h-screen">
      <section className="max-w-5xl mx-auto px-4 pt-10 pb-6">
        <p className="text-sm text-stone-500 mb-3">{shopName || '…'}</p>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-stone-900 mb-2">
          Leave a review
        </h1>
        <p className="text-stone-500">Share your experience to help other customers.</p>
      </section>

      <div className="border-t border-stone-200" />

      <section className="max-w-5xl mx-auto px-4 py-10 pb-20">
        <form onSubmit={submit} className="space-y-6 max-w-md">
          <div>
            <label className="block text-sm text-stone-700 mb-2">Rating</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  type="button"
                  key={n}
                  onClick={() => setRating(n)}
                  className={`text-3xl transition ${n <= rating ? 'text-orange-500' : 'text-stone-300 hover:text-stone-400'}`}
                  aria-label={`${n} star${n === 1 ? '' : 's'}`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm text-stone-700 mb-1.5">Comment (optional)</label>
            <textarea
              className="w-full border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:border-stone-400"
              rows={4}
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="How was your visit?"
            />
          </div>
          <button
            disabled={loading}
            className="rounded-full bg-stone-900 text-white px-6 py-2.5 text-sm font-medium hover:bg-stone-800 transition disabled:opacity-40"
          >
            {loading ? 'Submitting…' : 'Submit review'}
          </button>
        </form>
      </section>
    </div>
  )
}
