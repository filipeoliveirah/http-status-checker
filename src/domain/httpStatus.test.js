import { describe, expect, it } from 'vitest'
import { classifyStatus, getStatusIcon, getStatusLabel } from './httpStatus'

describe('classifyStatus', () => {
  it('classifies each class by its range', () => {
    expect(classifyStatus(100)).toBe('1')
    expect(classifyStatus(103)).toBe('1')
    expect(classifyStatus(200)).toBe('2')
    expect(classifyStatus(204)).toBe('2')
    expect(classifyStatus(301)).toBe('3')
    expect(classifyStatus(404)).toBe('4')
    expect(classifyStatus(500)).toBe('5')
    expect(classifyStatus(599)).toBe('5')
  })

  it('does not classify 1xx as an error (regression)', () => {
    expect(classifyStatus(101)).not.toBe('5')
  })

  it('returns null for out-of-range codes', () => {
    expect(classifyStatus(0)).toBeNull()
    expect(classifyStatus(99)).toBeNull()
    expect(classifyStatus(600)).toBeNull()
  })
})

describe('getStatusLabel', () => {
  it('returns the known label', () => {
    expect(getStatusLabel(404)).toBe('Not Found')
  })

  it('returns a fallback for unknown codes', () => {
    expect(getStatusLabel(799)).toBe('Unknown status')
  })
})

describe('getStatusIcon', () => {
  it('returns an icon for every class including 1xx', () => {
    expect(getStatusIcon(100)).toBeTruthy()
    expect(getStatusIcon(200)).toBe('✓')
    expect(getStatusIcon(301)).toBe('↪')
    expect(getStatusIcon(404)).toBe('⚠')
    expect(getStatusIcon(500)).toBe('✗')
  })
})
