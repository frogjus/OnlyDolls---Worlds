function ShimmerBar({ className }: { className?: string }) {
  return (
    <div className={`rounded-md bg-muted relative overflow-hidden ${className ?? ''}`}>
      <div className="absolute inset-0 shimmer-sweep" />
    </div>
  )
}

export default function DashboardLoading() {
  return (
    <div className="flex h-full flex-col p-6 gap-6 bg-background animate-in fade-in duration-300">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <ShimmerBar className="h-8 w-48" />
        <ShimmerBar className="h-8 w-32" />
      </div>

      {/* World cards grid skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-[var(--od-border-default)] bg-card p-5 space-y-3 shadow-[var(--od-shadow-card)]"
          >
            <ShimmerBar className="h-6 w-2/3" />
            <ShimmerBar className="h-4 w-full" />
            <ShimmerBar className="h-4 w-4/5" />
            <div className="flex items-center gap-3 pt-2">
              <ShimmerBar className="h-4 w-20 rounded-full" />
              <ShimmerBar className="h-4 w-20 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
