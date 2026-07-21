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

  it('reports a failed task as an error parameter', async () => {
    const tasks = [async () => {
      throw new Error('boom')
    }]
    const results = []
    await new Promise((resolve) => {
      runTaskPool({
        tasks,
        limit: 1,
        onTaskDone: (_index, _result, error) => results.push(error),
        onIdle: resolve,
      })
    })
    expect(results[0]).toBeInstanceOf(Error)
    expect(results[0].message).toBe('boom')
  })

  it('recovers from synchronous throws in task functions', async () => {
    const tasks = [
      () => {
        throw new Error('sync boom')
      },
      async () => ({ ok: true, data: 'recovered' }),
    ]
    const results = []
    await new Promise((resolve) => {
      runTaskPool({
        tasks,
        limit: 1,
        onTaskDone: (index, result, error) => results.push({ index, result, error }),
        onIdle: resolve,
      })
    })

    expect(results).toHaveLength(2)
    expect(results[0]).toMatchObject({
      index: 0,
      result: null,
    })
    expect(results[0].error).toBeInstanceOf(Error)
    expect(results[0].error.message).toBe('sync boom')

    expect(results[1]).toMatchObject({
      index: 1,
      result: { ok: true, data: 'recovered' },
      error: null,
    })
  })
})
