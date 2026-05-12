"use client"

import { useMemo } from "react"
import {
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { addDays, format, parseISO } from "date-fns"
import type { QuestionCard } from "@/lib/types"
import { buildCurvePoints } from "@/lib/srs"

type Props = {
  card: QuestionCard
}

export function LearningCurveChart({ card }: Props) {
  const now = useMemo(() => new Date(), [])
  const todayISO = format(now, "yyyy-MM-dd")

  const data = useMemo(() => {
    const points = buildCurvePoints(card, 0, 45, now)
    const revisionMap = new Map(
      card.revisionHistory.map((r) => [r.date, r.confidence]),
    )
    const projectedISO = card.nextRevisionDate

    return points.map((p) => {
      const isPast = p.date <= todayISO
      const revisionConfidence = revisionMap.get(p.date)
      return {
        date: p.date,
        // The forgetting/retention curve
        retentionPast: isPast ? p.retention : null,
        retentionProjected: isPast ? null : p.retention,
        // Confidence line (only past)
        confidence:
          revisionConfidence != null ? revisionConfidence * 20 : null,
        // Revision dots
        revisionDot:
          revisionConfidence != null ? p.retention : null,
        // Projected next revision marker
        projectedDot: p.date === projectedISO ? p.retention : null,
      }
    })
  }, [card, now, todayISO])

  // Build a smoothed confidence series using last-known carry-forward
  const dataWithCarry = useMemo(() => {
    let lastConf: number | null = null
    return data.map((d) => {
      if (d.confidence != null) lastConf = d.confidence
      return {
        ...d,
        confidenceLine: d.date <= todayISO ? lastConf : null,
      }
    })
  }, [data, todayISO])

  return (
    <div className="h-[340px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={dataWithCarry}
          margin={{ top: 16, right: 16, bottom: 8, left: 0 }}
        >
          <defs>
            <linearGradient id="curveFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.25} />
              <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border)"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tickFormatter={(d) => format(parseISO(d), "MMM d")}
            stroke="var(--muted-foreground)"
            fontSize={11}
            tickMargin={6}
            interval={Math.max(1, Math.floor(dataWithCarry.length / 8))}
          />
          <YAxis
            domain={[0, 100]}
            stroke="var(--muted-foreground)"
            fontSize={11}
            tickFormatter={(v) => `${v}%`}
            width={40}
          />
          <Tooltip
            cursor={{ stroke: "var(--border)" }}
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              fontSize: "12px",
              color: "var(--popover-foreground)",
            }}
            labelFormatter={(d) => format(parseISO(d as string), "EEE, MMM d")}
            formatter={(value, name) => {
              if (value == null) return ["", ""]
              const num = typeof value === "number" ? value : Number(value)
              const label = String(name)
              if (label === "Retention" || label === "Projected retention")
                return [`${Math.round(num)}%`, label]
              if (label === "Confidence")
                return [`${Math.round(num / 20)}/5`, label]
              return [String(value), label]
            }}
          />

          <ReferenceLine
            x={todayISO}
            stroke="var(--chart-1)"
            strokeDasharray="2 4"
            label={{
              value: "Today",
              position: "insideTopRight",
              fill: "var(--chart-1)",
              fontSize: 10,
            }}
          />

          {/* Forgetting curve - past */}
          <Line
            type="monotone"
            dataKey="retentionPast"
            name="Retention"
            stroke="var(--chart-1)"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
            connectNulls
          />
          {/* Forgetting curve - projected */}
          <Line
            type="monotone"
            dataKey="retentionProjected"
            name="Projected retention"
            stroke="var(--chart-3)"
            strokeWidth={2}
            strokeDasharray="4 4"
            dot={false}
            isAnimationActive={false}
            connectNulls
          />
          {/* Confidence trend line */}
          <Line
            type="stepAfter"
            dataKey="confidenceLine"
            name="Confidence"
            stroke="var(--chart-2)"
            strokeWidth={1.5}
            strokeOpacity={0.6}
            dot={false}
            isAnimationActive={false}
            connectNulls
          />
          {/* Revision events as dots */}
          <Scatter
            dataKey="revisionDot"
            name="Revised"
            fill="var(--chart-2)"
            shape={(props: { cx?: number; cy?: number }) => {
              const { cx, cy } = props
              if (cx == null || cy == null) return <g />
              return (
                <g>
                  <circle
                    cx={cx}
                    cy={cy}
                    r={6}
                    fill="var(--chart-2)"
                    fillOpacity={0.15}
                  />
                  <circle cx={cx} cy={cy} r={3.5} fill="var(--chart-2)" />
                </g>
              )
            }}
          />
          {/* Next projected revision */}
          <Scatter
            dataKey="projectedDot"
            name="Next revision"
            fill="var(--chart-3)"
            shape={(props: { cx?: number; cy?: number }) => {
              const { cx, cy } = props
              if (cx == null || cy == null) return <g />
              return (
                <g>
                  <circle
                    cx={cx}
                    cy={cy}
                    r={6}
                    fill="var(--chart-3)"
                    fillOpacity={0.2}
                  />
                  <circle
                    cx={cx}
                    cy={cy}
                    r={4}
                    fill="none"
                    stroke="var(--chart-3)"
                    strokeWidth={1.5}
                  />
                </g>
              )
            }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
