import { useMemo, useRef, useState } from 'react'
import { exportBulkRowsToCsv } from '../../application/exportCsv'
import { runTaskPool } from '../../application/taskPool'
import { classifyStatus } from '../../domain/httpStatus'
import { checkUrlStatus } from '../../infra/httpStatusGateway'
import { parseBulkUrls } from '../../shared/url'

function getRowFilterKey(row) {
  if (row.status === 'pending') return 'pending'
  if (!row.result?.ok) return 'err'
  if (row.result.mode === 'no-cors') return 'cors'
  return classifyStatus(row.result.code)
}

export function useBulkChecker() {
  const [running, setRunning] = useState(false)
  const [rows, setRows] = useState([])
  const [sort, setSort] = useState({ column: null, asc: true })
  const [filters, setFilters] = useState({
    2: true,
    3: true,
    4: true,
    5: true,
    cors: true,
    err: true,
  })
  const runIdRef = useRef(0)
  const poolRef = useRef(null)

  const stats = useMemo(() => {
    const output = { 2: 0, 3: 0, 4: 0, 5: 0, cors: 0, err: 0 }
    rows.forEach((row) => {
      const key = getRowFilterKey(row)
      if (output[key] !== undefined) {
        output[key] += 1
      }
    })
    return output
  }, [rows])

  const doneCount = useMemo(
    () => rows.filter((row) => row.status === 'done').length,
    [rows],
  )

  const sortedAndFilteredRows = useMemo(() => {
    const visibleRows = rows.filter((row) => {
      const key = getRowFilterKey(row)
      if (key === 'pending') return true
      return filters[key] !== false
    })

    if (!sort.column) return visibleRows

    return [...visibleRows].sort((a, b) => {
      let va = 0
      let vb = 0

      if (sort.column === 'url') {
        va = a.url
        vb = b.url
      }
      if (sort.column === 'code') {
        va = a.result?.ok && a.result.mode !== 'no-cors' ? a.result.code : 0
        vb = b.result?.ok && b.result.mode !== 'no-cors' ? b.result.code : 0
      }
      if (sort.column === 'elapsed') {
        va = a.result?.elapsed ?? 0
        vb = b.result?.elapsed ?? 0
      }

      if (va < vb) return sort.asc ? -1 : 1
      if (va > vb) return sort.asc ? 1 : -1
      return 0
    })
  }, [rows, sort, filters])

  function toggleSort(column) {
    setSort((current) => {
      if (current.column !== column) {
        return { column, asc: true }
      }
      return { column, asc: !current.asc }
    })
  }

  function toggleFilter(key) {
    setFilters((current) => ({
      ...current,
      [key]: !current[key],
    }))
  }

  function stop() {
    poolRef.current?.stop()
    poolRef.current = null
    setRunning(false)

    setRows((current) =>
      current.map((row) => {
        if (row.status === 'done') return row
        return {
          ...row,
          status: 'done',
          result: {
            ok: false,
            error: 'stopped',
            elapsed: 0,
            url: row.url,
          },
        }
      }),
    )
  }

  function run(inputText, concurrency) {
    const urls = parseBulkUrls(inputText)
    if (urls.length === 0) return { started: false }
    if (running) {
      stop()
      return { started: false }
    }

    const runId = runIdRef.current + 1
    runIdRef.current = runId

    const initialRows = urls.map((url) => ({
      url,
      status: 'pending',
      result: null,
    }))

    setSort({ column: null, asc: true })
    setRows(initialRows)
    setRunning(true)

    const tasks = urls.map((url) => () => checkUrlStatus(url))

    poolRef.current = runTaskPool({
      tasks,
      limit: concurrency,
      onTaskDone: (index, result) => {
        if (runIdRef.current !== runId) return
        setRows((current) =>
          current.map((row, rowIndex) =>
            rowIndex === index ? { ...row, status: 'done', result } : row,
          ),
        )
      },
      onIdle: () => {
        if (runIdRef.current !== runId) return
        setRunning(false)
      },
    })

    return { started: true }
  }

  function exportCsv() {
    exportBulkRowsToCsv(rows)
  }

  return {
    rows,
    running,
    doneCount,
    stats,
    sortedAndFilteredRows,
    sort,
    filters,
    run,
    stop,
    exportCsv,
    toggleSort,
    toggleFilter,
  }
}
