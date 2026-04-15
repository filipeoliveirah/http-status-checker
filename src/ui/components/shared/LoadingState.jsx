export function LoadingState({ host }) {
  return (
    <div className="mt-8 flex items-center justify-center gap-3 rounded-2xl border border-zinc-200 bg-white py-8 text-sm text-zinc-500">
      <span className="inline-block size-5 animate-spin rounded-full border-2 border-zinc-200 border-t-indigo-600" />
      <span>Consultando {host}...</span>
    </div>
  )
}
