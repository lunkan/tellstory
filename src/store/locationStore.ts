import { create } from "zustand";
import { LocationMessage } from "../../storyteller/types";

interface LocationStore {
  messageQueue: LocationMessage[];
  addMessage: (message: LocationMessage) => void;
}

export const useLocationStore = create<LocationStore>((set) => ({
  messageQueue: [],

  addMessage: (message) => {
    console.log('MSG:addMessage:', message.descriptionType);
    set((state) => ({
      messageQueue: [message, ...state.messageQueue], // 
    }));
  },  
}));