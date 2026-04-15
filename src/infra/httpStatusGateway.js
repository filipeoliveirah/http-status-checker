const REQUEST_TIMEOUT_MS = 12000

function fetchViaServer(url) {
  const params = new URLSearchParams({ url })
  return fetch(`/api/check?${params.toString()}`, {
    method: 'GET',
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
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

function fetchWithCors(url) {
  return fetch(url, {
    mode: 'cors',
    redirect: 'follow',
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
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

function probeNoCors(url) {
  return fetch(url, {
    mode: 'no-cors',
    redirect: 'follow',
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  }).then(() => ({
    ok: true,
    mode: 'no-cors',
  }))
}

function isTimeoutError(error) {
  return error?.name === 'AbortError' || error?.name === 'TimeoutError'
}

export async function checkUrlStatus(url) {
  const startedAt = Date.now()

  // Primary path: server-side check through Vercel function.
  // This avoids browser CORS limitations and gives real status codes.
  try {
    const serverResult = await fetchViaServer(url)
    return {
      ...serverResult,
      elapsed: serverResult.elapsed ?? Date.now() - startedAt,
      url: serverResult.url ?? url,
    }
  } catch {
    // Fallback keeps local/dev behavior if API route is not available.
  }

  try {
    const result = await fetchWithCors(url)
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
    await probeNoCors(url)
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
