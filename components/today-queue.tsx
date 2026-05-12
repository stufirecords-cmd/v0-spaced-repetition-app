"use client"

import { useMemo } from "react"
import Link from "next/link"
import {
  AlarmClock,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Coffee,
  Info,
  Sparkles,
  Zap,
} from "lucide-react"
import type { QuestionCard, Settings } from "@/lib/types"
import { currentRetention, partitionTodaysQueue } from "@/lib/srs"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

type Props = {
  cards: QuestionCard[]
  settings: Settings
  onRevise: (id: string) => void
  onStartSession: (ids: string[]) => void
  onPostpone: (id: string) => void
  onPostponeAll: (ids: string[]) => void
}

const difficultyTone: Record<string, string> = {
  Easy: "border-chart-2/30 bg-chart-2/10 text-chart-2",
  Medium: "border-chart-3/30 bg-chart-3/10 text-chart-3",
  Hard: "border-chart-4/30 bg-chart-4/10 text-chart-4",
}

export function TodayQueue({
  cards,
  settings,
  onRevise,
  onStartSession,
  onPostpone,
  onPostponeAll,
}: Props) {
  const { mustDo, canWait } = useMemo(
    () => partitionTodaysQueue(cards, settings),
    [cards, settings],
  )

  if (mustDo.length === 0 && canWait.length === 0) {
    return (
      <section className="mt-8 rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-2/15 text-chart-2">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold">All caught up</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              No reviews due. Add a new question or take a well-earned break.
            </p>
          </div>
        </div>
      </section>
    )
  }

  const targetPct = Math.round(settings.targetRetention * 100)

  return (
    <section className="mt-8 space-y-3">
      {/* Top summary bar */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex flex-col gap-3 border-b border-border bg-secondary/40 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Zap className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold">Today&apos;s queue</h2>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-foreground"
                        aria-label="How priority works"
                      >
                        <Info className="h-3.5 w-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs text-xs leading-relaxed">
                      Cards are ranked by how close they are to dropping below
                      your {targetPct}% retention target. Daily cap is{" "}
                      {settings.dailyReviewCap}. Anything beyond the cap with
                      retention still above {targetPct - 5}% is safe to push to
                      tomorrow.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {mustDo.length} priority · {canWait.length} can wait · cap{" "}
                {settings.dailyReviewCap}/day
              </p>
            </div>
          </div>

          {mustDo.length > 0 && (
            <Button
              size="sm"
              onClick={() => onStartSession(mustDo.map((c) => c.id))}
              className="self-start sm:self-auto"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Start session ({mustDo.length})
            </Button>
          )}
        </div>

        {/* Must-do list */}
        {mustDo.length > 0 && (
          <div>
            <div className="flex items-center gap-2 border-b border-border px-5 py-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Do today · ranked by urgency
              </span>
            </div>
            <ul className="divide-y divide-border">
              {mustDo.map((card, idx) => (
                <QueueRow
                  key={card.id}
                  card={card}
                  rank={idx + 1}
                  variant="priority"
                  onRevise={onRevise}
                  onPostpone={onPostpone}
                  targetRetention={settings.targetRetention}
                />
              ))}
            </ul>
          </div>
        )}

        {/* Can-wait list */}
        {canWait.length > 0 && (
          <div>
            <div className="flex items-center justify-between border-b border-t border-border bg-secondary/30 px-5 py-2">
              <div className="flex items-center gap-2">
                <Coffee className="h-3 w-3 text-muted-foreground" />
                <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Can wait · retention still safe
                </span>
              </div>
              <button
                type="button"
                onClick={() => onPostponeAll(canWait.map((c) => c.id))}
                className="text-[11px] font-medium text-primary hover:underline"
              >
                Postpone all to tomorrow
              </button>
            </div>
            <ul className="divide-y divide-border">
              {canWait.map((card) => (
                <QueueRow
                  key={card.id}
                  card={card}
                  variant="wait"
                  onRevise={onRevise}
                  onPostpone={onPostpone}
                  targetRetention={settings.targetRetention}
                />
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  )
}

function QueueRow({
  card,
  rank,
  variant,
  onRevise,
  onPostpone,
  targetRetention,
}: {
  card: QuestionCard
  rank?: number
  variant: "priority" | "wait"
  onRevise: (id: string) => void
  onPostpone: (id: string) => void
  targetRetention: number
}) {
  const retention = currentRetention(card)
  const retentionPct = Math.round(retention * 100)
  const targetPct = Math.round(targetRetention * 100)

  // Tone for retention chip
  let chipTone = "border-chart-2/30 bg-chart-2/10 text-chart-2"
  if (retentionPct < targetPct - 10)
    chipTone = "border-chart-4/30 bg-chart-4/10 text-chart-4"
  else if (retentionPct < targetPct)
    chipTone = "border-chart-3/30 bg-chart-3/10 text-chart-3"

  return (
    <li
      className={cn(
        "group flex items-center gap-3 px-5 py-3 transition-colors hover:bg-secondary/40",
        variant === "wait" && "opacity-80",
      )}
    >
      {/* Rank or icon */}
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border bg-card text-[11px] font-semibold tabular-nums text-muted-foreground">
        {variant === "priority" ? (
          rank
        ) : (
          <AlarmClock className="h-3.5 w-3.5" />
        )}
      </div>

      {/* Title + meta */}
      <div className="min-w-0 flex-1">
        <Link
          href={`/card/${card.id}`}
          className="block truncate text-sm font-medium hover:text-primary"
        >
          {card.title}
        </Link>
        <div className="mt-1 flex items-center gap-1.5">
          <span
            className={cn(
              "rounded-md border px-1.5 py-0.5 text-[10px] font-medium",
              difficultyTone[card.difficulty],
            )}
          >
            {card.difficulty}
          </span>
          <span
            className={cn(
              "rounded-md border px-1.5 py-0.5 text-[10px] font-medium tabular-nums",
              chipTone,
            )}
          >
            {retentionPct}% recall
          </span>
          <span className="text-[10px] text-muted-foreground">
            · Rev #{card.revisionHistory.length + 1}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {variant === "wait" && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-[11px] text-muted-foreground"
            onClick={() => onPostpone(card.id)}
          >
            Postpone
          </Button>
        )}
        <Button
          size="sm"
          variant={variant === "priority" ? "default" : "outline"}
          className="h-7 px-2.5 text-[11px]"
          onClick={() => onRevise(card.id)}
        >
          {variant === "priority" ? (
            <>
              Revise
              <ArrowRight className="h-3 w-3" />
            </>
          ) : (
            <>
              Revise
              <ChevronRight className="h-3 w-3" />
            </>
          )}
        </Button>
      </div>
    </li>
  )
}
