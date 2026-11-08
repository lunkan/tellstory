import assert from 'node:assert/strict';
import { test } from 'node:test';
import { QuadNode } from '../../../../engine/world/quad-node';
import { getCellEdges } from '../../../../engine/world/cell-edges';
import { connectGeneratedNodes } from '../../../../engine/world/connect-nodes';
import { hydrateVectorPaths } from '../../../../engine/world/hydrator/hydrateVectorPaths';
import { clearGeneratedVectors } from '../../../../engine/world/vector-generation/clear-generated-vectors';
import { RoadPlan } from '../../../../engine/world/vector-generation/road-plan';
import { applyRoadPlan } from './applyRoadPlan';
import { planRoadSnapshot } from './roadPlannerProtocol';
import { createRoadPlanningSnapshot } from './roadPlanningSnapshot';

function setup(): { root: QuadNode; nodes: QuadNode[] } {
    const root = QuadNode.createRoot(2);
    root.setTileData({});
    root.detach();
    const nodes = [0, 1, 2, 3].map((x) => {
        const node = root.findByPoint({ x, y: 0, z: 2 }, true);
        assert.ok(node);
        node.setTileData({ terrain: [{ type: 'urban', value: x === 0 || x === 3 ? 1 : 0 }] });
        return node;
    });
    return { root, nodes };
}

function snapshot(root: QuadNode) {
    return { ...createRoadPlanningSnapshot(root, 2, { x: 0, y: 0, width: 4, height: 1 }).request, maxDistance: 3 };
}

test('applies complete plans to hydrated nodes without detaching or saving', () => {
    const { root, nodes } = setup();
    const request = snapshot(root);
    const plan = planRoadSnapshot(request);
    assert.equal(applyRoadPlan(root, 2, request, plan, 'road', 1), 'applied');
    assert.deepEqual(nodes.map((node) => node.getOwnVectors().length), [1, 2, 2, 1]);
    assert.ok(nodes.every((node) => !node.isDetached()));
    assert.ok(root.getDetachedTiles().every((tile) => tile.vectors.length === 0));
    assert.equal(applyRoadPlan(root, 2, request, plan, 'road', 1), 'stale');
    assert.deepEqual(nodes.map((node) => node.getOwnVectors().length), [1, 2, 2, 1]);
});

test('overlapping fastest routes reuse existing segments without duplicate vectors', () => {
    const { root, nodes } = setup();
    nodes.forEach((node) => node.setTileData({ terrain: [{ type: 'urban', value: 1 }] }));
    const request = snapshot(root);
    const plan = planRoadSnapshot(request);
    assert.equal(applyRoadPlan(root, 2, request, plan, 'road', 1), 'applied');
    assert.deepEqual(nodes.map((node) => node.getOwnVectors().length), [1, 2, 2, 1]);
    assert.ok(nodes.every((node) => {
        const edges = node.getOwnVectors().map(({ type, direction }) => `${type}:${direction.x},${direction.y}`);
        return new Set(edges).size === edges.length;
    }));
});

