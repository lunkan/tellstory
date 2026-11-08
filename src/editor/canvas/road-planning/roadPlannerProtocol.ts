import { RoadCell, RoadSearchBounds, RoadTerrain } from '../../../../engine/world/vector-generation/road-path';
import { planRoadNetwork, RoadPlan, RoadPlanOptions } from '../../../../engine/world/vector-generation/road-plan';

/** A row-major snapshot, indexed relative to bounds, with no live quad-tree references. */
export type RoadPlanningRequest = Omit<RoadPlanOptions, 'bounds' | 'terrainAt' | 'isBlocked' | 'canConnect' | 'existingEdges' | 'roadTargets' | 'boundaryTargets' | 'canEndAtBoundary'> & {
    bounds: RoadSearchBounds;
    terrain: (RoadTerrain | null)[];
    /** Explicitly unavailable row-major indices. Null terrain at any other index is an error. */
    blocked?: number[];
    /** Existing directions on protected cells, indexed relative to bounds. */
    protectedCells?: { index: number; directions: RoadCell[] }[];
    /** Existing same-depth editable road directions. */
    generatedCells?: { index: number; directions: RoadCell[] }[];
    /** Resolved directions from shallower road hosts at the planning depth. */
    inheritedCells?: { index: number; directions: RoadCell[] }[];
};

export type RoadPlanningResponse =
    | { status: 'completed'; plan: RoadPlan }
    | { status: 'error'; message: string };

export function planRoadSnapshot(request: RoadPlanningRequest): RoadPlan {
    const { bounds, terrain, blocked = [], protectedCells = [], generatedCells = [], inheritedCells = [], ...options } = request;
    if (!Number.isSafeInteger(bounds.width) || !Number.isSafeInteger(bounds.height)
        || bounds.width <= 0 || bounds.height <= 0
        || !Number.isSafeInteger(bounds.width * bounds.height)
        || terrain.length !== bounds.width * bounds.height) {
        throw new Error('Road terrain snapshot does not match the planning bounds');
    }
    if (blocked.some((index) => !Number.isSafeInteger(index) || index < 0 || index >= terrain.length || terrain[index] !== null)) {
        throw new Error('Road terrain snapshot has invalid blocked cells');
    }
    const blockedIndices = new Set(blocked);
    const readDirections = (cells: typeof protectedCells, label: string): Map<number, Set<string>> => {
        const result = new Map<number, Set<string>>();
        for (const { index, directions } of cells) {
            if (!Number.isSafeInteger(index) || index < 0 || index >= terrain.length || terrain[index] === null
                || result.has(index)
                || directions.some(({ x, y }) => !Number.isInteger(x) || !Number.isInteger(y)
                    || Math.abs(x) > 1 || Math.abs(y) > 1 || (x === 0 && y === 0))) {
                throw new Error(`Road terrain snapshot has invalid ${label} cells`);
            }
            result.set(index, new Set(directions.map(({ x, y }) => `${x},${y}`)));
        }
        return result;
    };
    const protectedDirections = readDirections(protectedCells, 'protected');
    const generatedDirections = readDirections(generatedCells, 'generated');
    const inheritedDirections = readDirections(inheritedCells, 'inherited');
    const hasDirection = (index: number, direction: string): boolean =>
        !!protectedDirections.get(index)?.has(direction) || !!generatedDirections.get(index)?.has(direction)
        || !!inheritedDirections.get(index)?.has(direction);

    const indexOf = ({ x, y }: RoadCell): number => (y - bounds.y) * bounds.width + x - bounds.x;
    const canConnect = (from: RoadCell, to: RoadCell): boolean => {
        const fromDirections = protectedDirections.get(indexOf(from));
        const toDirections = protectedDirections.get(indexOf(to));
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        return (!fromDirections || hasDirection(indexOf(from), `${dx},${dy}`))
            && (!toDirections || hasDirection(indexOf(to), `${-dx},${-dy}`));
    };
    const existingEdges: [RoadCell, RoadCell][] = [];
    const existingDirections = new Map<number, Set<string>>();
    for (const entries of [protectedDirections, generatedDirections, inheritedDirections]) {
        for (const [index, directions] of entries) {
            const combined = existingDirections.get(index) ?? new Set<string>();
            directions.forEach((direction) => combined.add(direction));
            existingDirections.set(index, combined);
        }
    }
    for (const [index, directions] of existingDirections) {
        const from = { x: bounds.x + index % bounds.width, y: bounds.y + Math.floor(index / bounds.width) };
        for (const direction of directions) {
            const [dx, dy] = direction.split(',').map(Number);
            const to = { x: from.x + dx, y: from.y + dy };
            if (to.x < bounds.x || to.x >= bounds.x + bounds.width
                || to.y < bounds.y || to.y >= bounds.y + bounds.height) {
                continue;
            }
            const toIndex = indexOf(to);
            if (toIndex > index && hasDirection(toIndex, `${-dx},${-dy}`) && canConnect(from, to)) {
                existingEdges.push([from, to]);
            }
        }
    }

    return planRoadNetwork({
        ...options,
        bounds,
        terrainAt: (cell) => terrain[indexOf(cell)] ?? undefined,
        isBlocked: (cell) => blockedIndices.has(indexOf(cell)),
        canConnect,
        existingEdges,
        roadTargets: [...inheritedDirections].filter(([, directions]) => directions.size > 0).map(([index]) => ({
            x: bounds.x + index % bounds.width,
            y: bounds.y + Math.floor(index / bounds.width),
        })),
        boundaryTargets: [...protectedDirections.keys()].map((index) => ({
            x: bounds.x + index % bounds.width,
            y: bounds.y + Math.floor(index / bounds.width),
        })),
        canEndAtBoundary: (protectedCell, adjacentCell) => protectedDirections.has(indexOf(protectedCell))
            && !protectedDirections.has(indexOf(adjacentCell))
            && !canConnect(protectedCell, adjacentCell),
    });
}
