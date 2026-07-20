import { getStatusLabel } from '../domain/httpStatus'

// Quote a value for CSV and neutralize spreadsheet formula injection: a leading
// =, +, -, @ (or control char) is prefixed with a single quote so Excel/Sheets
// treat it as text, not a formula.
export function csvCell(value) {
  const text = String(value ?? '')
  const escaped = text.replace(/"/g, '""')
  const guarded = /^[=+\-@\t\r]/.test(escaped) ? `'${escaped}` : escaped
  return `"${guarded}"`
}

export function exportBulkRowsToCsv(rows) {
  const lines = ['URL,Status,Texto,Tempo (ms),Via,Redirecionado,Qtd Redirecionamentos,Cadeia de Redirecionamento']

  rows.forEach((row) => {
    const result = row.result

    if (!result) {
      lines.push([csvCell(row.url), '', 'Pendente', '', '', '', '', ''].join(','))
      return
    }

    if (!result.ok) {
      lines.push([csvCell(row.url), '', 'Erro', result.elapsed ?? 0, 'erro', '', '', ''].join(','))
      return
    }

    if (result.mode === 'no-cors') {
      lines.push([csvCell(row.url), '~', 'CORS bloqueado', result.elapsed, 'cors', '', '', ''].join(','))
      return
    }

    const redirects = result.redirects || []
    const hasRedirects = redirects.length > 0
    const isRedirectedStr = hasRedirects ? 'Sim' : 'Não'
    const redirectCount = redirects.length
    const via = hasRedirects ? `redirect (${redirectCount})` : 'direto'
    const chain = hasRedirects
      ? redirects.map((r) => `${r.url} (${r.statusCode})`).concat(result.finalUrl || row.url).join(' -> ')
      : ''

    lines.push([
      csvCell(row.url),
      result.code,
      csvCell(getStatusLabel(result.code)),
      result.elapsed,
      csvCell(via),
      csvCell(isRedirectedStr),
      redirectCount,
      csvCell(chain),
    ].join(','))
  })

  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `http-status-${new Date().toISOString().slice(0, 10)}.csv`
  anchor.click()
  URL.revokeObjectURL(url)
}
