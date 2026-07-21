import { isTimeoutError } from '../shared/time'

// O timeout do cliente (12s) é pragmaticamente maior que o do servidor (9s)
// para que o servidor possa abortar e retornar um JSON de timeout formatado
// antes que o cliente encerre a requisição HTTP abruptamente.
const REQUEST_TIMEOUT_MS = 12000

export class ApiUnavailableError extends Error {
  constructor(message = 'api_not_available') {
    super(message)
    this.name = 'ApiUnavailableError'
  }
}

// Combina o timeout por requisição com um sinal opcional do chamador (ex: botão Parar)
// de modo que qualquer um dos dois possa abortar a requisição.
function requestSignal(signal) {
  const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS)
  if (!signal) return timeout
  if (typeof AbortSignal.any === 'function') return AbortSignal.any([signal, timeout])

  const controller = new AbortController()
  const onAbort = () => controller.abort()
  if (signal.aborted) {
    controller.abort()
  } else {
    signal.addEventListener('abort', onAbort)
  }
  timeout.addEventListener('abort', onAbort)
  return controller.signal
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
      if (response.status === 404) {
        throw new ApiUnavailableError()
      }
      let serverError
      try {
        const payload = await response.json()
        serverError = payload?.error
      } catch {
        // Ignorar payload não-JSON
      }
      throw new Error(serverError ?? 'server_check_failed')
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

export async function checkUrlStatus(url, signal) {
  const startedAt = Date.now()

  // Helpers para reduzir duplicação de envelopes de retorno (DRY / Composing Methods)
  const meta = (result) => ({
    ...result,
    url,
    elapsed: result.elapsed ?? (Date.now() - startedAt),
  })

  const failure = (error) => ({
    ok: false,
    url,
    error,
    elapsed: Date.now() - startedAt,
  })

  // Fluxo principal: checagem no servidor para contornar limites de CORS do navegador.
  try {
    const serverResult = await fetchViaServer(url, signal)
    return meta(serverResult)
  } catch (error) {
    if (!(error instanceof ApiUnavailableError)) {
      return failure(error?.message ?? 'server_check_failed')
    }
    // Fallback mantém comportamento local se a API não estiver disponível (404).
  }

  try {
    const result = await fetchWithCors(url, signal)
    return meta(result)
  } catch (error) {
    if (isTimeoutError(error)) {
      return failure('timeout')
    }
    // Erro de CORS/rede -> tenta probe no-cors como último fallback
  }

  try {
    await probeNoCors(url, signal)
    return meta({
      ok: true,
      mode: 'no-cors',
    })
  } catch (error) {
    return failure(isTimeoutError(error) ? 'timeout' : 'unreachable')
  }
}
