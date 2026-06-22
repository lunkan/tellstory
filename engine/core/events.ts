import { QuadNodes2DPoint } from "../../storyteller/types";

export type GameEventType = 'characterEnter' | 'characterSpawn';

export type GameEvent = {
    point: QuadNodes2DPoint
    type: GameEventType,
    timestamp: number,
}

export type GameLocationChangeEvent = GameEvent & {
    playerId: string;
}

export function isLocationChangeEvent(event: GameEvent): event is GameLocationChangeEvent {
    return event.type === 'characterEnter' || event.type === 'characterSpawn';
}