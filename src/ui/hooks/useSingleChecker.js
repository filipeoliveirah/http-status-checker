import { useState } from 'react'
import { checkSingleUrl } from '../../application/checkSingleUrl'

export function useSingleChecker() {
  const [loading, setLoading] = useState(false)
  const [checkedUrl, setCheckedUrl] = useState('')
  const [result, setResult] = useState(null)

  async function run(rawUrl) {
    if (!rawUrl.trim() || loading) return

    setLoading(true)
    const response = await checkSingleUrl(rawUrl)
    setCheckedUrl(response.url)
    setResult(response.result)
    setLoading(false)
  }

  return {
    loading,
    checkedUrl,
    result,
    run,
  }
}
