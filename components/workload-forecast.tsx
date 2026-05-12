"use client"

import { useMemo } from "react"
import { format, parseISO } from "date-fns"
import { BarChart3, TrendingUp } from "lucide-react"
import type { QuestionCard, Settings } from "@/lib/types"
import { workloadForecast } from "@/lib/srs"
import { cn } from "@/lib/utils"

type Props = {
  cards: QuestionCard[]
  settings: Settings
  daysAhead?: number
}

export function WorkloadForecast({ cards, settings, daysAhead = 13 }: Props) {
  const forecast = useMemo(
    () => workloadForecast(cards, daysAhead),
    [cards, daysAhead],
  )

  const maxCount = useMemo(
    () => Math.max(settings.dailyReviewCap, ...forecast.map((d) => d.count), 1),
    [forecast, settings.dailyReviewCap],
  )

  const heavyDays = forecast.filter((d) => d.count > settings.dailyReviewCap).length
  const totalUpcoming = forecast.reduce((sum, d) => sum + d.count, 0)

  if (totalUpcoming === 0) return null

  return (
    <section className="mt-6 rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Workload forecast</h2>
          <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[10px] tabular-nums text-muted-foreground">
            next {daysAhead + 1} days
          </span>
        </div>
        {heavyDays > 0 ? (
          <div className="flex items-center gap-1.5 text-[11px] text-chart-4">
            <TrendingUp className="h-3 w-3" />
            {heavyDays} heavy {heavyDays === 1 ? "day" : "days"} ahead
          </div>
        ) : (
          <span className="text-[11px] text-muted-foreground">
            Load looks balanced
          </span>
        )}
      </div>

      {/* Bars */}
      <div className="flex items-end gap-1.5">
        {forecast.map((day) => {
          const heightPct = (day.count / maxCount) * 100
          const overCap = day.count > settings.dailyReviewCap
          const date = parseISO(day.date)
          const dayLabel = format(date, "EEEEE") // single letter
          const isToday = day.overdue

          return (
            <div
              key={day.date}
              className="group flex flex-1 flex-col items-center gap-1"
            >
              <div
                className="relative flex h-20 w-full items-end overflow-hidden rounded-md bg-secondary/60"
                aria-label={`${format(date, "EEE MMM d")}: ${day.count} reviews`}
              >
                {/* Capacity line */}
                <div
                  className="absolute left-0 right-0 border-t border-dashed border-border"
                  style={{
                    bottom: `${(settings.dailyReviewCap / maxCount) * 100}%`,
                  }}
                />
                {/* Bar */}
                <div
                  className={cn(
                    "w-full rounded-md transition-all",
                    overCap
                      ? "bg-chart-4/70 group-hover:bg-chart-4"
                      : isToday
                      ? "bg-primary group-hover:bg-primary"
                      : "bg-chart-1/60 group-hover:bg-chart-1",
                  )}
                  style={{ height: `${heightPct}%` }}
                />
                {day.count > 0 && (
                  <span
                    className={cn(
                      "absolute inset-x-0 bottom-1 text-center text-[9px] font-semibold tabular-nums",
                      overCap ? "text-background" : "text-foreground/80",
                    )}
                  >
                    {day.count}
                  </span>
                )}
              </div>
              <span
                className={cn(
                  "text-[9px] uppercase tracking-wide tabular-nums",
                  isToday ? "font-semibold text-primary" : "text-muted-foreground",
                )}
              >
                {isToday ? "Today" : dayLabel}
              </span>
            </div>
          )
        })}
      </div>

      <div className="mt-3 flex items-center gap-3 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-sm bg-chart-1/60" /> Normal
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-sm bg-chart-4/70" /> Over cap (
          {settings.dailyReviewCap}/day)
        </span>
        <span className="ml-auto">Dashed line = your daily cap</span>
      </div>
    </section>
  )
}
