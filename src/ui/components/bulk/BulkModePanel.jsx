import { BulkProgressCard } from './BulkProgressCard'
import { BulkTable } from './BulkTable'

export function BulkModePanel({
  bulkInput,
  onBulkInputChange,
  onSubmitBulk,
  bulkUrlCount,
  concurrency,
  onConcurrencyChange,
  bulkRunning,
  bulkError,
  hasRows,
  doneCount,
  totalRows,
  stats,
  onExportCsv,
  visibleRows,
  sort,
  onSort,
  filters,
  onToggleFilter,
}) {
  return (
    <section className="mx-auto mt-6 max-w-3xl text-left">
      <form onSubmit={onSubmitBulk}>
        <textarea
          value={bulkInput}
          onChange={(event) => onBulkInputChange(event.target.value)}
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
                onChange={(event) => onConcurrencyChange(Number(event.target.value))}
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
              className="cursor-pointer rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white transition hover:bg-zinc-800"
            >
              {bulkRunning ? 'Parar' : 'Verificar todas'}
            </button>
          </div>
        </div>
      </form>

      {bulkError ? (
        <section className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{bulkError}</section>
      ) : null}

      {hasRows ? (
        <>
          <BulkProgressCard doneCount={doneCount} totalRows={totalRows} stats={stats} />

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={onExportCsv}
              className="cursor-pointer rounded-full border border-zinc-300 bg-white px-4 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50"
            >
              Exportar CSV
            </button>
          </div>

          <BulkTable
            rows={visibleRows}
            running={bulkRunning}
            sort={sort}
            onSort={onSort}
            filters={filters}
            onToggleFilter={onToggleFilter}
            stats={stats}
            doneCount={doneCount}
            totalRows={totalRows}
          />
        </>
      ) : null}
    </section>
  )
}
