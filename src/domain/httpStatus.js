export const STATUS_LABELS = {
  100: 'Continue',
  101: 'Switching Protocols',
  102: 'Processing',
  103: 'Early Hints',
  200: 'OK',
  201: 'Created',
  202: 'Accepted',
  203: 'Non-Authoritative Information',
  204: 'No Content',
  205: 'Reset Content',
  206: 'Partial Content',
  207: 'Multi-Status',
  301: 'Moved Permanently',
  302: 'Found',
  303: 'See Other',
  304: 'Not Modified',
  307: 'Temporary Redirect',
  308: 'Permanent Redirect',
  400: 'Bad Request',
  401: 'Unauthorized',
  402: 'Payment Required',
  403: 'Forbidden',
  404: 'Not Found',
  405: 'Method Not Allowed',
  406: 'Not Acceptable',
  408: 'Request Timeout',
  409: 'Conflict',
  410: 'Gone',
  411: 'Length Required',
  413: 'Payload Too Large',
  414: 'URI Too Long',
  415: 'Unsupported Media Type',
  418: "I'm a Teapot",
  422: 'Unprocessable Entity',
  423: 'Locked',
  425: 'Too Early',
  429: 'Too Many Requests',
  451: 'Unavailable for Legal Reasons',
  500: 'Internal Server Error',
  501: 'Not Implemented',
  502: 'Bad Gateway',
  503: 'Service Unavailable',
  504: 'Gateway Timeout',
  507: 'Insufficient Storage',
  511: 'Network Authentication Required',
}

/**
 * Representa as categorias de status HTTP mapeadas pelo dígito inicial da classe.
 * AVISO: Os valores numéricos brutos ('1', '2', etc.) são usados acoplados na UI
 * para concatenações como `${statusClass}xx` (ex: "2xx") e filtros na tabela.
 * A alteração desses valores quebrará a renderização e filtros da interface.
 */
export const HttpCategory = {
  INFORMATIONAL: '1',
  SUCCESS: '2',
  REDIRECT: '3',
  CLIENT_ERROR: '4',
  SERVER_ERROR: '5',
}

const CATEGORY_ICON = {
  [HttpCategory.INFORMATIONAL]: 'ℹ',
  [HttpCategory.SUCCESS]: '✓',
  [HttpCategory.REDIRECT]: '↪',
  [HttpCategory.CLIENT_ERROR]: '⚠',
  [HttpCategory.SERVER_ERROR]: '✗',
}

export function classifyStatus(code) {
  const parsed = Number(code)
  if (isNaN(parsed) || parsed < 100 || parsed >= 600) return null

  if (parsed >= 100 && parsed < 200) return HttpCategory.INFORMATIONAL
  if (parsed >= 200 && parsed < 300) return HttpCategory.SUCCESS
  if (parsed >= 300 && parsed < 400) return HttpCategory.REDIRECT
  if (parsed >= 400 && parsed < 500) return HttpCategory.CLIENT_ERROR
  return HttpCategory.SERVER_ERROR
}

export function getStatusLabel(code) {
  // Nota: Os status padrão da API são em inglês para manter o padrão técnico do protocolo HTTP.
  return STATUS_LABELS[code] ?? 'Unknown status'
}

export function getStatusIcon(code) {
  const statusClass = classifyStatus(code)
  return CATEGORY_ICON[statusClass] ?? '?'
}
