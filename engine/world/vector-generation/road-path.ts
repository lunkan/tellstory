import { findShortestPaths, PathStep } from './shortest-path';

/** Travel-time penalty at maximum elevation, relative to flat terrain. */
export const ROAD_ELEVATION_COST = 4;
export const MAX_CONSECUTIVE_NON_URBAN_TILES = 5;
/** Minimum urban value for a tile to count as an urban road target. */
export const ROAD_URBAN_THRESHOLD = 0.1;

export type RoadCell = { x: number; y: number };
export type RoadTerrain = { elevation: number; urban: number };
export type RoadSearchBounds = { x: number; y: number; width: number; height: number };

export type RoadPathOptions = {
    start: RoadCell;
    end: RoadCell;
    /** A finite, inclusive grid rectangle: x <= cell.x < x + width, likewise for y. */
    bounds: RoadSearchBounds;
    /** Undefined means terrain is unavailable, not flat. It causes the search to fail explicitly. */
    terrainAt: (cell: RoadCell) => RoadTerrain | undefined;
    /** Explicitly unavailable cells are impassable; other missing terrain is an error. */
    isBlocked?: (cell: RoadCell) => boolean;
    /** Restricts which adjacent cells can be joined by a representable road. */
    canConnect?: (from: RoadCell, to: RoadCell) => boolean;
    /** Optional travel time for a step; defaults to the full centre-to-centre cost. */
    stepCost?: (from: RoadCell, to: RoadCell, fromTerrain: RoadTerrain, toTerrain: RoadTerrain, elevationCost: number) => number;
    elevationCost?: number;
    maxConsecutiveNonUrbanTiles?: number;
    /** Disable the gap limit, while retaining the same elevation-weighted search. */
    unlimitedNonUrban?: boolean;
};

export type RoadPath = { cells: RoadCell[]; travelTime: number };

type RoadState = RoadCell & { nonUrbanCount: number };

function cellKey(cell: RoadCell): string {
    return `${cell.x},${cell.y}`;
}

export function roadStepTravelTime(from: RoadTerrain, to: RoadTerrain, diagonal: boolean, elevationCost: number): number {
    const distance = diagonal ? Math.SQRT2 : 1;
    return distance * (1 + elevationCost * (from.elevation + to.elevation) / 2);
}

/**
 * Lowest-travel-time route within bounds. Urban values at the threshold reset the gap count;
 * non-urban start and end cells count toward the limit. Time is in flat-cell travel units.
 */
export function findRoadPath(options: RoadPathOptions): RoadPath | undefined {
    return findRoadPaths(options, [options.end]).get(cellKey(options.end));
}

/** Cheapest routes from one start to each reachable destination within the supplied bounds. */
export function findRoadPaths(options: Omit<RoadPathOptions, 'end'>, ends: readonly RoadCell[]): Map<string, RoadPath> {
    const { bounds, start } = options;
    const elevationCost = options.elevationCost ?? ROAD_ELEVATION_COST;
    const maxGap = options.maxConsecutiveNonUrbanTiles ?? MAX_CONSECUTIVE_NON_URBAN_TILES;

    if (![bounds.x, bounds.y, bounds.width, bounds.height].every(Number.isSafeInteger)
        || bounds.width <= 0 || bounds.height <= 0
        || !Number.isSafeInteger(bounds.x + bounds.width) || !Number.isSafeInteger(bounds.y + bounds.height)) {
        throw new Error('Road search bounds must be a non-empty rectangle of safe integers');
    }
    if (!Number.isFinite(elevationCost) || elevationCost < 0) {
        throw new Error('Road elevation cost must be finite and non-negative');
    }
    if (!Number.isSafeInteger(maxGap) || maxGap < 0) {
        throw new Error('Maximum consecutive non-urban tiles must be a non-negative safe integer');
    }
    const contains = ({ x, y }: RoadCell): boolean => Number.isSafeInteger(x) && Number.isSafeInteger(y)
        && x >= bounds.x && x < bounds.x + bounds.width && y >= bounds.y && y < bounds.y + bounds.height;
    if (!contains(start) || ends.some((end) => !contains(end))) {
        throw new Error('Road endpoints must be inside the search bounds');
    }
    if (options.isBlocked?.(start)) {
        return new Map();
    }

    const goalKeys = new Set(ends.map(cellKey));
    const terrain = new Map<string, RoadTerrain>();
    const readTerrain = (cell: RoadCell): RoadTerrain => {
        const key = cellKey(cell);
        const cached = terrain.get(key);
        if (cached) {
            return cached;
        }
        const value = options.terrainAt(cell);
        if (!value) {
            throw new Error(`Road terrain unavailable at ${key}`);
        }
        if (![value.elevation, value.urban].every((v) => Number.isFinite(v) && v >= 0 && v <= 1)) {
            throw new Error(`Road terrain values must be between 0 and 1 at ${key}`);
        }
        terrain.set(key, value);
        return value;
    };

    const startTerrain = readTerrain(start);
    const startGap = options.unlimitedNonUrban || startTerrain.urban >= ROAD_URBAN_THRESHOLD ? 0 : 1;
    if (startGap > maxGap) {
        return new Map();
    }

    const results = findShortestPaths<RoadState>({
        start: { ...start, nonUrbanCount: startGap },
        key: (state) => `${state.x},${state.y},${state.nonUrbanCount}`,
        goal: (state) => {
            const key = cellKey(state);
            return goalKeys.has(key) ? key : undefined;
        },
        goalCount: goalKeys.size,
        neighbours: (state) => {
            const from = readTerrain(state);
            const steps: PathStep<RoadState>[] = [];
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    if (!dx && !dy) {
                        continue;
                    }
                    const cell = { x: state.x + dx, y: state.y + dy };
                    if (!contains(cell)) {
                        continue;
                    }
                    if (options.isBlocked?.(cell)) {
                        continue;
                    }
                    if (options.canConnect && !options.canConnect(state, cell)) {
                        continue;
                    }
                    const to = readTerrain(cell);
                    const nonUrbanCount = options.unlimitedNonUrban || to.urban >= ROAD_URBAN_THRESHOLD ? 0 : state.nonUrbanCount + 1;
                    if (nonUrbanCount > maxGap) {
                        continue;
                    }
                    steps.push({
                        state: { ...cell, nonUrbanCount },
                        cost: options.stepCost
                            ? options.stepCost(state, cell, from, to, elevationCost)
                            : roadStepTravelTime(from, to, !!dx && !!dy, elevationCost),
                    });
                }
            }
            return steps;
        },
    });

    return new Map([...results].map(([key, result]) => [key, {
        cells: result.states.map(({ x, y }) => ({ x, y })),
        travelTime: result.cost,
    }]));
}
