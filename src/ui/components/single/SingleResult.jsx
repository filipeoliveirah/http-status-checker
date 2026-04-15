import { classifyStatus, getStatusIcon, getStatusLabel } from '../../../domain/httpStatus'
import { formatElapsed } from '../../../shared/time'
import { Metric } from '../shared/Metric'
import { StatusPill } from '../shared/StatusPill'
import { STATUS_TEXT_CLASS } from '../shared/statusStyles'

export function SingleResult({ checkedUrl, result }) {
  if (!result) return null

  if (!result.ok) {
    const message =
      result.error === 'timeout'
        ? `Tempo esgotado (${formatElapsed(result.elapsed)}). O servidor pode estar lento ou offline.`
        : 'Host inacessível. Verifique se a URL está correta e o servidor está online.'

    return (
      <section className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-6">
        <h3 className="text-sm font-semibold text-red-700">Não foi possível verificar</h3>
        <p className="mt-1 text-sm text-red-700/90">{message}</p>
      </section>
    )
  }

  const protocol = checkedUrl.startsWith('https') ? 'HTTPS' : 'HTTP'

  if (result.mode === 'no-cors') {
    return (
      <section className="mt-8 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="flex items-center gap-5 border-b border-zinc-100 p-6">
          <div className="text-5xl font-bold leading-none tracking-tight text-zinc-400">~</div>
          <div className="min-w-0 flex-1">
            <p className="text-lg font-semibold text-zinc-800">Servidor acessível</p>
            <p className="truncate text-sm text-zinc-500">{checkedUrl}</p>
          </div>
          <StatusPill statusClass="3" text="CORS" />
        </div>
        <div className="grid gap-4 border-b border-zinc-100 p-6 md:grid-cols-3">
          <Metric label="Tempo" value={formatElapsed(result.elapsed)} />
          <Metric label="Protocolo" value={protocol} />
          <Metric label="Status HTTP" value="Indisponível" />
        </div>
        <p className="m-6 rounded-xl bg-indigo-50 p-4 text-sm leading-relaxed text-indigo-700">
          <strong>Por que o status não aparece?</strong> O servidor respondeu, mas não permite leitura cross-origin
          (CORS). Isso é comum em sites tradicionais.
        </p>
      </section>
    )
  }

  const statusClass = classifyStatus(result.code)
  const statusLabel = getStatusLabel(result.code)
  const finalUrl = result.finalUrl || checkedUrl
  const redirected = finalUrl !== checkedUrl

  const details = [
    ['content-type', result.contentType],
    ['server', result.server],
    ['cache-control', result.cacheControl],
    ['x-protocol', protocol],
    ['x-response-time', formatElapsed(result.elapsed)],
  ].filter((item) => item[1])

  if (redirected) {
    details.unshift(['location', finalUrl])
  }

  return (
    <section className="mt-8 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center gap-5 border-b border-zinc-100 p-6">
        <div className="text-5xl font-bold leading-none tracking-tight text-zinc-800">{result.code}</div>
        <div className="min-w-0 flex-1">
          <p className={`text-lg font-semibold ${STATUS_TEXT_CLASS[statusClass]}`}>
            {getStatusIcon(result.code)} {statusLabel}
          </p>
          <p className="truncate text-sm text-zinc-500">{finalUrl}</p>
        </div>
        <StatusPill statusClass={statusClass} text={`${statusClass}xx`} />
      </div>

      <div className="grid gap-4 border-b border-zinc-100 p-6 md:grid-cols-4">
        <Metric label="Tempo" value={formatElapsed(result.elapsed)} />
        <Metric label="Content-Type" value={result.contentType ? result.contentType.split(';')[0] : '—'} />
        <Metric label="Protocolo" value={protocol} />
        <Metric label="Redirecionado" value={redirected ? 'Sim' : 'Não'} />
      </div>

      <div className="p-6">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">Detalhes Da Resposta</p>
        <div className="space-y-2">
          {details.map(([key, value]) => (
            <div key={key} className="flex flex-col gap-1 border-b border-zinc-100 pb-2 text-sm md:flex-row md:gap-4">
              <span className="w-44 shrink-0 font-medium text-indigo-600">{key}</span>
              <span className="break-all text-zinc-600">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
