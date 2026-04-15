import { classifyStatus, getStatusIcon, getStatusLabel } from '../../domain/httpStatus'
import { formatElapsed } from '../../shared/time'
import { ensureProtocol, extractHostname, parseBulkUrls } from '../../shared/url'
import { useBulkChecker } from '../hooks/useBulkChecker'
import { useSingleChecker } from '../hooks/useSingleChecker'
import { useMemo, useState } from 'react'

const SAMPLE_URLS = [
  'https://api.github.com/users/github',
  'https://httpbin.org/status/404',
  'https://httpbin.org/status/500',
  'https://google.com',
  'https://httpbin.org/redirect/3',
]

const BULK_FILTERS = [
  { key: '2', label: '2xx', chipClass: 'bg-emerald-50 text-emerald-600 border-emerald-500' },
  { key: '3', label: '3xx', chipClass: 'bg-blue-50 text-blue-600 border-blue-500' },
  { key: '4', label: '4xx', chipClass: 'bg-orange-50 text-orange-600 border-orange-500' },
  { key: '5', label: '5xx', chipClass: 'bg-red-50 text-red-600 border-red-500' },
  { key: 'cors', label: 'CORS', chipClass: 'bg-indigo-50 text-indigo-600 border-indigo-500' },
  { key: 'err', label: 'Erro', chipClass: 'bg-zinc-100 text-zinc-500 border-zinc-400' },
]

function StatusPill({ statusClass, text }) {
  const classMap = {
    2: 'bg-emerald-50 text-emerald-600',
    3: 'bg-blue-50 text-blue-600',
    4: 'bg-orange-50 text-orange-600',
    5: 'bg-red-50 text-red-600',
  }

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold tracking-wider ${classMap[statusClass]}`}>
      {text}
    </span>
  )
}

function SingleResult({ checkedUrl, result }) {
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
  const statusTextClassMap = {
    2: 'text-emerald-600',
    3: 'text-blue-600',
    4: 'text-orange-600',
    5: 'text-red-600',
  }
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
          <p className={`text-lg font-semibold ${statusTextClassMap[statusClass]}`}>
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

function Metric({ label, value }) {
  return (
    <div className="border-r border-zinc-100 pr-6 last:border-r-0 md:last:pr-0">
      <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-zinc-800">{value}</p>
    </div>
  )
}

function LoadingState({ host }) {
  return (
    <div className="mt-8 flex items-center justify-center gap-3 rounded-2xl border border-zinc-200 bg-white py-8 text-sm text-zinc-500">
      <span className="inline-block size-5 animate-spin rounded-full border-2 border-zinc-200 border-t-indigo-600" />
      <span>Consultando {host}...</span>
    </div>
  )
}

function BulkTable({ rows, running, sort, onSort, filters, onToggleFilter, stats, doneCount, totalRows }) {
  const hasAnyFinishedRows = rows.some((row) => row.status === 'done')

  return (
    <section className="mt-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-zinc-600">
            <strong className="text-zinc-900">{doneCount}</strong> de <strong className="text-zinc-900">{totalRows}</strong>{' '}
            URLs verificadas
          </p>
          {hasAnyFinishedRows ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {BULK_FILTERS.filter((filter) => stats[filter.key] > 0).map((filter) => (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() => onToggleFilter(filter.key)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium ${
                    filter.chipClass
                  } ${filters[filter.key] ? 'opacity-100' : 'opacity-40'}`}
                >
                  {filter.label} · {stats[filter.key]}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-3 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase tracking-wider text-zinc-400">
              <tr>
                <SortableHead label="URL" active={sort.column === 'url'} asc={sort.asc} onClick={() => onSort('url')} />
                <SortableHead
                  label="Status"
                  active={sort.column === 'code'}
                  asc={sort.asc}
                  onClick={() => onSort('code')}
                />
                <th className="px-4 py-3">Texto</th>
                <SortableHead
                  label="Tempo"
                  active={sort.column === 'elapsed'}
                  asc={sort.asc}
                  onClick={() => onSort('elapsed')}
                />
                <th className="px-4 py-3">Via</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <BulkRow key={row.url} row={row} running={running} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

