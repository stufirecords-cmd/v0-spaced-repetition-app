"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { fetchRecentSolves, type LeetcodeSolve } from "@/lib/leetcode"

const POLL_MS = 2 * 60 * 1000 // 2 minutes — feels real-time without spamming

type SyncState = {
  syncing: boolean
  lastSyncedAt: number | null
  error: string | null
  solves: LeetcodeSolve[]
}

/**
 * Polls LeetCode for the user's recent accepted submissions.
 *
 * Behavior:
 * - Initial fetch when username is first available.
 * - Polls every 2 minutes ONLY while the tab is visible.
 * - Refetches immediately on tab focus / visibility change (catches solves
 *   you did in another tab).
 * - Pauses entirely when autoSync is off or username is empty.
 * - `syncNow` lets the UI trigger an immediate manual refresh.
 */
export function useLeetcodeSync(
  username: string | undefined,
  autoSync: boolean,
) {
  const [state, setState] = useState<SyncState>({
    syncing: false,
    lastSyncedAt: null,
    error: null,
    solves: [],
  })

  const abortRef = useRef<AbortController | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastFetchRef = useRef<number>(0)

  const run = useCallback(
    async (force = false) => {
      const handle = username?.trim()
      if (!handle) return
      // Debounce: don't refetch if last call was <10s ago (unless forced).
      const now = Date.now()
      if (!force && now - lastFetchRef.current < 10_000) return
      lastFetchRef.current = now

      abortRef.current?.abort()
      const ctrl = new AbortController()
      abortRef.current = ctrl

      setState((s) => ({ ...s, syncing: true, error: null }))
      try {
        const solves = await fetchRecentSolves(handle, 20, ctrl.signal)
        if (ctrl.signal.aborted) return
        setState({
          syncing: false,
          lastSyncedAt: Date.now(),
          error: null,
          solves,
        })
      } catch (e) {
        if (ctrl.signal.aborted) return
        const message = e instanceof Error ? e.message : "Sync failed"
        console.log("[v0] LeetCode sync hook error:", message)
        setState((s) => ({ ...s, syncing: false, error: message }))
      }
    },
    [username],
  )

  // Start / stop the polling loop based on username + autoSync + visibility.
  useEffect(() => {
    const handle = username?.trim()
    if (!handle) return

    // Always do one fetch when we have a username (even if autoSync off, so
    // the user can review what's there).
    run(true)

    if (!autoSync) return

    const start = () => {
      if (intervalRef.current) return
      intervalRef.current = setInterval(() => {
        if (document.visibilityState === "visible") run(false)
      }, POLL_MS)
    }
    const stop = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        run(false) // catch up immediately on focus
        start()
      } else {
        stop()
      }
    }

    if (document.visibilityState === "visible") start()
    document.addEventListener("visibilitychange", onVisibility)
    window.addEventListener("focus", onVisibility)

    return () => {
      stop()
      document.removeEventListener("visibilitychange", onVisibility)
      window.removeEventListener("focus", onVisibility)
      abortRef.current?.abort()
    }
  }, [username, autoSync, run])

  return {
    syncing: state.syncing,
    lastSyncedAt: state.lastSyncedAt,
    error: state.error,
    solves: state.solves,
    syncNow: () => run(true),
  }
}
