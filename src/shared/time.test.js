import { describe, expect, it } from 'vitest'
import { formatElapsed } from './time'

describe('formatElapsed', () => {
  it('shows milliseconds under one second', () => {
    expect(formatElapsed(0)).toBe('0 ms')
    expect(formatElapsed(999)).toBe('999 ms')
  })

  it('shows seconds with two decimals from one second up', () => {
    expect(formatElapsed(1000)).toBe('1.00 s')
    expect(formatElapsed(1530)).toBe('1.53 s')
  })
})
