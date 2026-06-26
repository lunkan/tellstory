import { Metric, QuadNodeDelta, QuadNodePoint } from "../../storyteller/types";
import { ChronicleEventType } from "../chronicle/chronicle";
import { QuadNode } from "../world/quad-node";
import { World } from "../world/world";

export type ChronicleEvent = {
    timestamp: number,
    type: ChronicleEventType,
    locationId?: string,
}

type MemoryFilter = {
    startTime?: number;
    endTime?: number;
    types?: ChronicleEventType[],
    locationId?: string,
}

export class Character {
    public readonly id: string;

    public name: string;

    private _chronicle: ChronicleEvent[] = [];
    private _world: World;
    private _currentLocation: QuadNode | undefined;
    private _previousLocation: QuadNode | undefined;

    constructor(name: string, world: World) {
        this.id = name;
        this.name = name;
        this._world = world;
    }

    public setLocation(nextLocation: QuadNode): void {
        this._previousLocation = this._currentLocation || nextLocation;
        this._currentLocation = nextLocation;
        console.log('CHARACTER: setLocation', nextLocation.getPoint());
    }

    public getCurrentLocation(): QuadNode {
        console.log('CHARACTER: getCurrentLocation', this._currentLocation?.getPoint());
        return this._currentLocation!;
    }

    public getPreviousLocation(): QuadNode {
        console.log('CHARACTER: getPreviousLocation', this._previousLocation?.getPoint());
        return this._previousLocation!;
    }

    public getAdjacentNodes(): QuadNode[] {
        return this._world.findAdjacentNodes(this.getCurrentLocation().key);
    }

    public getQuadrantNodes(): QuadNode[] {
        if (this._currentLocation && this._currentLocation.getPoint().z < World.MAX_ZOOM_DEPTH) {
            return this._world.findQuadrantNodes(this.getCurrentLocation().key);
        }

        return [];
    }

    public getParentNode(): QuadNode | undefined {
        if (this._currentLocation && this._currentLocation.getPoint().z > World.MIN_ZOOM_DEPTH) {
            return this.getCurrentLocation().parent;
        }

        return;
    }

    public getAdjacentByDelta(deltaX: QuadNodeDelta, deltaY: QuadNodeDelta): QuadNode | undefined {
        return this._world.findNeighbourNode(this.getCurrentLocation().key, deltaX, deltaY);
    }

    public getQuadrantByDelta(x: 1 | 0, y: 1 | 0): QuadNode | undefined {
        return this._world.findQuadrantNode(this.getCurrentLocation().key, x, y);
    }

    public getAdjacent3DLocations(): QuadNode[] {
        const locations: QuadNode[] = [this.getCurrentLocation()];
        //const parent = this._world.findParentNode(this.getCurrentLocation().key);

        /*if (parent) {
            locations.push(parent);
        }*/

        locations.push(...this._world.findQuadrantNodes(this.getCurrentLocation().key));
        locations.push(...this._world.findAdjacentNodes(this.getCurrentLocation().key));
        return locations;
    }

    public getJourney(lookback: number): ChronicleEvent[] {
        return this.findMemories({ types: [ChronicleEventType.Enter] }).slice(0, lookback);
    }

    public moveToParent(): boolean {
        const parentLocation = this._world.findParentNode(this.getCurrentLocation().key);
        if (!parentLocation) {
            return false;
        }

        this._previousLocation = this.getCurrentLocation();
        this._currentLocation = parentLocation;
        return true;
    }

    public addMemory(event: ChronicleEvent): void {
        this._chronicle.unshift({
            locationId: this.getCurrentLocation().key.id,
            ...event,
        });
    }

    public findMemories(filter: MemoryFilter = {}): ChronicleEvent[] {
        return this._chronicle.filter((event) => {
            if (filter.startTime && filter.startTime > event.timestamp) {
                return false;
            } else if (filter.endTime && filter.endTime < event.timestamp) {
                return false;
            } else if (filter.locationId && filter.locationId !== event.locationId) {
                return false;
            } else if (filter?.types && !filter.types.includes(event.type)) {
                return false;
            }

            return true;
        });
    }

    public getMetricsByLocation(locationId: string, currentTime: number): Metric {
        const memories = this.findMemories({
            types: [ChronicleEventType.Enter],
            locationId: locationId,
        });

        const frequency = memories.length; // sigmoid
        const recency = memories[0] ? currentTime - memories[0].timestamp : -1; // sigmoid

        return {
            frequency,
            recency,
        };
    }
}
