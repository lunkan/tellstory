import { VectorSetting } from '../types';
import { getCellCost } from './cell-cost';
import { QuadNode } from './quad-node';
import { getVectorCell } from './vector-placement';

/** Half a connection: from the centre of `cell` to its border (corner for diagonals) in `direction`. */
export type CellEdge = {
    cell: QuadNode;
    direction: { x: number, y: number };
    type: string;
    value: number;
    /** Scale of the node the vector was drawn on. Shallow hosts are prominent roads. */
    scale: number;
}

/** A route between two cells of the same road: a polyline through points in grid units. */
export type CellLink = {
    points: { x: number, y: number }[];
    type: string;
    value: number;
    scale: number;
}

export type CellEdges = {
    edges: CellEdge[];
    links: CellLink[];
}

type CellIndex = { ix: number, iy: number };

// How much terrain cost outweighs distance. A step over cost 1 terrain is this much longer than over flat ground.
const COST_WEIGHT = 4;
// Routes over a bigger box than this (in cells) skip the cost search and go diagonal, then straight.
const MAX_SEARCH_CELLS = 25;

/**
 * Route between two cells at the same depth, as cell indexes from `a` to `b` (8-neighbour steps).
 * Small spans take the cheapest monotone route, so a hill in the way is walked around. Big spans go
 * diagonal then straight. Must stay deterministic.
 */
export function routeCells(a: CellIndex, b: CellIndex, costAt: (cell: CellIndex) => number): CellIndex[] {
    const dx = Math.abs(b.ix - a.ix);
    const dy = Math.abs(b.iy - a.iy);
    const sx = Math.sign(b.ix - a.ix);
    const sy = Math.sign(b.iy - a.iy);
    const at = (i: number, j: number): CellIndex => ({ ix: a.ix + i * sx, iy: a.iy + j * sy });

    if ((dx + 1) * (dy + 1) > MAX_SEARCH_CELLS) {
        const diagonal = Math.min(dx, dy);
        const corner = at(diagonal, diagonal);
        return corner.ix === b.ix && corner.iy === b.iy ? [a, b] : [a, corner, b];
    }

    const cost = Array.from({ length: dx + 1 }, (_, i) => Array.from({ length: dy + 1 }, (_, j) => costAt(at(i, j))));
    const best: number[][] = Array.from({ length: dx + 1 }, () => new Array<number>(dy + 1).fill(Infinity));
    const from: [number, number][][] = Array.from({ length: dx + 1 }, () => new Array<[number, number]>(dy + 1));
    best[0][0] = 0;

    for (let i = 0; i <= dx; i++) {
        for (let j = 0; j <= dy; j++) {
            // Diagonal first, so a tie prefers the direct route
            for (const [pi, pj] of [[i - 1, j - 1], [i - 1, j], [i, j - 1]]) {
                if (pi < 0 || pj < 0) {
                    continue;
                }

                const length = pi !== i && pj !== j ? Math.SQRT2 : 1;
                const total = best[pi][pj] + length * (1 + COST_WEIGHT * (cost[pi][pj] + cost[i][j]) / 2);
                if (total < best[i][j]) {
                    best[i][j] = total;
                    from[i][j] = [pi, pj];
                }
            }
        }
    }

    const route: CellIndex[] = [];
    let step: [number, number] | undefined = [dx, dy];
    while (step) {
        route.push(at(step[0], step[1]));
        step = step[0] === 0 && step[1] === 0 ? undefined : from[step[0]][step[1]];
    }

    return route.reverse();
}

type Item = { vector: VectorSetting, host: QuadNode };

/**
 * A cell where roads that were separate until then meet. `members` are one vector per joined road
 * (the ones that get linked), `all` is every vector of the joined roads (they decide the junction).
 */
type Meeting = { cell: QuadNode, depth: number, members: number[], all: number[] };

/** The vectors of `hosts` down to `depth`, in an order that never depends on how the nodes were visited. */
function _collectItems(hosts: readonly QuadNode[], depth: number): Item[] {
    const items: Item[] = [];
    [...hosts]
        .filter((host) => host.depth <= depth)
        .sort((a, b) => a.depth - b.depth || (a.key.hash < b.key.hash ? -1 : a.key.hash > b.key.hash ? 1 : 0))
        .forEach((host) => host.getOwnVectors().forEach((vector) => items.push({ vector, host })));

    return items;
}

/**
 * Finds where roads meet, from the shallowest host down to `depth`. When vectors that are not yet
 * connected share a cell, that cell is a meeting and they are connected from then on. Vectors that
 * are already connected and share a cell are not a new meeting, so no loops are created.
 * Only one vector per previously separate road is a member, since the rest are linked through the
 * earlier meeting.
 */
