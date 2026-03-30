function ShimmerBar({ className }: { className?: string }) {
  return (
    <div className={`rounded-md bg-muted relative overflow-hidden ${className ?? ''}`}>
      <div className="absolute inset-0 shimmer-sweep" />
    </div>
  )
}

export default function WorldLoading() {
  return (
    <div className="flex h-full flex-col bg-background animate-in fade-in duration-300">
      {/* Page header skeleton */}
      <div className="flex items-center gap-3 border-b border-[var(--od-border-default)] px-6 py-4">
        <ShimmerBar className="h-6 w-40" />
        <ShimmerBar className="ml-auto h-8 w-24" />
      </div>

      {/* Content area */}
      <div className="flex-1 p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-lg border border-[var(--od-border-default)] bg-card p-4 space-y-3"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <ShimmerBar className="h-5 w-3/4" />
              <ShimmerBar className="h-4 w-full" />
              <ShimmerBar className="h-4 w-2/3" />
              <div className="flex gap-2 pt-2">
                <ShimmerBar className="h-5 w-14 rounded-full" />
                <ShimmerBar className="h-5 w-14 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
