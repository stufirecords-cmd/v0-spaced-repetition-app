'use client'

const steps = [
  {
    step: '01',
    title: 'Add a problem',
    description:
      'Paste a LeetCode URL or add any coding problem you just solved.',
    code: `> recall add "Two Sum"
  difficulty: Easy
  tags: array, hash-table
  ✓ Scheduled for review in 1 day`,
  },
  {
    step: '02',
    title: 'Review on schedule',
    description:
      'Each morning, get a focused queue of problems due for review based on your memory.',
    code: `> recall queue --today

  [Easy]    Two Sum                  due now
  [Medium]  Longest Substring        due now
  [Hard]    Trapping Rain Water      due now

  3 problems · estimated 45 min`,
  },
  {
    step: '03',
    title: 'Mark your recall',
    description:
      'Rate how well you remembered. The algorithm adjusts your next interval automatically.',
    code: `> recall review "Two Sum"

  How was your recall?
  ▸ Forgot         (1 day)
    Hard           (3 days)
    Good           (14 days)  ✓
    Easy           (30 days)`,
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <div className="mb-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">
            How it works
          </div>
          <h2 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
            Three steps. Permanent recall.
          </h2>
        </div>

        <div className="space-y-6">
          {steps.map((step, i) => (
            <div
              key={step.step}
              className="grid items-center gap-8 rounded-2xl border border-border/60 bg-card/20 p-6 md:grid-cols-2 md:p-10"
            >
              <div className={i % 2 === 1 ? 'md:order-2' : ''}>
                <div className="mb-3 font-mono text-xs text-muted-foreground">
                  {step.step}
                </div>
                <h3 className="mb-3 text-2xl font-semibold tracking-tight md:text-3xl">
                  {step.title}
                </h3>
                <p className="text-base leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </div>

              <div
                className={`overflow-hidden rounded-lg border border-border/40 bg-background ${
                  i % 2 === 1 ? 'md:order-1' : ''
                }`}
              >
                <div className="flex items-center gap-1.5 border-b border-border/40 px-3 py-2">
                  <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                  <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                  <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                  <span className="ml-2 font-mono text-xs text-muted-foreground">
                    terminal
                  </span>
                </div>
                <pre className="overflow-x-auto p-5 font-mono text-xs leading-relaxed text-foreground/90">
                  <code>{step.code}</code>
                </pre>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
