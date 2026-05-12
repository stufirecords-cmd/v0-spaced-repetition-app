"use client"

import { useEffect, useState } from "react"
import { Code2, Settings as SettingsIcon, Sparkles } from "lucide-react"
import type { Settings } from "@/lib/types"
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
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"

type Props = {
  settings: Settings
  onChange: (s: Settings) => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const RETENTION_OPTIONS = [
  { value: 0.85, label: "85%", sub: "Lean", desc: "Fewer reviews, accept some forgetting" },
  { value: 0.9, label: "90%", sub: "Balanced", desc: "Default. Sweet spot for most learners" },
  { value: 0.95, label: "95%", sub: "Strict", desc: "More reviews, near-perfect recall" },
]

export function SettingsDialog({
  settings,
  onChange,
  open: openProp,
  onOpenChange,
}: Props) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = openProp ?? internalOpen
  const setOpen = onOpenChange ?? setInternalOpen
  const [draft, setDraft] = useState<Settings>(settings)

  // Reset the draft whenever the dialog opens or the underlying settings
  // change while it's open (e.g. user updated them in another flow).
  useEffect(() => {
    if (open) setDraft(settings)
  }, [open, settings])

  const handleOpen = (next: boolean) => {
    if (next) setDraft(settings)
    setOpen(next)
  }

  const handleSave = () => {
    onChange({
      ...draft,
      leetcodeUsername: draft.leetcodeUsername?.trim() || undefined,
    })
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-9">
          <SettingsIcon className="h-3.5 w-3.5" />
          Tune
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-primary" />
            Tune your scheduler
          </DialogTitle>
          <DialogDescription className="text-xs">
            Based on cognitive science — Anki, SuperMemo, FSRS. Changes apply
            to future reviews.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-1">
          {/* Daily cap */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">
                Daily review cap
              </Label>
              <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-semibold tabular-nums">
                {draft.dailyReviewCap === 50 ? "Unlimited" : `${draft.dailyReviewCap}/day`}
              </span>
            </div>
            <Slider
              value={[draft.dailyReviewCap]}
              min={5}
              max={50}
              step={5}
              onValueChange={([v]) =>
                setDraft((d) => ({ ...d, dailyReviewCap: v }))
              }
            />
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Beyond this, low-risk cards auto-shift to tomorrow. Working memory
              tops out around 15-25 mature reviews/day for most people.
            </p>
          </div>

          {/* Target retention */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Target retention</Label>
            <div className="grid grid-cols-3 gap-2">
              {RETENTION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() =>
                    setDraft((d) => ({ ...d, targetRetention: opt.value }))
                  }
                  className={cn(
                    "flex flex-col items-start gap-0.5 rounded-lg border bg-card p-3 text-left transition-all",
                    draft.targetRetention === opt.value
                      ? "border-primary ring-1 ring-primary"
                      : "border-border hover:border-primary/40",
                  )}
                >
                  <span className="text-base font-semibold">{opt.label}</span>
                  <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    {opt.sub}
                  </span>
                </button>
              ))}
            </div>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              {
                RETENTION_OPTIONS.find((o) => o.value === draft.targetRetention)
                  ?.desc
              }
              . Research (Ebbinghaus, FSRS) shows reviewing at 85-95% recall
              maximises long-term retention — don&apos;t wait until 50%.
            </p>
          </div>

          {/* Load balance */}
          <div className="flex items-start justify-between gap-3 rounded-lg border border-border bg-secondary/40 p-3">
            <div className="space-y-0.5">
              <Label className="text-xs font-medium">
                Smart load balancing
              </Label>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Shifts each next-review by up to ±15% to flatten busy days.
                Same trick Anki uses under the hood.
              </p>
            </div>
            <Switch
              checked={draft.loadBalance}
              onCheckedChange={(v) =>
                setDraft((d) => ({ ...d, loadBalance: v }))
              }
            />
          </div>

          {/* LeetCode sync */}
          <div className="space-y-3 rounded-lg border border-border bg-secondary/40 p-3">
            <div className="flex items-center gap-2">
              <Code2 className="h-3.5 w-3.5 text-primary" />
              <Label className="text-xs font-medium">LeetCode sync</Label>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="lc-username"
                className="text-[11px] font-normal text-muted-foreground"
              >
                Public username
              </Label>
              <Input
                id="lc-username"
                value={draft.leetcodeUsername ?? ""}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    leetcodeUsername: e.target.value,
                  }))
                }
                placeholder="e.g. soumya_sagar"
                className="h-8 text-xs"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
              />
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Your handle from leetcode.com/u/&lt;name&gt;. No password
                needed — we only read public solve history.
              </p>
            </div>

            <div className="flex items-start justify-between gap-3 pt-1">
              <div className="space-y-0.5">
                <Label className="text-[11px] font-medium">
                  Live auto-sync
                </Label>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  Checks every 2 minutes while the app is open. Solved
                  problems appear in near real time.
                </p>
              </div>
              <Switch
                checked={draft.leetcodeAutoSync}
                onCheckedChange={(v) =>
                  setDraft((d) => ({ ...d, leetcodeAutoSync: v }))
                }
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} size="sm">
            Cancel
          </Button>
          <Button onClick={handleSave} size="sm">
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
