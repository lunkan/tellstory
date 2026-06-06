import { create } from "zustand";
import { useLocationStore } from "./locationStore";
import { DirectionData } from "../../storyteller/types";

interface SceneStore {
  sceneIntroductionComplete: boolean,
  sceneReadyForInteraction: boolean,
  activeDirection: DirectionData | null;
  setSceneIntroductionComplete: (isReady: boolean) => void,
  setSceneReadyForInteraction: (isReady: boolean) => void,
  setActiveDirecton: (direction: DirectionData | null) => void;
}

export const useSceneStore = create<SceneStore>((set) => ({
  sceneIntroductionComplete: false,
  sceneReadyForInteraction: false,
  activeDirection: null,
  setSceneIntroductionComplete: (isReady) => set({ sceneIntroductionComplete: isReady }),
  setSceneReadyForInteraction: (isReady) => set({ sceneReadyForInteraction: isReady }),
  setActiveDirecton: (direction) => set({ activeDirection: direction }),
}));

export const useScene = () => {
  const messageQueue = useLocationStore((state) => state.messageQueue);
  const activeDirection = useSceneStore((state) => state.activeDirection);

  const currentScene = messageQueue.find((message) => message.descriptionType === 'enter' || message.descriptionType === 'spawn');
  if (!currentScene) {
        return {};
  }
    
  const sceneId = currentScene.eventId;
  const leadingText = currentScene.text;
  const messagesByScene = messageQueue.filter((message) => message.eventId === sceneId);
  const sceneTransition = messagesByScene.find((message) => message.descriptionType === 'sceneTransition');
  const quadrantSummary = messagesByScene.find((message) => message.descriptionType === 'quadrantSummary');
  const adjacentSummary = messagesByScene.find((message) => message.descriptionType === 'adjacentSummary');
  const directionAttention = messagesByScene.find((message) => message.descriptionType === activeDirection?.type && message.direction === activeDirection?.direction);

  return {
    sceneId,
    leadingText,
    sceneTransition,
    quadrantSummary,
    adjacentSummary,
    directionAttention
  };
};