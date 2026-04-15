export function runTaskPool({ tasks, limit, onTaskDone, onIdle }) {
  let index = 0
  let active = 0
  let completed = 0
  let stopped = false

  function maybeIdle() {
    if ((stopped || completed === tasks.length) && active === 0) {
      onIdle?.()
    }
  }

  function schedule() {
    if (stopped) {
      maybeIdle()
      return
    }

    while (active < limit && index < tasks.length) {
      const currentIndex = index
      index += 1
      active += 1

      Promise.resolve(tasks[currentIndex]())
        .then((result) => {
          onTaskDone?.(currentIndex, result)
        })
        .catch((error) => {
          onTaskDone?.(currentIndex, {
            ok: false,
            error: error?.message ?? 'unexpected',
            elapsed: 0,
          })
        })
        .finally(() => {
          active -= 1
          completed += 1
          schedule()
          maybeIdle()
        })
    }
  }

  schedule()

  return {
    stop() {
      stopped = true
    },
  }
}
