import { DIRECTION } from "./direction";

export interface Message {
    type: string;
};

export type LocationMessageDescriptionType =
    'intro' |
    'sceneTransition' |
    'adjacentSummary' |
    'quadrantSummary' |
    'adjacentDirection' |
    'quadrantDirection';

export interface DescriptionMessage {
    eventId: string;
    type: LocationMessageDescriptionType;
    text: string;
    attention: number;
    direction?: DIRECTION;
}

export function isDescriptionMessage(message: Message): message is DescriptionMessage {
    return message.type === 'intro'
        || message.type === 'sceneTransition'
        || message.type === 'adjacentSummary'
        || message.type === 'quadrantSummary'
        || message.type === 'adjacentDirection'
        || message.type === 'quadrantDirection';
}