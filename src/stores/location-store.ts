import { create } from 'zustand'

interface LocationUIState {
  createDialogOpen: boolean
  editingLocationId: string | null
  selectedLocationId: string | null
  setCreateDialogOpen: (open: boolean) => void
  setEditingLocationId: (id: string | null) => void
  setSelectedLocationId: (id: string | null) => void
}

export const useLocationStore = create<LocationUIState>((set) => ({
  createDialogOpen: false,
  editingLocationId: null,
  selectedLocationId: null,
  setCreateDialogOpen: (open) => set({ createDialogOpen: open }),
  setEditingLocationId: (id) => set({ editingLocationId: id }),
  setSelectedLocationId: (id) => set({ selectedLocationId: id }),
}))
