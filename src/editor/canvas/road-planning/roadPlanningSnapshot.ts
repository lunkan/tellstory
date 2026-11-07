import { QuadNode } from '../../../../engine/world/quad-node';
import { getCellEdges } from '../../../../engine/world/cell-edges';
import { RoadCell, RoadSearchBounds, RoadTerrain } from '../../../../engine/world/vector-generation/road-path';
import { MAX_ROAD_CONNECTION_DISTANCE } from '../../../../engine/world/vector-generation/road-plan';
import { GridBounds } from '../types';
import { RoadPlanningRequest } from './roadPlannerProtocol';

/** Visible grid bounds expanded by the maximum road target distance and clipped to the world. */
export function getRoadPlanningBounds(root: QuadNode, depth: number, visible: GridBounds): RoadSearchBounds | undefined {
    if (!Number.isSafeInteger(depth) || depth < 0 || depth > root.maxDepth
        || ![visible.x, visible.y, visible.xSize, visible.ySize].every(Number.isSafeInteger)
        || visible.xSize < 0 || visible.ySize < 0
        || !Number.isSafeInteger(visible.x + visible.xSize) || !Number.isSafeInteger(visible.y + visible.ySize)) {
        throw new Error('Invalid road planning viewport or depth');
    }

    const worldSize = 2 ** depth;
    const visibleLeft = Math.max(0, visible.x);
    const visibleTop = Math.max(0, visible.y);
    const visibleRight = Math.min(worldSize, visible.x + visible.xSize);
    const visibleBottom = Math.min(worldSize, visible.y + visible.ySize);
    if (visibleRight <= visibleLeft || visibleBottom <= visibleTop) {
        return undefined;
    }

    const x = Math.max(0, visibleLeft - MAX_ROAD_CONNECTION_DISTANCE);
    const y = Math.max(0, visibleTop - MAX_ROAD_CONNECTION_DISTANCE);
    const right = Math.min(worldSize, visibleRight + MAX_ROAD_CONNECTION_DISTANCE);
    const bottom = Math.min(worldSize, visibleBottom + MAX_ROAD_CONNECTION_DISTANCE);
    return { x, y, width: right - x, height: bottom - y };
}

export type RoadSnapshot =
    | { status: 'ready'; request: RoadPlanningRequest }
    | { status: 'missing-terrain'; cells: RoadCell[]; request: RoadPlanningRequest };

/** Reads existing cells only; missing tiles are reported, not created or treated as flat. */
export function createRoadPlanningSnapshot(root: QuadNode, depth: number, bounds: RoadSearchBounds, roadType = 'road'): RoadSnapshot {
    const worldSize = 2 ** depth;
    if (!Number.isSafeInteger(depth) || depth < 0 || depth > root.maxDepth
        || ![bounds.x, bounds.y, bounds.width, bounds.height].every(Number.isSafeInteger)
        || bounds.x < 0 || bounds.y < 0 || bounds.width <= 0 || bounds.height <= 0
        || bounds.x + bounds.width > worldSize || bounds.y + bounds.height > worldSize) {
        throw new Error('Invalid road planning snapshot bounds or depth');
    }
    const tileSize = root.bounds.size / worldSize;
    const terrain: (RoadTerrain | null)[] = [];
    const missing: RoadCell[] = [];
    const blocked: number[] = [];
    const protectedCells: NonNullable<RoadPlanningRequest['protectedCells']> = [];
    for (let y = bounds.y; y < bounds.y + bounds.height; y++) {
        for (let x = bounds.x; x < bounds.x + bounds.width; x++) {
            const node = root.findByPoint({ x: x * tileSize, y: y * tileSize, z: depth });
            const tile = node?.getTile();
            if (!tile) {
                missing.push({ x, y });
                blocked.push(terrain.length);
                terrain.push(null);
                continue;
            }
            if (node && !node.canHydrate()) {
                protectedCells.push({
                    index: terrain.length,
                    directions: node.getOwnVectors()
                        .filter((vector) => vector.type === roadType)
                        .map(({ direction }) => ({ ...direction })),
                });
            }
            terrain.push({
                urban: tile.terrain.find((item) => item.type === 'urban')?.value ?? 0,
                elevation: tile.terrain.find((item) => item.type === 'elevation')?.value ?? 0,
            });
        }
    }
    const nodes = root.findByRect({
        x: bounds.x * tileSize, y: bounds.y * tileSize,
        width: bounds.width * tileSize, height: bounds.height * tileSize, z: depth,
    }, { selectAllDepth: true });
    const cells = new Map(nodes.filter((node) => node.depth === depth).map((node) => [node.key.id, node]));
    const hosts = nodes.filter((node) => node.depth < depth && node.getOwnVectors().some((vector) => vector.type === roadType));
    const resolved = getCellEdges(depth, hosts, cells);
    const inherited = new Map<number, Set<string>>();
    const addDirection = (x: number, y: number, dx: number, dy: number): void => {
        if (x < bounds.x || x >= bounds.x + bounds.width || y < bounds.y || y >= bounds.y + bounds.height) {
            return;
        }
        const index = (y - bounds.y) * bounds.width + x - bounds.x;
        if (!terrain[index]) {
            return;
        }
        const directions = inherited.get(index) ?? new Set<string>();
        directions.add(`${dx},${dy}`);
        inherited.set(index, directions);
    };
    for (const edge of resolved.edges) {
        if (edge.type === roadType) {
            addDirection(edge.cell.bounds.x / tileSize, edge.cell.bounds.y / tileSize, edge.direction.x, edge.direction.y);
        }
    }
    for (const link of resolved.links) {
        if (link.type !== roadType) {
            continue;
        }
        for (let i = 1; i < link.points.length; i++) {
            const from = link.points[i - 1];
            const to = link.points[i];
            const dx = Math.sign(to.x - from.x);
            const dy = Math.sign(to.y - from.y);
            const steps = Math.round(Math.max(Math.abs(to.x - from.x), Math.abs(to.y - from.y)) / tileSize);
            let x = Math.floor(from.x / tileSize);
            let y = Math.floor(from.y / tileSize);
            for (let step = 0; step < steps; step++) {
                addDirection(x, y, dx, dy);
                x += dx;
                y += dy;
                addDirection(x, y, -dx, -dy);
            }
        }
    }
    const inheritedCells = [...inherited].sort(([a], [b]) => a - b).map(([index, directions]) => ({
        index,
        directions: [...directions].map((direction) => {
            const [x, y] = direction.split(',').map(Number);
            return { x, y };
        }).sort((a, b) => a.y - b.y || a.x - b.x),
    }));
    const request: RoadPlanningRequest = { bounds, terrain, blocked, protectedCells, inheritedCells };
    return missing.length ? { status: 'missing-terrain', cells: missing, request } : { status: 'ready', request };
}
