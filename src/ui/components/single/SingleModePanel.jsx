import { extractHostname } from '../../../shared/url'
import { LoadingState } from '../shared/LoadingState'
import { SingleResult } from './SingleResult'

const SAMPLE_URLS = [
  'https://api.github.com/users/github',
  'https://httpbin.org/status/404',
  'https://httpbin.org/status/500',
  'https://google.com',
  'https://httpbin.org/redirect/3',
]

export function SingleModePanel({
  singleInput,
  onSingleInputChange,
  onSubmitSingle,
  onApplySample,
  singleLoading,
  loadingHost,
  checkedUrl,
  singleResult,
}) {
  return (
    <section className="mx-auto mt-6 max-w-3xl text-left">
      <form onSubmit={onSubmitSingle} className="flex items-center gap-2 rounded-full border border-zinc-300 bg-white px-5 py-2 shadow-sm">
        <input
          type="url"
          value={singleInput}
          onChange={(event) => onSingleInputChange(event.target.value)}
          placeholder="https://exemplo.com"
          className="w-full border-none bg-transparent text-sm text-zinc-800 outline-none placeholder:text-zinc-400"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
        />
        <button
          type="submit"
          className="cursor-pointer rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-55"
          disabled={singleLoading}
        >
          {singleLoading ? 'Verificando...' : 'Verificar'}
        </button>
      </form>

      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {SAMPLE_URLS.map((url) => (
          <button
            key={url}
            type="button"
            onClick={() => onApplySample(url)}
            className="cursor-pointer rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-600 transition hover:border-indigo-500 hover:text-indigo-600"
          >
            {url.includes('httpbin') ? url.replace('https://httpbin.org/', '') : extractHostname(url)}
          </button>
        ))}
      </div>

      {singleLoading ? <LoadingState host={loadingHost} /> : null}
      {!singleLoading ? <SingleResult checkedUrl={checkedUrl} result={singleResult} /> : null}
    </section>
  )
}
