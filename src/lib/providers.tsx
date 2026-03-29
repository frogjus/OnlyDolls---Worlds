'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SessionProvider } from 'next-auth/react'
import { useState } from 'react'
import { TooltipProvider } from '@/components/ui/tooltip'
import { CommandPalette } from '@/components/command-palette'
import { useCommandPaletteKeyboard } from '@/components/command-palette/use-command-palette'

function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  useCommandPaletteKeyboard()
  return (
    <>
      {children}
      <CommandPalette />
    </>
  )
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())
  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <CommandPaletteProvider>{children}</CommandPaletteProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </SessionProvider>
  )
}
