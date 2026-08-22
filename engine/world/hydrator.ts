/*import tilesJSON from '../config/tiles.json' with { type: 'json' };
import markersJSON from '../config/markers.json' with { type: 'json' };
import { QuadNodeDelta, QuadNodes2DPoint } from '../types';
import { getRandFromSeeds, mergeSeeds } from '../util/number-generator';
import { Marker, MarkerConfigEntry, Markers } from './markers';
import { QuadNode } from './quad-node';

import { Tile } from "./tile";

export class Hydrator {
    private _markers: Markers | undefined

    constructor(markers?: Markers) {
        this._markers = markers;
    }

    public hydrate(node: QuadNode | undefined): QuadNode | undefined {
        if (!node) {
            return node; // Can't hydrate undefined
        } else if (node.tile) {
            return node; // Already hydrated
        } else if (!node.parent) {
            return node; // Root nodes can't hydrate
        }

        if (!node.parent.tile) {
            if (!this.hydrate(node.parent)) {
                return node; // No tiles for any parent
            }
        }

        this._hydrateSubTiles(node.parent);
        this._generateMarkers(node);
        return node; // Hydration complete
    }

    private _hydrateSubTiles(parent: QuadNode): void {
        if (!parent.tile) {
            return;
        }

        const quadrantA = parent.getQuadrantAt(0, 0, true);
        const quadrantB = parent.getQuadrantAt(1, 0, true);
        const quadrantC = parent.getQuadrantAt(0, 1, true);
        const quadrantD = parent.getQuadrantAt(1, 1, true);

        if (!quadrantA || !quadrantB || !quadrantC || !quadrantD) {
            return;
        }

        const quadrants: QuadNode[] = [quadrantA, quadrantB, quadrantC, quadrantD].map((quadrant) => {
            quadrant.tile = new Tile();
            return quadrant;
        });

        // Water - is water :) !!! Or lake?
        if (parent.tile.hasTerrain('ocean')) {
            quadrants.forEach((quadrant) => {
                quadrant.tile!.addTerrain({
                    type: 'ocean',
                    value: 1,
                });
            });

            return;
        }

        let seedIncrementor = 0;

        parent.tile.terrain.map((terrain) => {
            const config = tilesJSON.tiles.find((tile) => tile.name === terrain.type);
            const cluster = config?.cluster || 1;
            const seed = mergeSeeds(BigInt(++seedIncrementor), parent.key.hash);
            const quadrantValues = this._getQuadrantValues(seed, terrain.value, cluster);

            quadrants.forEach((quadrant, i) => {
                quadrant.tile?.addTerrain({
                    type: terrain.type,
                    value: quadrantValues[i],
                });
            });
        });

        function xQuadrantsFromVector(vx: QuadNodeDelta) {
            if (vx === -1) {
                return [quadrantA, quadrantC];
            } else if (vx === 1) {
                return [quadrantB, quadrantD];
            } else {
                return parent.bounds.x % 2 ? [quadrantA, quadrantC] : [quadrantB, quadrantD];
            }
        }

        function yQuadrantsFromVector(vy: QuadNodeDelta) {
            if (vy === -1) {
                return [quadrantA, quadrantB];
            } else if (vy === 1) {
                return [quadrantC, quadrantD];
            } else {
                return parent.bounds.y % 2 ? [quadrantA, quadrantB] : [quadrantC, quadrantD];
            }
        }

        parent.tile.vectors.forEach((vector) => {
            const xQuadrants = xQuadrantsFromVector(vector.direction.x);
            const yQuadrants = yQuadrantsFromVector(vector.direction.y);
            const vQuadrant = xQuadrants.find((quadrant) => yQuadrants.indexOf(quadrant) !== -1);
            if (!vQuadrant) {
                console.log('FAIL');
                return;
            }

            vQuadrant.tile?.setVector({
                direction: vQuadrant.getNormalizedRelativePosition(parent)!,
                value: vector.value,
                type: vector.type,
            });

            vQuadrant.tile?.setVector({
                direction: vector.direction,
                value: vector.value,
                type: vector.type,
            });
        });
    }

    private _getQuadrantValues(seed: bigint, value: number, cluster: number): number[] {
        const quadrants = [0, 1, 2, 3];

        // A random priority per quadrant decides who wins the larger share.
        const randoms = quadrants.map((i) => getRandFromSeeds(seed, BigInt(i)));

        // "Winner-takes-all" allocation: pour the parent's total budget
        // (value * 4) into the highest-priority quadrants first, filling each
        // to 1 before moving on. Winners reach 1, losers drop to 0. Because we
        // distribute exactly value * 4, this still averages to `value`.
        // e.g. value 0.5 => [1, 1, 0, 0]; value 0.3 => [1, 0.2, 0, 0].
        const order = [...quadrants].sort((a, b) => randoms[b] - randoms[a]);
        let budget = value * quadrants.length;
        const extreme = new Array<number>(quadrants.length).fill(0);
        for (const i of order) {
            const share = Math.min(1, budget);
            extreme[i] = share;
            budget -= share;
        }

        // Blend the even split (every quadrant = value) with the extreme split.
        // Both endpoints average to `value` and lie in [0, 1], so any convex
        // blend does too: cluster 0 => perfectly even, cluster 1 => winner-
        // takes-all, in between => a proportional spread around `value`.
        return quadrants.map((i) => {
            const quadValue = value + cluster * (extreme[i] - value);
            return Math.min(1, Math.max(0, quadValue)); // Guard against fp drift
        });
    }

    private _generateMarkers(node: QuadNode): void {
        if (!this._markers) {
            return;
        }

        // Check how many already - don't generate if provided.

        const terrainTypes = node.tile?.terrain.map((terrainConfig) => terrainConfig.type);
        const markers = markersJSON.markers.filter((marker) => node.depth === marker.zMin && marker.tags.some((tag) => terrainTypes?.includes(tag)));

        if (!markers.length) {
            return;
        }

        const rand = getRandFromSeeds(BigInt(100), node.key.hash);
        const randIndex = Math.floor(markers.length * rand);
        const marker = markers[randIndex];

        this._markers.addMarker({
            point: this._findMarkerPoint(marker, node),
            type: marker.name,
            id: 'hydrated',
        });
    }

    private _findMarkerPoint(marker: MarkerConfigEntry, node: QuadNode): QuadNodes2DPoint {
        const markerNode = [...node.getQuadrants()].sort((a, b) => {
            const valueA = this._getNodeMarkerWeight(marker, a);
            const valueB = this._getNodeMarkerWeight(marker, b);
            return valueB - valueA;
        })[0] || node; // Self if no quadrant nodes

        const randX = getRandFromSeeds(BigInt(101), markerNode.key.hash);
        const randY = getRandFromSeeds(BigInt(102), markerNode.key.hash);

        return {
            x: markerNode.bounds.size * randX + markerNode.bounds.x,
            y: markerNode.bounds.size * randY + markerNode.bounds.y,
        };
    }

    private _getNodeMarkerWeight(marker: MarkerConfigEntry, node: QuadNode): number {
        if (!node.tile) {
            return 0;
        }

        return node.tile!.terrain.reduce((acc, terrain) => {
            if (marker.tags.includes(terrain.type)) {
                acc += terrain.value;
            }

            return acc;
        }, 0);
    }
}
*/