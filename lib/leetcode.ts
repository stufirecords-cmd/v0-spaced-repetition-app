import type { Difficulty } from "./types"

export type LeetcodeSolve = {
  slug: string
  title: string
  url: string
  difficulty: Difficulty
  tags: string[]
  solvedAt: string // ISO
}

export function slugToUrl(slug: string): string {
  return `https://leetcode.com/problems/${slug}/`
}

/**
 * Calls our internal API route which proxies to LeetCode's GraphQL endpoint.
 * The proxy is needed because LeetCode does not send CORS headers for
 * browser-origin requests.
 */
export async function fetchRecentSolves(
  username: string,
  limit = 20,
  signal?: AbortSignal,
): Promise<LeetcodeSolve[]> {
  const trimmed = username.trim()
  if (!trimmed) return []
  const res = await fetch(
    `/api/leetcode/recent?username=${encodeURIComponent(trimmed)}&limit=${limit}`,
    { signal, cache: "no-store" },
  )
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(body || `LeetCode sync failed (${res.status})`)
  }
  const data = (await res.json()) as { solves: LeetcodeSolve[] }
  return data.solves ?? []
}
