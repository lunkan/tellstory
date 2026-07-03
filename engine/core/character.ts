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
    private _immediatLocation: QuadNode | undefined;
    private _currentLocation: QuadNode | undefined;
    private _previousLocation: QuadNode | undefined;

    constructor(name: string, world: World) {
        this.id = name;
        this.name = name;
        this.world = world;
    }

    public setLocation(nextLocation: QuadNode): void {
        if (!this._currentLocation || !nextLocation.isRelative(this._currentLocation)) {
            this._immediatLocation = this._findImmediatLocation(nextLocation);
        }

        this._previousLocation = this._currentLocation || nextLocation;
        this._currentLocation = nextLocation;
    }

    public getImmediatLocation(): QuadNode {
        return this._immediatLocation!;
    }

    public getCurrentLocation(): QuadNode {
        return this._currentLocation!;
    }

    public getPreviousLocation(): QuadNode {
        return this._previousLocation!;
    }

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

    private _findImmediatLocation(node: QuadNode): QuadNode {
        let immediatLocation = node;
        while (immediatLocation.depth < World.MAX_ZOOM_DEPTH) {
            const quadrantNode = immediatLocation.getQuadrantAt(0, 0, true); // Pick best (close to road landmark ...)
            if (!quadrantNode) {
                break;
            }

            immediatLocation = quadrantNode;
        }

        return immediatLocation;
    }
}
