import {
    findRoadPaths,
    ROAD_ELEVATION_COST,
    ROAD_URBAN_THRESHOLD,
    RoadCell,
    RoadPath,
    RoadSearchBounds,
    RoadTerrain,
    roadStepTravelTime,
} from './road-path';
/** Maximum Chebyshev distance between road targets, including diagonals. */
export const MAX_ROAD_CONNECTION_DISTANCE = 4;
/** Value contributed by a resolved shallower road when it is a target. */
export const SHALLOW_ROAD_TARGET_VALUE = 0.3;
/** Minimum endpoint products for distances of one through four tiles. */
export const ROAD_CONNECTION_PRODUCT_THRESHOLDS = [0.06, 0.12, 0.18, 0.24] as const;
/** Discount applied to complete existing road segments when selecting a route. */
export const EXISTING_ROAD_DISCOUNT = 0.5;

export type RoadPlanOptions = {
    bounds: RoadSearchBounds;
    terrainAt: (cell: RoadCell) => RoadTerrain | undefined;
    /** Explicitly unavailable cells are excluded from both routes and urban targets. */
    isBlocked?: (cell: RoadCell) => boolean;
    /** Must be symmetric: an edge must be representable from both endpoints. */
    canConnect?: (from: RoadCell, to: RoadCell) => boolean;
    /** Existing complete road edges, which contribute to connectivity without being generated. */
    existingEdges?: ReadonlyArray<readonly [RoadCell, RoadCell]>;
    /** Existing road cells that urban cells may connect to, but not to each other. */
    roadTargets?: readonly RoadCell[];
    /** Protected cells eligible for an isolated boundary-only connection. */
    boundaryTargets?: readonly RoadCell[];
    /** Whether a protected target may be reached only as a boundary from an adjacent cell. */
    canEndAtBoundary?: (protectedCell: RoadCell, adjacentCell: RoadCell) => boolean;
    elevationCost?: number;
    maxDistance?: number;
};

export type RoadConnection = RoadPath & {
    kind: 'road' | 'boundary';
};

export type RoadPlan = {
    /** Boundary routes end at a protected cell; their last pair creates only the editable half-edge. */
    connections: RoadConnection[];
    /** Urban cells grouped by complete network connectivity; boundary-only endpoints remain separate. */
    components: RoadCell[][];
};

type NetworkEdge = { to: string; cost: number };

function cellKey(cell: RoadCell): string {
    return `${cell.x},${cell.y}`;
}

function compareCells(a: RoadCell, b: RoadCell): number {
    return a.y - b.y || a.x - b.x;
}

/**
 * Plan a network within a stable terrain rectangle. Every available cell at the urban threshold is a
 * target. Eligible pairs are processed by endpoint distance and stable cell order. Routes minimize
 * elevation-weighted cost with a discount for complete existing road segments.
 *
 * The planner does not hydrate or mutate tiles. Its caller must bound the region and supply
 * terrain for every unblocked cell, including cells outside the viewport.
 */
