import assert from 'node:assert/strict';
import { test } from 'node:test';
import { QuadNode } from '../../../engine/world/quad-node';
import { getCellEdges } from '../../../engine/world/cell-edges';
import { World } from '../../../engine/world/world';
import { HydrationScheduler } from './HydrationScheduler';
import { RenderRequest, RenderSubscriber } from './CanvasRenderer';
import { RoadPlanningRequest, planRoadSnapshot } from './road-planning/roadPlannerProtocol';
import { RoadPlanningResult } from './road-planning/RoadPlannerWorker';

class ControlledPlanner {
    public requests: { request: RoadPlanningRequest; resolve: (result: RoadPlanningResult) => void; reject: (error: Error) => void }[] = [];
    public cancelled = 0;
    public disposed = false;

    public plan(request: RoadPlanningRequest): Promise<RoadPlanningResult> {
        return new Promise((resolve, reject) => this.requests.push({ request, resolve, reject }));
    }

    public cancel(): void {
        this.cancelled++;
    }

    public dispose(): void {
        this.disposed = true;
    }

    public finish(index: number): void {
        const pending = this.requests[index];
        pending.resolve({ status: 'completed', plan: planRoadSnapshot(pending.request) });
    }
}

function setup(): {
    world: World;
    planner: ControlledPlanner;
    scheduler: HydrationScheduler;
    render: (request: RenderRequest) => void;
    silenceDataUpdates: (silenced: boolean) => void;
} {
    const world = new World(
        { id: 1, name: 'test', size: 3, palette: 1, tiles: [] },
        { id: 1, name: 'test', version: '1', tiles: [], vectors: [], markers: [] },
    );
    world.quadtree.setTileData({ terrain: [{ type: 'urban', value: 1 }] });
    world.quadtree.detach();
    let subscriber: RenderSubscriber | undefined;
    let current: RenderRequest | undefined;
    let silenced = false;
    world.quadtree.subscribe(QuadNode.EVENT_DATA_CHANGE, () => {
        if (current && !silenced) {
            subscriber?.({ ...current, trigger: 'data' });
        }
    });
    const planner = new ControlledPlanner();
    const scheduler = new HydrationScheduler({
        world,
        subscribe(callback: RenderSubscriber): () => void {
            subscriber = callback;
            return () => { subscriber = undefined; };
        },
    }, planner);
    return {
        world, planner, scheduler,
        render: (request) => { current = request; subscriber?.(request); },
        silenceDataUpdates: (value) => { silenced = value; },
    };
}

async function waitFor(check: () => boolean): Promise<void> {
    const end = Date.now() + 3000;
    while (!check() && Date.now() < end) {
        await new Promise((resolve) => setTimeout(resolve, 5));
    }
    assert.ok(check(), 'Timed out waiting for scheduler');
}

const view: RenderRequest = {
    trigger: 'move', depth: 2, gridBounds: { x: 0, y: 0, xSize: 4, ySize: 4 },
};

test('scheduler hydrates then applies worker roads without a feedback loop or saving', async () => {
    const { world, planner, scheduler, render } = setup();
    try {
        render(view);
        await waitFor(() => planner.requests.length === 1);
        assert.ok(planner.requests[0].request.terrain.every(Boolean));
        planner.finish(0);
        await waitFor(() => world.quadtree.getAllQuadrants().some((node) => node.depth === 2 && node.getOwnVectors().length > 0));
        await new Promise((resolve) => setTimeout(resolve, 25));
        assert.equal(planner.requests.length, 1);
        assert.ok(world.quadtree.getAllQuadrants().filter((node) => node.depth === 2).every((node) => !node.isDetached()));
        assert.ok(world.getData().tiles.every((tile) => tile.vectors.length === 0));
    } finally {
        scheduler.dispose();
    }
    assert.equal(planner.disposed, true);
});

