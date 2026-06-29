import { QuadNodeDelta, QuadNodePoint, WorldData } from "../../storyteller/types";
import { hydrate } from "./hydrator";
import { Marker, Markers } from "./markers";
import { QuadNode } from "./quad-node";
import { QuadNodeKey } from "./quad-node-key";
import { Tile } from "./tile";

export class World {
    public static readonly MAX_ZOOM_DEPTH: number = 7;
    public static readonly MIN_ZOOM_DEPTH: number = 5;

    public readonly quadtree: QuadNode;
    public readonly markers: Markers;

    constructor(worldData: WorldData) {
        this.quadtree = new QuadNode();
        this.markers = new Markers(this.quadtree.bounds.size);

        for (const tileEntry of worldData.tiles) {
            const tile = new Tile();
            tileEntry.terrain.forEach((terrainSetting) => tile.setTerrain(terrainSetting));
            tileEntry.vectors.forEach((vectorSetting) => tile.setVector(vectorSetting));

            const nodeKey = QuadNodeKey.fromId(tileEntry.nodeId);
            const node = this.quadtree.findByKey(nodeKey, true);

            if (node) {
                node.tile = tile;
            }
        }

        for (const markerEntry of worldData.markers) {
            this.markers.addMarker(markerEntry);
        }
    }

    public getStartingLocations(): Marker[] {
        return this.markers.getAll().filter((marker) => marker.type === 'player-start');
    }

    public getMarkersFromNode(node: QuadNode): Marker[] {
        const { x, y, size } = node.bounds;
        return this.markers.getMarkers(x, y, node.depth, size);
    }

    /*public findMarkerByType(type: string): Marker | undefined {
        return this._markers.getMarkers(0, 0, 0, this._quadtree.bounds.size).find((marker) => marker.type === type);
    }*/

    public findNodeBykey(key: QuadNodeKey): QuadNode | undefined {
        const node = this.quadtree.findByKey(key);
        return node ? hydrate(node) : undefined;
    }

    public findNodeByPoint(point: QuadNodePoint): QuadNode | undefined {
        const node = this.quadtree.findByPoint(point, true);
        return node ? hydrate(node) : undefined;
    }

    public findNeighbourNode(key: QuadNodeKey, deltaX: QuadNodeDelta, deltaY: QuadNodeDelta): QuadNode | undefined {
        const refNode = this.quadtree.findByKey(key);
        if (!refNode) {
            return;
        }

        const x = refNode.bounds.x + deltaX * refNode.bounds.size;
        const y = refNode.bounds.y + deltaY * refNode.bounds.size;

        const neighbourNode = this.quadtree.findByPoint({ x, y, z: refNode.depth }, true);
        return hydrate(neighbourNode);
    }

    public findAdjacentNodes(key: QuadNodeKey): QuadNode[] {
        const node = this.quadtree.findByKey(key);
        if (!node) {
            return [];
        }

        const size = node.bounds.size;
        const x = node.bounds.x - size;
        const y = node.bounds.y - size;

        return this.quadtree
            .findByRect({ x, y, z: node.depth, width: size * 3, height: size * 3 }, true)
            .filter((adjacentNode) => adjacentNode !== node)
            .map((adjacentNode) => hydrate(adjacentNode)!);
    }

    public findQuadrantNodes(key: QuadNodeKey): QuadNode[] {
        const node = this.quadtree.findByKey(key);
        if (!node) {
            return [];
        }

        const quadrantNodes = node.getQuadrants(true);
        return quadrantNodes.map((quadrantNode) => hydrate(quadrantNode)!);
    }

    public findQuadrantNode(key: QuadNodeKey, x: 1 | 0, y: 1 | 0): QuadNode | undefined {
        const node = this.quadtree.findByKey(key);
        if (!node) {
            return;
        }

        const quadrantNode = node.getQuadrantAt(x, y, true);
        return hydrate(quadrantNode);
    }

    public findParentNode(key: QuadNodeKey): QuadNode | undefined {
        const parentKey = key.createParentKey();
        const parentNode = this.quadtree.findByKey(parentKey);
        return hydrate(parentNode);
    }

    public getData(): WorldData {
        return {
            id: -1,
            name: 'unknown',
            markers: this.markers.getAll(),
            tiles: this.quadtree.getDetachedTiles(),
        };
    }
}
