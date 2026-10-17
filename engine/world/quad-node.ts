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
//import { hydrate } from "./hydrator/hydrate";
import { TileMapObject } from "../schemas/tile-map-json-schema";
import { getTileSizeMeter, LEAF_SIZE_METER } from "./scale";

export type QuadNodeFilterCallback = (node: QuadNode) => boolean;

export type QuadNodeEventSubscriber = {
    type: string,
    callback: QuadNodeEventCallback,
}

export type QuadNodeEventData = {
    type: string;
    target: QuadNode;
    details?: unknown;
}

export type QuadNodeEventCallback = (data: QuadNodeEventData) => void;

export type FindAllByRectOptions = {
    selectAllDepth?: boolean;
    createIfMissing?: boolean;
};

/*
 * locked — Non-editable. Has at least one detached child.
 * Values are calculated from a combination of the node's own tiles and its children's tiles.
 * The node's own tiles are stored in the database; calculated tiles are not stored.
 *
 * detached — Editable. Values are defined by the tiles stored directly on the node.
 * The node's tiles are always stored in the database.
 *
 * hydrated — Editable. Has a detached parent. Values are generated based on its parents.
 * If edited, the node becomes detached, and all its parents become locked.
 * The node's tiles are not stored in the database.
 * 
 * empty — Editable. Has no detached parent. Values are generated without relying on a detached parent.
 * If edited, the node becomes detached, and all its parents become locked.
 * The node's tiles are not stored in the database.
*/

export class QuadNode {
    public static EVENT_DATA_CHANGE: string = 'dataChange';
    public static EVENT_NODE_DETACHED: string = 'nodeDetached';

    public static STATE_EMPTY: number = 0;
    public static STATE_LOCKED: number = 1;
    public static STATE_DETACHED: number = 2;
    public static STATE_HYDRATED: number = 4;

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

    public get state() {
        const locked = this._locked ? QuadNode.STATE_LOCKED : 0;
        const detached = this._detached ? QuadNode.STATE_DETACHED : 0;
        const hydrated = !!this._tile ? QuadNode.STATE_HYDRATED : 0;
        return locked | detached | hydrated;
    }

    private _tile: Tile | undefined;
    private _quadrants: QuadNode[] = [];
    private _detached: boolean = false;
    private _locked: boolean = false;
    private _registeredSubscribers: QuadNodeEventSubscriber[] = [];

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

