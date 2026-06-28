import { describe, expect, it } from 'vitest'
import { csvCell } from './exportCsv'

describe('csvCell', () => {
  it('wraps values in quotes', () => {
    expect(csvCell('https://x.com')).toBe('"https://x.com"')
  })

  it('escapes embedded double quotes', () => {
    expect(csvCell('a"b')).toBe('"a""b"')
  })

  it('neutralizes formula injection with a leading apostrophe', () => {
    expect(csvCell('=SUM(A1)')).toBe('"\'=SUM(A1)"')
    expect(csvCell('+1')).toBe('"\'+1"')
    expect(csvCell('-1')).toBe('"\'-1"')
    expect(csvCell('@cmd')).toBe('"\'@cmd"')
  })

  it('handles null/undefined as empty', () => {
    expect(csvCell(undefined)).toBe('""')
    expect(csvCell(null)).toBe('""')
  })
})
