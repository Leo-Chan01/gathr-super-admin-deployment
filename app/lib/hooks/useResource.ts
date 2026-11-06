'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { errorMessage } from '../api/client'

export interface Resource<T> {
  data: T | undefined
  error: string | null
  loading: boolean
  /** Re-run the loader; keeps showing the previous data while it loads. */
  reload: () => void
  /** Optimistically patch local data (e.g. after a mutation). */
  mutate: (update: (current: T | undefined) => T | undefined) => void
}

const sameDeps = (a: readonly unknown[], b: readonly unknown[]) =>
  a.length === b.length && a.every((value, index) => Object.is(value, b[index]))

/**
 * Minimal data loader: cancels stale requests when `deps` change and exposes
 * loading / error / reload for the UI. `loader` receives an AbortSignal.
 */
export function useResource<T>(
  loader: (signal: AbortSignal) => Promise<T>,
  deps: React.DependencyList
): Resource<T> {
  const [data, setData] = useState<T>()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [tick, setTick] = useState(0)
  const loaderRef = useRef(loader)

  // Flip to "loading" in the same render the inputs change (no extra effect pass).
  const key = [...deps, tick]
  const [prevKey, setPrevKey] = useState(key)
  if (!sameDeps(prevKey, key)) {
    setPrevKey(key)
    setLoading(true)
    setError(null)
  }

  useEffect(() => {
    loaderRef.current = loader
  })

  useEffect(() => {
    const controller = new AbortController()
    loaderRef
      .current(controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setData(result)
      })
      .catch((err) => {
        if (!controller.signal.aborted) setError(errorMessage(err))
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, key)

  const reload = useCallback(() => setTick((value) => value + 1), [])
  const mutate = useCallback((update: (current: T | undefined) => T | undefined) => {
    setData((current) => update(current))
  }, [])

  return { data, error, loading, reload, mutate }
}

/** Debounces a value (for search inputs that hit the API). */
export function useDebounced<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay)
    return () => window.clearTimeout(timer)
  }, [value, delay])
  return debounced
}