        this.subscribe(QuadNode.EVENT_NODE_DETACHED, this._onDetached.bind(this));
    }

    public subscribe(type: string, callback: QuadNodeEventCallback): void {
        this._registeredSubscribers.push({ type, callback });
    }

    /*    this._registeredSubscribers.push(callback);
        return () => {
            this._registeredSubscribers = this._registeredSubscribers.filter((subscriber) => subscriber !== callback);
        };
    }*/

    public dispatch(eventData: QuadNodeEventData): void {
        this._registeredSubscribers
            .filter((subscriber) => subscriber.type === eventData.type)
            .forEach((subscriber) => subscriber.callback(eventData));

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

    // Detach - User controlled. Should be saved to DB
    // Tiles above depth are locked,
    // Tiles below can be updated
    public detach(): void {
        // Should not be possible detach if parent has tiles.

        // case 0 - parent has no tile
        // -- then lock and calculate from children
        // case 1 - parent has tile
        // -- then lock keep current and merg with calculation from children
        // -- when calculating. sum values up by share, def on higher level takes remaning 

        if (this._detached) {
            return;
        }

        /*if (!this._tile) {
            hydrate(this); // Want the tile
        }*/

        this._detached = true;
        this.dispatch({ type: QuadNode.EVENT_NODE_DETACHED, target: this });

        /*if (this.parent && !this.parent.isDetached()) {
            this.parent.detach();
        }*/

        // This should not be needed - Must have been generated by now.
        console.log('detach', this.depth, ' * ', !!this._tile, this.hasTile());
        /*if (!this.hasTile()) {
            //node.tile = new Tile();
            this.setTileData({});
        }*/



    }

    public isDetached(): boolean {
        return this._detached;
    }

    public isLocked(): boolean {
        return this._locked;

        //return this._quadrants.some((quadNode) => quadNode.isDetached());
    }

    /** Detached and locked nodes hold user data - hydration must never write to them. */
    public canHydrate(): boolean {
        return !(this.state & (QuadNode.STATE_DETACHED | QuadNode.STATE_LOCKED));
    }

    /*public isEditableLeaf(): boolean {
        return this._detached && !this.isLocked();
    }

    public isGenerated(): boolean {
        return !!this._tile && !this._detached;
    }*/

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

    public hasTile(): this is { getTile(): Tile } {
        return this._tile !== undefined; //!!this._tile;
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

    public findByRect(rect: QuadNodesRect, options?: FindAllByRectOptions): QuadNode[] {
        if (this.depth > rect.z || !this.bounds.intersects2DRect(rect)) {
            return [];
        } else if (this.depth === rect.z) {
            return [this];
        }

        // selectAllDepth - include every intersecting ancestor on the way down, not just nodes at rect.z
        const nodes: QuadNode[] = options?.selectAllDepth ? [this] : [];
        for (const quadrant of this.getQuadrants(options?.createIfMissing)) {
            nodes.push(...quadrant.findByRect(rect, options));
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

        // Copy - pushing quadrant objects must not mutate the tile's own markers
        const objects: TileMapObject[] = this._tile?.isResolved ? [...this._tile.markers] as TileMapObject[] : []; //  this._tile.mapData.objects : [];
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

        this.dispatch({ type: QuadNode.EVENT_DATA_CHANGE, target: this });
        return true;
    }

    public updateTileData(tileData: Partial<TileData>): boolean {
        if (!this._tile) {
            return false;
        }

        this._tile = this._tile.update(tileData);
        this.dispatch({ type: QuadNode.EVENT_DATA_CHANGE, target: this });
        return true;
    }

    public getTile(): Tile | undefined {
        if (this._locked) {
            return this.getFlatTile();
        }

        // hola ho.
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

    private _onDetached(e: QuadNodeEventData): void {
        if (e.target === this) {
            return;
        }

        console.log('Being detached');

        this._detached = true;
        this._locked = true;

        //this._state = 'detached', 'locked', 'hydrated', 'empty';

        /*
            'locked' - Non editable, has detached child (calculate values - mix of own and children). Locked nodes own tiles are stored in DB, not calculated tiles.
            'detached' - Editable (Values is what is stored in tiles). Detached node tiles are always stored in DB
            'hydrated' - Has detached parent. Is editable (values are generated based on parents). If edited - it becomes detached and all parents locked. Tiles are not stored in DB
            'empty' - Doesn't have detached parent. Is editable. If edited - it becomes detached and all parents locked. Tiles are not stored in DB

            If last detached - detached
            If has detached children - locked
            If is not detached but has tiles - hydrated
            If not detached and no tiles - empty.

            When to save nodes
            - detached always
            - locked, only own tiles, not calculated
            - hydrated - never

        */

        // isEditableLeaf - detached



        /*public isEditableLeaf(): boolean {
            return this._detached && !this.isLocked();
        }

        public isGenerated(): boolean {
            return !!this._tile && !this._detached;
        }*/
    }

    public getFlatTile(mod: number = 1): Tile | undefined {
        if (!this._detached) {
            return;
        }

        const detachedQuadrants = this._quadrants.filter((quadrant) => quadrant.isDetached());
        const numDetachedQuadrants = detachedQuadrants.length;
        const quadModifier = numDetachedQuadrants / 4;

        const currentTile = this._tile ? this._tile.set({
            terrain: this._tile.terrain.map((terrain) => {
                return {
                    type: terrain.type,
                    value: terrain.value * (1 - quadModifier) * mod,
                };
            }),
        }) : new Tile(this.getTileBounds());

        return detachedQuadrants.reduce((acc, quadrant) => {
            const quadrantTile = quadrant.getFlatTile(mod * 0.25);
            return acc.update({
                terrain: quadrantTile?.terrain
            });
        }, currentTile);
    }
}