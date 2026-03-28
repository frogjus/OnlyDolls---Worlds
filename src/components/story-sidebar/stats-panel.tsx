'use client'

interface StatsPanelProps {
  wordCount: number
  beatsDone: number
  beatsTotal: number
  characterCount: number
}

export function StatsPanel({ wordCount, beatsDone, beatsTotal, characterCount }: StatsPanelProps) {
  return (
    <div className="grid grid-cols-3 gap-2 text-center">
      <div className="rounded-md bg-background p-2">
        <p className="text-lg font-bold">{wordCount.toLocaleString()}</p>
        <p className="text-xs text-muted-foreground">Words</p>
      </div>
      <div className="rounded-md bg-background p-2">
        <p className="text-lg font-bold">
          {beatsDone}/{beatsTotal}
        </p>
        <p className="text-xs text-muted-foreground">Beats</p>
      </div>
      <div className="rounded-md bg-background p-2">
        <p className="text-lg font-bold">{characterCount}</p>
        <p className="text-xs text-muted-foreground">Characters</p>
      </div>
    </div>
  )
}
