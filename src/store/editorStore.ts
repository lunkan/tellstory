import { create } from "zustand";

interface EditorStore {
  selectedTerrain: string;
  paintValue: number;
  editState: 'draw' | 'transform' | 'select' | null;
  selectTerrain: (name: string) => void;
  setPaintValue: (value: number) => void;
  setEditState: (state: 'draw' | 'transform' | 'select' | null) => void;
}

export const useEditorStore = create<EditorStore>((set) => ({
  selectedTerrain: '',
  paintValue: 0,
  editState: 'select',
  selectTerrain: (selectedTerrain) => {
    set(() => ({
      selectedTerrain: selectedTerrain,
    }));
  },
  setPaintValue: (value) => {
    set(() => ({
      paintValue: value,
    }));
  },
  setEditState: (state) => {
    set(() => ({
      editState: state,
    }));
  },
}));