test('reuses resolved inherited edges while generating other segments', () => {
    const root = QuadNode.createRoot(2);
    root.setTileData({});
    root.detach();
    const left = root.findByPoint({ x: 0, y: 0, z: 1 }, true)!;
    const right = root.findByPoint({ x: 2, y: 0, z: 1 }, true)!;
    left.setTileData({});
    right.setTileData({});
    assert.equal(connectGeneratedNodes(left, right, 'road', 1), 'connected');
    for (let y = 0; y < 2; y++) {
        for (let x = 0; x < 4; x++) {
            root.findByPoint({ x, y, z: 2 }, true)!.setTileData({ terrain: [{ type: 'urban', value: 1 }] });
        }
    }
    hydrateVectorPaths([left, right], 2);
    const request = createRoadPlanningSnapshot(root, 2, { x: 0, y: 0, width: 4, height: 2 }).request;
    const inherited = request.inheritedCells ?? [];
    assert.equal(inherited.length, 2);
    const a = inherited[0].index;
    const b = inherited[1].index;
    assert.equal(b, a + 1);
    const nodeAt = (index: number) => root.findByPoint({ x: index % 4, y: Math.floor(index / 4), z: 2 })!;
    const aNode = nodeAt(a);
    const bNode = nodeAt(b);
    const plan: RoadPlan = {
        components: [],
        connections: [{ kind: 'road', cells: [{ x: a % 4, y: Math.floor(a / 4) }, { x: b % 4, y: Math.floor(b / 4) }], travelTime: 1 }],
    };
    assert.equal(applyRoadPlan(root, 2, request, plan, 'road', 1), 'applied');
    assert.equal(aNode.getOwnVectors().length, 0);
    assert.equal(bNode.getOwnVectors().length, 0);
    const planned = planRoadSnapshot(request);
    assert.ok(!planned.connections.some((connection) => connection.cells.length === 2
        && connection.cells[0].x === a % 4 && connection.cells[0].y === Math.floor(a / 4)
        && connection.cells[1].x === b % 4 && connection.cells[1].y === Math.floor(b / 4)));
    assert.equal(applyRoadPlan(root, 2, request, planned, 'road', 1), 'applied');
    assert.ok(aNode.getOwnVectors().every((vector) => vector.direction.x !== 1 || vector.direction.y !== 0));
    assert.ok(bNode.getOwnVectors().every((vector) => vector.direction.x !== -1 || vector.direction.y !== 0));
});

test('reuses resolved links between inherited vectors inside the same shallower tile', () => {
    const root = QuadNode.createRoot(2);
    root.setTileData({});
    root.detach();
    const host = root.findByPoint({ x: 0, y: 0, z: 1 }, true)!;
    host.setTileData({ vectors: [
        { type: 'road', value: 1, direction: { x: 1, y: 0 }, placement: [2] },
        { type: 'road', value: 1, direction: { x: 0, y: 1 }, placement: [1] },
    ] });
    for (let y = 0; y < 2; y++) {
        for (let x = 0; x < 2; x++) {
            root.findByPoint({ x, y, z: 2 }, true)!.setTileData({ terrain: [{ type: 'urban', value: 1 }] });
        }
    }
    const request = createRoadPlanningSnapshot(root, 2, { x: 0, y: 0, width: 2, height: 2 }).request;
    const inherited = new Map(request.inheritedCells?.map(({ index, directions }) => [index, directions]));
    assert.ok(inherited.get(2)?.some((d) => d.x === 1 && d.y === -1));
    assert.ok(inherited.get(1)?.some((d) => d.x === -1 && d.y === 1));
    const plan: RoadPlan = {
        components: [],
        connections: [{ kind: 'road', cells: [{ x: 0, y: 1 }, { x: 1, y: 0 }], travelTime: Math.SQRT2 }],
    };
    assert.equal(applyRoadPlan(root, 2, request, plan, 'road', 1), 'applied');
    assert.equal(root.findByPoint({ x: 0, y: 1, z: 2 })!.getOwnVectors().length, 0);
    assert.equal(root.findByPoint({ x: 1, y: 0, z: 2 })!.getOwnVectors().length, 0);
});

test('writes the missing half when an inherited road has only one resolved endpoint', () => {
    const root = QuadNode.createRoot(2);
    root.setTileData({});
    root.detach();
    const host = root.findByPoint({ x: 0, y: 0, z: 1 }, true)!;
    host.setTileData({ vectors: [{ type: 'road', value: 1, direction: { x: 1, y: 0 }, placement: [2] }] });
    const from = root.findByPoint({ x: 1, y: 0, z: 2 }, true)!;
    const to = root.findByPoint({ x: 2, y: 0, z: 2 }, true)!;
    from.setTileData({ terrain: [{ type: 'urban', value: 1 }] });
    to.setTileData({ terrain: [{ type: 'urban', value: 1 }] });
    const request = createRoadPlanningSnapshot(root, 2, { x: 1, y: 0, width: 2, height: 1 }).request;
    assert.equal(applyRoadPlan(root, 2, request, planRoadSnapshot(request), 'road', 1), 'applied');
    assert.equal(from.getOwnVectors().length, 0);
    assert.deepEqual(to.getOwnVectors().map((v) => v.direction), [{ x: -1, y: 0 }]);
});

