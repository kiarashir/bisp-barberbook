'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'

const STYLES = [
  'Fade',
  'Buzz cut',
  'Crew cut',
  'Pompadour',
  'Undercut',
  'Quiff',
  'Slick back',
  'Textured crop',
  'Side part',
  'Long layered',
]

export default function TryOnPage() {
  const supabase = createClient()
  const router = useRouter()
  const [files, setFiles] = useState<File[]>([])
  const [style, setStyle] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<string[]>([])

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push('/login')
    })
  }, [])

  function pickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    setFiles(Array.from(e.target.files ?? []).slice(0, 3))
  }

  async function generate() {
    if (files.length === 0) { toast.error('Upload at least one photo'); return }
    if (!style) { toast.error('Pick a hairstyle'); return }

    setLoading(true)
    setResults([])
    const fd = new FormData()
    fd.append('style', style)
    for (const f of files) fd.append('photos', f)

    try {
      const res = await fetch('/api/try-on', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error ?? 'Generation failed'); return }
      setResults(json.images ?? [])
    } catch {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white min-h-screen">
      <section className="max-w-5xl mx-auto px-4 pt-10 pb-6">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-stone-900 mb-2">
          AI hairstyle try-on
        </h1>
        <p className="text-stone-500">
          Upload a photo of yourself, pick a hairstyle, and see how it could look.
        </p>
      </section>

      <div className="border-t border-stone-200" />

      <section className="max-w-5xl mx-auto px-4 py-10 pb-20 space-y-10">
        {/* Step 1 — photos */}
        <div>
          <h2 className="text-lg font-semibold text-stone-900 mb-1">1. Upload your photos</h2>
          <p className="text-sm text-stone-500 mb-4">
            1 to 3 clear, front-facing photos work best.
          </p>
          <label className="inline-block cursor-pointer rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:border-stone-400">
            Choose photos
            <input type="file" accept="image/*" multiple onChange={pickFiles} className="hidden" />
          </label>

          {files.length > 0 && (
            <div className="flex flex-wrap gap-3 mt-4">
              {files.map((f, i) => (
                <img
                  key={i}
                  src={URL.createObjectURL(f)}
                  alt=""
                  className="w-24 h-24 rounded-lg object-cover border border-stone-200"
                />
              ))}
            </div>
          )}
        </div>

        {/* Step 2 — style */}
        <div>
          <h2 className="text-lg font-semibold text-stone-900 mb-4">2. Pick a hairstyle</h2>
          <div className="flex flex-wrap gap-2">
            {STYLES.map(s => (
              <button
                key={s}
                type="button"
                onClick={() => setStyle(s)}
                className={`rounded-full px-4 py-2 text-sm border transition ${
                  style === s
                    ? 'bg-stone-900 text-white border-stone-900'
                    : 'border-stone-300 text-stone-700 hover:border-stone-400'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Step 3 — generate */}
        <div>
          <button
            type="button"
            onClick={generate}
            disabled={loading}
            className="rounded-full bg-orange-600 text-white px-6 py-3 text-sm font-medium hover:bg-orange-700 transition disabled:opacity-50"
          >
            {loading ? 'Generating…' : 'Generate hairstyles'}
          </button>
          {loading && (
            <p className="text-sm text-stone-500 mt-3">
              This can take up to a minute. Please wait.
            </p>
          )}
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-stone-900 mb-4">Results</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {results.map((b64, i) => {
                const url = `data:image/png;base64,${b64}`
                return (
                  <div key={i} className="rounded-xl border border-stone-200 overflow-hidden">
                    <img src={url} alt={`Result ${i + 1}`} className="w-full aspect-square object-cover" />
                    <a
                      href={url}
                      download={`hairstyle-${i + 1}.png`}
                      className="block text-center text-sm font-medium text-stone-700 py-2.5 border-t border-stone-200 hover:bg-stone-50"
                    >
                      Download
                    </a>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
