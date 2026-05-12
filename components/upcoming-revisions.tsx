"use client"

import { useMemo } from "react"
import Link from "next/link"
import { format, parseISO, startOfDay, addDays, isSameDay } from "date-fns"
import { CalendarClock, ChevronRight, Clock } from "lucide-react"
import type { QuestionCard } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type Props = {
  cards: QuestionCard[]
  onRevise: (id: string) => void
  daysAhead?: number
}

const difficultyDot: Record<string, string> = {
  Easy: "bg-chart-2",
  Medium: "bg-chart-3",
  Hard: "bg-chart-4",
}

export function UpcomingRevisions({ cards, onRevise, daysAhead = 7 }: Props) {
  const today = startOfDay(new Date())

  const grouped = useMemo(() => {
    const buckets: { date: Date; cards: QuestionCard[] }[] = []
    // Overdue bucket (anything before today)
    const overdue = cards.filter((c) => {
      const d = startOfDay(parseISO(c.nextRevisionDate))
      return d.getTime() < today.getTime()
    })
    if (overdue.length > 0) {
      buckets.push({ date: addDays(today, -1), cards: overdue })
    }
    // Today + next N days
    for (let i = 0; i <= daysAhead; i++) {
      const day = addDays(today, i)
      const dayCards = cards.filter((c) =>
        isSameDay(parseISO(c.nextRevisionDate), day),
      )
      if (dayCards.length > 0 || i <= 2) {
        // Always show today + next 2 even if empty, for context
        buckets.push({ date: day, cards: dayCards })
      }
    }
    return buckets
  }, [cards, today, daysAhead])

  const totalUpcoming = grouped.reduce((acc, b) => acc + b.cards.length, 0)

  if (totalUpcoming === 0) {
    return null
  }

  return (
    <section className="mt-8">
      <div className="mb-3 flex items-end justify-between">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Upcoming revisions</h2>
          <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[10px] tabular-nums text-muted-foreground">
            {totalUpcoming}
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Next {daysAhead} days
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <ol className="divide-y divide-border">
          {grouped.map((bucket) => (
            <DayBucket
              key={bucket.date.toISOString()}
              date={bucket.date}
              today={today}
              cards={bucket.cards}
              onRevise={onRevise}
            />
          ))}
        </ol>
      </div>
    </section>
  )
}

function DayBucket({
  date,
  today,
  cards,
  onRevise,
}: {
  date: Date
  today: Date
  cards: QuestionCard[]
  onRevise: (id: string) => void
}) {
  const diff = Math.round(
    (date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  )

  let label: string
  let tone: "overdue" | "today" | "soon" | "later"
  if (diff < 0) {
    label = "Overdue"
    tone = "overdue"
  } else if (diff === 0) {
    label = "Today"
    tone = "today"
  } else if (diff === 1) {
    label = "Tomorrow"
    tone = "soon"
  } else if (diff === 2) {
    label = "Day after"
    tone = "soon"
  } else {
    label = format(date, "EEEE")
    tone = "later"
  }

  return (
    <li className="grid grid-cols-12 gap-3 px-4 py-3">
      {/* Day label rail */}
      <div className="col-span-12 md:col-span-3 flex items-start gap-3">
        <div
          className={cn(
            "mt-0.5 flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-lg border text-center",
            tone === "overdue" &&
              "border-chart-4/30 bg-chart-4/10 text-chart-4",
            tone === "today" &&
              "border-primary/40 bg-primary/15 text-primary",
            tone === "soon" && "border-border bg-secondary text-foreground",
            tone === "later" && "border-border bg-card text-muted-foreground",
          )}
        >
          <span className="text-[9px] uppercase leading-none">
            {format(date, "MMM")}
          </span>
          <span className="text-sm font-semibold leading-tight tabular-nums">
            {format(date, "d")}
          </span>
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "text-sm font-medium",
                tone === "overdue" && "text-chart-4",
                tone === "today" && "text-primary",
              )}
            >
              {label}
            </span>
            <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[10px] tabular-nums text-muted-foreground">
              {cards.length}
            </span>
          </div>
          <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{format(date, "EEE, MMM d")}</span>
          </div>
        </div>
      </div>

      {/* Cards lined up */}
      <div className="col-span-12 md:col-span-9">
        {cards.length === 0 ? (
          <div className="flex h-full items-center text-xs text-muted-foreground">
            <span className="rounded-md border border-dashed border-border px-2 py-1">
              Nothing scheduled
            </span>
          </div>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {cards.map((card) => (
              <li
                key={card.id}
                className="group flex items-center gap-3 rounded-lg border border-transparent px-2 py-1.5 transition-colors hover:border-border hover:bg-secondary/40"
              >
                <span
                  className={cn(
                    "h-2 w-2 shrink-0 rounded-full",
                    difficultyDot[card.difficulty] ?? "bg-muted-foreground",
                  )}
                  aria-hidden
                />
                <Link
                  href={`/card/${card.id}`}
                  className="min-w-0 flex-1 truncate text-sm hover:text-primary"
                >
                  {card.title}
                </Link>
                <span className="hidden text-[10px] text-muted-foreground sm:inline">
                  {card.revisionHistory.length === 0
                    ? "First review"
                    : `Rev #${card.revisionHistory.length + 1}`}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-xs opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={() => onRevise(card.id)}
                >
                  Revise
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </li>
  )
}
