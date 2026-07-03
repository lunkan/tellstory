import tilesJSON from '../config/tiles.json' with { type: 'json' };
import markersJSON from '../config/markers.json' with { type: 'json' };
import { QuadNodeDelta, QuadNodes2DPoint } from '../types';
import { getRandFromSeeds } from '../util/number-generator';
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

        const elevationBalanceSerie = this._getBalanceSerie(++seedIncrementor, parent.key.hash);
        quadrants.forEach((quadrant, i) => {
            quadrant.tile?.addTerrain({
                type: 'elevation',
                value: parent.tile!.elevation + elevationBalanceSerie[i] * 0.25,
            });
        });

        parent.tile.terrain.filter((terrain) => {
            const config = tilesJSON.tiles.find((tile) => tile.name === terrain.type);
            return config?.category === 'biome' || config?.category === 'urban';
        }).map((terrain) => {
            const balanceSerie = this._getBalanceSerie(++seedIncrementor, parent.key.hash);

            quadrants.forEach((quadrant, i) => {
                quadrant.tile?.addTerrain({
                    type: terrain.type,
                    value: terrain.value + balanceSerie[i] * 0.25,
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

    private _getBalanceSerie(type: number, seed: bigint): number[] {
        const quadValues = [
            getRandFromSeeds(BigInt(type), BigInt(0), seed),
            getRandFromSeeds(BigInt(type), BigInt(1), seed),
            getRandFromSeeds(BigInt(type), BigInt(2), seed),
            getRandFromSeeds(BigInt(type), BigInt(3), seed),
        ];

        const sum = quadValues.reduce((acc, randVal) => acc + randVal, 0);
        const average = sum / 4;
        return quadValues.map((value) => value - average);
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
