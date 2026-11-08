import { getRandFromSeeds } from '../../util/number-generator';

export type TerrainPlanOptions = {
    smoothness: number;
    variation: number;
    cluster: number;
};

/** Neighbours are west, east, north and south; output is NW, NE, SW, SE. */
export function planTerrainChildren(
    centre: number, neighbours: readonly number[], seed: bigint, options: TerrainPlanOptions,
): number[] {
    if (neighbours.length !== 4 || ![centre, ...neighbours].every((value) => Number.isFinite(value) && value >= 0 && value <= 1)
        || ![options.smoothness, options.variation].every((value) => Number.isFinite(value) && value >= 0 && value <= 1)
        || !Number.isFinite(options.cluster) || options.cluster < 0) {
        throw new Error('Terrain values, smoothness and variation must be in [0, 1]; cluster must be finite and non-negative');
    }
    const interpolated = Array.from({ length: 4 }, (_, index) => {
        const horizontal = neighbours[index % 2 === 0 ? 0 : 1];
        const vertical = neighbours[index < 2 ? 2 : 3];
        return centre + options.smoothness * (horizontal + vertical - 2 * centre) / 4;
    });
    const order = [0, 1, 2, 3].map((index) => ({
        index,
        priority: (neighbours[index % 2 === 0 ? 0 : 1] + neighbours[index < 2 ? 2 : 3]) / 2
            + getRandFromSeeds(seed, BigInt(index)) * 0.25,
    })).sort((a, b) => b.priority - a.priority || a.index - b.index);
    let remaining = interpolated.reduce((sum, value) => sum + value, 0);
    const concentrated = [0, 0, 0, 0];
    for (const { index } of order) {
        concentrated[index] = Math.min(1, remaining);
        remaining -= concentrated[index];
    }

    const cluster = Math.min(1, options.cluster);
    return interpolated.map((value, index) => {
        const clustered = value + cluster * (concentrated[index] - value);
        const variation = (getRandFromSeeds(seed, BigInt(index)) * 2 - 1)
            * options.variation * Math.min(clustered, 1 - clustered) * 2;
        return Math.max(0, Math.min(1, clustered + variation));
    });
}
