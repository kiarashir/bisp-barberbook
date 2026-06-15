import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import { createClient } from '@/lib/supabase/server'

// Image generation can take a while.
export const maxDuration = 120

// Google's image model. If you ever see a "model not found" error,
// try 'gemini-2.5-flash-image' instead.
const MODEL = 'gemini-3.1-flash-image'

// How many variations to show the user. Gemini returns one image per
// call, so we make this many calls in parallel. Each one costs money,
// so keep this small. (The loading skeleton in the try-on page should
// match this number.)
const VARIATIONS = 2

export async function POST(request: NextRequest) {
  // Only logged-in users may generate, so the AI credit is not abused.
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'You must be logged in.' }, { status: 401 })
  }

  const formData = await request.formData()
  const style = formData.get('style')
  const photos = formData.getAll('photos').filter((p): p is File => p instanceof File)

  if (typeof style !== 'string' || !style || photos.length === 0) {
    return NextResponse.json({ error: 'Upload a photo and pick a style.' }, { status: 400 })
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

  const prompt =
    `Restyle the person in the photo to have a ${style} hairstyle. ` +
    `Keep their face, skin tone, and features exactly the same. ` +
    `Realistic, well-lit, front-facing portrait with a clean background.`

  // Gemini wants each photo as base64 text alongside its mime type.
  const imageParts = await Promise.all(
    photos.map(async (photo) => ({
      inlineData: {
        mimeType: photo.type || 'image/jpeg',
        data: Buffer.from(await photo.arrayBuffer()).toString('base64'),
      },
    }))
  )

  const contents = [{ text: prompt }, ...imageParts]

  try {
    // One call returns one image, so fire several in parallel for variety.
    // allSettled means one failed call doesn't sink the whole request.
    const results = await Promise.allSettled(
      Array.from({ length: VARIATIONS }, () =>
        ai.models.generateContent({ model: MODEL, contents })
      )
    )

    const images = results
      .map((result) => {
        if (result.status !== 'fulfilled') return undefined
        const parts = result.value.candidates?.[0]?.content?.parts ?? []
        for (const part of parts) {
          if (part.inlineData?.data) return part.inlineData.data
        }
        return undefined
      })
      .filter((b): b is string => typeof b === 'string')

    if (images.length === 0) {
      // If every call was rejected, surface a useful reason instead of
      // wrongly blaming the user's photo.
      const rejection = results.find((r): r is PromiseRejectedResult => r.status === 'rejected')
      if (rejection) {
        const raw = rejection.reason instanceof Error ? rejection.reason.message : String(rejection.reason)
        const friendly = /quota|RESOURCE_EXHAUSTED|429/i.test(raw)
          ? 'Image generation is not available on this Gemini plan. Billing must be enabled on the Google Cloud project.'
          : 'Image generation failed. Please try again in a moment.'
        return NextResponse.json({ error: friendly }, { status: 502 })
      }
      return NextResponse.json(
        { error: 'The AI could not create an image. Try a clearer, front-facing photo.' },
        { status: 502 }
      )
    }

    return NextResponse.json({ images })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Generation failed.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
