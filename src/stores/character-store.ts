import { create } from 'zustand'

interface CharacterStoreState {
  createDialogOpen: boolean
  editingCharacterId: string | null
  selectedCharacterId: string | null
  setCreateDialogOpen: (open: boolean) => void
  setEditingCharacterId: (id: string | null) => void
  setSelectedCharacterId: (id: string | null) => void
}

export const useCharacterStore = create<CharacterStoreState>((set) => ({
  createDialogOpen: false,
  editingCharacterId: null,
  selectedCharacterId: null,
  setCreateDialogOpen: (open) => set({ createDialogOpen: open }),
  setEditingCharacterId: (id) => set({ editingCharacterId: id }),
  setSelectedCharacterId: (id) => set({ selectedCharacterId: id }),
}))
