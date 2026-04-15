import { STATUS_PILL_CLASS } from './statusStyles'

export function StatusPill({ statusClass, text }) {
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold tracking-wider ${STATUS_PILL_CLASS[statusClass]}`}>
      {text}
    </span>
  )
}
