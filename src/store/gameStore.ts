import { create } from "zustand";
import { gameRepository } from "../repositories/gameRepository";
import { DIRECTION } from "../../shared/src/direction";

interface GameStore {
    worldId: number;
    loading: boolean;
    newGame: (worldId: number) => void;
    movePlayer: (direction: DIRECTION) => void;
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
    movePlayer: async (direction: DIRECTION) => {
        set({ loading: true });

        await gameRepository.move(direction);

        set(() => ({
            loading: false,
        }));
    },
}));