function _findMeetings(items: Item[], depth: number): Meeting[] {
    const parent = items.map((_, index) => index);
    const find = (i: number): number => {
        while (parent[i] !== i) {
            parent[i] = parent[parent[i]];
            i = parent[i];
        }

        return i;
    };

    const meetings: Meeting[] = [];
    const firstDepth = Math.min(...items.map(({ host }) => host.depth));
    for (let d = firstDepth; d <= depth; d++) {
        const cells = new Map<string, { cell: QuadNode, members: number[] }>();
        items.forEach(({ vector, host }, index) => {
            const cell = getVectorCell(vector, host, d);
            if (cell) {
                const entry = cells.get(cell.key.id) ?? { cell, members: [] };
                entry.members.push(index);
                cells.set(cell.key.id, entry);
            }
        });

        cells.forEach(({ cell, members }) => {
            const representatives = new Map<number, number>();
            members.forEach((index) => {
                const root = find(index);
                if (!representatives.has(root)) {
                    representatives.set(root, index);
                }
            });

            if (representatives.size < 2) {
                return;
            }

            // Lowest index becomes the root, so the result never depends on union order
            const roots = [...representatives.keys()];
            const lowest = Math.min(...roots);
            roots.forEach((root) => parent[root] = lowest);
            const all = items.map((_, index) => index).filter((index) => find(index) === lowest);
            meetings.push({ cell, depth: d, members: [...representatives.values()], all });
        });
    }

    return meetings;
}

/**
 * Everything to draw for vectors at `depth`, derived from vector placements (nothing is stored):
 * - an edge for each vector in a visible cell, and
 * - links from the vectors of each meeting to the meeting's junction at this depth. The junction is
 *   a child of the previous level's junction, chosen by where the network's vectors really are
 *   (see _findJunction), so it never jumps away from where the roads joined.
 *   Two crossings in different cells can never merge.
 * Mirror vectors on neighbouring hosts meet at the shared border instead.
 */
export function getCellEdges(depth: number, hosts: readonly QuadNode[], visibleCells: ReadonlyMap<string, QuadNode>): CellEdges {
    const edges: CellEdge[] = [];
    const links: CellLink[] = [];

    // Sorted, so which vector represents a road never depends on the order nodes were visited
    const items = _collectItems(hosts, depth);

    items.forEach(({ vector, host }) => {
        const cell = getVectorCell(vector, host, depth);
        if (cell && visibleCells.has(cell.key.id)) {
            edges.push({ cell, direction: vector.direction, type: vector.type, value: vector.value, scale: host.scale });
        }
    });

    if (!items.length) {
        return { edges, links };
    }

    // Each vector type is its own network, so a river never joins a road's junction
    const types = [...new Set(items.map(({ vector }) => vector.type))];
    types.forEach((type) => _linkNetwork(items.filter(({ vector }) => vector.type === type), depth, links));

    return { edges, links };
}

/**
 * The junction cell of a meeting at `depth`. It starts as the meeting cell, and each level down it
 * is the child, of the previous junction, that holds most of the network's vectors (ties go to the
 * lowest key). So it is always a child of the previous junction, and it is on a road that really
 * passes there, near where the roads actually join.
 */
function _findJunction(items: Item[], meeting: Meeting, depth: number): QuadNode | undefined {
    let hub = meeting.cell;
    for (let d = meeting.depth + 1; d <= depth; d++) {
        const counts = new Map<string, { cell: QuadNode, count: number }>();
        let unresolved = false;

        meeting.all.forEach((index) => {
            const { vector, host } = items[index];
            const cell = getVectorCell(vector, host, d);
            if (!cell) {
                unresolved = true;
            } else if (cell.parent === hub) {
                const entry = counts.get(cell.key.id) ?? { cell, count: 0 };
                entry.count++;
                counts.set(cell.key.id, entry);
            }
        });

        if (unresolved || !counts.size) {
            return; // Not narrowed this deep yet
        }

        hub = [...counts.values()]
            .sort((a, b) => b.count - a.count || (a.cell.key.hash < b.cell.key.hash ? -1 : a.cell.key.hash > b.cell.key.hash ? 1 : 0))[0].cell;
    }

    return hub;
}

function _linkNetwork(items: Item[], depth: number, links: CellLink[]): void {
    _findMeetings(items, depth).forEach((meeting) => {
        const hub = _findJunction(items, meeting, depth);
        if (!hub) {
            return; // Not narrowed this deep yet
        }

        const root = hub.getAncestors().at(-1) ?? hub;
        const size = hub.bounds.size;
        const costAt = ({ ix, iy }: CellIndex) => getCellCost(root.findByPoint({ x: ix * size, y: iy * size, z: depth }));
        const toIndex = (cell: QuadNode): CellIndex => ({ ix: Math.round(cell.bounds.x / size), iy: Math.round(cell.bounds.y / size) });

        meeting.members.forEach((index) => {
            const { vector, host } = items[index];
            const cell = getVectorCell(vector, host, depth);
            if (!cell || cell === hub) {
                return;
            }

            const points = routeCells(toIndex(hub), toIndex(cell), costAt)
                .map(({ ix, iy }) => ({ x: (ix + 0.5) * size, y: (iy + 0.5) * size }));
            links.push({ points, type: vector.type, value: vector.value, scale: host.scale });
        });
    });
}

