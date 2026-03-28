import { create } from 'zustand'

interface EventUIState {
  createDialogOpen: boolean
  editingEventId: string | null
  selectedEventId: string | null
  setCreateDialogOpen: (open: boolean) => void
  setEditingEventId: (id: string | null) => void
  setSelectedEventId: (id: string | null) => void
}

export const useEventStore = create<EventUIState>((set) => ({
  createDialogOpen: false,
  editingEventId: null,
  selectedEventId: null,
  setCreateDialogOpen: (open) => set({ createDialogOpen: open }),
  setEditingEventId: (id) => set({ editingEventId: id }),
  setSelectedEventId: (id) => set({ selectedEventId: id }),
}))
