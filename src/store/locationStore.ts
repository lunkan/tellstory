import { create } from "zustand";
import { DirectionData, LocationMessage } from "../../storyteller/types";
import { wsService } from "../websocket/websocketService";
import { useSceneStore } from "./sceneStore";

interface LocationStore {
  messageQueue: LocationMessage[];
  playerLocation: string;
  pendingMove: DirectionData | null;
  addMessage: (message: LocationMessage) => void;
  movePlayer: (direction: DirectionData) => void;
}

export const useLocationStore = create<LocationStore>((set) => ({
  messageQueue: [],
  playerLocation: '',
  pendingMove: null,

  addMessage: (message) => {
    set((state) => ({
      messageQueue: [message, ...state.messageQueue],
    }));
  },

  movePlayer: (direction) => {
    useSceneStore.getState().setActiveDirecton(null);

    set(() => ({
      pendingMove: direction,
    }));

    wsService.send({
      type: 'move',
      data: direction,
    });
  },
}));
