import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import sharp from 'sharp'
import { nanoid } from 'nanoid'
import { getSupabaseServer } from '@/lib/supabase/server'
import { getSupabaseService } from '@/lib/supabase/service'
import { r2Put } from '@/lib/r2'
import { serverEnv, PUBLIC_ENV } from '@/lib/env'

export const runtime = 'nodejs'
export const maxDuration = 30 // segundos para upload + sharp

const MAX_BYTES = 8 * 1024 * 1024 // 8 MB
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic'])

const textBodySchema = z.object({
  source_type: z.literal('text'),
  text: z.string().min(2).max(8000),
})
const linkBodySchema = z.object({
  source_type: z.literal('link'),
  url: z.string().url(),
})
const jsonBody = z.discriminatedUnion('source_type', [textBodySchema, linkBodySchema])

async function fireAndForgetWorker(jobId: string) {
  // Llamada a /api/process-job sin await — corre en una invocación separada
  // y no bloquea la respuesta al cliente.
  const url = new URL('/api/process-job', PUBLIC_ENV.APP_URL).toString()
  fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-quedamos-worker-secret': serverEnv.workerSecret,
    },
    body: JSON.stringify({ job_id: jobId }),
    keepalive: true,
  }).catch(() => {})
}

export async function POST(request: NextRequest) {
  const supabase = await getSupabaseServer()
  const { data: userData, error: userErr } = await supabase.auth.getUser()
  if (userErr || !userData.user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const user = userData.user
  const service = getSupabaseService()

  const contentType = request.headers.get('content-type') ?? ''
  let plan_source_input:
    | { source_type: 'image'; storage_key: string; image_url: string | null; raw_text: null; source_url: null }
    | { source_type: 'text'; storage_key: null; image_url: null; raw_text: string; source_url: null }
    | { source_type: 'link'; storage_key: null; image_url: null; raw_text: null; source_url: string }

  if (contentType.includes('multipart/form-data')) {
    const form = await request.formData()
    const file = form.get('file')
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'missing_file' }, { status: 400 })
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'file_too_large', max_bytes: MAX_BYTES }, { status: 413 })
    }
    if (!ALLOWED_MIME.has(file.type)) {
      return NextResponse.json({ error: 'unsupported_mime', got: file.type }, { status: 415 })
    }

    const inputBuf = Buffer.from(await file.arrayBuffer())
    // Sharp: strip EXIF, resize a max 1600px lado mayor, compresión jpeg q82
    const processed = await sharp(inputBuf, { failOn: 'truncated' })
      .rotate() // aplica EXIF orientation y luego strip
      .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 82, mozjpeg: true })
      .toBuffer()

    const key = `uploads/${user.id}/${nanoid(24)}.jpg`
    await r2Put({ key, body: processed, contentType: 'image/jpeg' })

    plan_source_input = {
      source_type: 'image',
      storage_key: key,
      image_url: null,
      raw_text: null,
      source_url: null,
    }
  } else {
    let parsed: z.infer<typeof jsonBody>
    try {
      parsed = jsonBody.parse(await request.json())
    } catch (err) {
      return NextResponse.json(
        { error: 'invalid_body', detail: err instanceof Error ? err.message : 'parse error' },
        { status: 400 },
      )
    }
    if (parsed.source_type === 'text') {
      plan_source_input = {
        source_type: 'text',
        storage_key: null,
        image_url: null,
        raw_text: parsed.text,
        source_url: null,
      }
    } else {
      plan_source_input = {
        source_type: 'link',
        storage_key: null,
        image_url: null,
        raw_text: null,
        source_url: parsed.url,
      }
    }
  }

  // Crear plan en estado draft (sin título — lo llenará el worker)
  const { data: plan, error: planErr } = await service
    .from('plans')
    .insert({ creator_id: user.id, status: 'draft' })
    .select('id')
    .single()
  if (planErr || !plan) {
    return NextResponse.json({ error: 'plan_insert_failed', detail: planErr?.message }, { status: 500 })
  }

  // plan_source
  const { data: source, error: sourceErr } = await service
    .from('plan_sources')
    .insert({ plan_id: plan.id, ...plan_source_input })
    .select('id')
    .single()
  if (sourceErr || !source) {
    return NextResponse.json({ error: 'source_insert_failed', detail: sourceErr?.message }, { status: 500 })
  }

  // processing_job
  const { data: job, error: jobErr } = await service
    .from('processing_jobs')
    .insert({
      plan_id: plan.id,
      plan_source_id: source.id,
      status: 'pending',
      provider: 'anthropic',
    })
    .select('id')
    .single()
  if (jobErr || !job) {
    return NextResponse.json({ error: 'job_insert_failed', detail: jobErr?.message }, { status: 500 })
  }

  // Disparar worker en otra invocación
  await fireAndForgetWorker(job.id)

  return NextResponse.json({ plan_id: plan.id, job_id: job.id })
}
