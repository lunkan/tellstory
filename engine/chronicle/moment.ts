import { Tile } from "../world/tile";
import type { ChronicleEvent, ChronicleEventType } from "./chronicle";

type MemoryFilter = {
    startTime?: number;
    endTime?: number;
    types?: ChronicleEventType[],
    location?: Tile,
}

export class Moment {
    private _timestamp: number;
    private _location: Tile;
    private _chronicle: ChronicleEvent[];

    constructor(timestamp: number, location: Tile, chronicle: ChronicleEvent[]) {
        this._timestamp = timestamp;
        this._location = location;
        this._chronicle = chronicle;
    }

    public getTime(): number {
        return this._timestamp;
    }

    public getLocation(): Tile {
        return this._location;
    }

    public getDepartureLocation(): Tile | undefined {
        if (!this._chronicle[1] || this._chronicle[1].location === this._location) {
            return;
        }

        return this._chronicle[1].location;
    }

    public getRelatedEvents(filter?: MemoryFilter): ChronicleEvent[] {
        const startTime = filter?.startTime || 0;
        const location = filter?.location || this._location;
        let endTime = filter?.endTime || this.getTime();
        endTime = endTime < 0 ? this.getTime() + endTime : endTime;

        return this._chronicle.filter((event) => {
            if (startTime > event.timestamp || endTime < event.timestamp) {
                return false;
            } else if (event.location !== location) {
                return false;
            } else if (filter?.types && !filter.types.includes(event.type)) {
                return false;
            }

            return true;
        });
    }
}