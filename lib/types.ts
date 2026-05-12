export type Difficulty = "Easy" | "Medium" | "Hard"

export type RevisionEntry = {
  date: string // ISO date
  confidence: number // 1-5
}

export type CardSource = {
  provider: "leetcode"
  slug: string // titleSlug, e.g. "two-sum"
  solvedAt?: string // ISO timestamp of original AC
}

export type QuestionCard = {
  id: string
  title: string
  url: string
  difficulty: Difficulty
  tags: string[]
  dateAdded: string // ISO date
  stabilityScore: number // SM-2 style ease/stability
  intervalDays: number // current interval
  nextRevisionDate: string // ISO date
  revisionHistory: RevisionEntry[]
  source?: CardSource // present if imported (e.g. from LeetCode)
}

/**
 * User-tunable scheduler settings. Backed by science:
 *
 * - dailyReviewCap: cognitive limit on reviews/day. Excess cards get
 *   auto-postponed if their retention is still safe. Default 15 — research
 *   suggests 15-25 mature reviews/day is a sustainable load for most learners.
 *
 * - targetRetention: the retention probability at which a card is "due".
 *   Anki/FSRS recommends 85-95%. Lower = fewer reviews but more forgetting.
 *   Higher = more reviews but stronger memory. Default 90%.
 *
 * - loadBalance: when scheduling next review, look at a ±15% window around
 *   the ideal date and pick the day with the fewest existing reviews. This
 *   naturally spreads "burst days" without hurting retention.
 *
 * - leetcodeUsername: public LeetCode handle. Used to fetch recently solved
 *   problems via their (unofficial) GraphQL endpoint. No password needed.
 *
 * - leetcodeAutoSync: when true, the app silently polls every 2 minutes while
 *   open (and on tab focus) so newly solved problems appear in near real time.
 */
export type Settings = {
  dailyReviewCap: number
  targetRetention: number // 0.80 - 0.95
  loadBalance: boolean
  leetcodeUsername?: string
  leetcodeAutoSync: boolean
}

export const DEFAULT_SETTINGS: Settings = {
  dailyReviewCap: 15,
  targetRetention: 0.9,
  loadBalance: true,
  leetcodeAutoSync: true,
}
