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

import { QuadNodeKey } from "./quad-node-key";
import { QuadNodeBounds } from "./quad-node-bounds";
import { Tile } from "./tile";
import { QuadNodeData, QuadNodeDelta, QuadNodeNormVector, QuadNodePoint, QuadNodesRect, TileDataEntry } from "../types";

export class QuadNode {
    public readonly key: QuadNodeKey;
    public readonly bounds: QuadNodeBounds;
    public readonly parent: QuadNode | undefined;

    public tile: Tile | undefined;

    public get depth() {
        return this.key.depth;
    }

    private _quadrants: QuadNode[] = [];
    private _detached: boolean = false;

    constructor(parent?: QuadNode, index?: any) {
        if (!parent) {
            this.key = new QuadNodeKey(0n, 0);
        } else {
            this.parent = parent;
            this.key = parent.key.createChildKey(index);
        }

        this.bounds = QuadNodeBounds.fromKey(this.key);
    }

    public detach(): void {
        if (this._detached) {
            return;
        }

        this._detached = true;
        if (this.parent) {
            this.parent.detach();
        }
    }

    public isDetached(): boolean {
        return this._detached;
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

    public getQuadrants(createIfMissing?: boolean): QuadNode[] {
        if (this._quadrants.length || !createIfMissing) {
            return this._quadrants;
        } else if (this.depth + 1 >= QuadNodeKey.MAX_DEPTH) {
            return this._quadrants; // Creat no more levels after depth of MAX_DEPTH
        }

        for (let i = 0; i < 4; i++) {
            // const quadrantKey = this.key.createChildKey(i as any);
            const quadrant = new QuadNode(this, i); //new QuadNode(quadrantKey, this);
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

    public findByPoint(point: QuadNodePoint, createIfMissing: boolean = false): QuadNode | undefined {
        if (this.depth > point.z || !this.bounds.contains2DPoint(point)) {
            return;
        } else if (this.depth === point.z) {
            return this;
        }

        for (const quadrant of this.getQuadrants(createIfMissing)) {
            const node = quadrant.findByPoint(point, createIfMissing);
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

    public getDetachedTiles(): TileDataEntry[] {
        if (!this.isDetached()) {
            return [];
        }

        const quadrantTiles = this._quadrants.flatMap((node: QuadNode) => node.getDetachedTiles());
        if (!this.tile) {
            return quadrantTiles;
        }

        const tileData: TileDataEntry = {
            nodeId: this.key.id,
            terrain: this.tile.terrain,
            vectors: this.tile.vectors,
        };

        return [tileData, ...quadrantTiles];
    }

    public toString(): string {
        return JSON.stringify({
            key: this.key.toString(),
            depth: this.depth,
            bounds: this.bounds.toString(),
            tile: this.tile?.toString(),
        }, null, 4);
    }

    public getJSON(): QuadNodeData {
        return {
            key: this.key.id,
            depth: this.depth,
            point: this.getPoint(),
            bounds: this.bounds.getJSON(),
            tile: this.tile?.getJSON(),
        }
    }

    private _compare(a: number, b: number): QuadNodeDelta {
        if (a > b) return 1;
        if (a < b) return -1;
        return 0;
    }
}