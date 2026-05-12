"use client"

import type { QuestionCard, Settings } from "./types"
import { DEFAULT_SETTINGS } from "./types"

const KEY = "recall.cards.v1"
const SETTINGS_KEY = "recall.settings.v1"

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

export function loadSettings(): Settings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY)
    if (!raw) return DEFAULT_SETTINGS
    const parsed = JSON.parse(raw) as Partial<Settings>
    return { ...DEFAULT_SETTINGS, ...parsed }
  } catch (e) {
    console.log("[v0] loadSettings error:", e)
    return DEFAULT_SETTINGS
  }
}

export function saveSettings(settings: Settings) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  } catch (e) {
    console.log("[v0] saveSettings error:", e)
  }
}

export function exportCards(): string {
  return JSON.stringify(loadCards(), null, 2)
}
