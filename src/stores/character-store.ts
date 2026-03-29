import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface CharacterStoreState {
  createDialogOpen: boolean
  editingCharacterId: string | null
  selectedCharacterId: string | null
  setCreateDialogOpen: (open: boolean) => void
  setEditingCharacterId: (id: string | null) => void
  setSelectedCharacterId: (id: string | null) => void
}

export const useCharacterStore = create<CharacterStoreState>()(
  persist(
    (set) => ({
      createDialogOpen: false,
      editingCharacterId: null,
      selectedCharacterId: null,
      setCreateDialogOpen: (open) => set({ createDialogOpen: open }),
      setEditingCharacterId: (id) => set({ editingCharacterId: id }),
      setSelectedCharacterId: (id) => set({ selectedCharacterId: id }),
    }),
    {
      name: 'storyforge-character',
      partialize: (state) => ({ selectedCharacterId: state.selectedCharacterId }),
    }
  )
)
