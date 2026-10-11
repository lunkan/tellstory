// 0 -  320km   -
// 1 -  160km   -
// 2 -  80km    -
// 3 -  40km    -
// 4 -  20km    -
// 5* - 10km    # Horizon
// 6 -  5km     # Region
// 7 -  2.5km   # District
// 8 -  1.25km  # Neighborhood
// 9 -  675m    # Local area
// 10 - 336m    # Nearby area
// 11 - 177m    # Immediate surroundings
// 12 - 89m     -
// 13 - 45m     ???
// 14 - 22.5m     ???
// 15 - 11m     ???
// 16 - 5.5m     ???
// 17 - 2m     ???
// 18 - 1m     ???


// ------------ Zones
// ...
// 4   - 1600m
// 3   - 800m
// ------------ Macro-Environment
// 2   - 400m
// 1   - 200m
// 0   - 100m
// ------------ Local Perimeter
// -1  - 50m
// -2  - 25m
// -3  - 12.5m
// ------------ Micro-Environment
// -4  - 6m
// -5  - 3m
// -6  - 1.5m

// 2^Sizem 


// 0 - 7 (1m - 5.5m) = Detail level (Generate items) * (Micro-Environment)
// 0 - 7 (1m - 89m) = Detail level (Generate objects) * (Local Perimeter)
// 8 - 10 (89m - 336m) = Visible level (Generate buildings) * (Macro-Environment)
// 11 < (336m < ) = Visible level (Generate markers and tiles) * (Zone)

import { QuadNodeKey } from "./quad-node-key";
import { QuadNodeBounds } from "./quad-node-bounds";
import { Tile } from "./tile";
import { QuadNodeData, QuadNodeDelta, QuadNodeNormVector, QuadNodePoint, QuadNodesRect, TileBounds, TileData, TileDataEntry } from "../types";
import { hydrate } from "./hydrator/hydrate";
import { TileMapObject } from "../schemas/tile-map-json-schema";
import { getTileSizeMeter, LEAF_SIZE_METER } from "./scale";

export type QuadNodeFilterCallback = (node: QuadNode) => boolean;

export type QuadNodeEventData = {
    type: string;
    details?: unknown;
}

export type QuadNodeEventCallback = (data: QuadNodeEventData) => void;

export class QuadNode {
    public static EVENT_DATA_CHANGE: string = 'dataChange';

    public static createRoot(maxDepth: number): QuadNode {
        return new QuadNode(maxDepth);
    }

    public readonly key: QuadNodeKey;
    public readonly bounds: QuadNodeBounds;
    public readonly parent: QuadNode | undefined;
    /** Deepest level this world subdivides to. Seeded at the root, inherited by every child. */
    public readonly maxDepth: number;

    //public tile: Tile | undefined;

    public get depth() {
        return this.key.depth;
    }

    /** Levels above the leaf: 0 at the leaf, `maxDepth` at the root. Comparable across worlds. */
    public get scale() {
        return this.maxDepth - this.depth;
    }

    private _tile: Tile | undefined;
    private _quadrants: QuadNode[] = [];
    private _detached: boolean = false;
    private _registeredEventCallbacks: QuadNodeEventCallback[] = [];

    private constructor(maxDepth: number, parent?: QuadNode, index?: any) {
        this.maxDepth = maxDepth;

        if (!parent) {
            this.key = new QuadNodeKey(0n, 0);
            this.bounds = QuadNodeBounds.createRoot(maxDepth);
        } else {
            this.parent = parent;
            this.key = parent.key.createChildKey(index);
            this.bounds = QuadNodeBounds.createChild(parent.bounds, index);
        }
    }

    public subscribe(callback: QuadNodeEventCallback): () => void {
        this._registeredEventCallbacks.push(callback);
        return () => {
            this._registeredEventCallbacks = this._registeredEventCallbacks.filter((subscriber) => subscriber !== callback);
        };
    }

    public dispatch(eventData: QuadNodeEventData): void {
        this._registeredEventCallbacks.forEach((subscriber: QuadNodeEventCallback) => subscriber(eventData));
        this.parent?.dispatch(eventData);
    }

