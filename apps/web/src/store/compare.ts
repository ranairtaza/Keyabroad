import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CompareItem {
  id: string;
  name: string;
  slug?: string;
  university_id?: string;
  type: 'university' | 'program';
  logo_url?: string;
  country?: string;
  tuition_fee?: number;
  currency?: string;
  degree_level?: string;
  duration?: string;
  intakes?: string[];
  gpa_requirement?: string;
  work_rights?: string;
}

interface CompareStore {
  items: CompareItem[];
  addItem: (item: CompareItem) => void;
  removeItem: (id: string) => void;
  clearItems: () => void;
}

export const useCompareStore = create<CompareStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        const items = get().items;
        if (items.length < 4 && !items.find(i => i.id === item.id)) {
          set({ items: [...items, item] });
        }
      },
      removeItem: (id) => set((state) => ({ items: state.items.filter(i => i.id !== id) })),
      clearItems: () => set({ items: [] }),
    }),
    {
      name: 'keyabroad-compare-storage',
    }
  )
);
