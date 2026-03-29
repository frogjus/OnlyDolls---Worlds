'use client'

import { motion } from 'framer-motion'
import { shimmer } from '@/lib/animations'

function ShimmerSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={`rounded-md bg-muted relative overflow-hidden ${className ?? ''}`}
    >
      <div className="absolute inset-0 shimmer-sweep" />
    </div>
  )
}

export default function WorldLoading() {
  return (
    <div className="flex h-full flex-col">
      {/* Page header skeleton */}
      <motion.div
        className="flex items-center gap-3 border-b px-6 py-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <ShimmerSkeleton className="h-6 w-40" />
        <ShimmerSkeleton className="ml-auto h-8 w-24" />
      </motion.div>

      {/* Content area */}
      <div className="flex-1 p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <motion.div
              key={i}
              custom={i}
              variants={shimmer}
              initial="hidden"
              animate="visible"
              className="rounded-lg border border-border/30 p-4 space-y-3"
            >
              <ShimmerSkeleton className="h-5 w-3/4" />
              <ShimmerSkeleton className="h-4 w-full" />
              <ShimmerSkeleton className="h-4 w-2/3" />
              <div className="flex gap-2 pt-2">
                <ShimmerSkeleton className="h-5 w-14 rounded-full" />
                <ShimmerSkeleton className="h-5 w-14 rounded-full" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
