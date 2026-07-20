import http from 'node:http'
import https from 'node:https'
import net from 'node:net'
import { lookup as dnsLookup } from 'node:dns'
import { lookup as dnsLookupAsync } from 'node:dns/promises'

// Keep the request timeout safely below Vercel's function maxDuration (see
// vercel.json) so the graceful timeout below actually fires before the platform
// kills the invocation.
const REQUEST_TIMEOUT_MS = 9000
const MAX_REDIRECTS = 5
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX_REQUESTS = 120
const rateBuckets = new Map()

function ensureProtocol(url) {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`
}

function parseIpv4(ipv4) {
  const ipv4Match = ipv4.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
  if (!ipv4Match) return null

  const octets = ipv4Match.slice(1).map(Number)
  if (octets.some((octet) => octet < 0 || octet > 255)) return null
  return octets
}

function isPrivateIpv4(ipv4) {
  const octets = parseIpv4(ipv4)
  if (!octets) return false

  const [a, b] = octets
  if (a === 10 || a === 127 || a === 0) return true
  if (a === 169 && b === 254) return true
  if (a === 192 && b === 168) return true
  if (a === 172 && b >= 16 && b <= 31) return true
  return false
}

function isPrivateIpv6(ipv6) {
  const normalized = ipv6.toLowerCase()

  if (normalized === '::1' || normalized === '::') return true
  if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true
  if (/^fe[89ab]/.test(normalized)) return true

  const mappedIpv4 = normalized.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/)
  if (mappedIpv4) {
    return isPrivateIpv4(mappedIpv4[1])
  }

  return false
}

export function isPrivateIp(ipAddress) {
  if (net.isIP(ipAddress) === 4) return isPrivateIpv4(ipAddress)
  if (net.isIP(ipAddress) === 6) return isPrivateIpv6(ipAddress)
  return false
}

export function isBlockedHostName(hostname) {
  const normalizedHost = hostname.toLowerCase().replace(/\.$/, '')
  return normalizedHost === 'localhost' || normalizedHost.endsWith('.local') || normalizedHost.endsWith('.internal')
}

async function assertSafeHostname(hostname) {
  if (isBlockedHostName(hostname)) {
    throw new Error('blocked_host')
  }

  const ipVersion = net.isIP(hostname)
  if (ipVersion && isPrivateIp(hostname)) {
    throw new Error('blocked_host')
  }

  if (!ipVersion) {
    const addresses = await dnsLookupAsync(hostname, { all: true, verbatim: true })
    if (!addresses.length || addresses.some((entry) => isPrivateIp(entry.address))) {
      throw new Error('blocked_host')
    }
  }
}

async function assertSafeUrl(url) {
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('invalid_protocol')
  }

  await assertSafeHostname(url.hostname)
}

// Custom DNS lookup used at *connection time*. Validating here (instead of only
// before fetch) closes the DNS-rebinding / TOCTOU window: the IP we hand to the
// socket is exactly the IP we validated. Host header + TLS SNI still use the
// original hostname, so HTTPS keeps working normally.
function safeLookup(hostname, options, callback) {
  dnsLookup(hostname, { all: true, verbatim: true }, (error, addresses) => {
    if (error) {
      callback(error)
      return
    }
    // Validate *every* resolved address; block the whole host if any is private.
    if (!addresses.length || addresses.some((entry) => isPrivateIp(entry.address))) {
      callback(new Error('blocked_host'))
      return
    }
    // Honor the `all` flag so the socket layer keeps Happy-Eyeballs (autoSelectFamily)
    // and can fall back across IPv6/IPv4 — every returned address is already validated.
    if (options?.all) {
      callback(null, addresses)
      return
    }
    const [first] = addresses
    callback(null, first.address, first.family)
  })
}

function createTimeoutSignal() {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  return {
    signal: controller.signal,
    clear: () => clearTimeout(timeoutId),
  }
}

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for']
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim()
  }
  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0].split(',')[0].trim()
  }

  return req.socket?.remoteAddress ?? 'unknown'
}

function checkRateLimit(clientKey) {
  const now = Date.now()
  const bucket = rateBuckets.get(clientKey)

  if (!bucket || now - bucket.startedAt > RATE_LIMIT_WINDOW_MS) {
    // Best-effort, per-instance limiter. Serverless instances are ephemeral and
    // run in parallel, so this is NOT a global rate limit — for that use a shared
    // store (Vercel KV / Upstash). Sweep expired buckets so the Map stays bounded.
    if (rateBuckets.size > 1000) {
      for (const [key, value] of rateBuckets) {
        if (now - value.startedAt > RATE_LIMIT_WINDOW_MS) rateBuckets.delete(key)
      }
    }
    rateBuckets.set(clientKey, { startedAt: now, count: 1 })
    return true
  }

  if (bucket.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false
  }

  bucket.count += 1
  return true
}

function buildAllowedOrigins(req) {
  const host = req.headers['x-forwarded-host'] || req.headers.host
  const env = globalThis.process?.env ?? {}

  const envOrigins = String(env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)

  const base = [
    'https://http-status-checker-teal.vercel.app',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
  ]

  if (typeof host === 'string' && host.length > 0) {
    base.push(`https://${host}`)
  }

  return new Set([...base, ...envOrigins])
}

