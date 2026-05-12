"use client"

import { useCallback, useEffect, useState } from "react"
import { format } from "date-fns"
import type { Difficulty, QuestionCard, Settings } from "@/lib/types"
import { DEFAULT_SETTINGS } from "@/lib/types"
import { loadCards, saveCards, loadSettings, saveSettings } from "@/lib/storage"
import {
  buildScheduleLoad,
  computeNextRevision,
  newCardDefaults,
  postponeOneDay,
} from "@/lib/srs"

function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export function useCards() {
  const [cards, setCards] = useState<QuestionCard[]>([])
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setCards(loadCards())
    setSettings(loadSettings())
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated) saveCards(cards)
  }, [cards, hydrated])

  useEffect(() => {
    if (hydrated) saveSettings(settings)
  }, [settings, hydrated])

  const addCard = useCallback(
    (input: {
      title: string
      url: string
      difficulty: Difficulty
      tags: string[]
    }): QuestionCard => {
      const card: QuestionCard = {
        id: uuid(),
        title: input.title.trim(),
        url: input.url.trim(),
        difficulty: input.difficulty,
        tags: input.tags,
        ...newCardDefaults(),
      }
      setCards((prev) => [card, ...prev])
      return card
    },
    [],
  )

  /**
   * Adds many cards at once, deduping by source slug. Returns the number of
   * cards actually inserted.
   */
  const addCardsBulk = useCallback(
    (
      inputs: Array<{
        title: string
        url: string
        difficulty: Difficulty
        tags: string[]
        source?: QuestionCard["source"]
      }>,
    ): number => {
      let inserted = 0
      setCards((prev) => {
        const existingSlugs = new Set(
          prev.map((c) => c.source?.slug).filter((s): s is string => !!s),
        )
        const toAdd: QuestionCard[] = []
        for (const input of inputs) {
          if (input.source?.slug && existingSlugs.has(input.source.slug)) continue
          if (input.source?.slug) existingSlugs.add(input.source.slug)
          toAdd.push({
            id: uuid(),
            title: input.title.trim(),
            url: input.url.trim(),
            difficulty: input.difficulty,
            tags: input.tags,
            source: input.source,
            ...newCardDefaults(),
          })
        }
        inserted = toAdd.length
        return [...toAdd, ...prev]
      })
      return inserted
    },
    [],
  )

  const recordRevision = useCallback(
    (id: string, confidence: number) => {
      setCards((prev) => {
        // Build load map from OTHER cards so this card doesn't see itself.
        const scheduleLoad = buildScheduleLoad(prev.filter((c) => c.id !== id))
        return prev.map((c) => {
          if (c.id !== id) return c
          const now = new Date()
          const next = computeNextRevision(c, confidence, {
            now,
            scheduleLoad,
            settings,
          })
          return {
            ...c,
            revisionHistory: [
              ...c.revisionHistory,
              { date: format(now, "yyyy-MM-dd"), confidence },
            ],
            intervalDays: next.intervalDays,
            stabilityScore: next.stabilityScore,
            nextRevisionDate: next.nextRevisionDate,
          }
        })
      })
    },
    [settings],
  )

  const postponeCard = useCallback((id: string) => {
    setCards((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c
        const updated = postponeOneDay(c)
        return { ...c, ...updated }
      }),
    )
  }, [])

  const postponeMany = useCallback((ids: string[]) => {
    const idSet = new Set(ids)
    setCards((prev) =>
      prev.map((c) => {
        if (!idSet.has(c.id)) return c
        const updated = postponeOneDay(c)
        return { ...c, ...updated }
      }),
    )
  }, [])

  const deleteCard = useCallback((id: string) => {
    setCards((prev) => prev.filter((c) => c.id !== id))
  }, [])

  return {
    cards,
    settings,
    setSettings,
    hydrated,
    addCard,
    addCardsBulk,
    recordRevision,
    postponeCard,
    postponeMany,
    deleteCard,
  }
}
