import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface SelectedEntity {
  type: 'character' | 'beat' | 'location' | 'event' | 'faction' | 'arc'
  id: string
  name: string
  meta?: Record<string, string>
}

interface LayoutState {
  inspectorOpen: boolean
  inspectorWidth: number
  selectedEntity: SelectedEntity | null
  toggleInspector: () => void
  setInspectorOpen: (open: boolean) => void
  setInspectorWidth: (width: number) => void
  selectEntity: (entity: SelectedEntity) => void
  clearSelectedEntity: () => void
}

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set) => ({
      inspectorOpen: false,
      inspectorWidth: 320,
      selectedEntity: null,
      toggleInspector: () => set((s) => ({ inspectorOpen: !s.inspectorOpen })),
      setInspectorOpen: (open) => set({ inspectorOpen: open }),
      setInspectorWidth: (width) =>
        set({ inspectorWidth: Math.min(500, Math.max(280, width)) }),
      selectEntity: (entity) =>
        set({ selectedEntity: entity, inspectorOpen: true }),
      clearSelectedEntity: () => set({ selectedEntity: null }),
    }),
    {
      name: 'storyforge-layout',
      partialize: (state) => ({
        inspectorWidth: state.inspectorWidth,
      }),
    }
  )
)
