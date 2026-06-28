import { describe, expect, it } from 'vitest'
import { ensureProtocol, extractHostname, parseBulkUrls } from './url'

describe('ensureProtocol', () => {
  it('keeps an existing protocol', () => {
    expect(ensureProtocol('http://x.com')).toBe('http://x.com')
    expect(ensureProtocol('https://x.com')).toBe('https://x.com')
  })

  it('prepends https:// to a bare domain', () => {
    expect(ensureProtocol('x.com')).toBe('https://x.com')
  })
})

describe('extractHostname', () => {
  it('extracts the hostname', () => {
    expect(extractHostname('https://api.github.com/users')).toBe('api.github.com')
  })

  it('returns the input when not parseable', () => {
    expect(extractHostname('not a url')).toBe('not a url')
  })
})

describe('parseBulkUrls', () => {
  it('trims, filters noise and normalizes protocol', () => {
    const input = '  example.com \n\n http://foo.com \nx'
    expect(parseBulkUrls(input)).toEqual(['https://example.com', 'http://foo.com'])
  })

  it('deduplicates after normalization', () => {
    const input = 'example.com\nhttps://example.com'
    expect(parseBulkUrls(input)).toEqual(['https://example.com'])
  })

  it('returns an empty array for blank input', () => {
    expect(parseBulkUrls('\n   \n')).toEqual([])
  })
})
