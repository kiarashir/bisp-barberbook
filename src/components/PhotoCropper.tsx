'use client'
import { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import type { Area } from 'react-easy-crop'

// Crops the source image to the chosen square area and returns it as a File.
async function getCroppedImg(src: string, area: Area): Promise<File> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
  const canvas = document.createElement('canvas')
  canvas.width = area.width
  canvas.height = area.height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas not supported')
  ctx.drawImage(image, area.x, area.y, area.width, area.height, 0, 0, area.width, area.height)
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (blob) resolve(new File([blob], 'photo.png', { type: 'image/png' }))
      else reject(new Error('Could not crop the photo'))
    }, 'image/png')
  })
}

export default function PhotoCropper({ src, onDone, onCancel }: {
  src: string
  onDone: (file: File) => void
  onCancel: () => void
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [area, setArea] = useState<Area | null>(null)

  const onComplete = useCallback((_: Area, pixels: Area) => setArea(pixels), [])

  async function use() {
    if (!area) return
    onDone(await getCroppedImg(src, area))
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-md overflow-hidden">
        <div className="relative h-80 bg-stone-900">
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            aspect={1}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onComplete}
          />
        </div>
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-sm text-stone-500">Zoom</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={e => setZoom(Number(e.target.value))}
              className="flex-1 accent-orange-600"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={onCancel}
              className="rounded-full border border-stone-300 px-5 py-2 text-sm font-medium text-stone-700 hover:border-stone-400"
            >
              Cancel
            </button>
            <button
              onClick={use}
              className="rounded-full bg-stone-900 text-white px-5 py-2 text-sm font-medium hover:bg-stone-800"
            >
              Use photo
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
