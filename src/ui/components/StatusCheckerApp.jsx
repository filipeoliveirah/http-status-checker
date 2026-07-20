import { parseBulkUrls } from '../../shared/url'
import { useBulkChecker } from '../hooks/useBulkChecker'
import { useMemo, useState } from 'react'
import { BulkModePanel } from './bulk/BulkModePanel'

export function StatusCheckerApp() {
  const [bulkInput, setBulkInput] = useState('')
  const [bulkError, setBulkError] = useState('')
  const [concurrency, setConcurrency] = useState(10)

  const bulk = useBulkChecker()

  const bulkUrlCount = useMemo(() => parseBulkUrls(bulkInput).length, [bulkInput])

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
              className="h-auto w-42"
            />
          </a>

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
          <p className="mx-auto mt-3 max-w-lg text-zinc-600">
            Verifique o status de uma única URL ou analise centenas de links simultaneamente com rapidez e precisão.
          </p>

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
            visibleRows={bulk.sortedAndFilteredRows}
            sort={bulk.sort}
            onSort={bulk.toggleSort}
            filters={bulk.filters}
            onToggleFilter={bulk.toggleFilter}
          />
        </section>

        {/* CTA Diagnóstico Out Limit */}
        <section className="mt-24 mb-8 rounded-[24px] bg-[#0d0d0d] px-6 py-16 text-center md:px-12 lg:py-20 shadow-2xl relative overflow-hidden border border-white/10">
          {/* Background glow effect */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl h-full opacity-20 pointer-events-none" style={{ background: 'radial-gradient(circle, #1633FF 0%, transparent 70%)' }}></div>

          <div className="relative z-10">
            <span className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-medium text-zinc-300 uppercase tracking-widest">
              Eficiência Tech
            </span>
            <h2 className="mx-auto mt-6 max-w-3xl text-3xl font-extrabold tracking-tight text-white md:text-4xl lg:text-5xl" style={{ letterSpacing: '-0.025em' }}>
              Garantimos performance, estabilidade e previsibilidade na sua operação
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-zinc-400 md:text-lg">
              Elimine gargalos operacionais e acelere a entrega de software. Conectamos engenharia ágil de nuvem e processos eficientes para transformar sua infraestrutura em um motor de crescimento.
            </p>
            <div className="mt-10 flex justify-center">
              <a
                href="https://outlimit.com.br"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-[#1633FF] px-4 py-4 text-sm font-bold text-white transition hover:bg-[#3a52ff] shadow-[0_0_24px_rgba(22,51,255,0.35)]"
              >
                Agendar diagnóstico gratuito
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="mt-auto border-t border-zinc-200 bg-white px-6 py-4 text-center text-xs text-zinc-500">
        Feito com <span className="text-indigo-600">💙</span> pela{' '}
        <a href="https://outlimit.com.br" target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">
          Out Limit
        </a>
      </footer>
    </div>
  )
}
