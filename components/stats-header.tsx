"use client"

import { Brain, CalendarClock, Flame, Layers } from "lucide-react"
import { differenceInCalendarDays, parseISO } from "date-fns"
import type { QuestionCard } from "@/lib/types"
import { isDue } from "@/lib/srs"

function computeStreak(cards: QuestionCard[]): number {
  // Collect all revision dates as a Set of ISO yyyy-mm-dd strings
  const days = new Set<string>()
  for (const c of cards) {
    for (const r of c.revisionHistory) days.add(r.date)
  }
  if (days.size === 0) return 0

  let streak = 0
  const today = new Date()
  for (let i = 0; i < 365; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const iso = d.toISOString().slice(0, 10)
    if (days.has(iso)) {
      streak++
    } else if (i === 0) {
      // Allow today to be skipped — streak still counts from yesterday
      continue
    } else {
      break
    }
  }
  return streak
}

export function StatsHeader({ cards }: { cards: QuestionCard[] }) {
  const total = cards.length
  const dueNow = cards.filter((c) => isDue(c)).length
  const totalRevisions = cards.reduce(
    (sum, c) => sum + c.revisionHistory.length,
    0,
  )
  const streak = computeStreak(cards)

  // Average retention right now (rough proxy)
  const now = new Date()
  let avgStability = 0
  if (cards.length) {
    avgStability =
      cards.reduce((sum, c) => {
        const last =
          c.revisionHistory.length > 0
            ? parseISO(c.revisionHistory[c.revisionHistory.length - 1].date)
            : parseISO(c.dateAdded)
        const t = Math.max(0, differenceInCalendarDays(now, last))
        return sum + Math.exp(-t / Math.max(0.5, c.stabilityScore))
      }, 0) / cards.length
  }

  const stats: {
    label: string
    value: string
    sub: string
    icon: React.ReactNode
    accent: string
  }[] = [
    {
      label: "Total questions",
      value: String(total),
      sub: `${totalRevisions} revisions logged`,
      icon: <Layers className="h-4 w-4" />,
      accent: "text-foreground",
    },
    {
      label: "Due now",
      value: String(dueNow),
      sub: dueNow > 0 ? "needs attention" : "you're all caught up",
      icon: <CalendarClock className="h-4 w-4" />,
      accent: dueNow > 0 ? "text-chart-2" : "text-muted-foreground",
    },
    {
      label: "Avg retention",
      value: `${Math.round(avgStability * 100)}%`,
      sub: "estimated right now",
      icon: <Brain className="h-4 w-4" />,
      accent: "text-chart-1",
    },
    {
      label: "Streak",
      value: `${streak}d`,
      sub: streak > 0 ? "keep going" : "log a revision today",
      icon: <Flame className="h-4 w-4" />,
      accent: streak > 0 ? "text-chart-3" : "text-muted-foreground",
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {stats.map((s) => (
        <div
          key={s.label}
          className="rounded-xl border border-border bg-card p-4"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{s.label}</span>
            <span className={s.accent}>{s.icon}</span>
          </div>
          <div className="mt-2 text-2xl font-semibold tabular-nums">
            {s.value}
          </div>
          <div className="mt-0.5 text-xs text-muted-foreground">{s.sub}</div>
        </div>
      ))}
    </div>
  )
}