test('a generated road joins a resolved shallower road without changing terrain', () => {
    const root = QuadNode.createRoot(2);
    root.setTileData({});
    root.detach();
    const host = root.findByPoint({ x: 0, y: 0, z: 1 }, true)!;
    host.setTileData({ vectors: [{ type: 'road', value: 1, direction: { x: 1, y: 0 }, placement: [2] }] });
    const cells: QuadNode[] = [];
    for (let y = 0; y < 2; y++) {
        for (let x = 0; x < 4; x++) {
            const node = root.findByPoint({ x, y, z: 2 }, true)!;
            node.setTileData({ terrain: [{ type: 'urban', value: x === 0 && y === 1 ? 0.25 : 0 }] });
            cells.push(node);
        }
    }
    const before = cells.map((node) => structuredClone(node.getTile()?.terrain));
    const request = createRoadPlanningSnapshot(root, 2, { x: 0, y: 0, width: 4, height: 2 }).request;
    assert.deepEqual(request.inheritedCells?.map(({ index }) => index), [1]);
    const plan = planRoadSnapshot(request);
    assert.deepEqual(plan.connections[0].cells, [{ x: 1, y: 0 }, { x: 0, y: 1 }]);
    assert.equal(applyRoadPlan(root, 2, request, plan, 'road', 1), 'applied');
    assert.deepEqual(cells.map((node) => node.getTile()?.terrain), before);
    assert.equal(host.getOwnVectors().length, 1);
    const rendered = getCellEdges(2, [host, ...cells], new Map(cells.map((node) => [node.key.id, node])));
    const inheritedCell = cells.find((node) => node.bounds.x === 1 && node.bounds.y === 0)!;
    assert.ok(rendered.edges.some((edge) => edge.cell === inheritedCell && edge.direction.x === 1 && edge.direction.y === 0));
    assert.ok(rendered.edges.some((edge) => edge.cell === inheritedCell && edge.direction.x === -1 && edge.direction.y === 1));
    assert.ok(cells.every((node) => !node.isDetached()));
    assert.ok(root.getDetachedTiles().every((tile) => tile.vectors.length === 0));
});

test('a detached tile is excluded even when it has an inherited road', () => {
    const root = QuadNode.createRoot(2);
    root.setTileData({});
    root.detach();
    const host = root.findByPoint({ x: 0, y: 0, z: 1 }, true)!;
    host.setTileData({ vectors: [{ type: 'road', value: 1, direction: { x: 1, y: 0 }, placement: [2] }] });
    const from = root.findByPoint({ x: 1, y: 0, z: 2 }, true)!;
    const to = root.findByPoint({ x: 2, y: 0, z: 2 }, true)!;
    from.setTileData({ terrain: [{ type: 'urban', value: 1 }] });
    to.setTileData({ terrain: [{ type: 'urban', value: 1 }] });
    from.detach();
    const before = structuredClone(root.getDetachedTiles());
    const request = createRoadPlanningSnapshot(root, 2, { x: 1, y: 0, width: 2, height: 1 }).request;
    const plan = planRoadSnapshot(request);
    assert.deepEqual(plan.connections, []);
    assert.equal(applyRoadPlan(root, 2, request, plan, 'road', 1), 'applied');
    assert.deepEqual(root.getDetachedTiles(), before);
    assert.deepEqual(to.getOwnVectors(), []);
});

