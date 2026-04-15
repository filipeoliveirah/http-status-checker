import { ensureProtocol, extractHostname, parseBulkUrls } from '../../shared/url'
import { useBulkChecker } from '../hooks/useBulkChecker'
import { useSingleChecker } from '../hooks/useSingleChecker'
import { useMemo, useState } from 'react'
import { BulkModePanel } from './bulk/BulkModePanel'
import { SingleModePanel } from './single/SingleModePanel'

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

  function handleBulkInputChange(value) {
    setBulkInput(value)
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
            <SingleModePanel
              singleInput={singleInput}
              onSingleInputChange={setSingleInput}
              onSubmitSingle={submitSingle}
              onApplySample={applySample}
              singleLoading={single.loading}
              loadingHost={loadingHost}
              checkedUrl={single.checkedUrl}
              singleResult={single.result}
            />
          ) : (
            <BulkModePanel
              bulkInput={bulkInput}
              onBulkInputChange={handleBulkInputChange}
              onSubmitBulk={submitBulk}
              bulkUrlCount={bulkUrlCount}
              concurrency={concurrency}
              onConcurrencyChange={setConcurrency}
              bulkRunning={bulk.running}
              bulkError={bulkError}
              hasRows={bulk.rows.length > 0}
              doneCount={bulk.doneCount}
              totalRows={bulk.rows.length}
              stats={bulk.stats}
              onExportCsv={bulk.exportCsv}
              visibleRows={visibleBulkRows}
              sort={bulk.sort}
              onSort={bulk.toggleSort}
              filters={bulk.filters}
              onToggleFilter={bulk.toggleFilter}
            />
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
