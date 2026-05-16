'use client'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'

type Row = { id: string; name: string; address: string; is_hidden: boolean }

export default function AdminShops() {
  const supabase = createClient()
  const [rows, setRows] = useState<Row[]>([])

  async function load() {
    const { data } = await supabase
      .from('shops')
      .select('id,name,address,is_hidden')
      .order('created_at', { ascending: false })
    setRows(data ?? [])
  }

  useEffect(() => { load() }, [])

  async function toggle(id: string, current: boolean) {
    const { error } = await supabase.from('shops').update({ is_hidden: !current }).eq('id', id)
    if (error) { toast.error(error.message); return }
    load()
  }

  return (
    <div className="bg-white min-h-screen">
      <section className="max-w-5xl mx-auto px-4 pt-10 pb-6">
        <p className="text-sm text-stone-500 mb-3">Admin</p>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-stone-900 mb-2">
          Shops
        </h1>
        <p className="text-stone-500">Hide or un-hide shops from the public listing.</p>
      </section>

      <div className="border-t border-stone-200" />

      <section className="max-w-5xl mx-auto px-4 py-10 pb-20">
        {rows.length === 0 ? (
          <p className="text-stone-500">No shops yet.</p>
        ) : (
          <ul className="space-y-2">
            {rows.map(r => (
              <li
                key={r.id}
                className="rounded-xl border border-stone-200 bg-white p-4 flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-stone-900 truncate">{r.name}</p>
                    {r.is_hidden && (
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 shrink-0">
                        hidden
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-stone-500 truncate">{r.address}</p>
                </div>
                <button
                  onClick={() => toggle(r.id, r.is_hidden)}
                  className={`text-sm rounded-full px-4 py-1.5 border transition shrink-0 ${
                    r.is_hidden
                      ? 'bg-stone-900 text-white border-stone-900 hover:bg-stone-800'
                      : 'bg-white text-stone-700 border-stone-200 hover:border-stone-300'
                  }`}
                >
                  {r.is_hidden ? 'Un-hide' : 'Hide'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
