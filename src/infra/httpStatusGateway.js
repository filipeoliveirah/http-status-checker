const REQUEST_TIMEOUT_MS = 12000

// Combines the per-request timeout with an optional caller signal (e.g. the bulk
// "Parar" button) so either one can abort the fetch.
function requestSignal(signal) {
  const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS)
  if (!signal) return timeout
  if (typeof AbortSignal.any === 'function') return AbortSignal.any([signal, timeout])
  return signal.aborted ? signal : timeout
}

function fetchViaServer(url, signal) {
  const params = new URLSearchParams({ url })
  return fetch(`/api/check?${params.toString()}`, {
    method: 'GET',
    signal: requestSignal(signal),
    headers: {
      Accept: 'application/json',
    },
  }).then(async (response) => {
    if (!response.ok) {
      throw new Error('server_check_failed')
    }

    const payload = await response.json()
    if (!payload || typeof payload.ok !== 'boolean') {
      throw new Error('invalid_server_payload')
    }

    return payload
  })
}

function fetchWithCors(url, signal) {
  return fetch(url, {
    mode: 'cors',
    redirect: 'follow',
    signal: requestSignal(signal),
  }).then((response) => ({
    ok: true,
    mode: 'direct',
    code: response.status,
    contentType: response.headers.get('content-type') ?? '',
    server: response.headers.get('server') ?? '',
    cacheControl: response.headers.get('cache-control') ?? '',
    finalUrl: response.url || url,
  }))
}

function probeNoCors(url, signal) {
  return fetch(url, {
    mode: 'no-cors',
    redirect: 'follow',
    signal: requestSignal(signal),
  }).then(() => ({
    ok: true,
    mode: 'no-cors',
  }))
}

function isTimeoutError(error) {
  return error?.name === 'AbortError' || error?.name === 'TimeoutError'
}

export async function checkUrlStatus(url, signal) {
  const startedAt = Date.now()

  // Primary path: server-side check through Vercel function.
  // This avoids browser CORS limitations and gives real status codes.
  try {
    const serverResult = await fetchViaServer(url, signal)
    return {
      ...serverResult,
      elapsed: serverResult.elapsed ?? Date.now() - startedAt,
      url: serverResult.url ?? url,
    }
  } catch {
    // Fallback keeps local/dev behavior if API route is not available.
  }

  try {
    const result = await fetchWithCors(url, signal)
    return {
      ...result,
      elapsed: Date.now() - startedAt,
      url,
    }
  } catch (error) {
    if (isTimeoutError(error)) {
      return {
        ok: false,
        error: 'timeout',
        elapsed: Date.now() - startedAt,
        url,
      }
    }
  }

  try {
    await probeNoCors(url, signal)
    return {
      ok: true,
      mode: 'no-cors',
      elapsed: Date.now() - startedAt,
      url,
    }
  } catch (error) {
    return {
      ok: false,
      error: isTimeoutError(error) ? 'timeout' : 'unreachable',
      elapsed: Date.now() - startedAt,
      url,
    }
  }
}
