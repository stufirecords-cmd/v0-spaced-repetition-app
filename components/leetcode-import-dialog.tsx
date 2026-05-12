"use client"

import { useEffect, useMemo, useState } from "react"
import { ExternalLink, Sparkles } from "lucide-react"
import type { LeetcodeSolve } from "@/lib/leetcode"
import type { Difficulty } from "@/lib/types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  pending: LeetcodeSolve[]
  onImport: (selected: LeetcodeSolve[]) => void
}

const DIFFICULTY_STYLES: Record<Difficulty, string> = {
  Easy: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  Medium: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  Hard: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function LeetcodeImportDialog({
  open,
  onOpenChange,
  pending,
  onImport,
}: Props) {
  // Pre-select Medium + Hard by default (Easy problems usually don't need SRS).
  const defaultSelected = useMemo(
    () =>
      new Set(
        pending
          .filter((s) => s.difficulty !== "Easy")
          .map((s) => s.slug),
      ),
    [pending],
  )

  const [selected, setSelected] = useState<Set<string>>(defaultSelected)

  // Resync selection set when the pending list changes (e.g. new solves).
  useEffect(() => {
    if (open) setSelected(new Set(defaultSelected))
  }, [open, defaultSelected])

  const toggle = (slug: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(slug)) next.delete(slug)
      else next.add(slug)
      return next
    })
  }

  const toggleAll = () => {
    if (selected.size === pending.length) setSelected(new Set())
    else setSelected(new Set(pending.map((s) => s.slug)))
  }

  const handleImport = () => {
    const chosen = pending.filter((s) => selected.has(s.slug))
    onImport(chosen)
    onOpenChange(false)
  }

  const allSelected = pending.length > 0 && selected.size === pending.length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-primary" />
            Import from LeetCode
          </DialogTitle>
          <DialogDescription className="text-xs">
            Recently solved problems from your LeetCode profile. Pick which
            ones you want to revise — Easy problems are unchecked by default.
          </DialogDescription>
        </DialogHeader>

        {pending.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            No new solves to import. Solve a problem on LeetCode and it&apos;ll
            appear here within ~2 minutes.
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between border-b border-border pb-2">
              <button
                type="button"
                onClick={toggleAll}
                className="text-xs font-medium text-primary hover:underline"
              >
                {allSelected ? "Deselect all" : "Select all"}
              </button>
              <span className="text-xs text-muted-foreground tabular-nums">
                {selected.size} of {pending.length} selected
              </span>
            </div>

            <ul className="max-h-[55vh] divide-y divide-border overflow-y-auto">
              {pending.map((s) => {
                const checked = selected.has(s.slug)
                return (
                  <li key={s.slug}>
                    <label
                      className={cn(
                        "flex cursor-pointer items-center gap-3 px-1 py-2.5 transition-colors hover:bg-secondary/50",
                        checked && "bg-secondary/30",
                      )}
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggle(s.slug)}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium">
                            {s.title}
                          </span>
                          <Badge
                            variant="outline"
                            className={cn(
                              "h-5 shrink-0 px-1.5 text-[10px] font-medium",
                              DIFFICULTY_STYLES[s.difficulty],
                            )}
                          >
                            {s.difficulty}
                          </Badge>
                        </div>
                        <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                          <span>Solved {formatRelative(s.solvedAt)}</span>
                          {s.tags.length > 0 && (
                            <>
                              <span>·</span>
                              <span className="truncate">
                                {s.tags.slice(0, 3).join(", ")}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="shrink-0 text-muted-foreground hover:text-foreground"
                        aria-label={`Open ${s.title} on LeetCode`}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </label>
                  </li>
                )
              })}
            </ul>
          </>
        )}

        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleImport}
            disabled={selected.size === 0}
          >
            {selected.size > 0
              ? `Import ${selected.size} card${selected.size === 1 ? "" : "s"}`
              : "Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
