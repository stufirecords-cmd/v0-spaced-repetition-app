"use client"

import Link from "next/link"
import { ExternalLink, MoreHorizontal, RotateCcw, Trash2 } from "lucide-react"
import { format, parseISO } from "date-fns"
import type { QuestionCard } from "@/lib/types"
import { daysUntil, isDue } from "@/lib/srs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sparkline } from "./sparkline"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type Props = {
  card: QuestionCard
  onRevise: (id: string) => void
  onDelete: (id: string) => void
}

const difficultyTone: Record<string, string> = {
  Easy: "border-chart-2/30 bg-chart-2/10 text-chart-2",
  Medium: "border-chart-3/30 bg-chart-3/10 text-chart-3",
  Hard: "border-chart-4/30 bg-chart-4/10 text-chart-4",
}

export function CardRow({ card, onRevise, onDelete }: Props) {
  const due = isDue(card)
  const days = daysUntil(card.nextRevisionDate)
  const confidences = card.revisionHistory.map((r) => r.confidence)

  let dueLabel: string
  if (due) {
    dueLabel = days === 0 ? "Due today" : `${Math.abs(days)}d overdue`
  } else {
    dueLabel = days === 1 ? "in 1 day" : `in ${days} days`
  }

  return (
    <div
      className={cn(
        "group grid grid-cols-12 items-center gap-3 border-b border-border px-4 py-3 transition-colors hover:bg-secondary/40",
        due && "bg-chart-2/[0.03]",
      )}
    >
      <div className="col-span-12 md:col-span-5">
        <div className="flex items-center gap-2">
          <Link
            href={`/card/${card.id}`}
            className="truncate text-sm font-medium hover:text-primary"
          >
            {card.title}
          </Link>
          <a
            href={card.url}
            target="_blank"
            rel="noreferrer"
            className="text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
            aria-label="Open original question"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <span
            className={cn(
              "rounded-md border px-1.5 py-0.5 text-[10px] font-medium",
              difficultyTone[card.difficulty],
            )}
          >
            {card.difficulty}
          </span>
          {card.tags.slice(0, 3).map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className="h-5 border-border bg-transparent px-1.5 text-[10px] font-normal text-muted-foreground"
            >
              {tag}
            </Badge>
          ))}
          {card.tags.length > 3 && (
            <span className="text-[10px] text-muted-foreground">
              +{card.tags.length - 3}
            </span>
          )}
        </div>
      </div>

      <div className="col-span-6 md:col-span-2">
        <div className="flex items-center gap-2">
          {due ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-chart-2/15 px-2 py-0.5 text-[11px] font-medium text-chart-2">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-chart-2" />
              {dueLabel}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">{dueLabel}</span>
          )}
        </div>
        <div className="mt-1 text-[10px] text-muted-foreground">
          next {format(parseISO(card.nextRevisionDate), "MMM d")}
        </div>
      </div>

      <div className="col-span-3 md:col-span-2 flex items-center">
        <Sparkline values={confidences} />
      </div>

      <div className="col-span-3 md:col-span-1 text-right text-xs text-muted-foreground tabular-nums">
        {card.revisionHistory.length}×
      </div>

      <div className="col-span-12 md:col-span-2 flex items-center justify-end gap-1">
        <Button
          size="sm"
          variant={due ? "default" : "outline"}
          onClick={() => onRevise(card.id)}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Revise
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="ghost" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/card/${card.id}`}>Open detail</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href={card.url} target="_blank" rel="noreferrer">
                Open original
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onClick={() => onDelete(card.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete card
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
