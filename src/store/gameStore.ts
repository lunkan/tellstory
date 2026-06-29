import { create } from "zustand";
import { gameRepository } from "../repositories/gameRepository";
interface GameStore {
    worldId: number;
    loading: boolean;
    newGame: (worldId: number) => void;
}

export const useGameStore = create<GameStore>((set) => ({
    worldId: NaN,
    loading: false,
    newGame: async (worldId) => {
        set({ worldId, loading: true });

        await gameRepository.create(worldId);

        set(() => ({
            loading: false,
        }));
    },
}));
