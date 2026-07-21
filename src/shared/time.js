export function formatElapsed(ms) {
  if (ms < 1000) return `${ms} ms`
  return `${(ms / 1000).toFixed(2)} s`
}

export function isTimeoutError(error) {
  return error?.name === 'AbortError' || error?.name === 'TimeoutError'
}
