import { create } from 'zustand'

interface EventStore {
  searchQuery: string
  setSearchQuery: (query: string) => void
  filterKeyEvents: boolean | null
  setFilterKeyEvents: (value: boolean | null) => void
}

export const useEventStore = create<EventStore>((set) => ({
  searchQuery: '',
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  filterKeyEvents: null,
  setFilterKeyEvents: (filterKeyEvents) => set({ filterKeyEvents }),
}))
