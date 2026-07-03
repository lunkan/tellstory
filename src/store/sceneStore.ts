import { create } from "zustand";
import {
    isDescriptionMessage,
    Message,
    LocationMessageDescriptionType,
    isPlayerLocationChangeMessage,
    PlayerLocationDirection,
    isPrimaryDescriptionMessage,
    isDirectionDescriptionMessage,
    isSecondaryDescriptionMessage
} from "../../shared/src/message";

import { DIRECTION, DIRECTION_NAME } from "../../shared/src/direction";
import { gameRepository } from "../repositories/gameRepository";
import { QuadNodePoint } from "../../engine/types";
import { getDepthName } from "../../shared/src/phraseology";

export interface SceneMessage {
    id: string,
    type: string,
    label: string,
    text: string,
    consumed?: boolean,
}

export type DirectionDescription = {
    id: string,
    label: string,
    text: string,
    direction: DIRECTION,
}

export type SceneDescription = {
    id: string,
    type: LocationMessageDescriptionType,
    label: string,
    text: string,
    consumed?: boolean,
}

export type AlertMessage = {
    id: string,
    label: string,
    text: string,
    consumed?: boolean,
}

type Attention = {
    type: 'direction' | 'zoom';
    value: number | DIRECTION | undefined;
}

interface SceneStore {
    title: string; // - if no other title
    eventId: string | undefined;
    currentPosition: QuadNodePoint | undefined; // Can be fetched on post
    directions: PlayerLocationDirection[]; // from event
    messages: SceneMessage[],
    attention: Attention | null;
    setAttention: (attention: Attention | null) => void;
    movePlayer: (direction: DIRECTION) => void;
    zoomPlayer: (zoomDelta: number) => void;
    handleMessage: (message: Message) => void;
    consumeDescription: (id: string) => void;
    sendAlertMessage: (message: AlertMessage) => void;
}

let idIncrementor = 0;

const cleanState = {
    title: 'Unknown',
    eventId: undefined,
    currentPosition: undefined,
    directions: [],
    messages: [],
    attention: null,
}

export const useSceneStore = create<SceneStore>((set, get) => ({
    ...cleanState,
    setAttention: (attention) => {
        set({ attention });
    },
    movePlayer: async (direction: DIRECTION) => {
        set({
            ...cleanState,
            title: `Moving ${DIRECTION_NAME[direction]}`,
        });

        await gameRepository.move(direction);
    },
    zoomPlayer: async (zoom: number) => {
        set({
            ...cleanState,
            title: `Scanning the ${getDepthName(zoom)}`,
        });

        await gameRepository.zoom(zoom);
    },
    handleMessage: (message: Message) => {
        if (isPlayerLocationChangeMessage(message)) {
            set({
                eventId: message.eventId,
                currentPosition: message.point,
                directions: message.directions,
            });

            return;
        }

        if (isDescriptionMessage(message)) {
            if (message.eventId !== get().eventId) {
                return; // Not relevant any longer, hero probably moved on...
            }

            const label = isDirectionDescriptionMessage(message)
                ? DIRECTION_NAME[message.direction]
                : message.type;

            set({
                messages: [
                    ...get().messages,
                    {
                        ...message,
                        id: `${message.eventId}${++idIncrementor}`,
                        label,
                    }
                ],
            });
        }
    },
    consumeDescription: (id: string) => {
        set({
            messages: get().messages.map((description) => {
                if (description.id !== id) {
                    return description;
                }

                return {
                    ...description,
                    consumed: true,
                };
            }),
        });
    },
    sendAlertMessage: (message: AlertMessage) => {
        set({
            messages: [
                ...get().messages,
                {
                    ...message,
                    type: 'alert',
                    id: `alert${++idIncrementor}`,
                }
            ],
        });
    },
}));

export function selectSceneReady(state: SceneStore): boolean {
    return state.messages.some((message) => isPrimaryDescriptionMessage(message));
}

export function selectAlertMessage(state: SceneStore): AlertMessage | undefined {
    return state.messages.find((message) => message.type === 'alert' && !message.consumed);
}

export function selectPrimaryDescription(state: SceneStore): SceneDescription | undefined {
    return state.messages.find((message) => isPrimaryDescriptionMessage(message) && !message.consumed) as SceneDescription | undefined;
}

export function selectSecondaryDescription(state: SceneStore): SceneDescription | undefined {
    return state.messages.find((message) => isSecondaryDescriptionMessage(message) && !message.consumed) as SceneDescription | undefined;
}

export function selectDirectionDescription(state: SceneStore): DirectionDescription | undefined {
    if (!state.attention || state.attention.type !== 'direction') {
        return;
    }

    return state.messages.find((message) => isDirectionDescriptionMessage(message) && message.direction === state.attention!.value) as DirectionDescription | undefined;
}
