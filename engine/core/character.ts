import { ChronicleEventType } from "../chronicle/chronicle";
import { QuadNodeDelta } from "../types";
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
    public readonly name: string;
    public readonly world: World;

    private _chronicle: ChronicleEvent[] = [];
    private _currentLocation: QuadNode | undefined;
    private _previousLocation: QuadNode | undefined;

    constructor(name: string, world: World) {
        this.id = name;
        this.name = name;
        this.world = world;
    }

    public setLocation(nextLocation: QuadNode): void {
        this._previousLocation = this._currentLocation || nextLocation;
        this._currentLocation = nextLocation;
    }

    public getCurrentLocation(): QuadNode {
        return this._currentLocation!;
    }

    public getPreviousLocation(): QuadNode {
        return this._previousLocation!;
    }

    /*public getNearbyLandmarks(): Marker[] {
        if (!this._currentLocation) {
            return [];
        }

        const { x, y, size } = this._currentLocation.bounds;
        return this.world.markers.getMarkers(x, y, this._currentLocation.depth, size);
    }*/

    public getAdjacentNodes(): QuadNode[] {
        return this.world.findAdjacentNodes(this.getCurrentLocation().key);
    }

    public getQuadrantNodes(): QuadNode[] {
        if (this._currentLocation && this._currentLocation.getPoint().z < World.MAX_ZOOM_DEPTH) {
            return this.world.findQuadrantNodes(this.getCurrentLocation().key);
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
        return this.world.findNeighbourNode(this.getCurrentLocation().key, deltaX, deltaY);
    }

    public getQuadrantByDelta(x: 1 | 0, y: 1 | 0): QuadNode | undefined {
        return this.world.findQuadrantNode(this.getCurrentLocation().key, x, y);
    }

    public getAdjacent3DLocations(): QuadNode[] {
        const locations: QuadNode[] = [this.getCurrentLocation()];
        //const parent = this._world.findParentNode(this.getCurrentLocation().key);

        /*if (parent) {
            locations.push(parent);
        }*/

        locations.push(...this.world.findQuadrantNodes(this.getCurrentLocation().key));
        locations.push(...this.world.findAdjacentNodes(this.getCurrentLocation().key));
        return locations;
    }

    public getJourney(lookback: number): ChronicleEvent[] {
        return this.findMemories({ types: [ChronicleEventType.Enter] }).slice(0, lookback);
    }

    public moveToParent(): boolean {
        const parentLocation = this.world.findParentNode(this.getCurrentLocation().key);
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
}
