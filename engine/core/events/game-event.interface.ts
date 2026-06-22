import { QuadNodes2DPoint } from "../../../storyteller/types";
import { GameEventType } from "./game-event.types";

export interface GameEvent {
    id: string;
    point: QuadNodes2DPoint;
    type: GameEventType;
    timestamp: number;
}