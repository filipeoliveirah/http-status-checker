import { checkUrlStatus } from '../infra/httpStatusGateway'
import { ensureProtocol } from '../shared/url'

export async function checkSingleUrl(rawUrl) {
  const url = ensureProtocol(rawUrl.trim())
  const result = await checkUrlStatus(url)
  return {
    url,
    result,
  }
}
