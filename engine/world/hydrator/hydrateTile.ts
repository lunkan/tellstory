import { config } from '../../config/config';
import { mergeSeeds, seedFromString } from '../../util/number-generator';
import { QuadNode } from '../quad-node';
import { terrainNeighbours } from './terrain-neighbours';
import { planTerrainChildren } from './terrain-planner';

/** Default share of quarter-cell interpolation towards parent-depth neighbours. */
export const TERRAIN_NEIGHBOUR_INFLUENCE = 0.5;
/** Strength of seeded variation, independent of clustering. */
export const TERRAIN_VARIATION = 0.08;

/** Overrides for known terrain names; all other terrain uses the default. */
export const TERRAIN_SMOOTHNESS: ReadonlyMap<string, number> = new Map([
    ['elevation', 0.7],
    ['urban', 0.25],
    ['forrest', 0.4],
    ['forest', 0.4],
]);
/** Multipliers preserve each palette's cluster setting while favouring concentrated urban areas. */
export const TERRAIN_CLUSTER_MULTIPLIERS: ReadonlyMap<string, number> = new Map([['urban', 1.6]]);
export const DEFAULT_TERRAIN_CLUSTER = 0.5;
/** Elevations at or below this value generate fully ocean-covered children. */
export const OCEAN_FULL_ELEVATION = 0.05;
/** Elevations at or above this value generate children without ocean coverage. */
export const OCEAN_ZERO_ELEVATION = 0.15;

export function oceanFromElevation(elevation: number): number {
    return Math.max(0, Math.min(1, (OCEAN_ZERO_ELEVATION - elevation) / (OCEAN_ZERO_ELEVATION - OCEAN_FULL_ELEVATION)));
}

export function hydrateTile(node: QuadNode): QuadNode {
    const parent = node.parent;
    const parentTile = parent?.getTile();
    if (!parent || !parentTile) {
        return node;
    }

    const quadrants = [
        parent.getQuadrantAt(0, 0, true), parent.getQuadrantAt(1, 0, true),
        parent.getQuadrantAt(0, 1, true), parent.getQuadrantAt(1, 1, true),
    ];
    const targets = quadrants.filter((child): child is QuadNode => !!child && child.canHydrate() && !child.hasTile());
    if (!targets.length) {
        return node;
    }

    const waterTerrain = parentTile.terrain
        .filter((terrain) => terrain.type !== 'ocean' && config.getTile(terrain.type)?.tags.includes('water'))
        .sort((a, b) => b.value - a.value)[0];
    if (waterTerrain && waterTerrain.value > 0.5) {
        targets.forEach((child) => child.setTileData({ terrain: [{ type: waterTerrain.type, value: 1 }] }));
        return node;
    }

    const neighbours = terrainNeighbours(parent).map((node) => ({ node, tile: node?.getTile() }));
    const types = [...new Set([parentTile, ...neighbours.map(({ tile }) => tile)].flatMap((tile) => tile?.terrain.map(({ type }) => type) ?? []))]
        .filter((type) => type !== 'ocean').sort();
    const values = quadrants.map(() => [] as { type: string; value: number }[]);
    for (const type of types) {
        const centre = parentTile.terrain.find((terrain) => terrain.type === type)?.value ?? 0;
        const surrounding = neighbours.map(({ node, tile }) => {
            if (tile) return tile.terrain.find((terrain) => terrain.type === type)?.value ?? 0;
            return node && type === 'elevation' ? 0 : centre;
        });
        const cluster = (config.getTile(type)?.cluster ?? DEFAULT_TERRAIN_CLUSTER) * (TERRAIN_CLUSTER_MULTIPLIERS.get(type) ?? 1);
        const seed = mergeSeeds(parent.key.hash, seedFromString(type));
        const planned = planTerrainChildren(centre, surrounding, seed, {
            smoothness: TERRAIN_SMOOTHNESS.get(type) ?? TERRAIN_NEIGHBOUR_INFLUENCE, variation: TERRAIN_VARIATION, cluster,
        });
        planned.forEach((value, index) => values[index].push({ type, value }));
    }
    quadrants.forEach((child, index) => {
        if (child && targets.includes(child)) {
            const elevation = values[index].find((terrain) => terrain.type === 'elevation')?.value ?? 0;
            const ocean = oceanFromElevation(elevation);
            child.setTileData({ terrain: [...values[index], { type: 'ocean', value: ocean }] });
        }
    });
    return node;
}
