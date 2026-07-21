export function runTaskPool({ tasks, limit, onTaskDone, onIdle }) {
  let index = 0
  let active = 0
  let completed = 0
  let stopped = false
  let notified = false
  const controller = new AbortController()

  function maybeIdle() {
    if (notified) return
    if ((stopped || completed === tasks.length) && active === 0) {
      notified = true
      onIdle?.()
    }
  }

  function schedule() {
    if (stopped || tasks.length === 0) {
      maybeIdle()
      return
    }

    while (active < limit && index < tasks.length) {
      const currentIndex = index
      index += 1
      active += 1

      let taskPromise
      try {
        taskPromise = Promise.resolve(tasks[currentIndex](controller.signal))
      } catch (syncError) {
        taskPromise = Promise.reject(syncError)
      }

      taskPromise
        .then((result) => {
          onTaskDone?.(currentIndex, result, null)
        })
        .catch((error) => {
          onTaskDone?.(currentIndex, null, error)
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
      controller.abort()
      maybeIdle()
    },
  }
}
