import { create } from "zustand";
import { isDescriptionMessage, Message, LocationMessageDescriptionType, isPlayerLocationChangeMessage, PlayerLocationDirection } from "../../shared/src/message";

import { DIRECTION, DIRECTION_NAME } from "../../shared/src/direction";
import { gameRepository } from "../repositories/gameRepository";

export type SceneDescription = {
    id: string,
    type: LocationMessageDescriptionType,
    label: string,
    text: string,
    attention: number,
    direction?: DIRECTION,
    isIntroDescription: boolean,
    consumed: boolean,

}

interface SceneStore {
    eventId: string,
    ready: boolean,
    focusMode: boolean,
    skipIntro: boolean,
    directions: PlayerLocationDirection[],
    description: SceneDescription | null,
    attentionDirection: PlayerLocationDirection | undefined;
    moveDirection: DIRECTION | undefined;
    alertMessage: string | undefined;
    setFocusMode: (focusMode: boolean) => void;
    setAttentionDirection: (direction: DIRECTION | undefined) => void;
    movePlayer: (direction: DIRECTION) => void;
    consumeDescription: (id: string) => void;
    handleMessage: (message: Message) => void;
    sendAlertMessage: (message: string) => void;
}

let idIncrementor = 0;
let descriptionQueue: SceneDescription[] = [];

export const useSceneStore = create<SceneStore>((set, get) => ({
    eventId: '',
    ready: false,
    focusMode: false,
    skipIntro: false,
    directions: [],
    description: null,
    attentionDirection: undefined,
    moveDirection: undefined,
    alertMessage: undefined,
    setFocusMode: (focusMode) => {
        set({
            focusMode,
            description: !get().description?.isIntroDescription ? get().description : null,
            skipIntro: true,
        });
    },
    setAttentionDirection: (direction) => {
        const description = direction ? descriptionQueue.find((description) => description.direction === direction) : null;
        const attentionDirection = get().directions.find((playerDirection) => playerDirection.direction === direction);

        set({
            attentionDirection,
            description: description,
        });
    },
    movePlayer: async (direction: DIRECTION) => {
        descriptionQueue = [];

        set({
            moveDirection: direction,
            directions: [],
            attentionDirection: undefined,
            eventId: '',
            description: null,
            focusMode: false,
            skipIntro: false,
            ready: false,
        });

        await gameRepository.move(direction);
    },
    consumeDescription: (id: string) => {
        descriptionQueue.forEach((description) => {
            if (description.id === id) {
                description.consumed = true;
            }
        });

        if (!get().description?.direction) {
            const description = descriptionQueue
                .filter((description) => description.isIntroDescription && !description.consumed)
                .sort((a, b) => a.attention - b.attention)
                .pop();


            set({
                description,
            });
        }
    },
    handleMessage: (message: Message) => {
        if (isPlayerLocationChangeMessage(message)) {
            set({
                eventId: message.eventId,
                directions: message.directions,
            });

        } else if (isDescriptionMessage(message) && message.eventId === get().eventId) {
            const newSceneDescription = {
                ...message,
                label: message.direction ? DIRECTION_NAME[message.direction] : message.type,
                id: `${message.eventId}${++idIncrementor}`,
                isIntroDescription: !message.direction,
                consumed: false,
            };

            descriptionQueue.push(newSceneDescription);
            if (!newSceneDescription.isIntroDescription || get().skipIntro || get().description) {
                return;
            }

            set({
                ready: descriptionQueue.some((description) => description.type === 'sceneTransition'),
                description: newSceneDescription
            });
        }
    },
    sendAlertMessage: (message: string) => {
        set({
            alertMessage: message
        });

        setTimeout(() => {
            set({
                alertMessage: undefined
            });
        }, 2000);
    },
}));
