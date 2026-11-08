import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getCellEdges } from '../cell-edges';
import { connectGeneratedNodes } from '../connect-nodes';
import { QuadNode } from '../quad-node';
import { ROAD_URBAN_THRESHOLD, RoadCell, RoadTerrain } from './road-path';
import { planRoadNetwork, RoadPlanOptions, MAX_ROAD_CONNECTION_DISTANCE } from './road-plan';

function options(rows: string[]): RoadPlanOptions {
    return {
        bounds: { x: 0, y: 0, width: rows[0].length, height: rows.length },
        terrainAt: ({ x, y }): RoadTerrain => ({
            urban: rows[y][x] === '#' ? 1 : rows[y][x] === 's' ? 0.3 : 0,
            elevation: rows[y][x] === '^' ? 1 : 0,
        }),
    };
}

function edgeKeys(cells: RoadCell[]): string[] {
    return cells.slice(1).map((cell, index) => {
        const from = cells[index];
        return [`${from.x},${from.y}`, `${cell.x},${cell.y}`].sort().join('|');
    });
}

test('empty terrain and a single urban cell have no connections', () => {
    assert.deepEqual(planRoadNetwork(options(['...'])), { connections: [], components: [] });
    assert.deepEqual(planRoadNetwork(options(['.#.'])), {
        connections: [],
        components: [[{ x: 1, y: 0 }]],
    });
});

test('urban targets include the threshold but exclude lower values', () => {
    assert.equal(ROAD_URBAN_THRESHOLD, 0.1);
    const values = [0.099, 0.1, 0.101];
    const plan = planRoadNetwork({
        bounds: { x: 0, y: 0, width: 3, height: 1 },
        terrainAt: ({ x }) => ({ urban: values[x], elevation: 0 }),
    });
    assert.deepEqual(plan.components, [[{ x: 1, y: 0 }], [{ x: 2, y: 0 }]]);
    assert.deepEqual(plan.connections, []);
});

test('endpoint value product sets the maximum distance for nearby pairs at each threshold', () => {
    const cases = [
        { product: 0.0599, max: 0 }, { product: 0.06, max: 1 }, { product: 0.1199, max: 1 },
        { product: 0.12, max: 2 }, { product: 0.1799, max: 2 },
    ];
    for (const { product, max } of cases) {
        for (const diagonal of [false, true]) {
            for (let distance = 1; distance <= 2; distance++) {
                const end = { x: distance, y: diagonal ? distance : 0 };
                const left = product < 0.1 ? 0.5 : 1;
                const right = product / left;
                const plan = planRoadNetwork({
                    bounds: { x: 0, y: 0, width: distance + 1, height: end.y + 1 },
                    terrainAt: ({ x, y }) => ({
                        urban: x === 0 && y === 0 ? left : x === end.x && y === end.y ? right : 0,
                        elevation: 0,
                    }),
                });
                assert.equal(plan.connections.length > 0, distance <= max,
                    `product ${product}, distance ${distance}, diagonal ${diagonal}`);
            }
        }
    }
});

test('urban tiles can use their actual value or their inherited road target value', () => {
    const base: RoadPlanOptions = {
        bounds: { x: 0, y: 0, width: 2, height: 1 },
        terrainAt: ({ x }) => ({ urban: x === 0 ? 0.5 : 0.1, elevation: 0 }),
    };
    assert.deepEqual(planRoadNetwork(base).connections, []);
    const viaRoad = planRoadNetwork({ ...base, roadTargets: [{ x: 1, y: 0 }] });
    assert.deepEqual(viaRoad.connections[0].cells, [{ x: 0, y: 0 }, { x: 1, y: 0 }]);
});

