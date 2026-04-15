const REQUEST_TIMEOUT_MS = 12000

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
