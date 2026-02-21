export interface ScrapedMeta {
  name?: string
  price?: number
  images: string[]   // all candidates; first is the best guess
}

function getMeta(doc: Document, ...selectors: string[]): string | undefined {
  for (const sel of selectors) {
    const val = doc.querySelector(sel)?.getAttribute('content')?.trim()
    if (val) return val
  }
  return undefined
}

const ERROR_STRINGS = [
  'access denied', 'forbidden', '403', '401', 'unauthorized',
  'blocked', 'captcha', 'robot', 'not found', '404', 'error',
  'just a moment', 'cloudflare', 'please enable',
]

function isErrorPage(title: string): boolean {
  const t = title.toLowerCase()
  return ERROR_STRINGS.some(s => t.includes(s))
}

async function fetchHtml(url: string, signal?: AbortSignal): Promise<string> {
  // Try corsproxy.io first — returns raw HTML directly
  try {
    const res = await fetch(`https://corsproxy.io/?url=${encodeURIComponent(url)}`, { signal })
    if (res.ok) {
      const html = await res.text()
      if (html.length > 500 && !html.toLowerCase().includes('corsproxy')) return html
    }
  } catch { /* fall through */ }

  // Fallback: allorigins — returns JSON { contents: html }
  const res2 = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`, { signal })
  if (!res2.ok) throw new Error('All proxies failed')
  const json = await res2.json() as { contents: string }
  return json.contents
}

function collectImages(doc: Document, html: string): string[] {
  const seen = new Set<string>()
  const imgs: string[] = []

  function add(src: unknown) {
    if (typeof src === 'string' && src.startsWith('http') && !seen.has(src)) {
      seen.add(src)
      imgs.push(src)
    }
  }

  // JSON-LD Product images (may be array)
  for (const script of Array.from(doc.querySelectorAll('script[type="application/ld+json"]'))) {
    try {
      const raw: unknown = JSON.parse(script.textContent ?? '{}')
      const items = (Array.isArray(raw) ? raw : [raw]) as Record<string, unknown>[]
      for (const item of items) {
        if (item['@type'] === 'Product') {
          const img = item.image
          if (Array.isArray(img)) img.forEach(add)
          else if (typeof img === 'string') add(img)
          else if (img && typeof img === 'object') add((img as Record<string, unknown>).url)
        }
      }
    } catch { /* skip */ }
  }

  // Open Graph images (there can be multiple og:image tags)
  doc.querySelectorAll('meta[property="og:image"], meta[property="og:image:secure_url"]')
    .forEach(el => add(el.getAttribute('content')))

  // Twitter card
  doc.querySelectorAll('meta[name="twitter:image"], meta[name="twitter:image:src"]')
    .forEach(el => add(el.getAttribute('content')))

  // Inline JSON arrays: "images":["https://...","https://..."]
  const jsonArrayMatch = html.match(/"images"\s*:\s*(\[[^\]]{0,2000}\])/)
  if (jsonArrayMatch?.[1]) {
    try {
      const arr = JSON.parse(jsonArrayMatch[1]) as unknown[]
      arr.forEach(add)
    } catch { /* skip */ }
  }

  return imgs
}

export async function scrapePageMeta(url: string, signal?: AbortSignal): Promise<ScrapedMeta> {
  const html = await fetchHtml(url, signal)
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const result: ScrapedMeta = { images: [] }

  // 1. JSON-LD schema.org Product — name + price
  for (const script of Array.from(doc.querySelectorAll('script[type="application/ld+json"]'))) {
    try {
      const raw: unknown = JSON.parse(script.textContent ?? '{}')
      const items = (Array.isArray(raw) ? raw : [raw]) as Record<string, unknown>[]
      for (const item of items) {
        if (item['@type'] === 'Product') {
          if (typeof item.name === 'string') result.name = item.name
          const offers = item.offers as Record<string, unknown> | Record<string, unknown>[] | undefined
          if (offers) {
            const offer = Array.isArray(offers) ? offers[0] : offers
            const p = parseFloat(String((offer as Record<string, unknown>).price ?? ''))
            if (!isNaN(p) && p > 0) result.price = p
          }
          break
        }
      }
    } catch { /* skip malformed */ }
  }

  // 2. Open Graph / product meta tags — name + price
  if (!result.name) {
    result.name = getMeta(doc,
      'meta[property="og:title"]',
      'meta[name="twitter:title"]',
    )
  }

  if (!result.price) {
    const raw = getMeta(doc,
      'meta[property="og:price:amount"]',
      'meta[property="product:price:amount"]',
      'meta[itemprop="price"]',
      'meta[name="price"]',
    )
    if (raw) {
      const p = parseFloat(raw.replace(/[^0-9.]/g, ''))
      if (!isNaN(p) && p > 0) result.price = p
    }
  }

  // 3. Collect all image candidates
  result.images = collectImages(doc, html)

  // 4. Fallback: <title>
  if (!result.name) {
    const title = doc.querySelector('title')?.textContent?.trim()
    if (title) result.name = title.split(/\s*[|\-–—]\s*/)[0].trim()
  }

  // 5. Inline JSON price pattern
  if (!result.price) {
    const m = html.match(/"price"\s*:\s*"?([\d]+\.?\d*)"?/)
    if (m?.[1]) {
      const p = parseFloat(m[1])
      if (!isNaN(p) && p > 0 && p < 1_000_000) result.price = p
    }
  }

  // Reject error-page names
  if (result.name && isErrorPage(result.name)) delete result.name

  return result
}
