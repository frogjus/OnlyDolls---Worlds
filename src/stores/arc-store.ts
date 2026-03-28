import { create } from 'zustand'

interface ArcStoreState {
  createDialogOpen: boolean
  editingArcId: string | null
  selectedArcId: string | null
  setCreateDialogOpen: (open: boolean) => void
  setEditingArcId: (id: string | null) => void
  setSelectedArcId: (id: string | null) => void
}

export const useArcStore = create<ArcStoreState>((set) => ({
  createDialogOpen: false,
  editingArcId: null,
  selectedArcId: null,
  setCreateDialogOpen: (open) => set({ createDialogOpen: open }),
  setEditingArcId: (id) => set({ editingArcId: id }),
  setSelectedArcId: (id) => set({ selectedArcId: id }),
}))