test('rejects a plan if inherited roads change while planning', () => {
    const { root, nodes } = setup();
    const request = snapshot(root);
    const plan = planRoadSnapshot(request);
    const parent = nodes[0].parent!;
    parent.setTileData({ vectors: [{ type: 'road', value: 1, direction: { x: 1, y: 0 }, placement: [2] }] });
    assert.equal(applyRoadPlan(root, 2, request, plan, 'road', 1), 'stale');
    assert.ok(nodes.every((node) => node.getOwnVectors().length === 0));
});

test('rejects stale terrain and protection changes without writing', () => {
    for (const change of ['terrain', 'detach', 'missing'] as const) {
        const { root, nodes } = setup();
        const request = snapshot(root);
        const plan = planRoadSnapshot(request);
        if (change === 'terrain') {
            nodes[1].setTileData({ terrain: [{ type: 'elevation', value: 1 }] });
        } else if (change === 'detach') {
            nodes[1].detach();
        } else {
            nodes[1].setTileData(undefined);
        }
        assert.equal(applyRoadPlan(root, 2, request, plan, 'road', 1), 'stale');
        assert.ok(nodes.every((node) => node.getOwnVectors().length === 0));
    }
});

test('rejects a plan if same-depth generated roads change after the snapshot', () => {
    const { root, nodes } = setup();
    const request = snapshot(root);
    const plan = planRoadSnapshot(request);
    assert.equal(connectGeneratedNodes(nodes[1], nodes[2], 'road', 1), 'connected');
    assert.equal(applyRoadPlan(root, 2, request, plan, 'road', 1), 'stale');
    assert.deepEqual(nodes.map((node) => node.getOwnVectors().length), [0, 1, 1, 0]);
});

test('applies complete viewport routes including context-only segments without duplicates', () => {
    const { root, nodes } = setup();
    nodes.slice(0, 3).forEach((node) => node.setTileData({ terrain: [{ type: 'urban', value: 1 }] }));
    nodes[3].setTileData({ terrain: [{ type: 'urban', value: 0 }] });
    const request = { ...snapshot(root), commitBounds: { x: 0, y: 0, width: 1, height: 1 } };
    const plan = planRoadSnapshot(request);
    assert.equal(applyRoadPlan(root, 2, request, plan, 'road', 1), 'applied');
    assert.deepEqual(nodes.map((node) => node.getOwnVectors().length), [1, 2, 1, 0]);
});

test('validates every connection before writing any edge', () => {
    const { root, nodes } = setup();
    const request = snapshot(root);
    const plan: RoadPlan = {
        components: [],
        connections: [
            { kind: 'road', cells: [{ x: 0, y: 0 }, { x: 1, y: 0 }], travelTime: 1 },
            { kind: 'road', cells: [{ x: 1, y: 0 }, { x: 3, y: 0 }], travelTime: 1 },
        ],
    };
    assert.throws(() => applyRoadPlan(root, 2, request, plan, 'road', 1), /non-adjacent/);
    assert.ok(nodes.every((node) => node.getOwnVectors().length === 0));
});

test('detached endpoints do not receive new boundary routes', () => {
    const { root, nodes } = setup();
    nodes[3].detach();
    const request = snapshot(root);
    const plan = planRoadSnapshot(request);
    assert.deepEqual(plan.connections, []);
    const protectedBefore = structuredClone(nodes[3].getOwnVectors());
    assert.equal(applyRoadPlan(root, 2, request, plan, 'road', 1), 'applied');
    assert.deepEqual(nodes[3].getOwnVectors(), protectedBefore);
    assert.deepEqual(nodes.map((node) => node.getOwnVectors().length), [0, 0, 0, 0]);
});

