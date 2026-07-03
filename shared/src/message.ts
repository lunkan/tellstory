import { QuadNodePoint } from "../../engine/types";
import { DIRECTION } from "./direction";

export interface Message {
    type: string;
};

export type LocationMessageDescriptionType =
    'intro' |
    'scene' |
    'sceneTransition' |
    'immediacy' |
    'proximity' |
    'adjacentDirection' |
    'quadrantDirection';

export type PlayerLocationDirection = {
    direction: DIRECTION;
    movementCost: number;
    impassible: boolean;
}

export interface PlayerLocationChangeMessage {
    eventId: string;
    type: 'playerLocationChange';
    point: QuadNodePoint;
    timestamp: number;
    playerId: string;
    directions: PlayerLocationDirection[];
}

export interface DescriptionMessage {
    eventId: string;
    type: LocationMessageDescriptionType;
    text: string;
    attention: number;
}

export interface DirectionDescriptionMessage extends DescriptionMessage {
    direction: DIRECTION;
}

export function isPlayerLocationChangeMessage(message: Message): message is PlayerLocationChangeMessage {
    return message.type === 'playerLocationChange';
}

export function isDescriptionMessage(message: Message): message is DescriptionMessage {
    return message.type === 'intro'
        || message.type === 'scene'
        || message.type === 'sceneTransition'
        || message.type === 'immediacy'
        || message.type === 'proximity'
        || message.type === 'adjacentDirection'
        || message.type === 'quadrantDirection';
}

export function isSceneDescriptionMessage(message: Message): message is DescriptionMessage {
    return message.type === 'intro'
        || message.type === 'scene'
        || message.type === 'sceneTransition'
        || message.type === 'immediacy'
}

export function isPrimaryDescriptionMessage(message: Message): message is DescriptionMessage {
    return message.type === 'intro' || message.type === 'scene' || message.type === 'sceneTransition';
}

export function isSecondaryDescriptionMessage(message: Message): message is DescriptionMessage {
    return message.type === 'immediacy';
}

export function isDirectionDescriptionMessage(message: Message): message is DirectionDescriptionMessage {
    return message.type === 'adjacentDirection' || message.type === 'quadrantDirection' || message.type === 'proximity'
}