'use client'

import { useCallback, useRef, useState } from 'react'
import type { ApiEnvelope, ExtractKind, ExtractResult } from '@/types'

interface Props {
  onExtracted: (result: ExtractResult) => void
  onClose: () => void
}

function kindFromFile(file: File): ExtractKind | null {
  const name = file.name.toLowerCase()
  if (name.endsWith('.csv')) return 'csv'
  if (name.endsWith('.pdf')) return 'pdf'
  if (name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.png') || name.endsWith('.webp')) {
    return 'image'
  }
  if (file.type.startsWith('image/')) return 'image'
  if (file.type === 'application/pdf') return 'pdf'
  if (file.type === 'text/csv') return 'csv'
  return null
}

async function readAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // "data:image/jpeg;base64,XXX" → "XXX"
      const idx = result.indexOf(';base64,')
      resolve(idx >= 0 ? result.slice(idx + ';base64,'.length) : result)
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

async function readAsText(file: File): Promise<string> {
  return await file.text()
}

export function UploadZone({ onExtracted, onClose }: Props) {
  const [dragging, setDragging] = useState(false)
  const [status, setStatus] = useState<'idle' | 'uploading' | 'error'>('idle')
  const [errMsg, setErrMsg] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const handleFile = useCallback(async (file: File) => {
    setErrMsg(null)
    const kind = kindFromFile(file)
    if (!kind) {
      setStatus('error')
      setErrMsg(`Unsupported file: ${file.name}. Use .csv, .pdf, .jpg/.png.`)
      return
    }
    setStatus('uploading')
    try {
      const payload = kind === 'csv' ? await readAsText(file) : await readAsBase64(file)
      const res = await fetch('/api/dashboard/extract', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ kind, payload }),
      })
      const envelope = (await res.json()) as ApiEnvelope<ExtractResult>
      if (!res.ok || !envelope.data) {
        throw new Error(envelope.error ?? 'Upload failed')
      }
      onExtracted(envelope.data)
      setStatus('idle')
    } catch (err) {
      setStatus('error')
      setErrMsg(err instanceof Error ? err.message : String(err))
    }
  }, [onExtracted])

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4"
      style={{ background: 'rgba(28, 26, 46, 0.55)' }}
      onClick={onClose}
    >
      <div
        className="surface-card p-6 w-full max-w-xl flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="label" style={{ fontSize: 11 }}>Upload</div>
            <h2 className="font-lora" style={{ fontSize: 22, color: 'var(--text-primary)' }}>
              Statement or receipt
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-sm px-2 py-1 rounded-md"
            style={{ background: 'var(--bg-card-soft)', color: 'var(--text-secondary)' }}
          >
            Close
          </button>
        </div>

        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            const file = e.dataTransfer.files[0]
            if (file) handleFile(file)
          }}
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all"
          style={{
            borderColor: dragging ? 'var(--accent-primary)' : 'var(--border-strong)',
            background: dragging ? 'var(--accent-primary-soft)' : 'var(--bg-card-soft)',
          }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--accent-primary)' }}>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" strokeLinecap="round" strokeLinejoin="round" />
            <polyline points="17 8 12 3 7 8" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="12" y1="3" x2="12" y2="15" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div className="text-sm mt-3 font-medium" style={{ color: 'var(--text-primary)' }}>
            Drop a file or <span style={{ color: 'var(--accent-primary-deep)' }}>browse</span>
          </div>
          <div className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
            CSV · PDF · JPG/PNG — up to 10 MB
          </div>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept=".csv,.pdf,.jpg,.jpeg,.png,.webp,application/pdf,text/csv,image/*"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFile(file)
            }}
          />
        </div>

        {status === 'uploading' && (
          <div className="text-sm flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--accent-primary)' }} />
            Parsing…
          </div>
        )}
        {status === 'error' && errMsg && (
          <div
            className="text-sm px-3 py-2 rounded-md"
            style={{ background: 'var(--accent-crimson-soft)', color: 'var(--accent-crimson-deep)' }}
          >
            {errMsg}
          </div>
        )}
      </div>
    </div>
  )
}
