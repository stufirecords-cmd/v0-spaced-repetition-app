"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { CheckCircle2, ExternalLink, PartyPopper, X } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { QuestionCard } from "@/lib/types"
import { currentRetention } from "@/lib/srs"
import { RetentionChip } from "./retention-chip"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Pre-sorted (highest priority first) list of due cards. */
  queue: QuestionCard[]
  onRevise: (id: string, confidence: number) => void
}

const SCALE: { value: number; label: string; sub: string; tone: string }[] = [
  { value: 1, label: "1", sub: "Forgot it", tone: "bg-chart-4" },
  { value: 2, label: "2", sub: "Struggled", tone: "bg-chart-4/70" },
  { value: 3, label: "3", sub: "OK", tone: "bg-muted-foreground/60" },
  { value: 4, label: "4", sub: "Solid", tone: "bg-chart-2/80" },
  { value: 5, label: "5", sub: "Easy", tone: "bg-chart-2" },
]

export function ReviewSession({ open, onOpenChange, queue, onRevise }: Props) {
  const [index, setIndex] = useState(0)
  const [confidence, setConfidence] = useState<number | null>(null)
  const [done, setDone] = useState(false)

  // Capture queue at open time so progress isn't disrupted by re-sorts.
  const [frozenQueue, setFrozenQueue] = useState<QuestionCard[]>([])
  useEffect(() => {
    if (open) {
      setFrozenQueue(queue)
      setIndex(0)
      setConfidence(null)
      setDone(false)
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const total = frozenQueue.length
  const current = frozenQueue[index]
  const progressPct = total === 0 ? 0 : Math.round(((index) / total) * 100)

  const retention = useMemo(
    () => (current ? currentRetention(current) : 0),
    [current],
  )

  if (!open) return null

  const handleSubmit = () => {
    if (!current || confidence == null) {
      toast.error("Pick a confidence score")
      return
    }
    onRevise(current.id, confidence)
    if (index + 1 >= total) {
      setDone(true)
    } else {
      setIndex(index + 1)
      setConfidence(null)
    }
  }

  const handleSkip = () => {
    if (!current) return
    if (index + 1 >= total) {
      setDone(true)
    } else {
      setIndex(index + 1)
      setConfidence(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-lg overflow-hidden p-0"
      >
        <DialogTitle className="sr-only">Review session</DialogTitle>

        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-border bg-secondary/40 px-5 py-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="rounded-md bg-primary/15 px-1.5 py-0.5 font-medium text-primary tabular-nums">
              {done ? total : index + 1} / {total}
            </span>
            <span className="text-muted-foreground">
              {done ? "Session complete" : "Review session"}
            </span>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => onOpenChange(false)}
            aria-label="Close session"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Progress bar */}
        <div className="h-1 w-full bg-border">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${done ? 100 : progressPct}%` }}
          />
        </div>

        {done || !current ? (
          <CompletionView
            total={total}
            onClose={() => onOpenChange(false)}
          />
        ) : (
          <div className="space-y-5 px-5 py-5">
            {/* Card info */}
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-pretty text-base font-semibold leading-snug">
                  {current.title}
                </h3>
                <a
                  href={current.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-0.5 shrink-0 text-muted-foreground hover:text-foreground"
                  aria-label="Open original question"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <span
                  className={cn(
                    "rounded-md border px-1.5 py-0.5 text-[10px] font-medium",
                    current.difficulty === "Easy" &&
                      "border-chart-2/30 bg-chart-2/10 text-chart-2",
                    current.difficulty === "Medium" &&
                      "border-chart-3/30 bg-chart-3/10 text-chart-3",
                    current.difficulty === "Hard" &&
                      "border-chart-4/30 bg-chart-4/10 text-chart-4",
                  )}
                >
                  {current.difficulty}
                </span>
                <RetentionChip retention={retention} showLabel />
                <span className="text-[11px] text-muted-foreground">
                  · Review #{current.revisionHistory.length + 1}
                </span>
              </div>

              <p className="text-xs leading-relaxed text-muted-foreground">
                Open the problem, try to recall the approach in your head first,
                then verify. Rate how confident you felt during retrieval — not
                after seeing the solution.
              </p>
            </div>

            {/* Confidence scale */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium">
                  How confident did you feel?
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Target ~85% retention
                </span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {SCALE.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setConfidence(s.value)}
                    className={cn(
                      "group flex flex-col items-center gap-1.5 rounded-lg border bg-card p-2.5 text-center transition-all hover:border-primary/60 hover:bg-secondary",
                      confidence === s.value &&
                        "border-primary ring-1 ring-primary",
                    )}
                  >
                    <span
                      className={cn(
                        "h-1.5 w-full rounded-full opacity-50 transition-opacity group-hover:opacity-100",
                        s.tone,
                        confidence === s.value && "opacity-100",
                      )}
                    />
                    <span className="text-base font-semibold leading-none">
                      {s.label}
                    </span>
                    <span className="text-[10px] leading-none text-muted-foreground">
                      {s.sub}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Footer actions */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <Button variant="ghost" size="sm" onClick={handleSkip}>
                Skip
              </Button>
              <div className="flex items-center gap-2">
                <Link
                  href={`/card/${current.id}`}
                  className="text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => onOpenChange(false)}
                >
                  View detail
                </Link>
                <Button
                  onClick={handleSubmit}
                  disabled={confidence == null}
                  size="sm"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {index + 1 === total ? "Finish" : "Next"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function CompletionView({
  total,
  onClose,
}: {
  total: number
  onClose: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center px-5 py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-chart-2/15 text-chart-2">
        <PartyPopper className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-base font-semibold">Nice work</h3>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground">
        You completed {total} {total === 1 ? "review" : "reviews"}. New
        intervals scheduled.
      </p>
      <Button className="mt-5" onClick={onClose}>
        Done
      </Button>
    </div>
  )
}
