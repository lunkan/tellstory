import { config } from "../../../../engine/config/config";
import { getCellEdges } from "../../../../engine/world/cell-edges";
import { QuadNode } from "../../../../engine/world/quad-node";
import { getRandFromSeeds, seedFromString } from "../../../../engine/util/number-generator";

type DrawVectorsOptions = {
    ctx: CanvasRenderingContext2D;
    /** Visible nodes at every depth from the root down to `depth`. */
    nodes: QuadNode[];
    /** Depth being rendered. */
    depth: number;
}

type Point = { x: number, y: number };
type Segment = [Point, Point];
type StyleGroup = { type: string, value: number, scale: number, segments: Segment[] };

const VECTOR_WIDTH_PIXELS = 4;
const DEFAULT_COLOR = '#000000';
// How far a point may wander from its cell position, as a share of the cell size
const WOBBLE = 0.12;
// Every type is shifted by its own constant offset (share of the cell size), so types on one path don't cover each other
const TYPE_OFFSET = 0.12;

/**
 * Draws vectors at the rendered depth. What passes through each cell comes from the vectors'
 * placement (see getCellEdges). The pieces of a road are joined into chains and drawn as smooth
 * curves. Roads are not kinked at cell borders or centres, and each point is nudged by a seed taken
 * from its position, so a road looks the same every time it is drawn.
 */
export function drawVectors(options: DrawVectorsOptions): void {
    const { ctx, nodes, depth } = options;

    const cells = new Map<string, QuadNode>();
    nodes.forEach((node) => {
        if (node.depth === depth) {
            cells.set(node.key.id, node);
        }
    });

    const size = cells.values().next().value?.bounds.size;
    if (!size) {
        return;
    }

    const { edges, links } = getCellEdges(depth, nodes, cells);

    const groups = new Map<string, StyleGroup>();
    const group = (type: string, value: number, scale: number): StyleGroup => {
        const key = `${type}|${value}|${scale}`;
        let styleGroup = groups.get(key);
        if (!styleGroup) {
            styleGroup = { type, value, scale, segments: [] };
            groups.set(key, styleGroup);
        }

        return styleGroup;
    };

    edges.forEach(({ cell, direction, type, value, scale }) => {
        const { x, y, size: cellSize } = cell.bounds;
        const centre = { x: x + cellSize / 2, y: y + cellSize / 2 };
        const border = { x: centre.x + direction.x * cellSize / 2, y: centre.y + direction.y * cellSize / 2 };
        group(type, value, scale).segments.push([centre, border]);
    });

    links.forEach(({ points, type, value, scale }) => {
        for (let i = 1; i < points.length; i++) {
            // One piece per cell, so long runs get the wobble too instead of being ruler-straight.
            // Runs are straight or diagonal and cell sizes are powers of two, so the steps are exact.
            const a = points[i - 1];
            const b = points[i];
            const steps = Math.max(1, Math.round(Math.max(Math.abs(b.x - a.x), Math.abs(b.y - a.y)) / size));
            const sx = Math.sign(b.x - a.x);
            const sy = Math.sign(b.y - a.y);
            let from = a;
            for (let step = 1; step <= steps; step++) {
                const to = step === steps ? b : { x: a.x + sx * step * size, y: a.y + sy * step * size };
                group(type, value, scale).segments.push([from, to]);
                from = to;
            }
        }
    });

    // Screen pixels -> grid units at the current zoom
    const pixel = 1 / ctx.getTransform().a;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Points used by more than one style of the same type are crossings between roads of one network.
    // Chains must end there, otherwise the smoothing cuts the corner. Other types are independent.
    const seen = new Map<string, string>();
    const sharedByType = new Map<string, Set<string>>();
    const graphByType = new Map<string, Graph>();
    groups.forEach((styleGroup, groupKey) => {
        const graph = graphByType.get(styleGroup.type) ?? new Map();
        graphByType.set(styleGroup.type, graph);

        styleGroup.segments.forEach(([a, b]) => {
            _addBranch(graph, a, b);
            _addBranch(graph, b, a);
            [a, b].forEach((point) => {
                const key = `${styleGroup.type}@${_key(point)}`;
                const owner = seen.get(key);
                if (owner === undefined) {
                    seen.set(key, groupKey);
                } else if (owner !== groupKey) {
                    const shared = sharedByType.get(styleGroup.type) ?? new Set<string>();
                    shared.add(_key(point));
                    sharedByType.set(styleGroup.type, shared);
                }
            });
        });
    });

    const ordered = [...groups.values()].sort((a, b) => _priority(a.type) - _priority(b.type) || a.type.localeCompare(b.type));
    const tangentCache = new Map<string, Map<string, Map<string, Point>>>();

    ordered.forEach(({ type, value, scale, segments }) => {
        ctx.strokeStyle = config.getVector(type)?.meta?.color ?? DEFAULT_COLOR;
        ctx.lineWidth = VECTOR_WIDTH_PIXELS * _widthMultiplier(type) * (0.5 + value) * (1 + scale / 2) * pixel;

        const seed = seedFromString(type);
        const offset = {
            x: (getRandFromSeeds(seed, 1n) - 0.5) * 2 * TYPE_OFFSET * size,
            y: (getRandFromSeeds(seed, 2n) - 0.5) * 2 * TYPE_OFFSET * size,
        };

        const graph = graphByType.get(type)!;
        const tangents = tangentCache.get(type) ?? new Map<string, Map<string, Point>>();
        tangentCache.set(type, tangents);
        const tangentAt = (junction: string, neighbour: string): Point | undefined => {
            let pairs = tangents.get(junction);
            if (!pairs) {
                pairs = _pairBranches(graph.get(junction));
                tangents.set(junction, pairs);
            }

            return pairs.get(neighbour);
        };

        _buildChains(segments, sharedByType.get(type) ?? new Set()).forEach(({ keys, points }) => {
            const last = keys.length - 1;
            const end = tangentAt(keys[last], keys[last - 1]);
            _strokeSmooth(
                ctx,
                points.map((point) => _wobble(point, size, seed, offset)),
                tangentAt(keys[0], keys[1]),
                end && { x: -end.x, y: -end.y },
            );
        });
    });
}

