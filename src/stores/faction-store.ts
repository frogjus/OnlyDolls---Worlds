import { create } from 'zustand'

interface FactionStore {
  createDialogOpen: boolean
  setCreateDialogOpen: (open: boolean) => void
  editingFactionId: string | null
  setEditingFactionId: (id: string | null) => void
  selectedFactionId: string | null
  setSelectedFactionId: (id: string | null) => void
}

export const useFactionStore = create<FactionStore>((set) => ({
  createDialogOpen: false,
  setCreateDialogOpen: (open) => set({ createDialogOpen: open }),
  editingFactionId: null,
  setEditingFactionId: (id) => set({ editingFactionId: id }),
  selectedFactionId: null,
  setSelectedFactionId: (id) => set({ selectedFactionId: id }),
}))