test('distance bonuses favour denser urban pairs while respecting score boundaries', () => {
    for (const { a, b, distance, expected } of [
        { a: 0.4, b: 0.4, distance: 2, expected: true },
        { a: 0.3, b: 0.3, distance: 2, expected: false },
        { a: 0.4, b: 0.4, distance: 3, expected: true },
        { a: 0.31, b: 0.31, distance: 3, expected: false },
        { a: 0.33, b: 0.33, distance: 3, expected: true },
        { a: 1, b: 0.14, distance: 3, expected: false },
        { a: 1, b: 0.141, distance: 3, expected: true },
        { a: 0.18 / (0.2 * 1.4), b: 0.2, distance: 3, expected: true },
        { a: 0.45, b: 0.45, distance: 4, expected: true },
        { a: 0.42, b: 0.42, distance: 4, expected: true },
        { a: 0.32, b: 0.32, distance: 4, expected: false },
        { a: 0.9, b: 0.15, distance: 4, expected: false },
        { a: 1, b: 0.1499, distance: 4, expected: false },
        { a: 1, b: 0.15, distance: 4, expected: true },
        { a: 1, b: 1, distance: 5, expected: false },
    ]) {
        for (const diagonal of [false, true]) {
            for (const [left, right] of [[a, b], [b, a]]) {
                const end = { x: distance, y: diagonal ? distance : 0 };
                const plan = planRoadNetwork({
                    bounds: { x: 0, y: 0, width: distance + 1, height: end.y + 1 },
                    terrainAt: ({ x, y }) => ({
                        urban: x === 0 && y === 0 ? left : x === end.x && y === end.y ? right : 0,
                        elevation: 0,
                    }),
                });
                assert.equal(plan.connections.length > 0, expected,
                    `values ${left}, ${right}, distance ${distance}, diagonal ${diagonal}`);
            }
        }
    }
});

test('newly eligible urban pairs reuse complete existing road segments', () => {
    const plan = planRoadNetwork({
        bounds: { x: 0, y: 0, width: 4, height: 2 },
        terrainAt: ({ x, y }) => ({
            urban: y === 0 && (x === 0 || x === 3) ? 0.4 : 0,
            elevation: 0,
        }),
        existingEdges: [
            [{ x: 0, y: 0 }, { x: 1, y: 1 }],
            [{ x: 1, y: 1 }, { x: 2, y: 1 }],
        ],
    });
    assert.deepEqual(plan.connections[0].cells, [
        { x: 0, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 0 },
    ]);
    assert.ok(Math.abs(plan.connections[0].travelTime - (1 + 2 * Math.SQRT2)) < 1e-12);
});

test('urban targets with inherited roads use the best urban or road-joint score', () => {
    for (const { a, b, distance } of [
        { a: 0.4, b: 0.4, distance: 3 },
        { a: 0.8, b: 0.1, distance: 4 },
    ]) {
        const base: RoadPlanOptions = {
            bounds: { x: 0, y: 0, width: distance + 1, height: 1 },
            terrainAt: ({ x }) => ({ urban: x === 0 ? a : x === distance ? b : 0, elevation: 0 }),
        };
        assert.equal(planRoadNetwork({ ...base, roadTargets: [{ x: distance, y: 0 }] }).connections.length, 1);
    }
});

test('adjacent urban cells form a network instead of collapsing into a single target', () => {
    const plan = planRoadNetwork(options(['###']));
    assert.equal(plan.connections.length, 2);
    assert.ok(plan.connections.every((connection) => connection.kind === 'road'));
    assert.equal(plan.components.length, 1);
    assert.equal(plan.components[0].length, 3);
    assert.deepEqual([...new Set(plan.connections.flatMap((connection) => edgeKeys(connection.cells)))].sort(), ['0,0|1,0', '1,0|2,0']);
});

test('urban chains can connect beyond four tiles through separate local pairs', () => {
    const plan = planRoadNetwork(options(['#...#...#']));
    assert.equal(plan.components.length, 1);
    assert.equal(plan.components[0].length, 3);
    assert.equal(plan.connections.length, 2);
    assert.ok(plan.connections.every((connection) => connection.kind === 'road' && connection.travelTime === 4));
    assert.equal(plan.connections.flatMap((connection) => edgeKeys(connection.cells)).length, 8);
});

test('limits endpoint distance in all directions with a configurable maximum', () => {
    assert.equal(MAX_ROAD_CONNECTION_DISTANCE, 4);
    const plan = planRoadNetwork(options(['#....#']));
    assert.deepEqual(plan.connections, []);
    assert.deepEqual(plan.components, [[{ x: 0, y: 0 }], [{ x: 5, y: 0 }]]);
    const atLimit = planRoadNetwork(options(['#...#']));
    assert.equal(atLimit.connections[0].travelTime, 4);
    assert.deepEqual(planRoadNetwork({ ...options(['#...#']), maxDistance: 3 }).connections, []);
    const diagonal = planRoadNetwork(options(['#....', '.....', '.....', '.....', '....#']));
    assert.equal(diagonal.connections[0].travelTime, 4 * Math.SQRT2);
    assert.equal(planRoadNetwork(options(['#.....', '......', '......', '......', '......', '.....#'])).connections.length, 0);
});

