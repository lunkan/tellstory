import { create } from "zustand";

interface GameStore {
    activeGameId: string | null;
    setActiveGameId: (id: string | null) => void;
}

export const useGameStore = create<GameStore>((set) => ({
    activeGameId: null,
    setActiveGameId: (id) => set({ activeGameId: id }),
}));