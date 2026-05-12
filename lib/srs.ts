import { addDays, differenceInCalendarDays, format, parseISO } from "date-fns"
import type { QuestionCard, RevisionEntry } from "./types"

/**
 * Simplified SM-2 inspired SRS.
 *
 * - First solve  → 1 day
 * - Then 3, 7, 14, 30, 60, 120...
 * - Confidence (1-5) modulates stability and interval growth:
 *     1-2 = struggled  → reset interval to 1-3 days, drop stability
 *     3   = ok         → keep interval, neutral
 *     4-5 = strong     → accelerate, grow stability
 */
export function computeNextRevision(
  card: QuestionCard,
  confidence: number,
  now: Date = new Date(),
): {
  intervalDays: number
  stabilityScore: number
  nextRevisionDate: string
} {
  const baseSchedule = [1, 3, 7, 14, 30, 60, 120]
  const reviewCount = card.revisionHistory.length + 1 // including the upcoming one
  let interval: number
  let stability = card.stabilityScore

  if (confidence <= 2) {
    // Failed / shaky — reset
    interval = confidence === 1 ? 1 : 2
    stability = Math.max(1, stability - 0.6)
  } else if (confidence === 3) {
    interval = baseSchedule[Math.min(reviewCount - 1, baseSchedule.length - 1)]
    stability = Math.max(1, stability + 0.1)
  } else {
    // 4 or 5 — strong
    const base = baseSchedule[Math.min(reviewCount - 1, baseSchedule.length - 1)]
    const multiplier = confidence === 5 ? 1.6 : 1.25
    interval = Math.round(base * multiplier)
    stability = stability + (confidence === 5 ? 0.5 : 0.25)
  }

  interval = Math.max(1, Math.round(interval))

  return {
    intervalDays: interval,
    stabilityScore: Math.round(stability * 100) / 100,
    nextRevisionDate: format(addDays(now, interval), "yyyy-MM-dd"),
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

  // Build segment list: from dateAdded → each revision → projected next
  const segments: { start: Date; stability: number }[] = []
  let cursor = start
  let stab = 1.5 // initial stability seed

  segments.push({ start: cursor, stability: stab })

  for (const rev of card.revisionHistory) {
    const revDate = parseISO(rev.date)
    // re-derive stability roughly from confidence sequence
    if (rev.confidence <= 2) stab = Math.max(0.8, stab - 0.6)
    else if (rev.confidence === 3) stab = stab + 0.2
    else if (rev.confidence === 4) stab = stab + 0.6
    else stab = stab + 1.0
    cursor = revDate
    segments.push({ start: cursor, stability: stab })
  }

  // Fill points day-by-day across span
  for (let d = 0; d <= totalSpan; d++) {
    const day = addDays(start, d)
    // find which segment we're in
    let seg = segments[0]
    for (const s of segments) {
      if (s.start.getTime() <= day.getTime()) seg = s
    }
    const t = differenceInCalendarDays(day, seg.start)
    const retention = Math.exp(-t / Math.max(0.5, seg.stability))
    points.push({
      date: format(day, "yyyy-MM-dd"),
      retention: Math.round(retention * 1000) / 10, // 0-100
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