    // Dehydrate - if updated
    /*public cleanChildren(): void {
        this._quadrants.forEach((quadNode) => {
            if (!quadNode.isGenerated()) {
                quadNode.tile = undefined;
                quadNode.cleanChildren();
            }
        });
    }*/

    public detach(): void {
        if (this._detached) {
            return;
        }

        if (!this._tile) {
            hydrate(this); // Want the tile
        }

        this._detached = true;
        if (this.parent && !this.parent.isDetached()) {
            this.parent.detach();
        }
    }

    public isDetached(): boolean {
        return this._detached;
    }

    public isLocked(): boolean {
        return this._quadrants.some((quadNode) => quadNode.isDetached());
    }

    public isEditableLeaf(): boolean {
        return this._detached && !this.isLocked();
    }

    public isGenerated(): boolean {
        return !!this._tile && !this._detached;
    }

    public isDescendant(quadNode: QuadNode | undefined): boolean {
        if (!quadNode) {
            return false;
        }

        return this.key.isDescendant(quadNode.key);
    }

    public isRelative(quadNode: QuadNode | undefined): boolean {
        if (!quadNode) {
            return false;
        }

        return this.isDescendant(quadNode) || quadNode.isDescendant(this);
    }

    public hasTile(): boolean {
        return !!this._tile;
    }

    public getPoint(): QuadNodePoint {
        return {
            x: this.bounds.x,
            y: this.bounds.y,
            z: this.depth,
        };
    }

    public getCenterPoint(): QuadNodePoint {
        return {
            x: this.bounds.x + this.bounds.size / 2,
            y: this.bounds.y + this.bounds.size / 2,
            z: this.depth,
        }
    }

    public getAncestors(): QuadNode[] {
        if (this.parent) {
            return [this.parent, ...this.parent.getAncestors()];
        }

        return [];
    }

    public getAllQuadrants(createIfMissing?: boolean): QuadNode[] {
        return this.getQuadrants(createIfMissing).flatMap((node) => [node, ...node.getAllQuadrants(createIfMissing)]);
    }

    public getQuadrants(createIfMissing?: boolean): QuadNode[] {
        if (this._quadrants.length || !createIfMissing) {
            return this._quadrants;
        } else if (this.scale === 0) {
            return this._quadrants; // Leaf level - this world subdivides no further
        }

        for (let i = 0; i < 4; i++) {
            // const quadrantKey = this.key.createChildKey(i as any);
            const quadrant = new QuadNode(this.maxDepth, this, i); //new QuadNode(quadrantKey, this);
            this._quadrants.push(quadrant);
        }

        return this._quadrants;
    }

    public getQuadrantAt(x: 1 | 0, y: 1 | 0, createIfMissing?: boolean): QuadNode | undefined {
        const quadrants = this.getQuadrants(createIfMissing);
        if (x === 0 && y === 0) {
            return quadrants[0];
        } else if (x === 0 && y === 1) {
            return quadrants[1]; // fel (C - B)
        } else if (x === 1 && y === 0) {
            return quadrants[2]; // fel (C - B)
        } else if (x === 1 && y === 1) {
            return quadrants[3];
        }

        return;
    }

    public findByKey(key: QuadNodeKey, createIfMissing: boolean = false): QuadNode | undefined {
        if (this.key.isMatch(key)) {
            return this;
        } else if (!this.key.isDescendant(key)) {
            return;
        }

        for (const child of this.getQuadrants(createIfMissing)) {
            const node = child.findByKey(key, createIfMissing);
            if (node) {
                return node;
            }
        }
    }

    public findByPoint(point: QuadNodePoint, createIfMissing: boolean = false, filterCallback?: QuadNodeFilterCallback): QuadNode | undefined {
        if (this.depth > point.z || !this.bounds.contains2DPoint(point)) {
            return;
        } else if (this.depth === point.z) {
            return this;
        } else if (filterCallback && !filterCallback(this)) {
            return;
        }

        for (const quadrant of this.getQuadrants(createIfMissing)) {
            const node = quadrant.findByPoint(point, createIfMissing, filterCallback);
            if (node) {
                return node;
            }
        }
    }

