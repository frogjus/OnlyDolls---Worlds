import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type BeatDensity = 'minimal' | 'standard' | 'detailed'

interface BeatUIState {
  density: BeatDensity
  createDialogOpen: boolean
  editingBeatId: string | null
  filterStarRating: number | null
  filterCharacterId: string | null
  highlightBeatId: string | null
  setDensity: (density: BeatDensity) => void
  setCreateDialogOpen: (open: boolean) => void
  setEditingBeatId: (id: string | null) => void
  setFilterStarRating: (rating: number | null) => void
  setFilterCharacterId: (id: string | null) => void
  setHighlightBeatId: (id: string | null) => void
  clearHighlight: () => void
  resetFilters: () => void
}

export const useBeatUI = create<BeatUIState>()(
  persist(
    (set) => ({
      density: 'standard',
      createDialogOpen: false,
      editingBeatId: null,
      filterStarRating: null,
      filterCharacterId: null,
      highlightBeatId: null,
      setDensity: (density) => set({ density }),
      setCreateDialogOpen: (open) => set({ createDialogOpen: open }),
      setEditingBeatId: (id) => set({ editingBeatId: id }),
      setFilterStarRating: (rating) => set({ filterStarRating: rating }),
      setFilterCharacterId: (id) => set({ filterCharacterId: id }),
      setHighlightBeatId: (id) => set({ highlightBeatId: id }),
      clearHighlight: () => set({ highlightBeatId: null }),
      resetFilters: () => set({ filterStarRating: null, filterCharacterId: null }),
    }),
    {
      name: 'storyforge-beat-ui',
      partialize: (state) => ({ density: state.density }),
    },
  ),
)