// Hard-coded until the multiplier is stored in the vector config meta
const WIDTH_MULTIPLIER_FALLBACK: Record<string, number> = { road: 1 / 3, river: 1 / 2 };

const _widthMultiplier = (type: string) =>
    config.getVector(type)?.meta?.widthMultiplier ?? WIDTH_MULTIPLIER_FALLBACK[type] ?? 1;

// Hard-coded until vector config gets a priority in meta. Higher is drawn on top.
const PRIORITY: Record<string, number> = { river: 0, road: 10 };
const _priority = (type: string) => PRIORITY[type] ?? 5;

type Graph = Map<string, { point: Point, branches: Map<string, Point> }>;

function _addBranch(graph: Graph, from: Point, to: Point): void {
    const key = _key(from);
    const node = graph.get(key) ?? { point: from, branches: new Map() };
    node.branches.set(_key(to), to);
    graph.set(key, node);
}

// Branches at least this opposite (cos of the angle between them) count as one line through the junction
const THROUGH_COS = Math.cos(Math.PI * 135 / 180) + 1e-6;

/**
 * Pairs the branches of a junction that continue each other (angle of 135 degrees or more, straightest
 * first), so the two curves leave it on a shared tangent and read as one line. Returns, per paired
 * branch, the direction pointing away from the junction into that branch. The rest end at the junction.
 */
function _pairBranches(node: { point: Point, branches: Map<string, Point> } | undefined): Map<string, Point> {
    const result = new Map<string, Point>();
    if (!node || node.branches.size < 2) {
        return result;
    }

    const list = [...node.branches.entries()]
        .sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0) // Stable order, so ties never depend on iteration
        .map(([key, point]) => ({ key, direction: _normalize(point.x - node.point.x, point.y - node.point.y) }));

    const pairs: { i: number, j: number, dot: number }[] = [];
    for (let i = 0; i < list.length; i++) {
        for (let j = i + 1; j < list.length; j++) {
            const dot = list[i].direction.x * list[j].direction.x + list[i].direction.y * list[j].direction.y;
            if (dot <= THROUGH_COS) {
                pairs.push({ i, j, dot });
            }
        }
    }

    pairs.sort((a, b) => a.dot - b.dot);
    pairs.forEach(({ i, j }) => {
        if (result.has(list[i].key) || result.has(list[j].key)) {
            return;
        }

        const a = list[i].direction;
        const b = list[j].direction;
        result.set(list[i].key, _normalize(a.x - b.x, a.y - b.y));
        result.set(list[j].key, _normalize(b.x - a.x, b.y - a.y));
    });

    return result;
}

function _normalize(x: number, y: number): Point {
    const length = Math.hypot(x, y) || 1;
    return { x: x / length, y: y / length };
}

