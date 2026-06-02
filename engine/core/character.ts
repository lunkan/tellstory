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
    private _currentLocation: QuadNode;
    private _previousLocation: QuadNode;

    constructor(name: string, world: World, point: QuadNodePoint) {
        this.id = name;
        this.name = name;
        this._world = world;
        this._currentLocation = world.findNodeByPoint(point)!;
        this._previousLocation = this._currentLocation;
    }

    public getCurrentLocation(): QuadNode {
        return this._currentLocation;
    }

    public getPreviousLocation(): QuadNode {
        return this._previousLocation;
    }

    public getAdjacent3DLocations(): QuadNode[] {
        const locations: QuadNode[] = [this._currentLocation];
        const parent = this._world.findParentNode(this._currentLocation.key);

        if (parent) {
            locations.push(parent);
        }

        locations.push(...this._world.findQuadrantNodes(this._currentLocation.key));
        locations.push(...this._world.findAdjacentNodes(this._currentLocation.key));
        return locations;
    }

    public getJourney(lookback: number): ChronicleEvent[] {
        return this.findMemories({ types: [ChronicleEventType.Enter] }).slice(0, lookback);
    }

    public moveToAdjacent(deltaX: QuadNodeDelta, deltaY: QuadNodeDelta): boolean {
        const nextLocation = this._world.findNeighbourNode(this._currentLocation.key, deltaX, deltaY);
        if (!nextLocation) {
            return false;
        }

        this._previousLocation = this._currentLocation;
        this._currentLocation = nextLocation;
        return true;
    }

    public moveToQuadrant(x: 1 | 0, y: 1 | 0): boolean {
        const nextLocation = this._world.findQuadrantNode(this._currentLocation.key, x, y);
        if (!nextLocation) {
            return false;
        }

        this._previousLocation = this._currentLocation;
        this._currentLocation = nextLocation;
        return true;
    }

    public moveToParent(): boolean {
        const parentLocation = this._world.findParentNode(this._currentLocation.key);
        if (!parentLocation) {
            return false;
        }

        this._previousLocation = this._currentLocation;
        this._currentLocation = parentLocation;
        return true;
    }

    public addMemory(event: ChronicleEvent): void {
        this._chronicle.unshift({
            locationId: this._currentLocation.key.id,
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
