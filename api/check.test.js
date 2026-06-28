import { describe, expect, it } from 'vitest'
import { isBlockedHostName, isPrivateIp } from './check.js'

describe('isPrivateIp (SSRF guard)', () => {
  it('flags private / loopback / link-local IPv4', () => {
    for (const ip of ['10.0.0.1', '127.0.0.1', '192.168.1.1', '169.254.1.1', '172.16.0.1', '172.31.255.255', '0.0.0.0']) {
      expect(isPrivateIp(ip), ip).toBe(true)
    }
  })

  it('allows public IPv4 (including 172.x outside 16-31)', () => {
    for (const ip of ['8.8.8.8', '1.1.1.1', '172.15.0.1', '172.32.0.1']) {
      expect(isPrivateIp(ip), ip).toBe(false)
    }
  })

  it('flags private IPv6 and IPv4-mapped private addresses', () => {
    for (const ip of ['::1', '::', 'fc00::1', 'fd12::1', 'fe80::1', '::ffff:127.0.0.1']) {
      expect(isPrivateIp(ip), ip).toBe(true)
    }
  })

  it('allows public IPv6 and IPv4-mapped public addresses', () => {
    expect(isPrivateIp('2001:4860:4860::8888')).toBe(false)
    expect(isPrivateIp('::ffff:8.8.8.8')).toBe(false)
  })

  it('returns false for non-IP strings', () => {
    expect(isPrivateIp('example.com')).toBe(false)
  })
})

describe('isBlockedHostName', () => {
  it('blocks localhost and internal suffixes (case/trailing-dot insensitive)', () => {
    for (const host of ['localhost', 'LOCALHOST', 'localhost.', 'foo.local', 'db.internal']) {
      expect(isBlockedHostName(host), host).toBe(true)
    }
  })

  it('allows normal public hostnames', () => {
    for (const host of ['example.com', 'api.github.com', 'sub.localhost.com']) {
      expect(isBlockedHostName(host), host).toBe(false)
    }
  })
})
