"use client"

import { useState } from "react"
import { Loader2, Plus, Link as LinkIcon } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Difficulty } from "@/lib/types"

type Props = {
  onAdd: (input: {
    title: string
    url: string
    difficulty: Difficulty
    tags: string[]
  }) => void
  trigger?: React.ReactNode
}

export function AddCardDialog({ onAdd, trigger }: Props) {
  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState("")
  const [title, setTitle] = useState("")
  const [difficulty, setDifficulty] = useState<Difficulty>("Medium")
  const [tagsInput, setTagsInput] = useState("")
  const [fetching, setFetching] = useState(false)
  const [titleAutofilled, setTitleAutofilled] = useState(false)

  const reset = () => {
    setUrl("")
    setTitle("")
    setDifficulty("Medium")
    setTagsInput("")
    setFetching(false)
    setTitleAutofilled(false)
  }

  const fetchTitle = async (value: string) => {
    if (!value || !/^https?:\/\//i.test(value)) return
    setFetching(true)
    try {
      const res = await fetch(`/api/fetch-title?url=${encodeURIComponent(value)}`)
      const data = await res.json()
      if (data?.title) {
        setTitle(data.title)
        setTitleAutofilled(true)
      }
    } catch (e) {
      console.log("[v0] title fetch failed:", e)
    } finally {
      setFetching(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim() || !title.trim()) {
      toast.error("URL and title are required")
      return
    }
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
    onAdd({ title, url, difficulty, tags })
    toast.success("Question added — first revision tomorrow")
    setOpen(false)
    reset()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) reset()
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="default">
            <Plus className="h-4 w-4" />
            Add question
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add a question</DialogTitle>
          <DialogDescription>
            Paste a link from LeetCode, Codeforces, GFG, or anywhere. We&apos;ll
            grab the title automatically.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url">Question URL</Label>
            <div className="relative">
              <LinkIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="url"
                placeholder="https://leetcode.com/problems/two-sum/"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onBlur={(e) => {
                  if (!title) fetchTitle(e.target.value)
                }}
                className="pl-9"
                autoFocus
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="title">Title</Label>
              {fetching && (
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Fetching title…
                </span>
              )}
              {titleAutofilled && !fetching && (
                <span className="text-xs text-chart-2">Auto-filled</span>
              )}
            </div>
            <Input
              id="title"
              placeholder="Two Sum"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                setTitleAutofilled(false)
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Difficulty</Label>
              <Select
                value={difficulty}
                onValueChange={(v) => setDifficulty(v as Difficulty)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Easy">Easy</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                placeholder="DP, Graph"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Add question</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
