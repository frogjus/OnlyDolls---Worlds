'use client'

import { cn } from '@/lib/utils'

export interface VizSkeletonProps {
  variant: 'graph' | 'timeline' | 'chart' | 'board' | 'editor' | 'diff'
}

const graphCircles = [
  { cx: '20%', cy: '30%', r: 20 },
  { cx: '45%', cy: '15%', r: 16 },
  { cx: '70%', cy: '25%', r: 22 },
  { cx: '85%', cy: '55%', r: 14 },
  { cx: '60%', cy: '50%', r: 18 },
  { cx: '30%', cy: '60%', r: 20 },
  { cx: '15%', cy: '75%', r: 14 },
  { cx: '50%', cy: '75%', r: 16 },
  { cx: '75%', cy: '80%', r: 18 },
  { cx: '40%', cy: '40%', r: 12 },
]

const graphLines: [number, number][] = [
  [0, 1], [0, 3], [1, 2], [1, 4], [2, 3],
  [3, 4], [4, 5], [5, 6], [5, 7], [6, 7],
  [7, 8], [8, 4], [9, 0], [9, 4], [9, 5],
]

function GraphSkeleton() {
  return (
    <svg className="h-full w-full" preserveAspectRatio="xMidYMid meet">
      {graphLines.map(([from, to], i) => (
        <line
          key={i}
          x1={graphCircles[from].cx}
          y1={graphCircles[from].cy}
          x2={graphCircles[to].cx}
          y2={graphCircles[to].cy}
          className="animate-pulse stroke-muted"
          strokeWidth={1.5}
        />
      ))}
      {graphCircles.map((c, i) => (
        <circle
          key={i}
          cx={c.cx}
          cy={c.cy}
          r={c.r}
          className="animate-pulse fill-muted"
          style={{ animationDelay: `${i * 100}ms` }}
        />
      ))}
    </svg>
  )
}

function TimelineSkeleton() {
  const rects = [
    { x: '5%', w: '12%' }, { x: '20%', w: '18%' }, { x: '42%', w: '10%' },
    { x: '55%', w: '15%' }, { x: '73%', w: '8%' }, { x: '84%', w: '12%' },
  ]
  return (
    <svg className="h-full w-full" preserveAspectRatio="xMidYMid meet">
      <line x1="3%" y1="30%" x2="97%" y2="30%" className="stroke-muted" strokeWidth={2} />
      <line x1="3%" y1="70%" x2="97%" y2="70%" className="stroke-muted" strokeWidth={2} />
      {rects.map((r, i) => (
        <rect
          key={`top-${i}`}
          x={r.x}
          y="20%"
          width={r.w}
          height="16%"
          rx={6}
          className="animate-pulse fill-muted"
          style={{ animationDelay: `${i * 120}ms` }}
        />
      ))}
      {rects.map((r, i) => (
        <rect
          key={`bot-${i}`}
          x={`${parseFloat(r.x) + 3}%`}
          y="58%"
          width={r.w}
          height="16%"
          rx={6}
          className="animate-pulse fill-muted"
          style={{ animationDelay: `${(i + 6) * 120}ms` }}
        />
      ))}
    </svg>
  )
}

function ChartSkeleton() {
  const bars = [
    { x: '15%', h: '40%' }, { x: '30%', h: '65%' }, { x: '45%', h: '50%' },
    { x: '60%', h: '80%' }, { x: '75%', h: '35%' },
  ]
  return (
    <svg className="h-full w-full" preserveAspectRatio="xMidYMid meet">
      <line x1="10%" y1="10%" x2="10%" y2="90%" className="stroke-muted" strokeWidth={2} />
      <line x1="10%" y1="90%" x2="95%" y2="90%" className="stroke-muted" strokeWidth={2} />
      {bars.map((b, i) => (
        <rect
          key={i}
          x={b.x}
          y={`${90 - parseFloat(b.h)}%`}
          width="10%"
          height={b.h}
          rx={4}
          className="animate-pulse fill-muted"
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </svg>
  )
}

function BoardSkeleton() {
  const columns = 4
  const cardsPerCol = 3
  return (
    <div className="flex h-full gap-4 p-4">
      {Array.from({ length: columns }).map((_, col) => (
        <div key={col} className="flex flex-1 flex-col gap-3">
          <div
            className="h-8 animate-pulse rounded-md bg-muted"
            style={{ animationDelay: `${col * 100}ms` }}
          />
          {Array.from({ length: cardsPerCol }).map((_, card) => (
            <div
              key={card}
              className="h-24 animate-pulse rounded-lg bg-muted"
              style={{ animationDelay: `${(col * cardsPerCol + card) * 80}ms` }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

function EditorSkeleton() {
  const widths = [
    '75%', '90%', '60%', '85%', '45%', '95%', '70%',
    '55%', '80%', '65%', '90%', '40%', '72%', '88%', '50%',
  ]
  return (
    <div className="flex flex-col gap-2.5 p-6">
      {widths.map((w, i) => (
        <div
          key={i}
          className="h-4 animate-pulse rounded bg-muted"
          style={{ width: w, animationDelay: `${i * 60}ms` }}
        />
      ))}
    </div>
  )
}

function DiffSkeleton() {
  const leftWidths = ['80%', '65%', '90%', '50%', '75%', '85%', '60%']
  const rightWidths = ['70%', '85%', '55%', '90%', '65%', '45%', '80%']
  return (
    <div className="flex h-full gap-2 p-4">
      <div className="flex flex-1 flex-col gap-2.5 rounded-lg border border-border p-4">
        {leftWidths.map((w, i) => (
          <div
            key={i}
            className="h-4 animate-pulse rounded bg-muted"
            style={{ width: w, animationDelay: `${i * 80}ms` }}
          />
        ))}
      </div>
      <div className="flex flex-1 flex-col gap-2.5 rounded-lg border border-border p-4">
        {rightWidths.map((w, i) => (
          <div
            key={i}
            className="h-4 animate-pulse rounded bg-muted"
            style={{ width: w, animationDelay: `${(i + 7) * 80}ms` }}
          />
        ))}
      </div>
    </div>
  )
}

const skeletonMap: Record<VizSkeletonProps['variant'], React.FC> = {
  graph: GraphSkeleton,
  timeline: TimelineSkeleton,
  chart: ChartSkeleton,
  board: BoardSkeleton,
  editor: EditorSkeleton,
  diff: DiffSkeleton,
}

function VizSkeleton({ variant }: VizSkeletonProps) {
  const Component = skeletonMap[variant]
  return (
    <div
      data-slot="viz-skeleton"
      className={cn('h-full w-full', variant === 'board' || variant === 'editor' || variant === 'diff' ? '' : 'p-8')}
      aria-busy="true"
      aria-label="Loading visualization"
    >
      <Component />
    </div>
  )
}

export { VizSkeleton }
