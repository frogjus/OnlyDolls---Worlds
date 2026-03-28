import { create } from 'zustand'

interface FactionUIState {
  createDialogOpen: boolean
  editingFactionId: string | null
  selectedFactionId: string | null
  setCreateDialogOpen: (open: boolean) => void
  setEditingFactionId: (id: string | null) => void
  setSelectedFactionId: (id: string | null) => void
}

export const useFactionStore = create<FactionUIState>((set) => ({
  createDialogOpen: false,
  editingFactionId: null,
  selectedFactionId: null,
  setCreateDialogOpen: (open) => set({ createDialogOpen: open }),
  setEditingFactionId: (id) => set({ editingFactionId: id }),
  setSelectedFactionId: (id) => set({ selectedFactionId: id }),
}))
