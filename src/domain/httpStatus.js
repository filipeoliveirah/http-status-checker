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

export function classifyStatus(code) {
  if (code >= 200 && code < 300) return '2'
  if (code >= 300 && code < 400) return '3'
  if (code >= 400 && code < 500) return '4'
  if (code >= 500) return '5'
  return '5'
}

export function getStatusLabel(code) {
  return STATUS_LABELS[code] ?? 'Status desconhecido'
}

export function getStatusIcon(code) {
  const statusClass = classifyStatus(code)
  return {
    2: '✓',
    3: '↪',
    4: '⚠',
    5: '✗',
  }[statusClass]
}
