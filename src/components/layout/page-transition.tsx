'use client'

import { useContext, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSelectedLayoutSegment } from 'next/navigation'
import { LayoutRouterContext } from 'next/dist/shared/lib/app-router-context.shared-runtime'
import { pageTransition } from '@/lib/animations'

function usePreviousValue<T>(value: T): T | undefined {
  const prevValue = useRef<T>(undefined)
  useEffect(() => {
    prevValue.current = value
    return () => {
      prevValue.current = undefined
    }
  })
  return prevValue.current
}

function FrozenRouter({ children }: { children: React.ReactNode }) {
  const context = useContext(LayoutRouterContext)
  const prevContext = usePreviousValue(context) || null
  const segment = useSelectedLayoutSegment()
  const prevSegment = usePreviousValue(segment)
  const changed =
    segment !== prevSegment &&
    segment !== undefined &&
    prevSegment !== undefined

  return (
    <LayoutRouterContext.Provider value={changed ? prevContext : context}>
      {children}
    </LayoutRouterContext.Provider>
  )
}

export function PageTransition({ children }: { children: React.ReactNode }) {
  const segment = useSelectedLayoutSegment()

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={segment}
        variants={pageTransition}
        initial="initial"
        animate="animate"
        exit="exit"
        className="flex-1 overflow-auto bg-background"
      >
        <FrozenRouter>{children}</FrozenRouter>
      </motion.div>
    </AnimatePresence>
  )
}
