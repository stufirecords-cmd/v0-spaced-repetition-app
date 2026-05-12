"use client"

import { useEffect, useMemo, useState } from "react"
import {
  AlertCircle,
  Check,
  Loader2,
  RefreshCw,
  Sparkles,
  Wifi,
  WifiOff,
} from "lucide-react"
import type { LeetcodeSolve } from "@/lib/leetcode"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type Props = {
  username: string | undefined
  autoSync: boolean
  syncing: boolean
  lastSyncedAt: number | null
  error: string | null
  pendingCount: number
  onSyncNow: () => void
  onReview: () => void
  onConfigure: () => void
}

function useRelativeTime(ts: number | null): string {
  const [, force] = useState(0)
  useEffect(() => {
    if (ts == null) return
    const id = setInterval(() => force((x) => x + 1), 15_000)
    return () => clearInterval(id)
  }, [ts])
  return useMemo(() => {
    if (ts == null) return "never"
    const diff = Date.now() - ts
    if (diff < 10_000) return "just now"
    if (diff < 60_000) return `${Math.floor(diff / 1000)}s ago`
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
    return `${Math.floor(diff / 3_600_000)}h ago`
  }, [ts])
}

export function LeetcodeSyncCard({
  username,
  autoSync,
  syncing,
  lastSyncedAt,
  error,
  pendingCount,
  onSyncNow,
  onReview,
  onConfigure,
}: Props) {
  const relative = useRelativeTime(lastSyncedAt)

  // Not configured yet — promo state.
  if (!username) {
    return (
      <section className="mt-6 overflow-hidden rounded-xl border border-dashed border-border bg-card">
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-medium leading-tight">
                Sync from LeetCode
              </h3>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                Add your LeetCode username and solved problems will appear here
                automatically — no copy-paste, no password.
              </p>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={onConfigure}>
            Connect LeetCode
          </Button>
        </div>
      </section>
    )
  }

  return (
    <section className="mt-6 overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
              error
                ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                : pendingCount > 0
                ? "bg-primary/15 text-primary"
                : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
            )}
          >
            {syncing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : error ? (
              <AlertCircle className="h-4 w-4" />
            ) : pendingCount > 0 ? (
              <Sparkles className="h-4 w-4" />
            ) : (
              <Check className="h-4 w-4" />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h3 className="text-sm font-medium leading-tight">
                LeetCode
                <span className="ml-1.5 font-normal text-muted-foreground">
                  @{username}
                </span>
              </h3>
              {pendingCount > 0 && !error && (
                <Badge className="h-5 bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
                  {pendingCount} new
                </Badge>
              )}
              <Badge
                variant="outline"
                className="h-5 gap-1 px-1.5 text-[10px] font-normal text-muted-foreground"
              >
                {autoSync ? (
                  <>
                    <Wifi className="h-2.5 w-2.5" />
                    Live
                  </>
                ) : (
                  <>
                    <WifiOff className="h-2.5 w-2.5" />
                    Manual
                  </>
                )}
              </Badge>
            </div>
            <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
              {error
                ? error
                : syncing
                ? "Checking LeetCode for new solves…"
                : pendingCount > 0
                ? `${pendingCount} new solve${pendingCount === 1 ? "" : "s"} ready to import · last checked ${relative}`
                : `All caught up · last checked ${relative}`}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={onSyncNow}
            disabled={syncing}
            className="h-8 px-2"
            aria-label="Sync now"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", syncing && "animate-spin")} />
          </Button>
          <Button
            size="sm"
            variant={pendingCount > 0 ? "default" : "outline"}
            onClick={onReview}
            disabled={pendingCount === 0 && !error}
          >
            {pendingCount > 0 ? "Review & import" : "Up to date"}
          </Button>
        </div>
      </div>
    </section>
  )
}

// Re-exported so dashboard can compute "pending" without duplicating logic.
export function computePending(
  solves: LeetcodeSolve[],
  importedSlugs: Set<string>,
): LeetcodeSolve[] {
  return solves.filter((s) => !importedSlugs.has(s.slug))
}
