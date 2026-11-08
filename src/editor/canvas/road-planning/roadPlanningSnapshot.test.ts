import assert from 'node:assert/strict';
import { test } from 'node:test';
import { QuadNode } from '../../../../engine/world/quad-node';
import { connectGeneratedNodes } from '../../../../engine/world/connect-nodes';
import { World } from '../../../../engine/world/world';
import { HydrationScheduler } from '../HydrationScheduler';
import { RenderRequest, RenderSubscriber } from '../CanvasRenderer';
import { createRoadPlanningSnapshot, getRoadPlanningBounds } from './roadPlanningSnapshot';
import { planRoadSnapshot } from './roadPlannerProtocol';

function createWorld(depth = 6): World {
    const world = new World(
        { id: 1, name: 'test', size: depth, palette: 1, tiles: [] },
        { id: 1, name: 'test', version: '1', tiles: [], vectors: [], markers: [] },
    );
    world.quadtree.setTileData({ terrain: [{ type: 'urban', value: 1 }] });
    world.quadtree.detach();
    return world;
}

test('planning bounds add the configured margin, clip to the world, and reject invalid viewports', () => {
    const root = QuadNode.createRoot(6);
    assert.deepEqual(getRoadPlanningBounds(root, 6, { x: 20, y: 30, xSize: 2, ySize: 3 }),
        { x: 16, y: 26, width: 10, height: 11 });
    assert.deepEqual(getRoadPlanningBounds(root, 6, { x: -3, y: 62, xSize: 5, ySize: 10 }),
        { x: 0, y: 58, width: 6, height: 6 });
    assert.equal(getRoadPlanningBounds(root, 6, { x: 64, y: 0, xSize: 2, ySize: 2 }), undefined);
    assert.equal(getRoadPlanningBounds(root, 6, { x: 1, y: 1, xSize: 0, ySize: 1 }), undefined);
    assert.throws(() => getRoadPlanningBounds(root, 7, { x: 0, y: 0, xSize: 1, ySize: 1 }), /Invalid/);
    assert.throws(() => getRoadPlanningBounds(root, 6, { x: 0.5, y: 0, xSize: 1, ySize: 1 }), /Invalid/);
});

test('snapshot reads a stable row-major copy without creating nodes', () => {
    const root = QuadNode.createRoot(2);
    for (const [x, y, urban, elevation] of [[0, 0, 1, 0.2], [1, 0, 0, 0.8], [0, 1, 0.4, 0], [1, 1, 1, 0]] as const) {
        const node = root.findByPoint({ x, y, z: 2 }, true);
        assert.ok(node);
        node.setTileData({ terrain: [{ type: 'urban', value: urban }, { type: 'elevation', value: elevation }] });
    }
    const bounds = { x: 0, y: 0, width: 2, height: 2 };
    const snapshot = createRoadPlanningSnapshot(root, 2, bounds);
    assert.equal(snapshot.status, 'ready');
    if (snapshot.status !== 'ready') {
        throw new Error('Expected complete snapshot');
    }
    assert.deepEqual(snapshot.request.terrain, [
        { urban: 1, elevation: 0.2 }, { urban: 0, elevation: 0.8 },
        { urban: 0.4, elevation: 0 }, { urban: 1, elevation: 0 },
    ]);
    assert.ok(planRoadSnapshot(snapshot.request).connections.length);
    root.findByPoint({ x: 0, y: 0, z: 2 })?.setTileData({ terrain: [{ type: 'urban', value: 0 }] });
    assert.equal(snapshot.request.terrain[0]?.urban, 1);
    assert.equal(root.findByPoint({ x: 3, y: 3, z: 2 }), undefined);
    assert.throws(() => createRoadPlanningSnapshot(root, 2, { x: 3, y: 3, width: 2, height: 1 }), /Invalid/);
});

