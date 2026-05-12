"use client"

import { useCallback, useEffect, useState } from "react"
import { format } from "date-fns"
import type { Difficulty, QuestionCard } from "@/lib/types"
import { loadCards, saveCards } from "@/lib/storage"
import { computeNextRevision, newCardDefaults } from "@/lib/srs"

function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export function useCards() {
  const [cards, setCards] = useState<QuestionCard[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setCards(loadCards())
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated) saveCards(cards)
  }, [cards, hydrated])

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

  const recordRevision = useCallback((id: string, confidence: number) => {
    setCards((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c
        const now = new Date()
        const next = computeNextRevision(c, confidence, now)
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
      }),
    )
  }, [])

  const deleteCard = useCallback((id: string) => {
    setCards((prev) => prev.filter((c) => c.id !== id))
  }, [])

  return { cards, hydrated, addCard, recordRevision, deleteCard }
}
