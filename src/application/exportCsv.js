import { getStatusLabel } from '../domain/httpStatus'

export function exportBulkRowsToCsv(rows) {
  const lines = ['URL,Status,Texto,Tempo (ms),Via']

  rows.forEach((row) => {
    const result = row.result

    if (!result) {
      lines.push(`"${row.url}",,Pendente,,`)
      return
    }

    if (!result.ok) {
      lines.push(`"${row.url}",,Erro,${result.elapsed ?? 0},erro`)
      return
    }

    if (result.mode === 'no-cors') {
      lines.push(`"${row.url}",~,CORS bloqueado,${result.elapsed},cors`)
      return
    }

    const label = getStatusLabel(result.code).replace(/"/g, '""')
    lines.push(`"${row.url}",${result.code},"${label}",${result.elapsed},direto`)
  })

  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const anchor = document.createElement('a')
  anchor.href = URL.createObjectURL(blob)
  anchor.download = `http-status-${new Date().toISOString().slice(0, 10)}.csv`
  anchor.click()
}
