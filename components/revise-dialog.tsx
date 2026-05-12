"use client"

import { useState } from "react"
import { CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  cardTitle: string
  onSubmit: (confidence: number) => void
}

const SCALE: { value: number; label: string; sub: string; color: string }[] = [
  { value: 1, label: "1", sub: "Forgot it", color: "bg-chart-4" },
  { value: 2, label: "2", sub: "Struggled", color: "bg-chart-4/70" },
  { value: 3, label: "3", sub: "OK", color: "bg-muted-foreground/60" },
  { value: 4, label: "4", sub: "Solid", color: "bg-chart-2/80" },
  { value: 5, label: "5", sub: "Easy", color: "bg-chart-2" },
]

export function ReviseDialog({ open, onOpenChange, cardTitle, onSubmit }: Props) {
  const [confidence, setConfidence] = useState<number | null>(null)

  const handleSubmit = () => {
    if (confidence == null) {
      toast.error("Pick a confidence score")
      return
    }
    onSubmit(confidence)
    toast.success("Revision logged — schedule updated")
    onOpenChange(false)
    setConfidence(null)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o)
        if (!o) setConfidence(null)
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-chart-2" />
            How confident do you feel?
          </DialogTitle>
          <DialogDescription className="line-clamp-1">
            {cardTitle}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="grid grid-cols-5 gap-2">
            {SCALE.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setConfidence(s.value)}
                className={cn(
                  "group flex flex-col items-center gap-1.5 rounded-lg border bg-card p-3 text-center transition-all hover:border-primary/60 hover:bg-secondary",
                  confidence === s.value && "border-primary ring-1 ring-primary",
                )}
              >
                <span
                  className={cn(
                    "h-2 w-full rounded-full opacity-50 transition-opacity group-hover:opacity-100",
                    s.color,
                    confidence === s.value && "opacity-100",
                  )}
                />
                <span className="text-lg font-semibold leading-none">
                  {s.label}
                </span>
                <span className="text-[10px] text-muted-foreground leading-none">
                  {s.sub}
                </span>
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Lower scores reset the interval. Higher scores accelerate it.
          </p>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={confidence == null}>
            Log revision
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
