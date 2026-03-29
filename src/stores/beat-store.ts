import { create } from 'zustand'

interface BeatUIState {
  createDialogOpen: boolean
  editingBeatId: string | null
  filterStarRating: number | null
  filterCharacterId: string | null
  highlightBeatId: string | null
  setCreateDialogOpen: (open: boolean) => void
  setEditingBeatId: (id: string | null) => void
  setFilterStarRating: (rating: number | null) => void
  setFilterCharacterId: (id: string | null) => void
  setHighlightBeatId: (id: string | null) => void
  clearHighlight: () => void
  resetFilters: () => void
}

export const useBeatUI = create<BeatUIState>((set) => ({
  createDialogOpen: false,
  editingBeatId: null,
  filterStarRating: null,
  filterCharacterId: null,
  highlightBeatId: null,
  setCreateDialogOpen: (open) => set({ createDialogOpen: open }),
  setEditingBeatId: (id) => set({ editingBeatId: id }),
  setFilterStarRating: (rating) => set({ filterStarRating: rating }),
  setFilterCharacterId: (id) => set({ filterCharacterId: id }),
  setHighlightBeatId: (id) => set({ highlightBeatId: id }),
  clearHighlight: () => set({ highlightBeatId: null }),
  resetFilters: () => set({ filterStarRating: null, filterCharacterId: null }),
}))
