'use client'

import Link from 'next/link'
import { ArrowRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-40 pb-24">
      {/* Subtle grid background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage:
            'linear-gradient(to right, var(--color-border) 1px, transparent 1px), linear-gradient(to bottom, var(--color-border) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage:
            'radial-gradient(ellipse 60% 60% at 50% 40%, black 40%, transparent 100%)',
        }}
      />

      <div className="relative mx-auto max-w-4xl px-6 text-center">
        {/* Tag */}
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/50 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
          <Sparkles className="h-3 w-3 text-accent" />
          <span className="font-mono">v1.0 — Now in public beta</span>
        </div>

        {/* Headline */}
        <h1 className="text-balance text-5xl font-semibold tracking-tight md:text-7xl">
          Never forget how
          <br />
          to solve a problem.
        </h1>

        {/* Subhead */}
        <p className="mx-auto mt-6 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
          The spaced repetition system built for engineers. Track every coding
          problem you solve and surface them exactly when you&apos;re about to
          forget.
        </p>

        {/* CTAs */}
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/auth/sign-up">
            <Button
              size="lg"
              className="group rounded-full bg-foreground px-6 text-background hover:bg-foreground/90"
            >
              Start practicing free
              <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </Link>
          <Link href="#how-it-works">
            <Button
              variant="ghost"
              size="lg"
              className="rounded-full text-muted-foreground hover:text-foreground"
            >
              How it works
            </Button>
          </Link>
        </div>

        {/* Trust line */}
        <p className="mt-12 font-mono text-xs text-muted-foreground/60">
          Free forever · No credit card required
        </p>
      </div>
    </section>
  )
}
