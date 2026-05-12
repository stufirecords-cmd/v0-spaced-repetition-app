"use client"

import { Line, LineChart, ResponsiveContainer, YAxis } from "recharts"

export function Sparkline({ values }: { values: number[] }) {
  if (values.length === 0) {
    return (
      <div className="flex h-8 w-24 items-center justify-center text-xs text-muted-foreground">
        —
      </div>
    )
  }

  const data = values.map((v, i) => ({ i, v }))

  return (
    <div className="h-8 w-24">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
          <YAxis domain={[1, 5]} hide />
          <Line
            type="monotone"
            dataKey="v"
            stroke="var(--chart-1)"
            strokeWidth={1.75}
            dot={{ r: 1.5, fill: "var(--chart-1)" }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
