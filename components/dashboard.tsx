"use client"

import { useMemo, useState } from "react"
import { Brain, Filter, Search, SlidersHorizontal } from "lucide-react"
import type { Difficulty, QuestionCard } from "@/lib/types"
import { useCards } from "@/hooks/use-cards"
import { daysUntil, isDue } from "@/lib/srs"
import { AddCardDialog } from "./add-card-dialog"
import { CardRow } from "./card-row"
import { ReviseDialog } from "./revise-dialog"
import { StatsHeader } from "./stats-header"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Filter = "due" | "all" | "upcoming"

export function Dashboard() {
  const { cards, hydrated, addCard, recordRevision, deleteCard } = useCards()
  const [reviseId, setReviseId] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>("due")
  const [difficulty, setDifficulty] = useState<Difficulty | "All">("All")
  const [tag, setTag] = useState<string>("All")
  const [search, setSearch] = useState("")

  const allTags = useMemo(() => {
    const s = new Set<string>()
    for (const c of cards) c.tags.forEach((t) => s.add(t))
    return Array.from(s).sort()
  }, [cards])

  const filtered = useMemo(() => {
    let list = [...cards]
    if (filter === "due") list = list.filter((c) => isDue(c))
    if (filter === "upcoming") list = list.filter((c) => !isDue(c))
    if (difficulty !== "All")
      list = list.filter((c) => c.difficulty === difficulty)
    if (tag !== "All") list = list.filter((c) => c.tags.includes(tag))
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.tags.some((t) => t.toLowerCase().includes(q)),
      )
    }
    // Sort: due first (by overdue amount), then by nextRevisionDate
    list.sort((a, b) => daysUntil(a.nextRevisionDate) - daysUntil(b.nextRevisionDate))
    return list
  }, [cards, filter, difficulty, tag, search])

  const reviseTarget: QuestionCard | undefined = useMemo(
    () => cards.find((c) => c.id === reviseId),
    [cards, reviseId],
  )

  const dueCount = cards.filter((c) => isDue(c)).length

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-10">
      {/* Header */}
      <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Brain className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold leading-none">Recall</h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Spaced repetition for coding questions
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <AddCardDialog onAdd={addCard} />
        </div>
      </header>

      {/* Stats */}
      <StatsHeader cards={cards} />

      {/* Filter tabs */}
      <div className="mt-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
          {(
            [
              { key: "due", label: "Due today", count: dueCount },
              { key: "all", label: "All", count: cards.length },
              {
                key: "upcoming",
                label: "Upcoming",
                count: cards.length - dueCount,
              },
            ] as { key: Filter; label: string; count: number }[]
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                filter === tab.key
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] tabular-nums",
                  filter === tab.key
                    ? "bg-background text-muted-foreground"
                    : "bg-secondary text-muted-foreground",
                )}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title or tag"
              className="h-9 w-44 pl-8 text-xs"
            />
          </div>
          <Select
            value={difficulty}
            onValueChange={(v) => setDifficulty(v as Difficulty | "All")}
          >
            <SelectTrigger className="h-9 w-[120px] text-xs">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All levels</SelectItem>
              <SelectItem value="Easy">Easy</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Hard">Hard</SelectItem>
            </SelectContent>
          </Select>
          <Select value={tag} onValueChange={setTag}>
            <SelectTrigger className="h-9 w-[120px] text-xs">
              <Filter className="h-3.5 w-3.5" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All tags</SelectItem>
              {allTags.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* List */}
      <div className="mt-3 overflow-hidden rounded-xl border border-border bg-card">
        <div className="grid grid-cols-12 gap-3 border-b border-border bg-secondary/40 px-4 py-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          <div className="col-span-12 md:col-span-5">Question</div>
          <div className="col-span-6 md:col-span-2">Next revision</div>
          <div className="col-span-3 md:col-span-2">Confidence</div>
          <div className="col-span-3 md:col-span-1 text-right">Reviews</div>
          <div className="col-span-12 md:col-span-2 text-right">Actions</div>
        </div>

        {!hydrated ? (
          <div className="px-4 py-12 text-center text-sm text-muted-foreground">
            Loading…
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            hasAny={cards.length > 0}
            filterName={
              filter === "due"
                ? "due"
                : filter === "upcoming"
                ? "upcoming"
                : "matching"
            }
            onAdd={addCard}
          />
        ) : (
          filtered.map((c) => (
            <CardRow
              key={c.id}
              card={c}
              onRevise={(id) => setReviseId(id)}
              onDelete={deleteCard}
            />
          ))
        )}
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Built with the Ebbinghaus forgetting curve · Data stays on this device
      </p>

      <ReviseDialog
        open={!!reviseTarget}
        onOpenChange={(o) => !o && setReviseId(null)}
        cardTitle={reviseTarget?.title ?? ""}
        onSubmit={(c) => {
          if (reviseTarget) recordRevision(reviseTarget.id, c)
        }}
      />
    </div>
  )
}

function EmptyState({
  hasAny,
  filterName,
  onAdd,
}: {
  hasAny: boolean
  filterName: string
  onAdd: (input: {
    title: string
    url: string
    difficulty: Difficulty
    tags: string[]
  }) => void
}) {
  if (!hasAny) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Brain className="h-6 w-6" />
        </div>
        <h3 className="mt-4 text-base font-medium">Start your memory bank</h3>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Paste a link from LeetCode, Codeforces, GFG, or anywhere else.
          We&apos;ll schedule revisions so you never forget how to solve it.
        </p>
        <div className="mt-5">
          <AddCardDialog
            onAdd={onAdd}
            trigger={<Button>Add your first question</Button>}
          />
        </div>
      </div>
    )
  }
  return (
    <div className="px-4 py-12 text-center text-sm text-muted-foreground">
      No {filterName} questions match your filters.
    </div>
  )
}