test('does not route through existing roads on detached tiles', () => {
    const { root, nodes } = setup();
    for (const node of [nodes[1], nodes[2]]) {
        node.setTileData({ vectors: [
            { type: 'road', value: 1, direction: { x: -1, y: 0 } },
            { type: 'road', value: 1, direction: { x: 1, y: 0 } },
        ] });
        node.detach();
    }
    const before = structuredClone(root.getDetachedTiles());
    const request = snapshot(root);
    const plan = planRoadSnapshot(request);
    assert.equal(applyRoadPlan(root, 2, request, plan, 'road', 1), 'applied');
    assert.deepEqual(root.getDetachedTiles(), before);
    assert.deepEqual(nodes.map((node) => node.getOwnVectors().length), [0, 2, 2, 0]);
});

test('changes to an excluded detached road do not invalidate the snapshot', () => {
    const { root, nodes } = setup();
    nodes[3].detach();
    const request = snapshot(root);
    const plan = planRoadSnapshot(request);
    nodes[3].setTileData({ vectors: [{ type: 'road', value: 1, direction: { x: -1, y: 0 } }] });
    assert.equal(applyRoadPlan(root, 2, request, plan, 'road', 1), 'applied');
    assert.ok(nodes.slice(0, 3).every((node) => node.getOwnVectors().length === 0));
});

test('refuses forged paths through detached tiles', () => {
    const { root, nodes } = setup();
    nodes[1].detach();
    const request = snapshot(root);
    const forged: RoadPlan = {
        components: [],
        connections: [{
            kind: 'road',
            cells: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }],
            travelTime: 2,
        }],
    };
    assert.throws(() => applyRoadPlan(root, 2, request, forged, 'road', 1), /without terrain/);
    assert.ok(nodes.every((node) => node.getOwnVectors().length === 0));
});

test('clearing and replanning after a terrain edit removes stale roads without touching protected data', () => {
    const { root, nodes } = setup();
    const first = snapshot(root);
    assert.equal(applyRoadPlan(root, 2, first, planRoadSnapshot(first), 'road', 1), 'applied');
    nodes[3].detach();
    const saved = structuredClone(root.getDetachedTiles());
    assert.equal(clearGeneratedVectors(nodes, 'road'), 3);
    assert.deepEqual(root.getDetachedTiles(), saved);

    nodes[0].setTileData({ terrain: [{ type: 'urban', value: 0 }] });
    const second = snapshot(root);
    const plan = planRoadSnapshot(second);
    assert.equal(plan.connections.length, 0);
    assert.equal(applyRoadPlan(root, 2, second, plan, 'road', 1), 'applied');
    assert.deepEqual(nodes.map((node) => node.getOwnVectors().length), [0, 0, 0, 1]);
    assert.deepEqual(root.getDetachedTiles(), saved);
});

test('clearing and replanning reroutes around increased elevation', () => {
    const root = QuadNode.createRoot(2);
    root.setTileData({});
    root.detach();
    const nodes: QuadNode[] = [];
    for (let y = 0; y < 3; y++) {
        for (let x = 0; x < 3; x++) {
            const node = root.findByPoint({ x, y, z: 2 }, true);
            assert.ok(node);
            node.setTileData({ terrain: [{ type: 'urban', value: y === 1 && x !== 1 ? 1 : 0 }] });
            nodes.push(node);
        }
    }
    const bounds = { x: 0, y: 0, width: 3, height: 3 };
    const first = createRoadPlanningSnapshot(root, 2, bounds).request;
    assert.equal(applyRoadPlan(root, 2, first, planRoadSnapshot(first), 'road', 1), 'applied');
    assert.equal(nodes[4].getOwnVectors().length, 2);

    nodes[4].setTileData({ terrain: [{ type: 'elevation', value: 1 }] });
    clearGeneratedVectors(nodes, 'road');
    const second = createRoadPlanningSnapshot(root, 2, bounds).request;
    const replanned = planRoadSnapshot(second);
    assert.equal(applyRoadPlan(root, 2, second, replanned, 'road', 1), 'applied');
    assert.equal(nodes[4].getOwnVectors().length, 0);
    assert.ok(Math.abs(replanned.connections[0].travelTime - 2 * Math.SQRT2) < 1e-12);
});