test('generated roads are placed and renderable at deeper depths before new planning completes', async () => {
    const { world, planner, scheduler, render } = setup();
    try {
        render(view);
        await waitFor(() => planner.requests.length === 1);
        planner.finish(0);
        const nodes = () => world.quadtree.getAllQuadrants();
        await waitFor(() => nodes().some((node) => node.depth === 2 && node.getOwnVectors().length > 0));
        const hosts = nodes().filter((node) => node.depth === 2 && node.getOwnVectors().length > 0);
        const vectors = hosts.reduce((total, node) => total + node.getOwnVectors().length, 0);
        const shallowCells = new Map(hosts.map((node) => [node.key.id, node]));
        assert.equal(getCellEdges(2, hosts, shallowCells).edges.length, vectors);

        render({ ...view, depth: 3, gridBounds: { x: 0, y: 0, xSize: 8, ySize: 8 } });
        await waitFor(() => planner.requests.length === 2);
        assert.ok(hosts.every((node) => node.getOwnVectors().every((vector) => vector.placement?.length === 1)));
        const deepCells = new Map(nodes().filter((node) => node.depth === 3).map((node) => [node.key.id, node]));
        const deepEdges = getCellEdges(3, hosts, deepCells).edges;
        assert.equal(deepEdges.length, vectors);
        assert.ok(deepEdges.every((edge) => edge.type === 'road' && edge.scale === 1));
        assert.ok(nodes().filter((node) => node.depth === 3).every((node) => node.getOwnVectors().length === 0));
        assert.ok(world.getData().tiles.every((tile) => tile.vectors.length === 0));
    } finally {
        scheduler.dispose();
    }
});

test('deeper planning reuses resolved roads from the shallower generated network', async () => {
    const { world, planner, scheduler, render } = setup();
    try {
        render(view);
        await waitFor(() => planner.requests.length === 1);
        planner.finish(0);
        await waitFor(() => world.quadtree.getAllQuadrants().some((node) => node.depth === 2 && node.getOwnVectors().length > 0));
        render({ ...view, depth: 3, gridBounds: { x: 0, y: 0, xSize: 8, ySize: 8 } });
        await waitFor(() => planner.requests.length === 2);
        const request = planner.requests[1].request;
        assert.ok(request.inheritedCells?.length);
        planner.finish(1);
        await waitFor(() => world.quadtree.getAllQuadrants().some((node) => node.depth === 3 && node.getOwnVectors().length > 0));
        for (const { index, directions } of request.inheritedCells) {
            const x = request.bounds.x + index % request.bounds.width;
            const y = request.bounds.y + Math.floor(index / request.bounds.width);
            const node = world.quadtree.findByPoint({ x, y, z: 3 });
            assert.ok(node);
            for (const direction of directions) {
                assert.ok(!node.getOwnVectors().some((vector) => vector.type === 'road'
                    && vector.direction.x === direction.x && vector.direction.y === direction.y));
            }
        }
    } finally {
        scheduler.dispose();
    }
});

test('new views cancel prior planning and stale replies cannot write roads', async () => {
    const { world, planner, scheduler, render } = setup();
    try {
        render(view);
        await waitFor(() => planner.requests.length === 1);
        render({ ...view, depth: 3, gridBounds: { x: 1, y: 1, xSize: 2, ySize: 2 } });
        await waitFor(() => planner.requests.length === 2);
        planner.finish(0);
        await new Promise((resolve) => setTimeout(resolve, 10));
        assert.ok(world.quadtree.getAllQuadrants().every((node) => node.depth !== 2 || node.getOwnVectors().length === 0));
        planner.finish(1);
        await waitFor(() => world.quadtree.getAllQuadrants().some((node) => node.depth === 3 && node.getOwnVectors().length > 0));
        assert.ok(planner.cancelled >= 2);
    } finally {
        scheduler.dispose();
    }
});

test('terrain edits replace roads while preserving detached tiles', async () => {
    const { world, planner, scheduler, render } = setup();
    try {
        render(view);
        await waitFor(() => planner.requests.length === 1);
        planner.finish(0);
        const root = world.quadtree;
        const node = root.findByPoint({ x: 0, y: 0, z: 2 });
        assert.ok(node);
        await waitFor(() => node.getOwnVectors().length > 0);
        node.detach();
        const saved = structuredClone(node.getOwnVectors());
        node.setTileData({ terrain: [{ type: 'urban', value: 0 }] });
        await waitFor(() => planner.requests.length === 2);
        planner.finish(1);
        await new Promise((resolve) => setTimeout(resolve, 20));
        assert.deepEqual(node.getOwnVectors(), saved);
        assert.equal(node.getTile()?.terrain.find((t) => t.type === 'urban')?.value, 0);
        assert.equal(planner.requests.length, 2);
        const reloaded = new World(
            { id: 1, name: 'test', size: 3, palette: 1, ...world.getData() },
            { id: 1, name: 'test', version: '1', tiles: [], vectors: [], markers: [] },
        );
        assert.deepEqual(reloaded.quadtree.findByKey(node.key)?.getOwnVectors(), saved);
    } finally {
        scheduler.dispose();
    }
});

