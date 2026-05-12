'use client'

import { useState, type ChangeEvent, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Camera, LinkIcon, Type } from 'lucide-react'

type Mode = 'image' | 'link' | 'text'

export function NewPlanForm() {
  const [mode, setMode] = useState<Mode>('image')
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()

  async function go(opts: { url?: string; text?: string; file?: File }) {
    setSubmitting(true)
    try {
      let response: Response
      if (opts.file) {
        const fd = new FormData()
        fd.set('file', opts.file)
        response = await fetch('/api/plans/new', { method: 'POST', body: fd })
      } else if (opts.url) {
        response = await fetch('/api/plans/new', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ source_type: 'link', url: opts.url }),
        })
      } else {
        response = await fetch('/api/plans/new', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ source_type: 'text', text: opts.text }),
        })
      }
      const data = await response.json()
      if (!response.ok) {
        toast.error(data.error ?? 'No pudimos crear el plan')
        return
      }
      router.push(`/app/plans/${data.plan_id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error de red')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-5">
      <ModeSwitch mode={mode} onChange={setMode} />
      {mode === 'image' && <ImageInput submitting={submitting} onSubmit={go} />}
      {mode === 'link' && <LinkInput submitting={submitting} onSubmit={go} />}
      {mode === 'text' && <TextInput submitting={submitting} onSubmit={go} />}
    </div>
  )
}

function ModeSwitch({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  const tabs: { id: Mode; label: string; icon: typeof Camera }[] = [
    { id: 'image', label: 'Captura', icon: Camera },
    { id: 'link', label: 'Link', icon: LinkIcon },
    { id: 'text', label: 'Texto', icon: Type },
  ]
  return (
    <div className="grid grid-cols-3 gap-2 rounded-xl border border-border/60 bg-muted/40 p-1">
      {tabs.map((t) => {
        const active = mode === t.id
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className={[
              'flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              active
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            ].join(' ')}
          >
            <t.icon className="size-4" /> {t.label}
          </button>
        )
      })}
    </div>
  )
}

function ImageInput({
  submitting,
  onSubmit,
}: {
  submitting: boolean
  onSubmit: (opts: { file: File }) => void
}) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sube la captura</CardTitle>
        <CardDescription>
          JPG, PNG, WebP o HEIC · hasta 8 MB · sin metadata EXIF (la borramos automáticamente).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <label
          htmlFor="image-upload"
          className="flex min-h-44 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-muted/30 px-6 py-8 transition-colors hover:border-brand/40 hover:bg-muted/50"
        >
          {preview ? (
            // Vista previa local (blob URL) — next/image no aplica.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="preview"
              className="max-h-64 rounded-md object-contain"
            />
          ) : (
            <>
              <span className="grid size-12 place-items-center rounded-xl bg-brand-soft text-brand">
                <Camera className="size-5" />
              </span>
              <p className="text-sm font-medium">Toca para elegir o arrastra una captura</p>
              <p className="text-xs text-muted-foreground">JPG · PNG · WebP · HEIC</p>
            </>
          )}
          <input
            id="image-upload"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic"
            className="hidden"
            onChange={handleChange}
          />
        </label>
        <Button
          disabled={!file || submitting}
          onClick={() => file && onSubmit({ file })}
          size="lg"
          className="btn-brand w-full"
        >
          {submitting ? 'Subiendo…' : 'Convertir en plan'}
        </Button>
      </CardContent>
    </Card>
  )
}

function LinkInput({
  submitting,
  onSubmit,
}: {
  submitting: boolean
  onSubmit: (opts: { url: string }) => void
}) {
  const [url, setUrl] = useState('')
  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!url) return
    onSubmit({ url })
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pega el link</CardTitle>
        <CardDescription>
          De Instagram, TikTok, Google Maps, una página de evento, lo que sea.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              type="url"
              required
              autoFocus
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
          <Button type="submit" disabled={!url || submitting} size="lg" className="btn-brand w-full">
            {submitting ? 'Procesando…' : 'Convertir en plan'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function TextInput({
  submitting,
  onSubmit,
}: {
  submitting: boolean
  onSubmit: (opts: { text: string }) => void
}) {
  const [text, setText] = useState('')
  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!text) return
    onSubmit({ text })
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pega el texto</CardTitle>
        <CardDescription>
          Mensaje del grupo, descripción del evento, lo que tengas.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Cena en La Trattoria de Barranco, sábado a las 8..."
            rows={6}
            required
          />
          <Button type="submit" disabled={!text || submitting} size="lg" className="btn-brand w-full">
            {submitting ? 'Procesando…' : 'Convertir en plan'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