test('explicitly blocked cells are impassable and do not prevent nearby roads', () => {
    const base = options(['#.#.#']);
    const plan = planRoadNetwork({
        ...base,
        isBlocked: ({ x }) => x === 3,
        terrainAt: (cell) => cell.x === 3 ? undefined : base.terrainAt(cell),
    });
    assert.equal(plan.connections.length, 1);
    assert.deepEqual(plan.connections[0].cells, [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }]);
    assert.deepEqual(plan.components, [[{ x: 0, y: 0 }, { x: 2, y: 0 }], [{ x: 4, y: 0 }]]);
});

test('routes may detour around blocked cells', () => {
    const base = options(['...', '#.#', '...']);
    const plan = planRoadNetwork({ ...base, isBlocked: ({ x, y }) => x === 1 && y === 1 });
    assert.equal(plan.components.length, 1);
    assert.ok(!plan.connections[0].cells.some(({ x, y }) => x === 1 && y === 1));
    assert.ok(Math.abs(plan.connections[0].travelTime - 2 * Math.SQRT2) < 1e-12);
});

test('eligible urban pairs may take a detour longer than the old non-urban gap limit', () => {
    const base = options(['#.#', '...', '...', '...', '...', '...', '...']);
    const plan = planRoadNetwork({
        ...base,
        isBlocked: ({ x, y }) => x === 1 && y < 6,
    });
    assert.equal(plan.connections.length, 1);
    assert.ok(plan.connections[0].cells.length > 7);
    assert.equal(plan.components.length, 1);
});

test('chooses a lower-travel-time route around high elevation', () => {
    const plan = planRoadNetwork(options(['...', '#^#', '...']));
    assert.equal(plan.connections.length, 1);
    assert.equal(plan.connections[0].travelTime, 2 * Math.SQRT2);
    assert.ok(!plan.connections[0].cells.some(({ x, y }) => x === 1 && y === 1));
});

test('indirectly connected pairs reuse cheaper existing routes without duplicating them', () => {
    const map = options(['#.#', '...', '#..']);
    const plan = planRoadNetwork(map);
    assert.equal(plan.connections.length, 2);
    assert.equal(plan.components.length, 1);
});

test('sparse urban endpoints use the same local pair rule', () => {
    const plan = planRoadNetwork(options(['ss', 's.']));
    assert.equal(plan.components.length, 1);
    assert.equal(plan.connections.length, 2);
    assert.ok(plan.connections.every(({ kind }) => kind === 'road'));
});

test('pairs are planned in distance order before longer connections', () => {
    const plan = planRoadNetwork(options(['##.#..#...#']));
    assert.deepEqual(plan.connections.map(({ cells }) => [cells[0].x, cells[cells.length - 1].x]), [
        [0, 1], [1, 3], [3, 6], [6, 10],
    ]);
});

test('context-only roads influence visible routes without being emitted independently', () => {
    const plan = planRoadNetwork({
        ...options(['###']),
        commitBounds: { x: 0, y: 0, width: 1, height: 1 },
    });
    assert.deepEqual(plan.connections.map(({ cells }) => cells), [
        [{ x: 0, y: 0 }, { x: 1, y: 0 }],
        [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }],
    ]);
});

test('context-only pairs are considered before visible pairs at the same distance', () => {
    const plan = planRoadNetwork({
        ...options(['##', '.#']),
        commitBounds: { x: 0, y: 0, width: 1, height: 1 },
    });
    assert.deepEqual(plan.connections.map(({ cells }) => cells), [
        [{ x: 0, y: 0 }, { x: 1, y: 0 }],
        [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }],
    ]);
});

test('invalid commit bounds are rejected', () => {
    assert.throws(() => planRoadNetwork({
        ...options(['###']), commitBounds: { x: 1, y: 0, width: 3, height: 1 },
    }), /commit bounds/);
});

test('a later distant pair reuses roads generated by earlier shorter pairs', () => {
    const plan = planRoadNetwork(options(['#..#', '.#..']));
    assert.deepEqual(plan.connections.map(({ cells }) => [cells[0], cells[cells.length - 1]]), [
        [{ x: 0, y: 0 }, { x: 1, y: 1 }],
        [{ x: 3, y: 0 }, { x: 1, y: 1 }],
    ]);
    assert.equal(plan.components.length, 1);
});

test('discounts complete segments and reports actual travel time', () => {
    const base = options(['#..#', '....']);
    const existingEdges: [RoadCell, RoadCell][] = [
        [{ x: 0, y: 0 }, { x: 1, y: 1 }],
        [{ x: 1, y: 1 }, { x: 2, y: 1 }],
    ];
    const plan = planRoadNetwork({ ...base, existingEdges });
    assert.deepEqual(plan.connections[0].cells, [
        { x: 0, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 0 },
    ]);
    assert.ok(Math.abs(plan.connections[0].travelTime - (1 + 2 * Math.SQRT2)) < 1e-12);
});