test('a stale snapshot retries without clearing roads or changing newly protected tiles', async () => {
    const { world, planner, scheduler, render, silenceDataUpdates } = setup();
    try {
        render(view);
        await waitFor(() => planner.requests.length === 1);
        planner.finish(0);
        const node = world.quadtree.findByPoint({ x: 0, y: 0, z: 2 });
        assert.ok(node);
        await waitFor(() => node.getOwnVectors().length > 0);
        render(view);
        await waitFor(() => planner.requests.length === 2);
        silenceDataUpdates(true);
        node.detach();
        const saved = structuredClone(node.getOwnVectors());
        node.setTileData({ terrain: [{ type: 'urban', value: 0 }] });
        silenceDataUpdates(false);
        planner.finish(1);
        await waitFor(() => planner.requests.length === 3);
        assert.deepEqual(node.getOwnVectors(), saved);
        planner.finish(2);
        await new Promise((resolve) => setTimeout(resolve, 20));
        assert.deepEqual(node.getOwnVectors(), saved);
        assert.equal(planner.requests.length, 3);
    } finally {
        scheduler.dispose();
    }
});

test('worker failures are reported without applying roads', async () => {
    const { world, planner, scheduler, render } = setup();
    const original = console.error;
    const errors: unknown[][] = [];
    console.error = (...args: unknown[]) => { errors.push(args); };
    try {
        render(view);
        await waitFor(() => planner.requests.length === 1);
        const error = new Error('worker failed');
        planner.requests[0].reject(error);
        await waitFor(() => errors.length > 0);
        assert.deepEqual(errors[0], ['Road generation failed:', error]);
        assert.ok(world.quadtree.getAllQuadrants().every((node) => node.getOwnVectors().length === 0));
    } finally {
        console.error = original;
        scheduler.dispose();
    }
});

test('dispose prevents late worker results from writing', async () => {
    const { world, planner, scheduler, render } = setup();
    render(view);
    await waitFor(() => planner.requests.length === 1);
    scheduler.dispose();
    planner.finish(0);
    await new Promise((resolve) => setTimeout(resolve, 10));
    assert.ok(world.quadtree.getAllQuadrants().every((node) => node.getOwnVectors().length === 0));
});

test('panning away and back replaces prior generated roads deterministically', async () => {
    const { world, planner, scheduler, render } = setup();
    const left: RenderRequest = { trigger: 'move', depth: 3, gridBounds: { x: 0, y: 0, xSize: 1, ySize: 1 } };
    const right: RenderRequest = { trigger: 'move', depth: 3, gridBounds: { x: 7, y: 7, xSize: 1, ySize: 1 } };
    const roads = () => world.quadtree.getAllQuadrants()
        .filter((node) => node.depth === 3 && node.getOwnVectors().length)
        .map((node) => [node.key.id, node.getOwnVectors()])
        .sort(([a], [b]) => String(a).localeCompare(String(b)));
    try {
        render(left);
        await waitFor(() => planner.requests.length === 1);
        planner.finish(0);
        await waitFor(() => roads().length > 0);
        const first = structuredClone(roads());

        render(right);
        await waitFor(() => planner.requests.length === 2);
        planner.finish(1);
        await waitFor(() => roads().some(([key]) => !first.some(([old]) => old === key)));
        const leftCorner = world.quadtree.findByPoint({ x: 0, y: 0, z: 3 });
        assert.ok(leftCorner);
        assert.equal(leftCorner.getOwnVectors().length, 0);

        render(left);
        await waitFor(() => planner.requests.length === 3);
        planner.finish(2);
        await waitFor(() => JSON.stringify(roads()) === JSON.stringify(first));
        assert.deepEqual(roads(), first);
    } finally {
        scheduler.dispose();
    }
});
