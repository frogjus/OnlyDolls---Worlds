import { create } from 'zustand'

interface BeatUIState {
  createDialogOpen: boolean
  editingBeatId: string | null
  filterStarRating: number | null
  filterCharacterId: string | null
  setCreateDialogOpen: (open: boolean) => void
  setEditingBeatId: (id: string | null) => void
  setFilterStarRating: (rating: number | null) => void
  setFilterCharacterId: (id: string | null) => void
  resetFilters: () => void
}

export const useBeatUI = create<BeatUIState>((set) => ({
  createDialogOpen: false,
  editingBeatId: null,
  filterStarRating: null,
  filterCharacterId: null,
  setCreateDialogOpen: (open) => set({ createDialogOpen: open }),
  setEditingBeatId: (id) => set({ editingBeatId: id }),
  setFilterStarRating: (rating) => set({ filterStarRating: rating }),
  setFilterCharacterId: (id) => set({ filterCharacterId: id }),
  resetFilters: () => set({ filterStarRating: null, filterCharacterId: null }),
}))