test('crossing a road cell alone is not discounted', () => {
    const base = options(['...', '#.#', '...']);
    const existingEdges: [RoadCell, RoadCell][] = [
        [{ x: 1, y: 0 }, { x: 1, y: 1 }],
        [{ x: 1, y: 1 }, { x: 1, y: 2 }],
    ];
    const plan = planRoadNetwork({ ...base, existingEdges });
    assert.deepEqual(plan.connections[0].cells, [{ x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }]);
    assert.equal(plan.connections[0].travelTime, 2);
});

test('a sufficiently cheaper new route is added even when endpoints already have an indirect connection', () => {
    const base = options(['##.', '...', '...']);
    const existingEdges: [RoadCell, RoadCell][] = [
        [{ x: 0, y: 0 }, { x: 0, y: 1 }],
        [{ x: 0, y: 1 }, { x: 0, y: 2 }],
        [{ x: 0, y: 2 }, { x: 1, y: 2 }],
        [{ x: 1, y: 2 }, { x: 1, y: 1 }],
        [{ x: 1, y: 1 }, { x: 1, y: 0 }],
    ];
    const plan = planRoadNetwork({ ...base, existingEdges });
    assert.deepEqual(plan.connections[0].cells, [{ x: 0, y: 0 }, { x: 1, y: 0 }]);
    assert.equal(plan.connections[0].travelTime, 1);
});

test('road target input order does not change planning or pair tie order', () => {
    const base = options(['.#.', '...', '...']);
    const roadTargets = [{ x: 0, y: 0 }, { x: 2, y: 0 }, { x: 1, y: 2 }];
    const first = planRoadNetwork({ ...base, roadTargets });
    assert.deepEqual(first, planRoadNetwork({ ...base, roadTargets: [...roadTargets].reverse() }));
    assert.deepEqual(first.connections.map(({ cells }) => [cells[0], cells[cells.length - 1]]), [
        [{ x: 0, y: 0 }, { x: 1, y: 0 }],
        [{ x: 1, y: 0 }, { x: 2, y: 0 }],
        [{ x: 1, y: 0 }, { x: 1, y: 2 }],
    ]);
});

test('planning is deterministic and snapshots each terrain cell once', () => {
    const base = options(['#.#', '.^.', '#.#']);
    let reads = 0;
    const first = planRoadNetwork({ ...base, terrainAt: (cell) => {
        reads++;
        return base.terrainAt(cell);
    } });
    assert.equal(reads, 9);
    assert.deepEqual(first, planRoadNetwork(base));
});

test('planned paths can be applied as ordinary adjacent vectors on hydrated tiles', () => {
    const root = QuadNode.createRoot(2);
    root.setTileData({});
    root.detach();
    const nodes = new Map<string, QuadNode>();
    for (let y = 0; y < 4; y++) {
        for (let x = 0; x < 4; x++) {
            const node = root.findByPoint({ x, y, z: 2 }, true);
            assert.ok(node);
            node.setTileData({});
            nodes.set(`${x},${y}`, node);
        }
    }
    const plan = planRoadNetwork(options(['#...', '....', '..#.', '....']));
    for (const { cells } of plan.connections) {
        for (let i = 1; i < cells.length; i++) {
            const from = nodes.get(`${cells[i - 1].x},${cells[i - 1].y}`);
            const to = nodes.get(`${cells[i].x},${cells[i].y}`);
            assert.ok(from && to);
            assert.equal(connectGeneratedNodes(from, to, 'road', 1), 'connected');
        }
    }
    const visible = new Map([...nodes.values()].map((node) => [node.key.id, node]));
    assert.equal(getCellEdges(2, [...nodes.values()], visible).edges.length, 4);
    assert.ok([...nodes.values()].every((node) => !node.isDetached()));
    assert.equal(root.getDetachedTiles().some((tile) => tile.vectors.length > 0), false);
});

test('missing terrain and invalid options fail even without urban targets', () => {
    const base = options(['..']);
    assert.throws(() => planRoadNetwork({ ...base, terrainAt: ({ x }) => x ? undefined : { urban: 0, elevation: 0 } }), /unavailable/);
    assert.throws(() => planRoadNetwork({ ...base, terrainAt: () => ({ urban: -1, elevation: 0 }) }), /terrain values/);
    assert.throws(() => planRoadNetwork({ ...base, maxDistance: -1 }), /maximum distance/);
    assert.throws(() => planRoadNetwork({ ...base, elevationCost: NaN }), /cost/);
});
