'use client'

import { Activity, Brain, Calendar, Code2, LineChart, Zap } from 'lucide-react'

const features = [
  {
    icon: Brain,
    title: 'Forgetting curve algorithm',
    description:
      'Built on cognitive science. We schedule reviews based on memory stability, not arbitrary intervals.',
  },
  {
    icon: Code2,
    title: 'LeetCode native',
    description:
      'Paste a URL and we extract the title, difficulty, and tags. Sync solved problems automatically.',
  },
  {
    icon: Calendar,
    title: 'Daily review queue',
    description:
      'See exactly what to review today. No more guessing which problems you should redo.',
  },
  {
    icon: LineChart,
    title: 'Learning curve insights',
    description:
      'Visualize retention over time. Watch stability scores climb as problems become permanent.',
  },
  {
    icon: Activity,
    title: 'Workload forecast',
    description:
      'See your review load for the next 30 days. Plan study sessions without surprises.',
  },
  {
    icon: Zap,
    title: 'Built for speed',
    description:
      'Keyboard shortcuts everywhere. Mark a review in under a second. Stay in flow.',
  },
]

export function Features() {
  return (
    <section id="features" className="relative px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <div className="mb-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">
            Features
          </div>
          <h2 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
            Everything you need to retain
            <br />
            what you&apos;ve solved.
          </h2>
        </div>

        <div className="grid gap-px overflow-hidden rounded-2xl border border-border/60 bg-border/40 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group bg-background p-8 transition-colors hover:bg-card/40"
            >
              <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 bg-card/40 text-foreground">
                <feature.icon className="h-4 w-4" />
              </div>
              <h3 className="mb-2 text-base font-medium tracking-tight">
                {feature.title}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
