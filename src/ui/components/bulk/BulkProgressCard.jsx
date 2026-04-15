export function BulkProgressCard({ doneCount, totalRows, stats }) {
  const percentage = totalRows ? Math.round((doneCount / totalRows) * 100) : 0
  const done = doneCount === totalRows

  return (
    <section className="mt-7 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between text-sm">
        <p className="font-medium text-zinc-800">{done ? 'Concluído' : 'Verificando...'}</p>
        <p className="text-zinc-500">
          {doneCount} / {totalRows}
        </p>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-zinc-200">
        <div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${percentage}%` }} />
      </div>
      <div className="mt-3 flex flex-wrap gap-4 text-xs text-zinc-600">
        {stats[2] > 0 ? <span>{stats[2]} 2xx</span> : null}
        {stats[3] > 0 ? <span>{stats[3]} 3xx</span> : null}
        {stats[4] > 0 ? <span>{stats[4]} 4xx</span> : null}
        {stats[5] > 0 ? <span>{stats[5]} 5xx</span> : null}
        {stats.cors > 0 ? <span>{stats.cors} CORS</span> : null}
        {stats.err > 0 ? <span>{stats.err} erro</span> : null}
      </div>
    </section>
  )
}
