"use client"

import { useState, useMemo } from "react"
import { BarChart3, Download, Filter, Search, Users } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface User {
  id: string
  email: string
  created_at: string
}

interface Question {
  id: string
  user_id: string
  title: string
  url: string
  difficulty: string
  tags: string[]
  date_added: string
  stability_score: number
  interval_days: number
  next_revision_date: string
  profiles: { email: string }
}

interface AdminDashboardProps {
  users: User[]
  questions: Question[]
  adminEmail?: string
}

export function AdminDashboard({
  users,
  questions,
  adminEmail,
}: AdminDashboardProps) {
  const [view, setView] = useState<"overview" | "users" | "questions">(
    "overview",
  )
  const [searchUser, setSearchUser] = useState("")
  const [searchQuestion, setSearchQuestion] = useState("")
  const [difficultyFilter, setDifficultyFilter] = useState<string>("All")

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter((u) =>
      u.email.toLowerCase().includes(searchUser.toLowerCase()),
    )
  }, [users, searchUser])

  // Filtered questions
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      const matchesSearch =
        q.title.toLowerCase().includes(searchQuestion.toLowerCase()) ||
        q.profiles.email.toLowerCase().includes(searchQuestion.toLowerCase())
      const matchesDifficulty =
        difficultyFilter === "All" || q.difficulty === difficultyFilter
      return matchesSearch && matchesDifficulty
    })
  }, [questions, searchQuestion, difficultyFilter])

  // Statistics
  const stats = useMemo(() => {
    return {
      totalUsers: users.length,
      totalQuestions: questions.length,
      averageQuestionsPerUser:
        users.length > 0
          ? (questions.length / users.length).toFixed(1)
          : "0",
      difficultyDistribution: {
        Easy: questions.filter((q) => q.difficulty === "Easy").length,
        Medium: questions.filter((q) => q.difficulty === "Medium").length,
        Hard: questions.filter((q) => q.difficulty === "Hard").length,
      },
      averageStabilityScore:
        questions.length > 0
          ? (
              questions.reduce((sum, q) => sum + q.stability_score, 0) /
              questions.length
            ).toFixed(2)
          : "0",
    }
  }, [users, questions])

  const exportData = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      users: users.length,
      questions: questions.length,
      users_list: users,
      questions_list: questions,
    }
    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `spaced-repetition-data-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-10">
      {/* Header */}
      <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold leading-none">Admin Dashboard</h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Manage all user data and questions
            </p>
          </div>
        </div>
        <Button
          onClick={exportData}
          variant="outline"
          className="gap-2 w-full md:w-auto"
        >
          <Download className="h-4 w-4" />
          Export Data
        </Button>
      </header>

      {/* View selector */}
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
          {(
            [
              { key: "overview", label: "Overview" },
              { key: "users", label: "Users" },
              { key: "questions", label: "Questions" },
            ] as { key: "overview" | "users" | "questions"; label: string }[]
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setView(tab.key)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                view === tab.key
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overview */}
      {view === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Total Users
                  </p>
                  <p className="mt-2 text-2xl font-bold">{stats.totalUsers}</p>
                </div>
                <Users className="h-8 w-8 text-primary/50" />
              </div>
            </div>
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Total Questions
                  </p>
                  <p className="mt-2 text-2xl font-bold">
                    {stats.totalQuestions}
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-primary/50" />
              </div>
            </div>
            <div className="rounded-lg border border-border bg-card p-6">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Avg Questions per User
                </p>
                <p className="mt-2 text-2xl font-bold">
                  {stats.averageQuestionsPerUser}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="font-semibold mb-4">Difficulty Distribution</h3>
              <div className="space-y-2">
                {["Easy", "Medium", "Hard"].map((difficulty) => {
                  const count =
                    stats.difficultyDistribution[
                      difficulty as keyof typeof stats.difficultyDistribution
                    ]
                  const percentage =
                    stats.totalQuestions > 0
                      ? ((count / stats.totalQuestions) * 100).toFixed(0)
                      : "0"
                  return (
                    <div key={difficulty} className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground">
                            {difficulty}
                          </span>
                          <span className="font-medium">
                            {count} ({percentage}%)
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-secondary/50">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="font-semibold mb-4">Memory Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Avg Stability Score
                  </span>
                  <span className="font-medium">{stats.averageStabilityScore}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users view */}
      {view === "users" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
                placeholder="Search by email..."
                className="h-9 pl-8 text-xs"
              />
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/40">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider">
                    Questions
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider">
                    Joined
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-xs text-muted-foreground">
                      No users found
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const userQuestions = questions.filter(
                      (q) => q.user_id === user.id,
                    ).length
                    return (
                      <tr
                        key={user.id}
                        className="border-b border-border hover:bg-secondary/30 transition-colors"
                      >
                        <td className="px-4 py-3 text-xs">{user.email}</td>
                        <td className="px-4 py-3 text-xs font-medium">
                          {userQuestions}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Questions view */}
      {view === "questions" && (
        <div className="space-y-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuestion}
                onChange={(e) => setSearchQuestion(e.target.value)}
                placeholder="Search by title or user email..."
                className="h-9 pl-8 text-xs"
              />
            </div>
            <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
              <SelectTrigger className="h-9 w-full md:w-[120px] text-xs">
                <Filter className="h-3.5 w-3.5" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All levels</SelectItem>
                <SelectItem value="Easy">Easy</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/40">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider">
                    Difficulty
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider">
                    Stability
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground text-xs uppercase tracking-wider">
                    Added
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredQuestions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-xs text-muted-foreground">
                      No questions found
                    </td>
                  </tr>
                ) : (
                  filteredQuestions.map((question) => (
                    <tr
                      key={question.id}
                      className="border-b border-border hover:bg-secondary/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="max-w-xs">
                          <a
                            href={question.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-medium text-primary hover:underline truncate block"
                            title={question.title}
                          >
                            {question.title}
                          </a>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {question.profiles.email}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-block rounded-full px-2 py-1 text-xs font-medium",
                            question.difficulty === "Easy"
                              ? "bg-green-500/15 text-green-700"
                              : question.difficulty === "Medium"
                                ? "bg-yellow-500/15 text-yellow-700"
                                : "bg-red-500/15 text-red-700",
                          )}
                        >
                          {question.difficulty}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs font-medium">
                        {question.stability_score.toFixed(1)}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {new Date(question.date_added).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Footer */}
      <p className="mt-8 text-center text-xs text-muted-foreground">
        Admin Dashboard • {adminEmail}
      </p>
    </div>
  )
}
