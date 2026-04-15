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

export function parseBulkUrls(text) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 3 && (line.startsWith('http') || line.includes('.')))
    .map(ensureProtocol)
    .filter((url, index, arr) => arr.indexOf(url) === index)
}
