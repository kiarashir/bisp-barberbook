'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'

export default function FavoriteButton({ shopId }: { shopId: string }) {
  const supabase = createClient()
  const router = useRouter()
  const [fav, setFav] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('shop_id', shopId)
        .maybeSingle()
      setFav(!!data)
    }
    load()
  }, [shopId])

  async function toggle() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setBusy(true)
    if (fav) {
      await supabase.from('favorites').delete().eq('user_id', user.id).eq('shop_id', shopId)
      setFav(false)
    } else {
      const { error } = await supabase.from('favorites').insert({ user_id: user.id, shop_id: shopId })
      if (error) { toast.error(error.message); setBusy(false); return }
      setFav(true)
    }
    setBusy(false)
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      className={`shrink-0 inline-flex items-center gap-1.5 text-sm font-medium rounded-full px-5 py-2.5 border transition disabled:opacity-50 ${
        fav
          ? 'border-orange-200 bg-orange-50 text-orange-700'
          : 'border-stone-300 bg-white text-stone-700 hover:border-stone-400'
      }`}
    >
      {fav ? '♥ Saved' : '♡ Save'}
    </button>
  )
}
