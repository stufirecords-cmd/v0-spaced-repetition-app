'use client'

import { Brain, Calendar, CheckCircle2, Flame } from 'lucide-react'

export function ProductPreview() {
  return (
    <section className="relative px-6 pb-24">
      <div className="mx-auto max-w-6xl">
        <div className="relative rounded-2xl border border-border/60 bg-card/30 p-2 shadow-2xl backdrop-blur">
          {/* Glow */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-12 -top-12 -z-10 h-32 rounded-full bg-primary/20 blur-3xl"
          />

          <div className="overflow-hidden rounded-xl border border-border/40 bg-background">
            {/* Window chrome */}
            <div className="flex items-center justify-between border-b border-border/40 px-4 py-3">
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
                <div className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
                <div className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Brain className="h-3 w-3" />
                <span className="font-mono">recall.app/dashboard</span>
              </div>
              <div className="w-12" />
            </div>

            {/* Content */}
            <div className="grid gap-4 p-6 md:grid-cols-3">
              {/* Stat 1 */}
              <div className="rounded-lg border border-border/40 bg-card/30 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Due today
                  </span>
                  <Flame className="h-3.5 w-3.5 text-accent" />
                </div>
                <div className="mt-2 text-3xl font-semibold tracking-tight">
                  7
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  problems to revise
                </div>
              </div>

              {/* Stat 2 */}
              <div className="rounded-lg border border-border/40 bg-card/30 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Retention
                  </span>
                  <CheckCircle2 className="h-3.5 w-3.5 text-chart-2" />
                </div>
                <div className="mt-2 text-3xl font-semibold tracking-tight">
                  94%
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  past 30 days
                </div>
              </div>

              {/* Stat 3 */}
              <div className="rounded-lg border border-border/40 bg-card/30 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Streak</span>
                  <Calendar className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="mt-2 text-3xl font-semibold tracking-tight">
                  12<span className="text-base text-muted-foreground">d</span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  longest: 28 days
                </div>
              </div>
            </div>

            {/* Problem list */}
            <div className="border-t border-border/40 p-6">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-medium">Today&apos;s queue</h3>
                <span className="font-mono text-xs text-muted-foreground">
                  3 of 7
                </span>
              </div>
              <div className="space-y-2">
                {[
                  {
                    title: 'Two Sum',
                    diff: 'Easy',
                    color: 'text-chart-2',
                    interval: '14d',
                  },
                  {
                    title: 'Longest Substring Without Repeating Characters',
                    diff: 'Medium',
                    color: 'text-accent',
                    interval: '6d',
                  },
                  {
                    title: 'Trapping Rain Water',
                    diff: 'Hard',
                    color: 'text-destructive',
                    interval: '3d',
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="flex items-center justify-between rounded-md border border-border/30 bg-card/20 px-3 py-2.5 text-sm transition-colors hover:bg-card/40"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`font-mono text-xs ${item.color}`}>
                        {item.diff}
                      </span>
                      <span>{item.title}</span>
                    </div>
                    <span className="font-mono text-xs text-muted-foreground">
                      every {item.interval}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
