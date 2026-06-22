import { QuadNodes2DPoint } from "../../../storyteller/types";
import { GameEvent } from "./game-event.interface";
import { GameEventType } from "./game-event.types";

export type GameLocationChangeEventConfig = {
    point: QuadNodes2DPoint,
    type: GameEventType,
    timestamp: number,
    playerId: string;
}

var incrementor = 0;

export class GameLocationChangeEvent implements GameEvent {
    public readonly id: string;
    public readonly point: QuadNodes2DPoint;
    public readonly type: GameEventType;
    public readonly timestamp: number;
    public readonly playerId: string;

    constructor(config: GameLocationChangeEventConfig) {
        const { type, point, playerId, timestamp } = config;
        this.id = `locChangeEv@${++incrementor}`;
        this.point = point;
        this.type = type;
        this.playerId = playerId;
        this.timestamp = timestamp;
    }

    public serialize(): string {
        return JSON.stringify({
            id: this.id,
            point: this.point,
            type: this.type,
            timestamp: this.timestamp,
            playerId: this.playerId
        });
    }
}