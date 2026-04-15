import { classifyStatus, getStatusLabel } from '../../../domain/httpStatus'
import { formatElapsed } from '../../../shared/time'
import { STATUS_TEXT_CLASS } from '../shared/statusStyles'

const BULK_FILTERS = [
  { key: '2', label: '2xx', chipClass: 'bg-emerald-50 text-emerald-600 border-emerald-500' },
  { key: '3', label: '3xx', chipClass: 'bg-blue-50 text-blue-600 border-blue-500' },
  { key: '4', label: '4xx', chipClass: 'bg-orange-50 text-orange-600 border-orange-500' },
  { key: '5', label: '5xx', chipClass: 'bg-red-50 text-red-600 border-red-500' },
  { key: 'cors', label: 'CORS', chipClass: 'bg-indigo-50 text-indigo-600 border-indigo-500' },
  { key: 'err', label: 'Erro', chipClass: 'bg-zinc-100 text-zinc-500 border-zinc-400' },
]

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

  return (
    <tr className="border-t border-zinc-100 hover:bg-zinc-50/60">
      <td className="max-w-[340px] truncate px-4 py-3 text-zinc-800">
        <a href={row.url} target="_blank" rel="noreferrer" className="hover:text-indigo-600 hover:underline">
          {row.url}
        </a>
      </td>
      <td className={`px-4 py-3 text-base font-bold ${STATUS_TEXT_CLASS[statusClass]}`}>{result.code}</td>
      <td className="px-4 py-3 text-zinc-600">{getStatusLabel(result.code)}</td>
      <td className="px-4 py-3 text-zinc-500">{formatElapsed(result.elapsed)}</td>
      <td className="px-4 py-3">
        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-600">direto</span>
      </td>
    </tr>
  )
}

export function BulkTable({ rows, running, sort, onSort, filters, onToggleFilter, stats, doneCount, totalRows }) {
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