test('snapshot reports missing and blocked terrain without generating nodes or guessing values', () => {
    const root = QuadNode.createRoot(2);
    root.setTileData({ terrain: [{ type: 'urban', value: 0.5 }] });
    root.detach();
    const locked = root.getQuadrants(true)[0];
    const child = locked.getQuadrants(true)[0];
    child.setTileData({ terrain: [{ type: 'urban', value: 1 }] });
    child.detach();
    const snapshot = createRoadPlanningSnapshot(root, 2, { x: 0, y: 0, width: 2, height: 1 });
    assert.equal(snapshot.status, 'missing-terrain');
    if (snapshot.status !== 'missing-terrain') {
        throw new Error('Expected missing terrain');
    }
    assert.deepEqual(snapshot.cells, [{ x: 1, y: 0 }]);
    assert.deepEqual(snapshot.request.blocked, [0, 1]);
    assert.equal(snapshot.request.terrain[1], null);
    assert.equal(planRoadSnapshot(snapshot.request).components.length, 0);
    assert.equal(locked.isLocked(), true);
    assert.equal(root.findByPoint({ x: 1, y: 0, z: 2 })?.hasTile(), false);
});

test('snapshot uses calculated terrain on locked nodes', () => {
    const root = QuadNode.createRoot(2);
    root.setTileData({});
    root.detach();
    const locked = root.getQuadrants(true)[0];
    locked.setTileData({ terrain: [{ type: 'urban', value: 0.4 }] });
    const child = locked.getQuadrants(true)[0];
    child.setTileData({ terrain: [{ type: 'urban', value: 0.8 }] });
    child.detach();
    const snapshot = createRoadPlanningSnapshot(root, 1, { x: 0, y: 0, width: 1, height: 1 });
    assert.equal(snapshot.status, 'ready');
    if (snapshot.status === 'ready') {
        assert.equal(snapshot.request.terrain[0]?.urban, locked.getTile()?.terrain.find((item) => item.type === 'urban')?.value);
        assert.deepEqual(snapshot.request.protectedCells, [{ index: 0, directions: [] }]);
    }
});

test('snapshot excludes detached nodes regardless of their vector type', () => {
    const root = QuadNode.createRoot(2);
    const nodes = [0, 1, 2].map((x) => {
        const node = root.findByPoint({ x, y: 0, z: 2 }, true);
        assert.ok(node);
        node.setTileData({ terrain: [{ type: 'urban', value: x === 1 ? 0 : 1 }] });
        return node;
    });
    nodes[1].setTileData({ vectors: [
        { type: 'road', value: 1, direction: { x: -1, y: 0 } },
        { type: 'road', value: 1, direction: { x: 1, y: 0 } },
        { type: 'river', value: 1, direction: { x: 0, y: 1 } },
    ] });
    nodes[1].detach();
    const before = structuredClone(nodes[1].getOwnVectors());
    const snapshot = createRoadPlanningSnapshot(root, 2, { x: 0, y: 0, width: 3, height: 1 });
    assert.deepEqual(snapshot.request.blocked, [1]);
    assert.deepEqual(snapshot.request.protectedCells, []);
    const plan = planRoadSnapshot(snapshot.request);
    assert.equal(plan.components.length, 2);
    for (const { cells } of plan.connections) {
        for (let i = 1; i < cells.length; i++) {
            assert.equal(connectGeneratedNodes(nodes[cells[i - 1].x], nodes[cells[i].x], 'road', 1), 'connected');
        }
    }
    assert.deepEqual(nodes[1].getOwnVectors(), before);
    assert.equal(nodes[0].isDetached(), false);
    assert.equal(nodes[2].isDetached(), false);
    const riverSnapshot = createRoadPlanningSnapshot(root, 2, { x: 0, y: 0, width: 3, height: 1 }, 'river');
    assert.deepEqual(riverSnapshot.request.blocked, [1]);
});

test('a plan cannot join or follow roads on detached tiles', () => {
    const root = QuadNode.createRoot(2);
    const nodes = [0, 1, 2, 3].map((x) => {
        const node = root.findByPoint({ x, y: 0, z: 2 }, true);
        assert.ok(node);
        node.setTileData({ terrain: [{ type: 'urban', value: x === 0 || x === 3 ? 1 : 0 }] });
        return node;
    });
    for (const node of [nodes[1], nodes[2]]) {
        node.setTileData({ vectors: [
            { type: 'road', value: 1, direction: { x: -1, y: 0 } },
            { type: 'road', value: 1, direction: { x: 1, y: 0 } },
        ] });
        node.detach();
    }
    const before = nodes.slice(1, 3).map((node) => structuredClone(node.getOwnVectors()));
    const snapshot = createRoadPlanningSnapshot(root, 2, { x: 0, y: 0, width: 4, height: 1 });
    const plan = planRoadSnapshot({ ...snapshot.request, maxDistance: 3 });
    assert.equal(plan.components.length, 2);
    assert.equal(plan.connections.length, 0);
    assert.deepEqual(nodes.slice(1, 3).map((node) => node.getOwnVectors()), before);
});

