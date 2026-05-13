'use client'

import Link from 'next/link'
import { Brain } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function LandingNavbar() {
  return (
    <header className="fixed top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-foreground text-background">
            <Brain className="h-4 w-4" />
          </div>
          <span className="text-sm font-semibold tracking-tight">Recall</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <Link
            href="#features"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Features
          </Link>
          <Link
            href="#how-it-works"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            How it works
          </Link>
          <Link
            href="#pricing"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Pricing
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/auth/login">
            <Button
              variant="ghost"
              size="sm"
              className="text-sm font-normal text-muted-foreground hover:text-foreground"
            >
              Log in
            </Button>
          </Link>
          <Link href="/auth/sign-up">
            <Button
              size="sm"
              className="rounded-full bg-foreground text-background hover:bg-foreground/90"
            >
              Get Started
            </Button>
          </Link>
        </div>
      </div>
    </header>
  )
}
