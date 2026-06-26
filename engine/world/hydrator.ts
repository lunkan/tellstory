import { QuadNodeDelta } from '../../storyteller/types';
import tilesJSON from '../config/tiles.json' with { type: 'json' };
import { getRandFromSeeds } from '../util/number-generator';
import { QuadNode } from './quad-node';

import { Tile } from "./tile";

export function hydrate(node: QuadNode | undefined): QuadNode | undefined {
    if (!node) {
        return node; // Can't hydrate undefined
    } else if (node.tile) {
        return node; // Already hydrated
    } else if (!node.parent) {
        return node; // Root nodes can't hydrate
    }

    if (!node.parent.tile) {
        if (!hydrate(node.parent)) {
            return node; // No tiles for any parent
        }
    }

    hydrateSubTiles(node.parent);
    return node; // Hydration complete
}

function hydrateSubTiles(parent: QuadNode): void {
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

    // Water - is water :)
    if (parent.tile.hasTerrain('water')) {
        quadrants.forEach((quadrant) => {
            quadrant.tile!.addTerrain({
                type: 'water',
                value: 1,
            });
        });

        return;
    }

    let seedIncrementor = 0;

    const elevationBalanceSerie = getBalanceSerie(++seedIncrementor, parent.key.hash);
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
        const balanceSerie = getBalanceSerie(++seedIncrementor, parent.key.hash);

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

function getBalanceSerie(type: number, seed: bigint): number[] {
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