const _key = (point: Point) => `${point.x},${point.y}`;
const _edgeKey = (a: string, b: string) => a < b ? `${a}|${b}` : `${b}|${a}`;

type Chain = { keys: string[], points: Point[] };

/**
 * Joins segments that share an end point into chains. A chain ends where a point has one or three
 * or more segments, or where styles of one type meet, so junctions are chain ends.
 */
function _buildChains(segments: Segment[], breaks: Set<string>): Chain[] {
    const points = new Map<string, Point>();
    const neighbours = new Map<string, string[]>();

    const connect = (a: string, b: string) => {
        const list = neighbours.get(a) ?? [];
        if (!list.includes(b)) {
            list.push(b);
        }

        neighbours.set(a, list);
    };

    segments.forEach(([a, b]) => {
        const ka = _key(a);
        const kb = _key(b);
        if (ka === kb) {
            return;
        }

        points.set(ka, a);
        points.set(kb, b);
        connect(ka, kb);
        connect(kb, ka);
    });

    const used = new Set<string>();
    const chains: Chain[] = [];

    const walk = (start: string, next: string): void => {
        const chain = [start, next];
        used.add(_edgeKey(start, next));

        let previous = start;
        let current = next;
        while (neighbours.get(current)!.length === 2 && !breaks.has(current)) {
            const following = neighbours.get(current)!.find((key) => key !== previous)!;
            if (used.has(_edgeKey(current, following))) {
                break; // Closed loop
            }

            used.add(_edgeKey(current, following));
            chain.push(following);
            previous = current;
            current = following;
        }

        chains.push({ keys: chain, points: chain.map((key) => points.get(key)!) });
    };

    // From open ends and junctions first, then whatever is left is a closed loop
    [true, false].forEach((endsOnly) => {
        neighbours.forEach((list, key) => {
            if (endsOnly && list.length === 2 && !breaks.has(key)) {
                return;
            }

            list.forEach((next) => {
                if (!used.has(_edgeKey(key, next))) {
                    walk(key, next);
                }
            });
        });
    });

    return chains;
}

/**
 * Curves through the midpoints of the chain, using each point as the control. The ends stay in place.
 * `startDir` and `endDir` are the travel directions at the ends, set where a junction pairs this chain
 * with another one, so both leave the junction on the same tangent.
 */
function _strokeSmooth(ctx: CanvasRenderingContext2D, points: Point[], startDir?: Point, endDir?: Point): void {
    const count = points.length;
    const direction = (a: Point, b: Point) => _normalize(b.x - a.x, b.y - a.y);
    const first = direction(points[0], points[1]);
    const last = direction(points[count - 2], points[count - 1]);

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    if (count === 2) {
        _piece(ctx, points[0], points[1], startDir ?? first, endDir ?? first);
    } else {
        const mid = (i: number): Point => ({ x: (points[i].x + points[i + 1].x) / 2, y: (points[i].y + points[i + 1].y) / 2 });

        _piece(ctx, points[0], mid(0), startDir ?? first, first);
        for (let i = 1; i < count - 1; i++) {
            const to = mid(i);
            ctx.quadraticCurveTo(points[i].x, points[i].y, to.x, to.y);
        }

        _piece(ctx, mid(count - 2), points[count - 1], last, endDir ?? last);
    }

    ctx.stroke();
}

/** A curve from the current point to `to` leaving along `fromDir` and arriving along `toDir`. Straight when both follow the chord. */
function _piece(ctx: CanvasRenderingContext2D, from: Point, to: Point, fromDir: Point, toDir: Point): void {
    const reach = Math.hypot(to.x - from.x, to.y - from.y) * 0.4;
    ctx.bezierCurveTo(
        from.x + fromDir.x * reach, from.y + fromDir.y * reach,
        to.x - toDir.x * reach, to.y - toDir.y * reach,
        to.x, to.y,
    );
}

// Seeded by position only, so neighbouring pieces that share a point move it the same way
function _wobble(point: Point, size: number, typeSeed: bigint, offset: Point): Point {
    const seedX = BigInt(Math.round(point.x * 2)) ^ typeSeed;
    const seedY = BigInt(Math.round(point.y * 2));
    return {
        x: point.x + offset.x + (getRandFromSeeds(seedX, seedY, 1n) - 0.5) * 2 * WOBBLE * size,
        y: point.y + offset.y + (getRandFromSeeds(seedX, seedY, 2n) - 0.5) * 2 * WOBBLE * size,
    };
}