export function planRoadNetwork(options: RoadPlanOptions): RoadPlan {
    const { bounds } = options;
    const elevationCost = options.elevationCost ?? ROAD_ELEVATION_COST;
    const maxDistance = options.maxDistance ?? MAX_ROAD_CONNECTION_DISTANCE;

    if (![bounds.x, bounds.y, bounds.width, bounds.height].every(Number.isSafeInteger)
        || bounds.width <= 0 || bounds.height <= 0
        || !Number.isSafeInteger(bounds.x + bounds.width) || !Number.isSafeInteger(bounds.y + bounds.height)) {
        throw new Error('Road planning bounds must be a non-empty rectangle of safe integers');
    }
    if (!Number.isFinite(elevationCost) || elevationCost < 0
        || !Number.isSafeInteger(maxDistance) || maxDistance < 0) {
        throw new Error('Road planning cost and maximum distance must be non-negative');
    }

    const terrain = new Map<string, RoadTerrain>();
    const urbanCells: RoadCell[] = [];
    for (let y = bounds.y; y < bounds.y + bounds.height; y++) {
        for (let x = bounds.x; x < bounds.x + bounds.width; x++) {
            const cell = { x, y };
            if (options.isBlocked?.(cell)) {
                continue;
            }
            const value = options.terrainAt(cell);
            if (!value) {
                throw new Error(`Road terrain unavailable at ${cellKey(cell)}`);
            }
            if (![value.elevation, value.urban].every((v) => Number.isFinite(v) && v >= 0 && v <= 1)) {
                throw new Error(`Road terrain values must be between 0 and 1 at ${cellKey(cell)}`);
            }
            terrain.set(cellKey(cell), { ...value });
            if (value.urban >= ROAD_URBAN_THRESHOLD) {
                urbanCells.push(cell);
            }
        }
    }
    const terrainAt = (cell: RoadCell): RoadTerrain | undefined => terrain.get(cellKey(cell));
    const network = new Map<string, NetworkEdge[]>();
    const connections: RoadConnection[] = [];

    const addEdge = (from: RoadCell, to: RoadCell): void => {
        const fromKey = cellKey(from);
        const toKey = cellKey(to);
        const fromEdges = network.get(fromKey) ?? [];
        const toEdges = network.get(toKey) ?? [];
        if (!fromEdges.some((edge) => edge.to === toKey)) {
            const fromTerrain = terrainAt(from)!;
            const toTerrain = terrainAt(to)!;
            const cost = roadStepTravelTime(fromTerrain, toTerrain, from.x !== to.x && from.y !== to.y, elevationCost);
            fromEdges.push({ to: toKey, cost });
            toEdges.push({ to: fromKey, cost });
            network.set(fromKey, fromEdges);
            network.set(toKey, toEdges);
        }
    };

    for (const [from, to] of options.existingEdges ?? []) {
        const dx = Math.abs(from.x - to.x);
        const dy = Math.abs(from.y - to.y);
        if (!terrainAt(from) || !terrainAt(to) || !Number.isSafeInteger(dx) || !Number.isSafeInteger(dy)
            || dx > 1 || dy > 1 || dx + dy === 0
            || (options.canConnect && (!options.canConnect(from, to) || !options.canConnect(to, from)))) {
            throw new Error('Existing road edges must connect available, adjacent cells');
        }
        addEdge(from, to);
    }

    const addPath = (path: RoadPath, kind: RoadConnection['kind']): void => {
        for (let i = 1; i < path.cells.length; i++) {
            addEdge(path.cells[i - 1], path.cells[i]);
        }
        connections.push({ ...path, kind });
    };

    const urbanByKey = new Map(urbanCells.map((cell) => [cellKey(cell), cell]));
    const targets = new Map(urbanByKey);
    const roadKeys = new Set<string>();
    for (const cell of options.roadTargets ?? []) {
        if (!Number.isSafeInteger(cell.x) || !Number.isSafeInteger(cell.y) || !terrainAt(cell)) {
            throw new Error('Existing road targets must be available cells inside the planning bounds');
        }
        targets.set(cellKey(cell), cell);
        roadKeys.add(cellKey(cell));
    }
    const eligible = (a: RoadCell, b: RoadCell): boolean => {
        const aKey = cellKey(a);
        const bKey = cellKey(b);
        const aUrban = urbanByKey.has(aKey);
        const bUrban = urbanByKey.has(bKey);
        const aValue = terrainAt(a)!.urban;
        const bValue = terrainAt(b)!.urban;
        let product = aUrban && bUrban ? aValue * bValue : 0;
        if (aUrban && roadKeys.has(bKey)) {
            product = Math.max(product, aValue * SHALLOW_ROAD_TARGET_VALUE);
        }
        if (bUrban && roadKeys.has(aKey)) {
            product = Math.max(product, bValue * SHALLOW_ROAD_TARGET_VALUE);
        }
        const distance = Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
        return distance > 0 && distance <= maxDistance
            && distance <= ROAD_CONNECTION_PRODUCT_THRESHOLDS.length
            && product >= ROAD_CONNECTION_PRODUCT_THRESHOLDS[distance - 1];
    };
    const neighboursOf = (cell: RoadCell): RoadCell[] => {
        const neighbours: RoadCell[] = [];
        for (let y = Math.max(bounds.y, cell.y - maxDistance); y <= Math.min(bounds.y + bounds.height - 1, cell.y + maxDistance); y++) {
            for (let x = Math.max(bounds.x, cell.x - maxDistance); x <= Math.min(bounds.x + bounds.width - 1, cell.x + maxDistance); x++) {
                const other = targets.get(cellKey({ x, y }));
                if (other && eligible(cell, other)) {
                    neighbours.push(other);
                }
            }
        }
        return neighbours;
    };
    const hasEdge = (from: RoadCell, to: RoadCell): boolean =>
        (network.get(cellKey(from)) ?? []).some((edge) => edge.to === cellKey(to));
    const stepCost = (from: RoadCell, to: RoadCell, fromTerrain: RoadTerrain, toTerrain: RoadTerrain, weight: number): number =>
        roadStepTravelTime(fromTerrain, toTerrain, from.x !== to.x && from.y !== to.y, weight)
        * (hasEdge(from, to) ? 1 - EXISTING_ROAD_DISCOUNT : 1);
    const actualTravelTime = (cells: RoadCell[], boundary: boolean): number => {
        let total = 0;
        for (let i = 1; i < cells.length; i++) {
            const from = cells[i - 1];
            const to = cells[i];
            const fromTerrain = terrainAt(from)!;
            const toTerrain = terrainAt(to)!;
            if (boundary && i === cells.length - 1) {
                const distance = from.x !== to.x && from.y !== to.y ? Math.SQRT2 : 1;
                total += distance / 2 * (1 + elevationCost * (toTerrain.elevation + 3 * fromTerrain.elevation) / 4);
            } else {
                total += roadStepTravelTime(fromTerrain, toTerrain, from.x !== to.x && from.y !== to.y, elevationCost);
            }
        }
        return total;
    };
    const pairs = new Map<string, { first: RoadCell; second: RoadCell; distance: number }>();
    for (const start of urbanCells) {
        for (const end of neighboursOf(start)) {
            const [first, second] = compareCells(start, end) < 0 ? [start, end] : [end, start];
            const key = `${cellKey(first)}|${cellKey(second)}`;
            pairs.set(key, { first, second, distance: Math.max(Math.abs(first.x - second.x), Math.abs(first.y - second.y)) });
        }
    }
    const boundaryKeys = new Set((options.boundaryTargets ?? []).map(cellKey));
    const orderedPairs = [...pairs.values()].sort((a, b) =>
        a.distance - b.distance || compareCells(a.first, b.first) || compareCells(a.second, b.second));
    for (const { first, second } of orderedPairs) {
        const path = findRoadPaths({
            start: first, bounds, terrainAt, elevationCost, unlimitedNonUrban: true,
            isBlocked: options.isBlocked, canConnect: options.canConnect, stepCost,
        }, [second]).get(cellKey(second));
        if (path) {
            if (path.cells.some((cell, index) => index > 0 && !hasEdge(path.cells[index - 1], cell))) {
                addPath({ cells: path.cells, travelTime: actualTravelTime(path.cells, false) }, 'road');
            }
            continue;
        }

        if (!options.canEndAtBoundary) {
            continue;
        }
        for (const [target, end] of [[first, second], [second, first]]) {
            const targetKey = cellKey(target);
            if (!boundaryKeys.has(targetKey)) {
                continue;
            }
            const boundaryPath = findRoadPaths({
                start: target, bounds, terrainAt, elevationCost, unlimitedNonUrban: true,
                isBlocked: options.isBlocked,
                canConnect: (from, to) => cellKey(from) === targetKey
                    ? options.canEndAtBoundary!(target, to)
                    : cellKey(to) !== targetKey && (options.canConnect?.(from, to) ?? true),
                stepCost: (from, to, fromTerrain, toTerrain, weight) => {
                    if (cellKey(from) !== targetKey) {
                        return stepCost(from, to, fromTerrain, toTerrain, weight);
                    }
                    const distance = from.x !== to.x && from.y !== to.y ? Math.SQRT2 : 1;
                    return distance / 2 * (1 + weight * (fromTerrain.elevation + 3 * toTerrain.elevation) / 4);
                },
            }, [end]).get(cellKey(end));
            if (boundaryPath) {
                const cells = [...boundaryPath.cells].reverse();
                for (let i = 1; i < cells.length - 1; i++) {
                    addEdge(cells[i - 1], cells[i]);
                }
                connections.push({ cells, travelTime: actualTravelTime(cells, true), kind: 'boundary' });
            }
        }
    }

    const remaining = new Set(urbanCells.map(cellKey));
    const components: RoadCell[][] = [];
    for (const cell of urbanCells) {
        const key = cellKey(cell);
        if (!remaining.delete(key)) {
            continue;
        }
        const reached = new Set([key]);
        const queue = [key];
        for (let i = 0; i < queue.length; i++) {
            for (const edge of network.get(queue[i]) ?? []) {
                if (!reached.has(edge.to)) {
                    reached.add(edge.to);
                    queue.push(edge.to);
                }
            }
        }
        const component = [cell];
        for (const other of urbanCells) {
            const otherKey = cellKey(other);
            if (remaining.has(otherKey) && reached.has(otherKey)) {
                remaining.delete(otherKey);
                component.push(other);
            }
        }
        components.push(component);
    }
    return { connections, components };
}
