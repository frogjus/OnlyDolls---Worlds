import { create } from 'zustand'

interface StructureStoreState {
  createActDialogOpen: boolean
  createSequenceDialogOpen: boolean
  editingActId: string | null
  editingSequenceId: string | null
  selectedActId: string | null
  setCreateActDialogOpen: (open: boolean) => void
  setCreateSequenceDialogOpen: (open: boolean) => void
  setEditingActId: (id: string | null) => void
  setEditingSequenceId: (id: string | null) => void
  setSelectedActId: (id: string | null) => void
}

export const useStructureStore = create<StructureStoreState>((set) => ({
  createActDialogOpen: false,
  createSequenceDialogOpen: false,
  editingActId: null,
  editingSequenceId: null,
  selectedActId: null,
  setCreateActDialogOpen: (open) => set({ createActDialogOpen: open }),
  setCreateSequenceDialogOpen: (open) => set({ createSequenceDialogOpen: open }),
  setEditingActId: (id) => set({ editingActId: id }),
  setEditingSequenceId: (id) => set({ editingSequenceId: id }),
  setSelectedActId: (id) => set({ selectedActId: id }),
}))
