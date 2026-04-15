export function Metric({ label, value }) {
  return (
    <div className="border-r border-zinc-100 pr-6 last:border-r-0 md:last:pr-0">
      <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-zinc-800">{value}</p>
    </div>
  )
}
