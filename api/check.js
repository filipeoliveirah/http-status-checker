const REQUEST_TIMEOUT_MS = 12000

function ensureProtocol(url) {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`
}

function isPrivateIpv4(hostname) {
  const ipv4Match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
  if (!ipv4Match) return false

  const octets = ipv4Match.slice(1).map(Number)
  if (octets.some((octet) => octet < 0 || octet > 255)) return false

  const [a, b] = octets
  if (a === 10 || a === 127 || a === 0) return true
  if (a === 169 && b === 254) return true
  if (a === 192 && b === 168) return true
  if (a === 172 && b >= 16 && b <= 31) return true
  return false
}

function isBlockedHost(hostname) {
  const normalizedHost = hostname.toLowerCase()
  return (
    normalizedHost === 'localhost' ||
    normalizedHost === '::1' ||
    normalizedHost.endsWith('.local') ||
    isPrivateIpv4(normalizedHost)
  )
}

function createTimeoutSignal() {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  return {
    signal: controller.signal,
    clear: () => clearTimeout(timeoutId),
  }
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')

  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'method_not_allowed' })
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

  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    return res.status(400).json({ ok: false, error: 'invalid_protocol' })
  }

  if (isBlockedHost(parsedUrl.hostname)) {
    return res.status(400).json({ ok: false, error: 'blocked_host' })
  }

  const startedAt = Date.now()
  const timeout = createTimeoutSignal()

  try {
    const response = await fetch(parsedUrl.toString(), {
      method: 'GET',
      redirect: 'follow',
      signal: timeout.signal,
      headers: {
        'user-agent': 'OutLimit-HTTP-Status-Checker/1.0',
      },
    })
    timeout.clear()

    return res.status(200).json({
      ok: true,
      mode: 'direct',
      code: response.status,
      contentType: response.headers.get('content-type') ?? '',
      server: response.headers.get('server') ?? '',
      cacheControl: response.headers.get('cache-control') ?? '',
      finalUrl: response.url || parsedUrl.toString(),
      elapsed: Date.now() - startedAt,
      url: parsedUrl.toString(),
    })
  } catch (error) {
    timeout.clear()

    const isTimeout = error?.name === 'AbortError' || error?.name === 'TimeoutError'
    return res.status(200).json({
      ok: false,
      error: isTimeout ? 'timeout' : 'unreachable',
      elapsed: Date.now() - startedAt,
      url: parsedUrl.toString(),
    })
  }
}
