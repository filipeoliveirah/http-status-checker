import { classifyStatus, getStatusIcon, getStatusLabel } from '../../../domain/httpStatus'
import { formatElapsed } from '../../../shared/time'
import { Metric } from '../shared/Metric'
import { StatusPill } from '../shared/StatusPill'
import { STATUS_TEXT_CLASS } from '../shared/statusStyles'

export function SingleResult({ checkedUrl, result, embed = false }) {
  if (!result) return null

  if (!result.ok) {
    const message =
      result.error === 'timeout'
        ? `Tempo esgotado (${formatElapsed(result.elapsed)}). O servidor pode estar lento ou offline.`
        : 'Host inacessível. Verifique se a URL está correta e o servidor está online.'

    return (
      <section className={`${embed ? '' : 'mt-8'} rounded-2xl border border-red-200 bg-red-50 p-6`}>
        <h3 className="text-sm font-semibold text-red-700">Não foi possível verificar</h3>
        <p className="mt-1 text-sm text-red-700/90">{message}</p>
      </section>
    )
  }

  const protocol = checkedUrl.startsWith('https') ? 'HTTPS' : 'HTTP'

  if (result.mode === 'no-cors') {
    return (
      <section className={`${embed ? '' : 'mt-8 overflow-hidden rounded-2xl border border-zinc-200 shadow-sm'} bg-white`}>
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
  const redirects = result.redirects || []
  const redirectCount = redirects.length
  const redirectedLabel = redirectCount > 0
    ? `Sim (${redirectCount} ${redirectCount === 1 ? 'camada' : 'camadas'})`
    : redirected
      ? 'Sim'
      : 'Não'

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
    <section className={`${embed ? '' : 'mt-8 overflow-hidden rounded-2xl border border-zinc-200 shadow-sm'} bg-white`}>
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
        <Metric label="Redirecionado" value={redirectedLabel} />
      </div>

      {redirectCount > 0 && (
        <div className="border-b border-zinc-100 bg-zinc-50/50 p-6">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Cadeia de Redirecionamento
          </p>
          <div className="relative ml-3 border-l-2 border-indigo-100 pl-6 space-y-6">
            {redirects.map((redirect, idx) => (
              <div key={idx} className="relative">
                <span className="absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-50 ring-4 ring-white">
                  <span className="h-2 w-2 rounded-full bg-indigo-600" />
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-zinc-800 text-sm break-all">{redirect.url}</span>
                    <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-600/20">
                      {redirect.statusCode}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-zinc-500 flex items-center gap-1.5">
                    <span>Redireciona para</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="w-3 h-3 text-zinc-400 shrink-0"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                    </svg>
                    <span className="font-medium break-all text-zinc-600">{redirect.location}</span>
                  </p>
                </div>
              </div>
            ))}
            <div className="relative">
              <span className="absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-50 ring-4 ring-white">
                <span className="h-2 w-2 rounded-full bg-emerald-600" />
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-emerald-800 text-sm break-all">{finalUrl}</span>
                  <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                    statusClass === '2'
                      ? 'bg-emerald-50 text-emerald-800 ring-emerald-600/20'
                      : 'bg-red-50 text-red-800 ring-red-600/20'
                  }`}>
                    {result.code}
                  </span>
                </div>
                <p className="mt-1 text-xs text-emerald-700/80 font-medium">Destino Final</p>
              </div>
            </div>
          </div>
        </div>
      )}

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
