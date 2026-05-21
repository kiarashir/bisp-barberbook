'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import PhotoCropper from '@/components/PhotoCropper'

// Example photos are from Wikimedia Commons.
const STYLES = [
  { name: 'Fade', photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Fade_Hair_Cut.jpg/500px-Fade_Hair_Cut.jpg' },
  { name: 'High top fade', photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/High_top_fade.jpg/500px-High_top_fade.jpg' },
  { name: 'Buzz cut', photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/SDCC_2015_-_James_McAvoy_%2819573358149%29_%28cropped%29.jpg/330px-SDCC_2015_-_James_McAvoy_%2819573358149%29_%28cropped%29.jpg' },
  { name: 'Crew cut', photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Crew_Cut%2C_Semi_Short_Taper.jpg/500px-Crew_Cut%2C_Semi_Short_Taper.jpg' },
  { name: 'High and tight', photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Highandtight.jpg/500px-Highandtight.jpg' },
  { name: 'Undercut', photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Undercut_%2820048891914%29.jpg/500px-Undercut_%2820048891914%29.jpg' },
  { name: 'Quiff', photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ee/Man_with_glasses_and_a_quiff_hairstyle_%281490854%29.jpg/500px-Man_with_glasses_and_a_quiff_hairstyle_%281490854%29.jpg' },
  { name: 'Pompadour', photo: 'https://upload.wikimedia.org/wikipedia/commons/5/50/Pompadour_hairstyle.jpg' },
]

type Photo = { file: File; preview: string }

export default function TryOnPage() {
  const supabase = createClient()
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [style, setStyle] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<string[]>([])

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push('/login')
    })
  }, [])

  // Free the photo preview object URLs when leaving the page.
  const photosRef = useRef<Photo[]>([])
  photosRef.current = photos
  useEffect(() => {
    return () => {
      for (const p of photosRef.current) URL.revokeObjectURL(p.preview)
    }
  }, [])

  function pickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) setCropSrc(URL.createObjectURL(f))
    e.target.value = ''
  }

  function onCropped(file: File) {
    setPhotos(prev => [...prev, { file, preview: URL.createObjectURL(file) }])
    if (cropSrc) URL.revokeObjectURL(cropSrc)
    setCropSrc(null)
  }

  function cancelCrop() {
    if (cropSrc) URL.revokeObjectURL(cropSrc)
    setCropSrc(null)
  }

  function removePhoto(i: number) {
    setPhotos(prev => {
      URL.revokeObjectURL(prev[i].preview)
      return prev.filter((_, idx) => idx !== i)
    })
  }

  async function generate() {
    if (!style) { toast.error('Pick a hairstyle'); return }
    setLoading(true)
    setResults([])
    const fd = new FormData()
    fd.append('style', style)
    for (const p of photos) fd.append('photos', p.file)

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
      <section className="max-w-3xl mx-auto px-4 pt-10 pb-6">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-stone-900 mb-2">
          AI hairstyle try-on
        </h1>
        <p className="text-stone-500">
          Upload a photo, pick a hairstyle, and see how it could look.
        </p>
        <p className="text-sm font-medium text-orange-600 mt-4">Step {step} of 2</p>
      </section>

      <div className="border-t border-stone-200" />

      <section className="max-w-3xl mx-auto px-4 py-10 pb-20">
        {/* Step 1 — photos */}
        {step === 1 && (
          <div>
            <h2 className="text-lg font-semibold text-stone-900 mb-1">Your photos</h2>
            <p className="text-sm text-stone-500 mb-5">
              Add 1 to 3 clear, front-facing photos. You can zoom and crop each one.
            </p>

            <div className="flex flex-wrap gap-3">
              {photos.map((p, i) => (
                <div key={i} className="relative w-28 h-28">
                  <img
                    src={p.preview}
                    alt=""
                    className="w-full h-full rounded-lg object-cover border border-stone-200"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-stone-900 text-white text-sm flex items-center justify-center hover:bg-stone-700"
                    aria-label="Remove photo"
                  >
                    ×
                  </button>
                </div>
              ))}

              {photos.length < 3 && (
                <label className="w-28 h-28 cursor-pointer rounded-lg border-2 border-dashed border-stone-300 flex flex-col items-center justify-center text-stone-400 hover:border-stone-400 hover:text-stone-500">
                  <span className="text-2xl leading-none">+</span>
                  <span className="text-xs mt-1">Add photo</span>
                  <input type="file" accept="image/*" onChange={pickFile} className="hidden" />
                </label>
              )}
            </div>

            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={photos.length === 0}
              className="mt-8 rounded-full bg-stone-900 text-white px-6 py-3 text-sm font-medium hover:bg-stone-800 transition disabled:opacity-40"
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 2 — hairstyle */}
        {step === 2 && (
          <div>
            <button
              type="button"
              onClick={() => setStep(1)}
              disabled={loading}
              className="text-sm text-stone-600 hover:text-stone-900 disabled:opacity-40 mb-5"
            >
              ← Back to photos
            </button>

            <h2 className="text-lg font-semibold text-stone-900 mb-4">Choose a hairstyle</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {STYLES.map(s => (
                <button
                  key={s.name}
                  type="button"
                  onClick={() => setStyle(s.name)}
                  disabled={loading}
                  className={`rounded-xl overflow-hidden border text-left transition disabled:opacity-60 ${
                    style === s.name
                      ? 'border-orange-500 ring-2 ring-orange-200'
                      : 'border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <div className="aspect-square bg-stone-100">
                    <img
                      src={s.photo}
                      alt=""
                      onError={e => { e.currentTarget.style.display = 'none' }}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="px-3 py-2 text-sm font-medium text-stone-900">{s.name}</p>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={generate}
              disabled={loading || !style}
              className="mt-8 rounded-full bg-orange-600 text-white px-6 py-3 text-sm font-medium hover:bg-orange-700 transition disabled:opacity-50"
            >
              {loading ? 'Generating…' : 'Generate hairstyles'}
            </button>

            {/* Results / skeletons */}
            {(loading || results.length > 0) && (
              <div className="mt-10">
                <h2 className="text-lg font-semibold text-stone-900 mb-4">Results</h2>
                {loading && (
                  <p className="text-sm text-stone-500 mb-4">
                    This can take up to a minute. Please wait.
                  </p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {loading
                    ? [0, 1, 2].map(i => (
                        <div
                          key={i}
                          className="aspect-square rounded-xl bg-stone-100 animate-pulse"
                        />
                      ))
                    : results.map((b64, i) => {
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
          </div>
        )}
      </section>

      {cropSrc && (
        <PhotoCropper src={cropSrc} onDone={onCropped} onCancel={cancelCrop} />
      )}
    </div>
  )
}
