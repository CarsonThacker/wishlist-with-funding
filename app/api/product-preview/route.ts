import { NextResponse } from 'next/server'

const allowedStores = [
  'amazon.com', 'amazon.co.uk', 'amazon.ca', 'amazon.de', 'amazon.fr', 'amazon.it',
  'amazon.es', 'amazon.com.au', 'amazon.co.jp', 'amazon.in', 'amazon.nl', 'amazon.se',
  'amazon.com.be', 'amazon.pl', 'ebay.com', 'ebay.co.uk', 'ebay.ca', 'ebay.de', 'ebay.fr',
  'ebay.it', 'ebay.es', 'ebay.com.au', 'ebay.ie',
]

function isSupportedStore(hostname: string) {
  const host = hostname.toLowerCase().replace(/^www\./, '')
  return allowedStores.some((store) => host === store || host.endsWith(`.${store}`))
}

function safeStoreUrl(value: string) {
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' || url.username || url.password || !isSupportedStore(url.hostname)) return null
    return url
  } catch {
    return null
  }
}

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/gi, '&').replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/&nbsp;/gi, ' ')
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code: string) => String.fromCodePoint(Number.parseInt(code, 16)))
    .trim()
}

function metaValues(html: string) {
  const metas: Array<Record<string, string>> = []
  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    const tag = match[0]
    const attrs: Record<string, string> = {}
    for (const attr of tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) {
      attrs[attr[1].toLowerCase()] = attr[2] ?? attr[3] ?? attr[4] ?? ''
    }
    metas.push(attrs)
  }
  return metas
}

function parseProduct(html: string) {
  const metas = metaValues(html)
  const getMeta = (...keys: string[]) => {
    for (const key of keys) {
      const found = metas.find((entry) => (entry.property ?? entry.name ?? entry.itemprop ?? '').toLowerCase() === key.toLowerCase())?.content
      if (found) return decodeHtml(found)
    }
    return ''
  }
  const title = getMeta('og:title', 'twitter:title', 'title') || decodeHtml(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '')
  const description = getMeta('og:description', 'description', 'twitter:description')
  const imageUrl = getMeta('og:image', 'twitter:image', 'og:image:url')
  let price = getMeta('product:price:amount', 'og:price:amount', 'price')
  if (!price) {
    price = html.match(/(?:a-offscreen|priceblock_ourprice|x-price-primary)[^>]*>\s*[^\d$£€]*([$£€]?\s?[\d,.]+)|<meta[^>]*(?:itemprop=["']price["'][^>]*content|content=["']([\d,.]+)["'][^>]*itemprop=["']price["'])/i)?.[1]
      ?? html.match(/(?:priceblock_ourprice|a-offscreen)[^>]*>\s*([$£€]?\s?[\d,.]+)/i)?.[1]
      ?? ''
  }
  const numericPrice = price ? Number(price.replace(/[^\d.]/g, '').replace(/,(?=\d{3}(?:\D|$))/g, '')) : NaN
  return {
    title: title.slice(0, 180),
    description: description.slice(0, 500),
    imageUrl: imageUrl.slice(0, 1500),
    price: Number.isFinite(numericPrice) ? numericPrice : null,
  }
}

async function readLimitedBody(response: Response, maxBytes = 1_500_000) {
  const reader = response.body?.getReader()
  if (!reader) return ''
  const chunks: Uint8Array[] = []
  let total = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.byteLength
    if (total > maxBytes) {
      await reader.cancel()
      throw new Error('Product page is too large to preview.')
    }
    chunks.push(value)
  }
  return new TextDecoder().decode(Buffer.concat(chunks))
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    if (typeof body.url !== 'string' || body.url.length > 2048) {
      return NextResponse.json({ error: 'Enter a supported product link.' }, { status: 400 })
    }

    let current = safeStoreUrl(body.url)
    if (!current) return NextResponse.json({ error: 'Product previews currently support Amazon and eBay links.' }, { status: 400 })

    let response: Response | null = null
    for (let attempt = 0; attempt < 4; attempt += 1) {
      response = await fetch(current, {
        redirect: 'manual',
        signal: AbortSignal.timeout(8000),
        headers: { 'user-agent': 'WishlistProductPreview/1.0', accept: 'text/html' },
      })
      if (response.status < 300 || response.status >= 400) break
      const location = response.headers.get('location')
      if (!location || attempt === 3) break
      current = safeStoreUrl(new URL(location, current).toString())
      if (!current) return NextResponse.json({ error: 'The store redirected to an unsupported product page.' }, { status: 400 })
    }

    if (!response?.ok || !response.headers.get('content-type')?.includes('text/html')) {
      return NextResponse.json({ error: 'This store did not provide a product preview. You can enter the details manually.' }, { status: 422 })
    }
    const html = await readLimitedBody(response)
    const product = parseProduct(html)
    if (!product.title && !product.description && !product.imageUrl && product.price === null) {
      return NextResponse.json({ error: 'No product details were available. You can enter them manually.' }, { status: 422 })
    }
    return NextResponse.json(product, { headers: { 'Cache-Control': 'private, max-age=60' } })
  } catch {
    return NextResponse.json({ error: 'Could not fetch product details. You can still add the item manually.' }, { status: 422 })
  }
}
