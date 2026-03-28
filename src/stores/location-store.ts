import { create } from 'zustand'

interface LocationStore {
  dialogOpen: boolean
  setDialogOpen: (open: boolean) => void
  editingId: string | null
  setEditingId: (id: string | null) => void
  selectedId: string | null
  setSelectedId: (id: string | null) => void
  filterType: string | null
  setFilterType: (type: string | null) => void
}

export const useLocationStore = create<LocationStore>((set) => ({
  dialogOpen: false,
  setDialogOpen: (dialogOpen) => set({ dialogOpen }),
  editingId: null,
  setEditingId: (editingId) => set({ editingId }),
  selectedId: null,
  setSelectedId: (selectedId) => set({ selectedId }),
  filterType: null,
  setFilterType: (filterType) => set({ filterType }),
}))
