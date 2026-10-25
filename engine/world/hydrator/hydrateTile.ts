//import tilesJSON from '../../config/tiles.json' with { type: 'json' };
import { config } from '../../config/config';
import { getRandFromSeeds, mergeSeeds } from '../../util/number-generator';
import { QuadNode } from '../quad-node';

//import { Tile } from "../tile";

export function hydrateTile(node: QuadNode): QuadNode {
    if (!node?.parent) {
        return node;
    }

    _hydrateSubTiles(node.parent);
    return node; // Hydration complete
}

function _hydrateSubTiles(parent: QuadNode): void {
    const parentTile = parent.getTile();
    if (!parentTile) {
        return;
    }

    const quadrantA = parent.getQuadrantAt(0, 0, true);
    const quadrantB = parent.getQuadrantAt(1, 0, true);
    const quadrantC = parent.getQuadrantAt(0, 1, true);
    const quadrantD = parent.getQuadrantAt(1, 1, true);

    if (!quadrantA || !quadrantB || !quadrantC || !quadrantD) {
        return;
    }

    // Keep all 4 - quadrantValues are indexed by position. Skip protected nodes when writing.
    const quadrants: QuadNode[] = [quadrantA, quadrantB, quadrantC, quadrantD];


    /*.map((quadrant) => {
        //quadrant.tile = new Tile();
        quadrant.setTileData({});
        return quadrant;
    });*/

    // Water (ocean, lake) - dominant water type above threshold makes all quadrants full water
    const waterTerrain = parentTile.terrain
        .filter((terrain) => config.getTile(terrain.type)?.tags.includes('water'))
        .sort((a, b) => b.value - a.value)[0];

    if (waterTerrain && waterTerrain.value > 0.5) {
        quadrants.filter((quadrant) => quadrant.canHydrate()).forEach((quadrant) => {
            quadrant.setTileData({
                terrain: [{
                    type: waterTerrain.type,
                    value: 1,
                }],
            });
        });

        /*quadrants.forEach((quadrant) => {
            quadrant.tile!.addTerrain({
                type: 'ocean',
                value: 1,
            });
        });*/

        return;
    }

    let seedIncrementor = 0;

    parentTile.terrain.map((terrain) => {
        const tileConfig = config.getTile(terrain.type);
        //tilesJSON.tiles.find((tile) => tile.name === terrain.type);
        const cluster = tileConfig?.cluster || 1;
        const seed = mergeSeeds(BigInt(++seedIncrementor), parent.key.hash);
        const quadrantValues = _getQuadrantValues(seed, terrain.value, cluster);

        quadrants.forEach((quadrant, i) => {
            if (!quadrant.canHydrate()) {
                return;
            }

            quadrant.setTileData({
                terrain: [{
                    type: terrain.type,
                    value: quadrantValues[i],
                }],
            });

            /*quadrant.tile?.addTerrain({
                type: terrain.type,
                value: quadrantValues[i],
            });*/
        });
    });
}

function _getQuadrantValues(seed: bigint, value: number, cluster: number): number[] {
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
