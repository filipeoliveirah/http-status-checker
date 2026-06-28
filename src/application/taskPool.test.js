import { describe, expect, it } from 'vitest'
import { runTaskPool } from './taskPool'

describe('runTaskPool', () => {
  it('runs every task and reports each result by index', async () => {
    const tasks = [0, 1, 2, 3].map((n) => async () => ({ ok: true, n }))
    const done = []
    await new Promise((resolve) => {
      runTaskPool({
        tasks,
        limit: 2,
        onTaskDone: (index, result) => done.push([index, result.n]),
        onIdle: resolve,
      })
    })
    expect(done).toHaveLength(4)
    expect(done.map(([index]) => index).sort()).toEqual([0, 1, 2, 3])
  })

  it('never exceeds the concurrency limit', async () => {
    let active = 0
    let maxActive = 0
    const tasks = Array.from({ length: 12 }, () => async () => {
      active += 1
      maxActive = Math.max(maxActive, active)
      await Promise.resolve()
      await Promise.resolve()
      active -= 1
      return { ok: true }
    })
    await new Promise((resolve) => {
      runTaskPool({ tasks, limit: 3, onIdle: resolve })
    })
    expect(maxActive).toBe(3)
  })

  it('passes an AbortSignal and aborts it on stop', () => {
    let captured
    const tasks = [
      (signal) => {
        captured = signal
        return new Promise(() => {}) // never resolves on its own
      },
    ]
    const pool = runTaskPool({ tasks, limit: 1, onTaskDone: () => {}, onIdle: () => {} })

    expect(captured).toBeInstanceOf(AbortSignal)
    expect(captured.aborted).toBe(false)

    pool.stop()
    expect(captured.aborted).toBe(true)
  })

  it('reports a failed task as a result instead of throwing', async () => {
    const tasks = [async () => {
      throw new Error('boom')
    }]
    const results = []
    await new Promise((resolve) => {
      runTaskPool({
        tasks,
        limit: 1,
        onTaskDone: (_index, result) => results.push(result),
        onIdle: resolve,
      })
    })
    expect(results[0]).toMatchObject({ ok: false, error: 'boom' })
  })
})
