import { NextResponse } from "next/server"
import type { Difficulty } from "@/lib/types"
import type { LeetcodeSolve } from "@/lib/leetcode"

export const runtime = "edge"
export const dynamic = "force-dynamic"

const LC_ENDPOINT = "https://leetcode.com/graphql/"

const RECENT_AC_QUERY = `
  query recentAcSubmissions($username: String!, $limit: Int!) {
    recentAcSubmissionList(username: $username, limit: $limit) {
      id
      title
      titleSlug
      timestamp
    }
  }
`

const QUESTION_DETAIL_QUERY = `
  query questionData($titleSlug: String!) {
    question(titleSlug: $titleSlug) {
      difficulty
      topicTags { name slug }
    }
  }
`

type RecentAc = {
  id: string
  title: string
  titleSlug: string
  timestamp: string // seconds
}

type QuestionDetail = {
  difficulty: "Easy" | "Medium" | "Hard"
  topicTags: { name: string; slug: string }[]
}

async function lcGraphQL<T>(
  query: string,
  variables: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<T> {
  const res = await fetch(LC_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // LeetCode's GraphQL endpoint rejects requests with no/unknown UA.
      "User-Agent":
        "Mozilla/5.0 (compatible; RecallSRS/1.0; +https://github.com/Soumya-sagar)",
      Referer: "https://leetcode.com",
    },
    body: JSON.stringify({ query, variables }),
    signal,
  })
  if (!res.ok) {
    const txt = await res.text().catch(() => "")
    throw new Error(`LeetCode responded ${res.status}: ${txt.slice(0, 200)}`)
  }
  const json = (await res.json()) as { data?: T; errors?: { message: string }[] }
  if (json.errors?.length) {
    throw new Error(json.errors.map((e) => e.message).join("; "))
  }
  if (!json.data) throw new Error("Empty response from LeetCode")
  return json.data
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const username = url.searchParams.get("username")?.trim()
  const limitRaw = Number(url.searchParams.get("limit") ?? "20")
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 20) : 20

  if (!username) {
    return NextResponse.json(
      { error: "username query param is required" },
      { status: 400 },
    )
  }

  try {
    const ac = await lcGraphQL<{ recentAcSubmissionList: RecentAc[] | null }>(
      RECENT_AC_QUERY,
      { username, limit },
    )
    const list = ac.recentAcSubmissionList ?? []

    // Dedupe by slug — same problem may appear multiple times if resubmitted.
    const seen = new Set<string>()
    const unique: RecentAc[] = []
    for (const item of list) {
      if (seen.has(item.titleSlug)) continue
      seen.add(item.titleSlug)
      unique.push(item)
    }

    // Fetch difficulty + tags in parallel. Tolerate per-problem failures.
    const details = await Promise.all(
      unique.map(async (s) => {
        try {
          const d = await lcGraphQL<{ question: QuestionDetail | null }>(
            QUESTION_DETAIL_QUERY,
            { titleSlug: s.titleSlug },
          )
          return d.question
        } catch (e) {
          console.log("[v0] LC detail fetch failed for", s.titleSlug, e)
          return null
        }
      }),
    )

    const solves: LeetcodeSolve[] = unique.map((s, i) => {
      const detail = details[i]
      const difficulty: Difficulty =
        detail?.difficulty === "Easy" ||
        detail?.difficulty === "Medium" ||
        detail?.difficulty === "Hard"
          ? detail.difficulty
          : "Medium"
      const tags = (detail?.topicTags ?? []).map((t) => t.name)
      const tsNum = Number(s.timestamp)
      const solvedAt = Number.isFinite(tsNum)
        ? new Date(tsNum * 1000).toISOString()
        : new Date().toISOString()
      return {
        slug: s.titleSlug,
        title: s.title,
        url: `https://leetcode.com/problems/${s.titleSlug}/`,
        difficulty,
        tags,
        solvedAt,
      }
    })

    return NextResponse.json(
      { solves },
      {
        headers: {
          // Edge cache for 15s — keeps polling cheap if user has multiple tabs.
          "Cache-Control": "public, max-age=0, s-maxage=15",
        },
      },
    )
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error"
    console.log("[v0] LeetCode sync error:", message)
    // Common case: invalid username returns null from LeetCode — surface a
    // clearer message so the UI can show it.
    const isUnknownUser = /user.*not.*exist/i.test(message)
    return NextResponse.json(
      {
        error: isUnknownUser
          ? `LeetCode user "${username}" not found`
          : message,
      },
      { status: isUnknownUser ? 404 : 502 },
    )
  }
}
