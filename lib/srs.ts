import { addDays, differenceInCalendarDays, format, parseISO } from "date-fns"
import type { QuestionCard, RevisionEntry, Settings } from "./types"
import { DEFAULT_SETTINGS } from "./types"

/**
 * Simplified SM-2 inspired SRS with FSRS-style load balancing.
 *
 * Base intervals: 1, 3, 7, 14, 30, 60, 120 days
 * Confidence (1-5) modulates stability and interval growth:
 *   1-2 = struggled  -> reset interval to 1-3 days, drop stability
 *   3   = ok         -> keep interval, neutral
 *   4-5 = strong     -> accelerate, grow stability
 *
 * Load balancing: once we have an ideal interval, we look at +/-15% of that
 * window and pick the day with the fewest already-scheduled reviews. This is
 * the same trick Anki uses internally to prevent pile-ups.
 */
export function computeNextRevision(
  card: QuestionCard,
  confidence: number,
  opts: {
    now?: Date
    /** Map of ISO date -> count of cards already scheduled that day. */
    scheduleLoad?: Map<string, number>
    settings?: Settings
  } = {},
): {
  intervalDays: number
  stabilityScore: number
  nextRevisionDate: string
} {
  const now = opts.now ?? new Date()
  const settings = opts.settings ?? DEFAULT_SETTINGS

  const baseSchedule = [1, 3, 7, 14, 30, 60, 120]
  const reviewCount = card.revisionHistory.length + 1
  let interval: number
  let stability = card.stabilityScore

  if (confidence <= 2) {
    interval = confidence === 1 ? 1 : 2
    stability = Math.max(1, stability - 0.6)
  } else if (confidence === 3) {
    interval = baseSchedule[Math.min(reviewCount - 1, baseSchedule.length - 1)]
    stability = Math.max(1, stability + 0.1)
  } else {
    const base = baseSchedule[Math.min(reviewCount - 1, baseSchedule.length - 1)]
    const multiplier = confidence === 5 ? 1.6 : 1.25
    interval = Math.round(base * multiplier)
    stability = stability + (confidence === 5 ? 0.5 : 0.25)
  }

  interval = Math.max(1, Math.round(interval))

  // Load balance: only for intervals >= 3 (short reviews shouldn't shift)
  let chosenInterval = interval
  if (settings.loadBalance && interval >= 3 && opts.scheduleLoad) {
    const fuzz = Math.max(1, Math.round(interval * 0.15))
    const windowStart = Math.max(1, interval - fuzz)
    const windowEnd = interval + fuzz

    let bestInterval = interval
    let bestLoad = Number.POSITIVE_INFINITY

    for (let d = windowStart; d <= windowEnd; d++) {
      const candidate = format(addDays(now, d), "yyyy-MM-dd")
      const load = opts.scheduleLoad.get(candidate) ?? 0
      // Prefer days with lower load; tie-break toward the ideal day.
      const distance = Math.abs(d - interval)
      const score = load * 10 + distance
      if (score < bestLoad) {
        bestLoad = score
        bestInterval = d
      }
    }
    chosenInterval = bestInterval
  }

  return {
    intervalDays: chosenInterval,
    stabilityScore: Math.round(stability * 100) / 100,
    nextRevisionDate: format(addDays(now, chosenInterval), "yyyy-MM-dd"),
  }
}

/**
 * Ebbinghaus forgetting curve: R = e^(-t/S)
 * t = days since last revision (or dateAdded)
 * S = stability score
 */
export function retentionAt(card: QuestionCard, date: Date): number {
  const lastEvent =
    card.revisionHistory.length > 0
      ? parseISO(card.revisionHistory[card.revisionHistory.length - 1].date)
      : parseISO(card.dateAdded)

  const t = Math.max(0, differenceInCalendarDays(date, lastEvent))
  const s = Math.max(0.5, card.stabilityScore)
  return Math.exp(-t / s)
}

/** Retention right now (0-1). */
export function currentRetention(card: QuestionCard, now: Date = new Date()): number {
  return retentionAt(card, now)
}

export type RetentionTier = "fresh" | "strong" | "ok" | "risky" | "lost"

/** Bucket a 0-1 retention into a semantic tier. */
export function retentionTier(retention: number): RetentionTier {
  if (retention >= 0.99) return "fresh"
  if (retention >= 0.85) return "strong"
  if (retention >= 0.7) return "ok"
  if (retention >= 0.4) return "risky"
  return "lost"
}

export function retentionTierLabel(tier: RetentionTier): string {
  switch (tier) {
    case "fresh":
      return "Fresh"
    case "strong":
      return "Strong"
    case "ok":
      return "OK"
    case "risky":
      return "Risky"
    case "lost":
      return "Forgotten"
  }
}

/**
 * Priority score for the "do today" queue.
 * Higher = more urgent. Combines:
 *   - retention gap (how far below target we are)
 *   - overdue days (the longer it sat, the worse)
 *   - difficulty weight (hard problems decay faster in practice)
 */
export function priorityScore(
  card: QuestionCard,
  settings: Settings = DEFAULT_SETTINGS,
  now: Date = new Date(),
): number {
  const retention = currentRetention(card, now)
  const retentionGap = Math.max(0, settings.targetRetention - retention)
  const overdue = Math.max(0, -daysUntil(card.nextRevisionDate, now))
  const difficultyWeight =
    card.difficulty === "Hard" ? 1.15 : card.difficulty === "Easy" ? 0.9 : 1.0
  return (retentionGap * 100 + overdue * 5) * difficultyWeight
}

