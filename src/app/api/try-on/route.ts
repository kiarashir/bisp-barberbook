import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'

// Image generation can take a while.
export const maxDuration = 120

export async function POST(request: NextRequest) {
  // Only logged-in users may generate, so the OpenAI credit is not abused.
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

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  const prompt =
    `Restyle the person in the photo to have a ${style} hairstyle. ` +
    `Keep their face, skin tone, and features exactly the same. ` +
    `Realistic, well-lit, front-facing portrait with a clean background.`

  try {
    const result = await openai.images.edit({
      model: 'gpt-image-1',
      image: photos,
      prompt,
      n: 3,
      size: '1024x1024',
      quality: 'medium',
    })
    const images = (result.data ?? [])
      .map(d => d.b64_json)
      .filter((b): b is string => typeof b === 'string')
    return NextResponse.json({ images })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Generation failed.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
