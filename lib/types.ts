export type Difficulty = "Easy" | "Medium" | "Hard"

export type RevisionEntry = {
  date: string // ISO date
  confidence: number // 1-5
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
}
