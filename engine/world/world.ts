import tilesJSON from '../config/tiles.json' with { type: 'json' };
import markersJSON from '../config/markers.json' with { type: 'json' };

import { config } from "../config/config";
import { MarkerConfigData, TileConfigData } from '../config/type';
import { MarkerSetting, QuadNodeDelta, QuadNodePoint, WorldData } from "../types";
import { hydrate } from "./hydrator/hydrate";
//import { Hydrator } from "./hydrator";
//import { Marker, Markers } from "./markers";
import { QuadNode } from "./quad-node";
import { QuadNodeKey } from "./quad-node-key";
import { Tile } from "./tile";

export class World {
    public static readonly MAX_ZOOM_DEPTH: number = QuadNodeKey.MAX_DEPTH; // - 1; // 12; //7;
    public static readonly MIN_ZOOM_DEPTH: number = 5;

    public readonly quadtree: QuadNode;
    //public readonly markers: Markers;

    //private _hydrator: Hydrator;

    constructor(worldData: WorldData) {
        if (!config.isInitilized()) {
            config.init({
                name: tilesJSON.name,
                version: tilesJSON.version,
                tiles: tilesJSON.tiles as TileConfigData[],
                markers: markersJSON.markers as MarkerConfigData[],
            });
        }

        this.quadtree = new QuadNode();
        //this.markers = new Markers(this.quadtree.bounds.size);

        //this._hydrator = new Hydrator(this.markers);

        for (const tileEntry of worldData.tiles) {
            const tile = new Tile();
            tileEntry.terrain.forEach((terrainSetting) => tile.setTerrain(terrainSetting));
            tileEntry.vectors.forEach((vectorSetting) => tile.setVector(vectorSetting));
            tileEntry.markers.forEach((markerSetting) => tile.addMarker(markerSetting)); // New

            const nodeKey = QuadNodeKey.fromId(tileEntry.nodeId);
            const node = this.quadtree.findByKey(nodeKey, true);

            if (node) {
                node.tile = tile;

                // If stored they are detached and all there acestors should be detached as well.
                // Need to set detached flag though !! 
                //if (tileEntry.detached) {
                // They are always detached if loaded
                node.detach();
                //}
            }
        }

        /*for (const markerEntry of worldData.markers) {
            this.markers.addMarker(markerEntry);
        }*/
    }

    //public getStartingLocations(): Marker[] {
    public getStartingLocations(): MarkerSetting[] {
        return this.quadtree.tile?.markers.filter((marker) => marker.type === 'player-start') || [];

        //return this.markers.getAll().filter((marker) => marker.type === 'player-start');
    }

    //public getMarkersFromNode(node: QuadNode): Marker[] {
    public getMarkersFromNode(node: QuadNode): MarkerSetting[] {
        /*const { x, y, size } = node.bounds;
        return this.markers.getMarkers(x, y, node.depth, size);*/

        // Is it strange to get all from here? When tile data is only by node not recursive
        let current: QuadNode | undefined = node;
        const markers: MarkerSetting[] = [];
        while (current && current.tile) {
            markers.push(...current.tile.markers);
            current = current.parent;
        }

        return markers;
    }

    public findNodeBykey(key: QuadNodeKey): QuadNode | undefined {
        const node = this.quadtree.findByKey(key);
        //return node ? this._hydrator.hydrate(node) : undefined;
        return node ? hydrate(node) : undefined;
    }

    public findNodeByPoint(point: QuadNodePoint): QuadNode | undefined {
        const node = this.quadtree.findByPoint(point, true);
        //return node ? this._hydrator.hydrate(node) : undefined;
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
        //return this._hydrator.hydrate(neighbourNode);
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
            //.map((adjacentNode) => this._hydrator.hydrate(adjacentNode)!);
            .map((adjacentNode) => hydrate(adjacentNode)!);
    }

    public findQuadrantNodes(key: QuadNodeKey): QuadNode[] {
        const node = this.quadtree.findByKey(key);
        if (!node) {
            return [];
        }

        const quadrantNodes = node.getQuadrants(true);
        //return quadrantNodes.map((quadrantNode) => this._hydrator.hydrate(quadrantNode)!);
        return quadrantNodes.map((quadrantNode) => hydrate(quadrantNode)!);
    }

    public findQuadrantNode(key: QuadNodeKey, x: 1 | 0, y: 1 | 0): QuadNode | undefined {
        const node = this.quadtree.findByKey(key);
        if (!node) {
            return;
        }

        const quadrantNode = node.getQuadrantAt(x, y, true);
        //return this._hydrator.hydrate(quadrantNode);
        return hydrate(quadrantNode);
    }

    public findParentNode(key: QuadNodeKey): QuadNode | undefined {
        const parentKey = key.createParentKey();
        const parentNode = this.quadtree.findByKey(parentKey);
        //return this._hydrator.hydrate(parentNode);
        return hydrate(parentNode);
    }

    public getData(): WorldData {
        return {
            id: -1,
            name: 'unknown',
            //markers: this.markers.getAll(),
            tiles: this.quadtree.getDetachedTiles(),
        };
    }
}
