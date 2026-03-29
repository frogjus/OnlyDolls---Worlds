import { Skeleton } from '@/components/ui/skeleton'

export default function WorldLoading() {
  return (
    <div className="flex h-full flex-col">
      {/* Page header skeleton */}
      <div className="flex items-center gap-3 border-b px-6 py-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="ml-auto h-8 w-24" />
      </div>

      {/* Content area */}
      <div className="flex-1 p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-lg border p-4 space-y-3">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <div className="flex gap-2 pt-2">
                <Skeleton className="h-5 w-14 rounded-full" />
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