/**
 * Partition due cards into the "must do today" set (priority queue, capped)
 * and the "can wait" set (auto-postpone candidates whose retention is still
 * comfortably above target).
 */
export function partitionTodaysQueue(
  cards: QuestionCard[],
  settings: Settings = DEFAULT_SETTINGS,
  now: Date = new Date(),
): { mustDo: QuestionCard[]; canWait: QuestionCard[] } {
  const due = cards.filter((c) => isDue(c, now))
  if (due.length === 0) return { mustDo: [], canWait: [] }

  // Sort by priority (highest first)
  const sorted = [...due].sort(
    (a, b) =>
      priorityScore(b, settings, now) - priorityScore(a, settings, now),
  )

  if (sorted.length <= settings.dailyReviewCap) {
    return { mustDo: sorted, canWait: [] }
  }

  // First N are "must do". The rest -> only postpone-eligible if retention
  // is still >= targetRetention - 5% (we don't postpone real risks).
  const mustDo = sorted.slice(0, settings.dailyReviewCap)
  const overflow = sorted.slice(settings.dailyReviewCap)
  const postponeFloor = settings.targetRetention - 0.05
  const canWait: QuestionCard[] = []
  for (const c of overflow) {
    if (currentRetention(c, now) >= postponeFloor) {
      canWait.push(c)
    } else {
      mustDo.push(c) // still risky -> bump back into must-do
    }
  }
  return { mustDo, canWait }
}

/**
 * Postpone a card by 1 day without altering its stability. Used for
 * load-balancing when daily cap is hit and retention is still safe.
 */
export function postponeOneDay(
  card: QuestionCard,
  now: Date = new Date(),
): Pick<QuestionCard, "nextRevisionDate" | "intervalDays"> {
  const currentNext = parseISO(card.nextRevisionDate)
  const base = currentNext.getTime() < now.getTime() ? now : currentNext
  return {
    nextRevisionDate: format(addDays(base, 1), "yyyy-MM-dd"),
    intervalDays: card.intervalDays,
  }
}

/**
 * Workload forecast for the next N days. Returns per-day counts so the UI
 * can render a heatmap and warn about heavy days before they arrive.
 */
export function workloadForecast(
  cards: QuestionCard[],
  daysAhead: number,
  now: Date = new Date(),
): { date: string; count: number; overdue: boolean }[] {
  const buckets: { date: string; count: number; overdue: boolean }[] = []
  for (let i = 0; i <= daysAhead; i++) {
    const day = addDays(now, i)
    const iso = format(day, "yyyy-MM-dd")
    let count = 0
    if (i === 0) {
      // Today bucket includes overdue cards
      count = cards.filter((c) => daysUntil(c.nextRevisionDate, now) <= 0).length
    } else {
      count = cards.filter((c) => c.nextRevisionDate === iso).length
    }
    buckets.push({ date: iso, count, overdue: i === 0 })
  }
  return buckets
}

/** Build a Map<ISODate, count> of currently scheduled reviews, used by load-balancer. */
export function buildScheduleLoad(cards: QuestionCard[]): Map<string, number> {
  const m = new Map<string, number>()
  for (const c of cards) {
    m.set(c.nextRevisionDate, (m.get(c.nextRevisionDate) ?? 0) + 1)
  }
  return m
}

/**
 * Build dense points for the learning curve.
 * Each revision boosts retention back to 1 then decays per the new stability.
 */
export function buildCurvePoints(
  card: QuestionCard,
  daysBefore = 0,
  daysAfter = 30,
  now: Date = new Date(),
): { date: string; retention: number }[] {
  const start = parseISO(card.dateAdded)
  const totalSpan =
    Math.max(differenceInCalendarDays(now, start), 0) + daysAfter + daysBefore

  const points: { date: string; retention: number }[] = []

  const segments: { start: Date; stability: number }[] = []
  let cursor = start
  let stab = 1.5

  segments.push({ start: cursor, stability: stab })

  for (const rev of card.revisionHistory) {
    const revDate = parseISO(rev.date)
    if (rev.confidence <= 2) stab = Math.max(0.8, stab - 0.6)
    else if (rev.confidence === 3) stab = stab + 0.2
    else if (rev.confidence === 4) stab = stab + 0.6
    else stab = stab + 1.0
    cursor = revDate
    segments.push({ start: cursor, stability: stab })
  }

  for (let d = 0; d <= totalSpan; d++) {
    const day = addDays(start, d)
    let seg = segments[0]
    for (const s of segments) {
      if (s.start.getTime() <= day.getTime()) seg = s
    }
    const t = differenceInCalendarDays(day, seg.start)
    const retention = Math.exp(-t / Math.max(0.5, seg.stability))
    points.push({
      date: format(day, "yyyy-MM-dd"),
      retention: Math.round(retention * 1000) / 10,
    })
  }

  return points
}

export function daysUntil(dateISO: string, now: Date = new Date()): number {
  return differenceInCalendarDays(parseISO(dateISO), now)
}

export function isDue(card: QuestionCard, now: Date = new Date()): boolean {
  return daysUntil(card.nextRevisionDate, now) <= 0
}

export function newCardDefaults(now: Date = new Date()): Pick<
  QuestionCard,
  "dateAdded" | "stabilityScore" | "intervalDays" | "nextRevisionDate" | "revisionHistory"
> {
  return {
    dateAdded: format(now, "yyyy-MM-dd"),
    stabilityScore: 1.5,
    intervalDays: 1,
    nextRevisionDate: format(addDays(now, 1), "yyyy-MM-dd"),
    revisionHistory: [] as RevisionEntry[],
  }
}