function SortableHead({ label, active, asc, onClick }) {
  return (
    <th className="cursor-pointer px-4 py-3 hover:text-zinc-600" onClick={onClick}>
      {label} <span className={active ? 'text-indigo-600' : ''}>{active ? (asc ? '↑' : '↓') : '↕'}</span>
    </th>
  )
}

function BulkRow({ row, running }) {
  if (row.status === 'pending') {
    return (
      <tr className="border-t border-zinc-100">
        <td colSpan={5} className="px-4 py-3 text-zinc-500">
          <span className="mr-2 inline-block size-3 animate-spin rounded-full border border-zinc-200 border-t-indigo-600" />
          {row.url} {running ? '' : '(interrompido)'}
        </td>
      </tr>
    )
  }

  const result = row.result
  if (!result?.ok) {
    const label = result?.error === 'timeout' ? 'Timeout' : result?.error === 'stopped' ? 'Interrompido' : 'Inacessível'
    return (
      <tr className="border-t border-zinc-100 hover:bg-zinc-50/60">
        <td className="max-w-[340px] truncate px-4 py-3 text-zinc-800">
          <a href={row.url} target="_blank" rel="noreferrer" className="hover:text-indigo-600 hover:underline">
            {row.url}
          </a>
        </td>
        <td className="px-4 py-3 font-semibold text-zinc-400">—</td>
        <td className="px-4 py-3 text-zinc-500">{label}</td>
        <td className="px-4 py-3 text-zinc-500">{result?.elapsed ? formatElapsed(result.elapsed) : '—'}</td>
        <td className="px-4 py-3">
          <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-600">erro</span>
        </td>
      </tr>
    )
  }

  if (result.mode === 'no-cors') {
    return (
      <tr className="border-t border-zinc-100 hover:bg-zinc-50/60">
        <td className="max-w-[340px] truncate px-4 py-3 text-zinc-800">
          <a href={row.url} target="_blank" rel="noreferrer" className="hover:text-indigo-600 hover:underline">
            {row.url}
          </a>
        </td>
        <td className="px-4 py-3 font-semibold text-zinc-400">~</td>
        <td className="px-4 py-3 text-indigo-600">Acessível (CORS)</td>
        <td className="px-4 py-3 text-zinc-500">{formatElapsed(result.elapsed)}</td>
        <td className="px-4 py-3">
          <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs text-indigo-600">cors</span>
        </td>
      </tr>
    )
  }

  const statusClass = classifyStatus(result.code)
  const textClassMap = {
    2: 'text-emerald-600',
    3: 'text-blue-600',
    4: 'text-orange-600',
    5: 'text-red-600',
  }

  return (
    <tr className="border-t border-zinc-100 hover:bg-zinc-50/60">
      <td className="max-w-[340px] truncate px-4 py-3 text-zinc-800">
        <a href={row.url} target="_blank" rel="noreferrer" className="hover:text-indigo-600 hover:underline">
          {row.url}
        </a>
      </td>
      <td className={`px-4 py-3 text-base font-bold ${textClassMap[statusClass]}`}>{result.code}</td>
      <td className="px-4 py-3 text-zinc-600">{getStatusLabel(result.code)}</td>
      <td className="px-4 py-3 text-zinc-500">{formatElapsed(result.elapsed)}</td>
      <td className="px-4 py-3">
        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-600">direto</span>
      </td>
    </tr>
  )
}

