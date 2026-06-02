import { Tile } from '../world/tile';
import { Moment } from './moment';

export enum ChronicleEventType {
    Enter = 'enter',
}

export type ChronicleEvent = {
    timestamp: number,
    type: ChronicleEventType,
    location: Tile,
    fromLocation?: Tile,
}

export class Chronicle {
    private _chronicle: ChronicleEvent[] = [];

    public logEvent(event: ChronicleEvent): void {
        this._chronicle.unshift(event);
    }

    public getPresentTime(): number {
        return this._chronicle[0].timestamp;
    }

    public getPresentLocation(): Tile {
        return this._chronicle[0].location;
    }

    public getPresentMoment(): Moment {
        return new Moment(this.getPresentTime(), this.getPresentLocation(), this._chronicle);
    }
}