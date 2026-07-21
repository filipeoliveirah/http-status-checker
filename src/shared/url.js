const MIN_URL_LENGTH = 3

export function ensureProtocol(url) {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`
}

export function extractHostname(url) {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}

// Canonicaliza a URL para evitar checagens redundantes no Set de deduplicação (Organizing Data)
export function canonicalizeUrl(urlStr) {
  const trimmed = urlStr.trim()
  if (!trimmed) return ''
  try {
    const withProtocol = ensureProtocol(trimmed)
    const url = new URL(withProtocol)

    // Converte hostname para minúsculo, remove a barra final redundante do path, e mantém query + hash
    const cleanPath = url.pathname.replace(/\/$/, '')
    return `${url.protocol}//${url.hostname.toLowerCase()}${url.port ? ':' + url.port : ''}${cleanPath}${url.search}${url.hash}`
  } catch {
    return ensureProtocol(trimmed)
  }
}

export function parseBulkUrls(text) {
  const urls = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > MIN_URL_LENGTH && (line.startsWith('http') || line.includes('.')))
    .map(canonicalizeUrl)
  return Array.from(new Set(urls))
}