    public findByRect(rect: QuadNodesRect, createIfMissing: boolean = false): QuadNode[] {
        if (this.depth > rect.z || !this.bounds.intersects2DRect(rect)) {
            return [];
        } else if (this.depth === rect.z) {
            return [this];
        }

        const nodes: QuadNode[] = [];
        for (const quadrant of this.getQuadrants(createIfMissing)) {
            nodes.push(...quadrant.findByRect(rect, createIfMissing));
        }

        return nodes;
    }

    // Is this good?
    public findMapObjectsByRect(rect: QuadNodesRect): TileMapObject[] {
        // 1) In bounds ?
        // 2) In depth ? 
        // 3) Has map nodes ?
        // 4) Map objects in bounds - then add

        if (rect.z < 4 || !this.bounds.intersects2DRect(rect)) {
            return []; // No reported after 
        }

        const objects: TileMapObject[] = this._tile?.mapData ? this._tile.mapData.objects : [];
        for (const quadrant of this.getQuadrants()) {
            objects.push(...quadrant.findMapObjectsByRect(rect));
        }

        return objects;
    }

    public getNormalizedRelativePosition(node: QuadNode): QuadNodeNormVector | undefined {
        if (!node) {
            return;
        }

        const z = this._compare(node.getPoint().z, this.getPoint().z);
        /*if (z < 0) {
            return { x: 0, y: 0, z };
        }*/

        const relCenter = node.getCenterPoint();
        const currCenter = this.getCenterPoint();

        return {
            x: this._compare(relCenter.x, currCenter.x),
            y: this._compare(relCenter.y, currCenter.y),
            z,
        };
    }

    public getNormalizedDistance(node: QuadNode): number {
        if (node.depth !== this.depth) {
            return -1;
        }

        const relCenter = node.getCenterPoint();
        const currCenter = this.getCenterPoint();
        const distance = Math.hypot(relCenter.x - currCenter.x, relCenter.y - currCenter.y);
        const normDistance = Math.floor(distance / this.bounds.size);
        return normDistance;
    }

    public isAdjacent(node: QuadNode): boolean {
        const normDistance = this.getNormalizedDistance(node);
        return normDistance === 1;
    }

    public setTileData(tileData: Partial<TileData> | undefined): boolean {
        if (!tileData) {
            this._tile = undefined;
        } else if (!this._tile) {
            this._tile = new Tile(this.getTileBounds(), tileData);
        } else {
            this._tile = this._tile.set(tileData);
        }

        this.dispatch({ type: QuadNode.EVENT_DATA_CHANGE });
        return true;
    }

    public updateTileData(tileData: Partial<TileData>): boolean {
        if (!this._tile) {
            return false;
        }

        this._tile = this._tile.update(tileData);
        this.dispatch({ type: QuadNode.EVENT_DATA_CHANGE });
        return true;
    }

    public getTile(): Tile | undefined {
        return this._tile;
    }

    public getDetachedTiles(): TileDataEntry[] {
        if (!this.isDetached()) {
            return [];
        }

        const quadrantTiles = this._quadrants.flatMap((node: QuadNode) => node.getDetachedTiles());
        if (!this._tile) {
            return quadrantTiles;
        }

        const tileData: TileDataEntry = {
            nodeId: this.key.id,
            ...this._tile,
            //terrain: this._tile.terrain,
            //vectors: this._tile.vectors,
            //markers: this._tile.markers
        };

        return [tileData, ...quadrantTiles];
    }

    public getTileBounds(): TileBounds {
        // bounds are in grid units (1 unit = 1 leaf), not tile indices
        const size = getTileSizeMeter(this.scale);
        return {
            x: this.bounds.x * LEAF_SIZE_METER,
            y: this.bounds.y * LEAF_SIZE_METER,
            width: size,
            height: size,
        };
    }

    public toString(): string {
        return JSON.stringify({
            key: this.key.toString(),
            depth: this.depth,
            bounds: this.bounds.toString(),
            tile: this._tile?.toString(),
        }, null, 4);
    }

    public getJSON(): QuadNodeData {
        return {
            key: this.key.id,
            depth: this.depth,
            point: this.getPoint(),
            bounds: this.bounds.getJSON(),
            tile: this._tile?.getJSON(),
        }
    }

    private _compare(a: number, b: number): QuadNodeDelta {
        if (a > b) return 1;
        if (a < b) return -1;
        return 0;
    }
}