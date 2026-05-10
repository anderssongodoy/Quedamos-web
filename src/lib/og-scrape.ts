import 'server-only'

// OpenGraph scraper liviano — sin libs externas, regex sobre el HTML.
// Si la URL no responde HTML válido, devuelve {} para que el caller decida fallback.

export interface OgMetadata {
  title?: string
  description?: string
  image?: string
  siteName?: string
  url?: string
}

const META_REGEX = /<meta\s+([^>]+?)\/?>/gi
const ATTR_REGEX = /([a-zA-Z:-]+)\s*=\s*"([^"]*)"/g

function parseAttrs(attrString: string): Record<string, string> {
  const out: Record<string, string> = {}
  let m: RegExpExecArray | null
  ATTR_REGEX.lastIndex = 0
  while ((m = ATTR_REGEX.exec(attrString))) {
    out[m[1].toLowerCase()] = m[2]
  }
  return out
}

export async function scrapeOpenGraph(url: string): Promise<OgMetadata> {
  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'User-Agent': 'QuedamosBot/1.0 (+https://quedamos.app)',
        Accept: 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return {}
    const ct = res.headers.get('content-type') ?? ''
    if (!ct.includes('text/html')) return {}

    // Solo leemos los primeros 256KB — los <meta> están en el <head>.
    const reader = res.body?.getReader()
    if (!reader) return {}
    const chunks: Uint8Array[] = []
    let total = 0
    const LIMIT = 256_000
    while (total < LIMIT) {
      const { value, done } = await reader.read()
      if (done) break
      chunks.push(value)
      total += value.byteLength
    }
    reader.cancel().catch(() => {})
    const html = Buffer.concat(chunks.map((c) => Buffer.from(c))).toString('utf8')

    const og: OgMetadata = {}
    let match: RegExpExecArray | null
    META_REGEX.lastIndex = 0
    while ((match = META_REGEX.exec(html))) {
      const attrs = parseAttrs(match[1])
      const property = attrs.property ?? attrs.name
      const content = attrs.content
      if (!property || !content) continue
      switch (property) {
        case 'og:title':
        case 'twitter:title':
          og.title ??= content
          break
        case 'og:description':
        case 'twitter:description':
        case 'description':
          og.description ??= content
          break
        case 'og:image':
        case 'twitter:image':
          og.image ??= content
          break
        case 'og:site_name':
          og.siteName ??= content
          break
        case 'og:url':
          og.url ??= content
          break
      }
    }

    if (!og.title) {
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
      if (titleMatch) og.title = titleMatch[1].trim()
    }

    return og
  } catch {
    return {}
  }
}
