import { create } from "zustand";
import { isLocationChangeEvent } from "../../engine/core/events/game-event.config";
import { isDescriptionMessage, Message, LocationMessageDescriptionType } from "../../shared/src/message";

import { DIRECTION } from "../../shared/src/direction";

export type SceneDescription = {
    id: string,
    type: LocationMessageDescriptionType,
    text: string,
    //summary: string,
    attention: number,
    direction?: DIRECTION,
    consumed: boolean,
    lastReadTimestamp: number,

}

interface SceneStore {
    eventId: string,
    ready: boolean,
    description: SceneDescription | null,
    //descriptionQueue: SceneDescription[],
    attentionDirection: DIRECTION | undefined;
    setAttentionDirection: (direction: DIRECTION | undefined) => void;
    consumeDescription: (id: string) => void;
    handleMessage: (message: Message) => void;
}

let incrementor = 0;
let descriptionQueue: SceneDescription[] = [];

function getAttentionWeight(description: SceneDescription, attentionDirection?: DIRECTION): number {
    let weight = description.attention;
    if (attentionDirection && attentionDirection === description.direction) {
        weight += 10;
    }

    if (description.consumed) {
        weight -= 10;
    }

    return weight;
}

/*function descriptionSort(descriptions: SceneDescription[], attentionDirection?: DIRECTION): SceneDescription[] {
    return descriptions.sort((a, b) => (getAttentionWeight(b, attentionDirection) - getAttentionWeight(a, attentionDirection)));
}*/

function getDescription(attentionDirection?: DIRECTION): SceneDescription | null {
    console.log('*getDescription', descriptionQueue);
    return descriptionQueue.sort((a, b) => (getAttentionWeight(b, attentionDirection) - getAttentionWeight(a, attentionDirection)))[0] || null;
}

export const useSceneStore = create<SceneStore>((set, get) => ({
    eventId: '',
    ready: false,
    //descriptionQueue: [],
    description: null,
    attentionDirection: undefined,
    setAttentionDirection: (direction) => {
        //descriptionQueue = descriptionSort(descriptionQueue, direction);
        //const description = descriptionQueue.find((description) => description.attention > 0);

        set({
            attentionDirection: direction,
            description: getDescription(direction),
        });
    },
    consumeDescription: (id: string) => {
        console.log('useSceneStore:consumeDescription', id);
        descriptionQueue = descriptionQueue.map((description) => {
            if (description.id === id) {
                return {
                    ...description,
                    consumed: true,
                    lastReadTimestamp: Date.now(),
                };
            }

            return description;
        });

        console.log('useSceneStore:consumeDescription', descriptionQueue, getDescription(get().attentionDirection));

        set({
            description: getDescription(get().attentionDirection),
        });
    },
    handleMessage: (message: Message) => {
        console.log('useSceneStore:handleMessage', message);

        if (isLocationChangeEvent(message)) {
            descriptionQueue = [];

            set({
                eventId: message.id,
                ready: false,
            });

        } else if (isDescriptionMessage(message) && message.eventId === get().eventId) {
            descriptionQueue.push({
                ...message,
                id: `${message.eventId}@${++incrementor}`,
                consumed: false,
                lastReadTimestamp: -1,
            });

            set({
                ready: descriptionQueue.some((description) => description.type === 'sceneTransition'),
                description: getDescription(get().attentionDirection),
            });
        }
    }
}));

/*export const useScene = () => {
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
};*/