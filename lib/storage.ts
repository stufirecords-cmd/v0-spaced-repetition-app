"use client"

import type { QuestionCard } from "./types"

const KEY = "recall.cards.v1"

export function loadCards(): QuestionCard[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as QuestionCard[]
    return Array.isArray(parsed) ? parsed : []
  } catch (e) {
    console.log("[v0] loadCards error:", e)
    return []
  }
}

export function saveCards(cards: QuestionCard[]) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(KEY, JSON.stringify(cards))
  } catch (e) {
    console.log("[v0] saveCards error:", e)
  }
}

export function exportCards(): string {
  return JSON.stringify(loadCards(), null, 2)
}