test('detached endpoints do not create boundary roads', () => {
    const root = QuadNode.createRoot(1);
    const left = root.findByPoint({ x: 0, y: 0, z: 1 }, true);
    const right = root.findByPoint({ x: 1, y: 0, z: 1 }, true);
    assert.ok(left && right);
    left.setTileData({ terrain: [{ type: 'urban', value: 1 }] });
    right.setTileData({ terrain: [{ type: 'urban', value: 1 }] });
    right.detach();
    const before = structuredClone(right.getOwnVectors());
    const snapshot = createRoadPlanningSnapshot(root, 1, { x: 0, y: 0, width: 2, height: 1 });
    const plan = planRoadSnapshot(snapshot.request);
    assert.deepEqual(plan.connections, []);
    assert.deepEqual(left.getOwnVectors(), []);
    assert.deepEqual(right.getOwnVectors(), before);
    assert.equal(left.isDetached(), false);
    assert.equal(plan.components.length, 1);
});

test('boundary planning preserves locked-node data', () => {
    const root = QuadNode.createRoot(2);
    const left = root.findByPoint({ x: 0, y: 0, z: 1 }, true);
    const right = root.findByPoint({ x: 2, y: 0, z: 1 }, true);
    assert.ok(left && right);
    left.setTileData({ terrain: [{ type: 'urban', value: 1 }] });
    right.setTileData({ terrain: [{ type: 'urban', value: 1 }] });
    const child = right.getQuadrants(true)[0];
    child.setTileData({ terrain: [{ type: 'urban', value: 1 }] });
    child.detach();
    assert.equal(right.isLocked(), true);
    const before = structuredClone(root.getDetachedTiles());
    const snapshot = createRoadPlanningSnapshot(root, 1, { x: 0, y: 0, width: 2, height: 1 });
    const plan = planRoadSnapshot(snapshot.request);
    assert.equal(plan.connections[0]?.kind, 'boundary');
    assert.equal(connectGeneratedNodes(left, right, 'road', 1), 'connected');
    assert.deepEqual(root.getDetachedTiles(), before);
    assert.equal(right.getOwnVectors().length, 0);
});

test('scheduler hydrates visible cells and their bounded margin, without hydrating distant tiles', async () => {
    const world = createWorld();
    let subscriber: RenderSubscriber | undefined;
    const renderer = {
        world,
        subscribe(callback: RenderSubscriber): () => void {
            subscriber = callback;
            return () => { subscriber = undefined; };
        },
    };
    const scheduler = new HydrationScheduler(renderer, {
        plan: async (planningRequest) => ({ status: 'completed', plan: planRoadSnapshot(planningRequest) }),
        cancel: () => {},
        dispose: () => {},
    });
    const request: RenderRequest = {
        trigger: 'move', depth: 6, gridBounds: { x: 20, y: 20, xSize: 1, ySize: 1 },
    };
    assert.ok(subscriber);
    subscriber(request);
    const end = Date.now() + 3000;
    while (!world.quadtree.findByPoint({ x: 24, y: 24, z: 6 })?.hasTile() && Date.now() < end) {
        await new Promise((resolve) => setTimeout(resolve, 5));
    }
    assert.equal(world.quadtree.findByPoint({ x: 20, y: 20, z: 6 })?.hasTile(), true);
    assert.equal(world.quadtree.findByPoint({ x: 16, y: 16, z: 6 })?.hasTile(), true);
    assert.equal(world.quadtree.findByPoint({ x: 24, y: 24, z: 6 })?.hasTile(), true);
    assert.equal(world.quadtree.findByPoint({ x: 50, y: 50, z: 6 })?.hasTile() ?? false, false);
    scheduler.dispose();
    assert.equal(subscriber, undefined);
});
