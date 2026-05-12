import { cn } from "@/lib/utils"
import type { RetentionTier } from "@/lib/srs"
import { retentionTier, retentionTierLabel } from "@/lib/srs"

type Props = {
  retention: number // 0-1
  size?: "sm" | "md"
  showLabel?: boolean
  className?: string
}

const toneClasses: Record<
  RetentionTier,
  { dot: string; text: string; bg: string; border: string }
> = {
  fresh: {
    dot: "bg-muted-foreground/60",
    text: "text-muted-foreground",
    bg: "bg-muted",
    border: "border-border",
  },
  strong: {
    dot: "bg-chart-2",
    text: "text-chart-2",
    bg: "bg-chart-2/10",
    border: "border-chart-2/30",
  },
  ok: {
    dot: "bg-primary",
    text: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/30",
  },
  risky: {
    dot: "bg-chart-3",
    text: "text-chart-3",
    bg: "bg-chart-3/10",
    border: "border-chart-3/30",
  },
  lost: {
    dot: "bg-chart-4",
    text: "text-chart-4",
    bg: "bg-chart-4/10",
    border: "border-chart-4/30",
  },
}

export function RetentionChip({
  retention,
  size = "sm",
  showLabel = false,
  className,
}: Props) {
  const tier = retentionTier(retention)
  const tone = toneClasses[tier]
  const pct = Math.round(retention * 100)
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border tabular-nums",
        tone.bg,
        tone.border,
        tone.text,
        size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-xs",
        className,
      )}
      title={`Estimated retention: ${pct}% (${retentionTierLabel(tier)})`}
    >
      <span
        className={cn("h-1.5 w-1.5 rounded-full", tone.dot)}
        aria-hidden
      />
      <span>{pct}%</span>
      {showLabel && (
        <span className="opacity-75">· {retentionTierLabel(tier)}</span>
      )}
    </span>
  )
}
