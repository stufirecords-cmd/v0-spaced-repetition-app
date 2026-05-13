"use client"

import { useCallback, useEffect, useState } from "react"
import { format } from "date-fns"
import { createClient } from "@/lib/supabase/client"
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
    const loadData = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      // Load from Supabase if authenticated, otherwise localStorage
      if (user) {
        const { data: questions } = await supabase
          .from('questions')
          .select('*')
          .eq('user_id', user.id)
        
        if (questions) {
          setCards(questions as QuestionCard[])
        }
      } else {
        setCards(loadCards())
      }
      
      setSettings(loadSettings())
      setHydrated(true)
    }
    
    loadData()
  }, [])

  useEffect(() => {
    if (!hydrated || cards.length === 0) return
    
    // Save to Supabase if authenticated, otherwise localStorage
    const saveToSupabase = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        try {
          for (const card of cards) {
            const { error } = await supabase
              .from('questions')
              .upsert({
                id: card.id,
                user_id: user.id,
                title: card.title,
                url: card.url,
                difficulty: card.difficulty,
                tags: card.tags,
                stability_score: card.stabilityScore,
                interval_days: card.intervalDays,
                next_revision_date: card.nextRevisionDate,
                revision_history: card.revisionHistory,
                source: card.source,
              })
            if (error) {
              console.log("[v0] Supabase save error:", error)
            }
          }
        } catch (err) {
          console.log("[v0] Supabase save exception:", err)
        }
      } else {
        // Fallback to localStorage
        saveCards(cards)
      }
    }
    
    // Debounce saves to avoid too many requests
    const timer = setTimeout(saveToSupabase, 1000)
    return () => clearTimeout(timer)
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
    
    // Delete from Supabase
    const deleteFromSupabase = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { error } = await supabase
          .from('questions')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id)
        
        if (error) {
          console.log("[v0] Delete error:", error)
        }
      }
    }
    deleteFromSupabase().catch(console.error)
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
