'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function CTA() {
  return (
    <section id="pricing" className="relative px-6 py-24">
      <div className="mx-auto max-w-4xl">
        <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/30 px-8 py-16 text-center md:py-24">
          {/* Glow */}
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-0 -z-10 h-64 w-[80%] -translate-x-1/2 rounded-full bg-primary/20 blur-3xl"
          />

          <div className="mb-4 font-mono text-xs uppercase tracking-wider text-muted-foreground">
            Free forever
          </div>

          <h2 className="text-balance text-4xl font-semibold tracking-tight md:text-5xl">
            Stop re-solving
            <br />
            the same problems.
          </h2>

          <p className="mx-auto mt-6 max-w-md text-pretty text-base text-muted-foreground">
            Join hundreds of engineers who&apos;ve made their LeetCode prep
            permanent.
          </p>

          <div className="mt-10">
            <Link href="/auth/sign-up">
              <Button
                size="lg"
                className="group rounded-full bg-foreground px-6 text-background hover:bg-foreground/90"
              >
                Get started
                <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </Link>
          </div>

          <p className="mt-6 font-mono text-xs text-muted-foreground/60">
            No credit card · 30 seconds to set up
          </p>
        </div>
      </div>
    </section>
  )
}