export function StatusCheckerApp() {
  const [mode, setMode] = useState('single')
  const [singleInput, setSingleInput] = useState('')
  const [bulkInput, setBulkInput] = useState('')
  const [bulkError, setBulkError] = useState('')
  const [concurrency, setConcurrency] = useState(10)

  const single = useSingleChecker()
  const bulk = useBulkChecker()

  const bulkUrlCount = useMemo(() => parseBulkUrls(bulkInput).length, [bulkInput])
  const visibleBulkRows = useMemo(() => bulk.sortedAndFilteredRows, [bulk.sortedAndFilteredRows])

  const loadingHost = singleInput.trim() ? extractHostname(ensureProtocol(singleInput.trim())) : 'servidor'

  function submitSingle(event) {
    event.preventDefault()
    single.run(singleInput)
  }

  function applySample(url) {
    setSingleInput(url)
    single.run(url)
  }

  function submitBulk(event) {
    event.preventDefault()
    const { started } = bulk.run(bulkInput, concurrency)
    if (!started && bulkUrlCount === 0) {
      setBulkError('Cole pelo menos uma URL válida para iniciar a verificação.')
      return
    }
    setBulkError('')
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)] text-[var(--text-primary)]">
      <header className="border-b border-zinc-200 bg-white">
        <nav className="mx-auto flex h-16 max-w-7xl items-center px-6 lg:px-10">
          <a href="https://outlimit.com.br" target="_blank" rel="noreferrer">
            <img
              src="https://outlimit.com.br/wp-content/uploads/2026/03/logo-out-limit-creative-light.png"
              alt="Out Limit"
              className="h-8 w-auto"
            />
          </a>
          <div className="mx-4 h-5 w-px bg-zinc-300" />
          <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600">HTTP Status Checker</span>
          <div className="ml-auto">
            <a
              href="https://outlimit.com.br"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded-full bg-zinc-900 px-4 py-2 text-xs font-medium text-white transition hover:opacity-85"
            >
              Falar com especialista
            </a>
          </div>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-6 pb-16 lg:px-10">
        <section className="relative pt-16 text-center">
          <span className="inline-flex items-center rounded-full bg-indigo-50 px-4 py-1.5 text-xs font-medium text-indigo-600">
            Verificação instantânea
          </span>
          <h1 className="mx-auto mt-5 max-w-xl text-4xl font-bold tracking-tight text-zinc-900 md:text-5xl">
            HTTP Status Checker
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-zinc-600">Verifique o status de uma URL ou centenas de uma vez.</p>

          <div className="mt-8 inline-flex rounded-full border border-zinc-300 bg-white p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setMode('single')}
              className={`rounded-full px-5 py-2 text-sm font-medium transition ${
                mode === 'single' ? 'bg-zinc-900 text-white' : 'text-zinc-500'
              }`}
            >
              URL única
            </button>
            <button
              type="button"
              onClick={() => setMode('bulk')}
              className={`rounded-full px-5 py-2 text-sm font-medium transition ${
                mode === 'bulk' ? 'bg-zinc-900 text-white' : 'text-zinc-500'
              }`}
            >
              Em lote
            </button>
          </div>

          {mode === 'single' ? (
            <section className="mx-auto mt-6 max-w-3xl text-left">
              <form onSubmit={submitSingle} className="flex items-center gap-2 rounded-full border border-zinc-300 bg-white px-5 py-2 shadow-sm">
                <input
                  type="url"
                  value={singleInput}
                  onChange={(event) => setSingleInput(event.target.value)}
                  placeholder="https://exemplo.com"
                  className="w-full border-none bg-transparent text-sm text-zinc-800 outline-none placeholder:text-zinc-400"
                  autoComplete="off"
                  autoCapitalize="off"
                  spellCheck={false}
                />
                <button
                  type="submit"
                  className="rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-55"
                  disabled={single.loading}
                >
                  {single.loading ? 'Verificando...' : 'Verificar'}
                </button>
              </form>

              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {SAMPLE_URLS.map((url) => (
                  <button
                    key={url}
                    type="button"
                    onClick={() => applySample(url)}
                    className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-600 transition hover:border-indigo-500 hover:text-indigo-600"
                  >
                    {url.includes('httpbin') ? url.replace('https://httpbin.org/', '') : extractHostname(url)}
                  </button>
                ))}
              </div>

              {single.loading ? <LoadingState host={loadingHost} /> : null}
              {!single.loading ? <SingleResult checkedUrl={single.checkedUrl} result={single.result} /> : null}
            </section>
          ) : (
            <section className="mx-auto mt-6 max-w-3xl text-left">
              <form onSubmit={submitBulk}>
                <textarea
                  value={bulkInput}
                  onChange={(event) => {
                    setBulkInput(event.target.value)
                    setBulkError('')
                  }}
                  placeholder={'Cole as URLs aqui, uma por linha:\nhttps://meusite.com\nhttps://api.meusite.com/health\n...'}
                  className="min-h-44 w-full resize-y rounded-2xl border border-zinc-300 bg-white p-4 text-sm leading-relaxed text-zinc-800 shadow-sm outline-none ring-indigo-500/20 transition focus:ring-4"
                />

                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-zinc-500">
                    <span className="font-medium text-zinc-700">{bulkUrlCount} URL(s)</span> detectadas
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="flex items-center gap-2 text-xs text-zinc-600">
                      Paralelas:
                      <select
                        value={concurrency}
                        onChange={(event) => setConcurrency(Number(event.target.value))}
                        className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-800"
                      >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                      </select>
                    </label>
                    <button
                      type="submit"
                      className="rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white transition hover:bg-zinc-800"
                    >
                      {bulk.running ? 'Parar' : 'Verificar todas'}
                    </button>
                  </div>
                </div>
              </form>

              {bulkError ? (
                <section className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{bulkError}</section>
              ) : null}

              {bulk.rows.length > 0 ? (
                <>
                  <section className="mt-7 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                    <div className="mb-3 flex items-center justify-between text-sm">
                      <p className="font-medium text-zinc-800">{bulk.doneCount === bulk.rows.length ? 'Concluído' : 'Verificando...'}</p>
                      <p className="text-zinc-500">
                        {bulk.doneCount} / {bulk.rows.length}
                      </p>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-zinc-200">
                      <div
                        className="h-full rounded-full bg-indigo-600 transition-all"
                        style={{ width: `${bulk.rows.length ? Math.round((bulk.doneCount / bulk.rows.length) * 100) : 0}%` }}
                      />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-4 text-xs text-zinc-600">
                      {bulk.stats[2] > 0 ? <span>{bulk.stats[2]} 2xx</span> : null}
                      {bulk.stats[3] > 0 ? <span>{bulk.stats[3]} 3xx</span> : null}
                      {bulk.stats[4] > 0 ? <span>{bulk.stats[4]} 4xx</span> : null}
                      {bulk.stats[5] > 0 ? <span>{bulk.stats[5]} 5xx</span> : null}
                      {bulk.stats.cors > 0 ? <span>{bulk.stats.cors} CORS</span> : null}
                      {bulk.stats.err > 0 ? <span>{bulk.stats.err} erro</span> : null}
                    </div>
                  </section>

                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={bulk.exportCsv}
                      className="rounded-full border border-zinc-300 bg-white px-4 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50"
                    >
                      Exportar CSV
                    </button>
                  </div>

                  <BulkTable
                    rows={visibleBulkRows}
                    running={bulk.running}
                    sort={bulk.sort}
                    onSort={bulk.toggleSort}
                    filters={bulk.filters}
                    onToggleFilter={bulk.toggleFilter}
                    stats={bulk.stats}
                    doneCount={bulk.doneCount}
                    totalRows={bulk.rows.length}
                  />
                </>
              ) : null}
            </section>
          )}
        </section>
      </main>

      <footer className="mt-auto border-t border-zinc-200 bg-white px-6 py-4 text-center text-xs text-zinc-400">
        Feito com <span className="text-indigo-600">💙</span> pela{' '}
        <a href="https://outlimit.com.br" target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">
          Out Limit
        </a>
      </footer>
    </div>
  )
}
