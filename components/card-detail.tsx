"use client"

import Link from "next/link"
import { useState } from "react"
import { format, formatDistanceToNow, parseISO } from "date-fns"
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  RotateCcw,
  Trash2,
} from "lucide-react"
import { useCards } from "@/hooks/use-cards"
import { daysUntil, isDue } from "@/lib/srs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LearningCurveChart } from "./learning-curve-chart"
import { ReviseDialog } from "./revise-dialog"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

const difficultyTone: Record<string, string> = {
  Easy: "border-chart-2/30 bg-chart-2/10 text-chart-2",
  Medium: "border-chart-3/30 bg-chart-3/10 text-chart-3",
  Hard: "border-chart-4/30 bg-chart-4/10 text-chart-4",
}

export function CardDetail({ id }: { id: string }) {
  const router = useRouter()
  const { cards, hydrated, recordRevision, deleteCard } = useCards()
  const [reviseOpen, setReviseOpen] = useState(false)

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 text-sm text-muted-foreground">
        Loading…
      </div>
    )
  }

  const card = cards.find((c) => c.id === id)
  if (!card) {
    return (
      <div className="mx-auto flex max-w-5xl flex-col items-center px-4 py-16 text-center">
        <h2 className="text-lg font-semibold">Card not found</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          It may have been deleted from this device.
        </p>
        <Button asChild className="mt-4" variant="outline">
          <Link href="/">
            <ArrowLeft className="h-4 w-4" /> Back to dashboard
          </Link>
        </Button>
      </div>
    )
  }

  const due = isDue(card)
  const days = daysUntil(card.nextRevisionDate)
  let dueLabel: string
  if (due) {
    dueLabel = days === 0 ? "Due today" : `${Math.abs(days)}d overdue`
  } else {
    dueLabel = days === 1 ? "In 1 day" : `In ${days} days`
  }

  const lastRev = card.revisionHistory[card.revisionHistory.length - 1]
  const avgConfidence =
    card.revisionHistory.length === 0
      ? null
      : Math.round(
          (card.revisionHistory.reduce((s, r) => s + r.confidence, 0) /
            card.revisionHistory.length) *
            10,
        ) / 10

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-8 md:py-10">
      <div className="mb-6 flex items-center justify-between">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-destructive"
          onClick={() => {
            if (confirm("Delete this card? This cannot be undone.")) {
              deleteCard(card.id)
              router.push("/")
            }
          }}
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>
      </div>

      {/* Title block */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "rounded-md border px-2 py-0.5 text-xs font-medium",
                difficultyTone[card.difficulty],
              )}
            >
              {card.difficulty}
            </span>
            {card.tags.map((t) => (
              <Badge
                key={t}
                variant="outline"
                className="h-6 border-border bg-transparent text-xs font-normal text-muted-foreground"
              >
                {t}
              </Badge>
            ))}
          </div>
          <h1 className="mt-3 text-2xl font-semibold text-balance">
            {card.title}
          </h1>
          <a
            href={card.url}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-primary"
          >
            <ExternalLink className="h-3 w-3" />
            <span className="truncate max-w-md">{card.url}</span>
          </a>
        </div>

        <Button
          size="lg"
          onClick={() => setReviseOpen(true)}
          className={cn(due && "shadow-lg shadow-primary/20")}
        >
          <RotateCcw className="h-4 w-4" />
          {due ? "Revise now" : "Mark revision"}
        </Button>
      </div>

      {/* Mini stat grid */}
      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Status" value={dueLabel} accent={due ? "text-chart-2" : "text-foreground"} />
        <StatCard
          label="Next revision"
          value={format(parseISO(card.nextRevisionDate), "MMM d")}
          sub={format(parseISO(card.nextRevisionDate), "yyyy")}
        />
        <StatCard
          label="Times revised"
          value={String(card.revisionHistory.length)}
          sub={
            lastRev
              ? `last ${formatDistanceToNow(parseISO(lastRev.date))} ago`
              : "not yet"
          }
        />
        <StatCard
          label="Avg confidence"
          value={avgConfidence != null ? `${avgConfidence}/5` : "—"}
          sub={`stability ${card.stabilityScore.toFixed(2)}`}
        />
      </div>

      {/* Learning curve chart */}
      <section className="mt-6 rounded-xl border border-border bg-card p-4 md:p-6">
        <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-sm font-medium">Learning curve</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Retention decays over time, then rebounds on each revision.
            </p>
          </div>
          <Legend />
        </div>
        <LearningCurveChart card={card} />
      </section>

      {/* Revision log */}
      <section className="mt-6 rounded-xl border border-border bg-card">
        <header className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-medium">Revision history</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Every time you marked this question revised.
          </p>
        </header>
        {card.revisionHistory.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-muted-foreground">
            No revisions yet — log your first one when you&apos;re ready.
          </div>
        ) : (
          <ul>
            {[...card.revisionHistory].reverse().map((r, i) => (
              <li
                key={`${r.date}-${i}`}
                className="flex items-center justify-between border-b border-border px-4 py-3 last:border-b-0"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-chart-2" />
                  <div>
                    <div className="text-sm">
                      {format(parseISO(r.date), "EEE, MMM d, yyyy")}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDistanceToNow(parseISO(r.date))} ago
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <ConfidenceDots value={r.confidence} />
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {r.confidence}/5
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ReviseDialog
        open={reviseOpen}
        onOpenChange={setReviseOpen}
        cardTitle={card.title}
        onSubmit={(c) => recordRevision(card.id, c)}
      />
    </div>
  )
}

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string
  value: string
  sub?: string
  accent?: string
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={cn("mt-2 text-xl font-semibold tabular-nums", accent)}>
        {value}
      </div>
      {sub && (
        <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div>
      )}
    </div>
  )
}

function ConfidenceDots({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            i <= value ? "bg-chart-2" : "bg-muted",
          )}
        />
      ))}
    </div>
  )
}

function Legend() {
  const items = [
    { color: "var(--chart-1)", label: "Retention" },
    { color: "var(--chart-3)", label: "Projected", dashed: true },
    { color: "var(--chart-2)", label: "Revisions" },
  ]
  return (
    <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
      {items.map((i) => (
        <span key={i.label} className="flex items-center gap-1.5">
          <span
            className={cn(
              "inline-block h-0.5 w-4 rounded-full",
              i.dashed && "border-t border-dashed",
            )}
            style={{
              background: i.dashed ? "transparent" : i.color,
              borderColor: i.color,
            }}
          />
          {i.label}
        </span>
      ))}
    </div>
  )
}