function isAllowedOrigin(req) {
  const origin = req.headers.origin
  if (!origin) return true

  const allowed = buildAllowedOrigins(req)
  return allowed.has(origin)
}

// Performs a single GET and resolves with the response (body is drained, never
// buffered — we only need status + headers).
function requestOnce(targetUrl, signal) {
  return new Promise((resolve, reject) => {
    const client = targetUrl.protocol === 'http:' ? http : https
    const request = client.request(
      targetUrl,
      {
        method: 'GET',
        lookup: safeLookup,
        signal,
        headers: {
          'user-agent': 'OutLimit-HTTP-Status-Checker/1.0',
        },
      },
      (response) => {
        response.resume()
        resolve(response)
      },
    )

    request.on('error', reject)
    request.end()
  })
}

async function fetchWithSafeRedirects(initialUrl, signal) {
  let currentUrl = initialUrl
  const redirects = []

  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
    const response = await requestOnce(currentUrl, signal)
    const status = response.statusCode

    const isRedirect = status >= 300 && status < 400
    if (!isRedirect) {
      return { response, finalUrl: currentUrl, redirects }
    }

    const location = response.headers.location
    if (!location) {
      return { response, finalUrl: currentUrl, redirects }
    }

    const nextUrl = new URL(location, currentUrl)
    await assertSafeUrl(nextUrl)

    redirects.push({
      url: currentUrl.toString(),
      statusCode: status,
      location: nextUrl.toString(),
    })

    currentUrl = nextUrl
  }

  throw new Error('redirect_loop')
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('Vary', 'Origin')

  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'method_not_allowed' })
  }

  if (!isAllowedOrigin(req)) {
    return res.status(403).json({ ok: false, error: 'forbidden_origin' })
  }

  const clientIp = getClientIp(req)
  if (!checkRateLimit(clientIp)) {
    res.setHeader('Retry-After', '60')
    return res.status(429).json({ ok: false, error: 'rate_limited' })
  }

  const rawUrl = Array.isArray(req.query.url) ? req.query.url[0] : req.query.url
  if (!rawUrl || typeof rawUrl !== 'string') {
    return res.status(400).json({ ok: false, error: 'missing_url' })
  }

  const requestedUrl = ensureProtocol(rawUrl.trim())
  let parsedUrl

  try {
    parsedUrl = new URL(requestedUrl)
  } catch {
    return res.status(400).json({ ok: false, error: 'invalid_url' })
  }

  try {
    await assertSafeUrl(parsedUrl)
  } catch (error) {
    if (error?.message === 'invalid_protocol') {
      return res.status(400).json({ ok: false, error: 'invalid_protocol' })
    }
    return res.status(400).json({ ok: false, error: 'blocked_host' })
  }

  const startedAt = Date.now()
  const timeout = createTimeoutSignal()

  try {
    const { response, finalUrl, redirects } = await fetchWithSafeRedirects(parsedUrl, timeout.signal)
    timeout.clear()

    return res.status(200).json({
      ok: true,
      mode: 'direct',
      code: response.statusCode,
      contentType: response.headers['content-type'] ?? '',
      server: response.headers['server'] ?? '',
      cacheControl: response.headers['cache-control'] ?? '',
      finalUrl: finalUrl.toString(),
      elapsed: Date.now() - startedAt,
      url: parsedUrl.toString(),
      redirects,
    })
  } catch (error) {
    timeout.clear()

    const isTimeout = error?.name === 'AbortError' || error?.name === 'TimeoutError'
    const isRedirectLoop = error?.message === 'redirect_loop'
    return res.status(200).json({
      ok: false,
      error: isTimeout ? 'timeout' : isRedirectLoop ? 'redirect_loop' : 'unreachable',
      elapsed: Date.now() - startedAt,
      url: parsedUrl.toString(),
    })
  }
}
