import { create } from "zustand";
import { gameRepository } from "../repositories/gameRepository";
import { isLocationChangeEvent } from "../../engine/core/events/game-event.config";
import { Message } from "../../shared/src/message";

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
    handleMessage: (message: Message) => {
        if (isLocationChangeEvent(message)) {
            console.log('useGameStore:isLocationChangeEvent');
            /*set({
                eventId: message.id,
            });*/
        }
    }
}));
