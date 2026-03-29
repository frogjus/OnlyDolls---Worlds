import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface LayoutState {
  inspectorOpen: boolean
  inspectorWidth: number
  toggleInspector: () => void
  setInspectorOpen: (open: boolean) => void
  setInspectorWidth: (width: number) => void
}

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set) => ({
      inspectorOpen: false,
      inspectorWidth: 320,
      toggleInspector: () => set((s) => ({ inspectorOpen: !s.inspectorOpen })),
      setInspectorOpen: (open) => set({ inspectorOpen: open }),
      setInspectorWidth: (width) =>
        set({ inspectorWidth: Math.min(500, Math.max(280, width)) }),
    }),
    { name: 'storyforge-layout' }
  )
)
