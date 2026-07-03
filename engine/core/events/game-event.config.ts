import { GameLocationChangeEvent } from "./game-location-change-event";

export function isLocationChangeEvent(event: { type: string }): event is GameLocationChangeEvent {
    return event.type === 'characterEnter' || event.type === 'characterSpawn' || event.type === 'characterDepthChange';
}