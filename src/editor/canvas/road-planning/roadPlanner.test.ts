import assert from 'node:assert/strict';
import { test } from 'node:test';
import { planRoadNetwork } from '../../../../engine/world/vector-generation/road-plan';
import { RoadPlannerWorker, WorkerPort } from './RoadPlannerWorker';
import { planRoadSnapshot, RoadPlanningRequest, RoadPlanningResponse } from './roadPlannerProtocol';

class FakeWorker implements WorkerPort {
    public onmessage: Worker['onmessage'] = null;
    public onerror: Worker['onerror'] = null;
    public onmessageerror: Worker['onmessageerror'] = null;
    public terminated = false;
    public sent?: RoadPlanningRequest;
    public failure?: Error;

    public postMessage(message: RoadPlanningRequest): void {
        if (this.failure) {
            throw this.failure;
        }
        this.sent = structuredClone(message);
    }

    public terminate(): void {
        this.terminated = true;
    }

    public reply(response: RoadPlanningResponse): void {
        if (this.onmessage) {
            Reflect.apply(this.onmessage, this, [{ data: response }]);
        }
    }

    public crash(message: string): void {
        if (this.onerror) {
            Reflect.apply(this.onerror, this, [{ message, preventDefault: () => {} }]);
        }
    }

    public unreadable(): void {
        if (this.onmessageerror) {
            Reflect.apply(this.onmessageerror, this, [{}]);
        }
    }
}

function snapshot(): RoadPlanningRequest {
    return {
        bounds: { x: 10, y: -2, width: 3, height: 1 },
        terrain: [
            { urban: 1, elevation: 0 },
            { urban: 0, elevation: 0 },
            { urban: 1, elevation: 0 },
        ],
    };
}

test('snapshot planning uses row-major terrain and preserves bounds', () => {
    const request = snapshot();
    const plan = planRoadSnapshot(request);
    assert.deepEqual(plan, planRoadNetwork({
        bounds: request.bounds,
        terrainAt: ({ x }) => request.terrain[x - 10] ?? undefined,
    }));
    assert.deepEqual(plan.connections[0].cells, [{ x: 10, y: -2 }, { x: 11, y: -2 }, { x: 12, y: -2 }]);
    assert.throws(() => planRoadSnapshot({ ...request, terrain: [] }), /snapshot/);
    assert.throws(() => planRoadSnapshot({ ...request, terrain: [request.terrain[0], null, request.terrain[2]] }), /unavailable/);
    assert.deepEqual(planRoadSnapshot({
        ...request, terrain: [request.terrain[0], null, request.terrain[2]], blocked: [1],
    }).components, [[{ x: 10, y: -2 }], [{ x: 12, y: -2 }]]);
    assert.throws(() => planRoadSnapshot({ ...request, blocked: [0] }), /invalid blocked/);
    assert.throws(() => planRoadSnapshot({ ...request, blocked: [3] }), /invalid blocked/);
});

test('a blocked snapshot cell does not suppress reachable roads elsewhere', () => {
    const plan = planRoadSnapshot({
        bounds: { x: 0, y: 0, width: 5, height: 1 },
        terrain: [
            { urban: 1, elevation: 0 }, { urban: 0, elevation: 0 }, { urban: 1, elevation: 0 },
            null, { urban: 1, elevation: 0 },
        ],
        blocked: [3],
    });
    assert.deepEqual(plan.connections[0].cells, [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }]);
    assert.equal(plan.components.length, 2);
});

test('protected cells only carry routes along their existing road directions', () => {
    const request: RoadPlanningRequest = {
        bounds: { x: 0, y: 0, width: 3, height: 1 },
        terrain: [{ urban: 1, elevation: 0 }, { urban: 0, elevation: 0 }, { urban: 1, elevation: 0 }],
        protectedCells: [{ index: 1, directions: [] }],
    };
    const absent = planRoadSnapshot(request);
    assert.equal(absent.connections.length, 0);
    assert.equal(absent.components.length, 2);

    const oneSide = planRoadSnapshot({ ...request, protectedCells: [{ index: 1, directions: [{ x: -1, y: 0 }] }] });
    assert.equal(oneSide.connections.length, 0);
    assert.equal(oneSide.components.length, 2);

    const bothSides = planRoadSnapshot({
        ...request, protectedCells: [{ index: 1, directions: [{ x: -1, y: 0 }, { x: 1, y: 0 }] }],
    });
    assert.deepEqual(bothSides.connections[0].cells, [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }]);
    assert.equal(bothSides.components.length, 1);
});

test('routes can detour around protected terrain without a matching road', () => {
    const request: RoadPlanningRequest = {
        bounds: { x: 0, y: 0, width: 3, height: 2 },
        terrain: [
            { urban: 1, elevation: 0 }, { urban: 0, elevation: 0 }, { urban: 1, elevation: 0 },
            { urban: 0, elevation: 0 }, { urban: 0, elevation: 0 }, { urban: 0, elevation: 0 },
        ],
        protectedCells: [{ index: 1, directions: [] }],
    };
    const plan = planRoadSnapshot(request);
    assert.deepEqual(plan.connections[0].cells, [{ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 0 }]);
    assert.equal(plan.connections[0].travelTime, 2 * Math.SQRT2);
    assert.equal(plan.components.length, 1);
});

test('existing protected roads count as connected only when both half-edges exist', () => {
    const request: RoadPlanningRequest = {
        bounds: { x: 0, y: 0, width: 2, height: 1 },
        terrain: [{ urban: 1, elevation: 0 }, { urban: 1, elevation: 0 }],
        protectedCells: [
            { index: 0, directions: [{ x: 1, y: 0 }] },
            { index: 1, directions: [{ x: -1, y: 0 }] },
        ],
    };
    const existing = planRoadSnapshot(request);
    assert.equal(existing.connections.length, 0);
    assert.equal(existing.components.length, 1);
    const incomplete = planRoadSnapshot({
        ...request, protectedCells: [{ index: 0, directions: [{ x: 1, y: 0 }] }, { index: 1, directions: [] }],
    });
    assert.equal(incomplete.connections.length, 0);
    assert.equal(incomplete.components.length, 2);
});

test('inherited directions enable protected crossings and discount complete inherited routes', () => {
    const request: RoadPlanningRequest = {
        bounds: { x: 0, y: 0, width: 3, height: 2 },
        terrain: [
            { urban: 1, elevation: 0 }, { urban: 0, elevation: 0 }, { urban: 1, elevation: 0 },
            { urban: 0, elevation: 0 }, { urban: 0, elevation: 0 }, { urban: 0, elevation: 0 },
        ],
        protectedCells: [{ index: 1, directions: [] }],
        inheritedCells: [{ index: 1, directions: [{ x: -1, y: 0 }, { x: 1, y: 0 }] }],
    };
    const crossing = planRoadSnapshot(request);
    assert.equal(crossing.components.length, 1);
    const crossingEdges = new Set(crossing.connections.flatMap(({ cells }) => cells.slice(1).map((cell, index) =>
        `${cells[index].x},${cells[index].y}|${cell.x},${cell.y}`)));
    assert.deepEqual([...crossingEdges].sort(), ['0,0|1,0', '1,0|2,0']);
    const detour: RoadPlanningRequest = {
        ...request, protectedCells: [], inheritedCells: [
            { index: 0, directions: [{ x: 1, y: 1 }] },
            { index: 4, directions: [{ x: -1, y: -1 }, { x: 1, y: -1 }] },
            { index: 2, directions: [{ x: -1, y: 1 }] },
        ],
    };
    const reused = planRoadSnapshot(detour);
    assert.deepEqual(reused.connections, []);
    assert.equal(reused.components.length, 1);
    assert.throws(() => planRoadSnapshot({
        ...request, inheritedCells: [{ index: 1, directions: [{ x: 2, y: 0 }] }],
    }), /invalid inherited/);
});

test('urban tiles connect to nearby inherited roads but inherited-only tiles do not connect to one another', () => {
    const request: RoadPlanningRequest = {
        bounds: { x: 0, y: 0, width: 4, height: 1 },
        terrain: [0.5, 0, 0, 0].map((urban) => ({ urban, elevation: 0 })),
        inheritedCells: [
            { index: 2, directions: [{ x: 1, y: 0 }] },
            { index: 3, directions: [{ x: -1, y: 0 }] },
        ],
    };
    const plan = planRoadSnapshot(request);
    assert.deepEqual(plan.connections.map(({ cells }) => cells), [[{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }]]);
    assert.deepEqual(planRoadSnapshot({ ...request, terrain: request.terrain.map(() => ({ urban: 0, elevation: 0 })) }).connections, []);
    assert.deepEqual(request.terrain.map((tile) => tile?.urban), [0.5, 0, 0, 0]);
    assert.deepEqual(planRoadSnapshot(request), plan);
});

test('shallower road targets use 0.3 for complete and boundary routes', () => {
    for (const protectedTarget of [false, true]) {
        for (const { urban, distance, expected } of [
            { urban: 0.199, distance: 1, expected: false },
            { urban: 0.2, distance: 1, expected: true },
            { urban: 0.399, distance: 2, expected: false },
            { urban: 0.4, distance: 2, expected: true },
            { urban: 0.599, distance: 3, expected: false },
            { urban: 0.6, distance: 3, expected: true },
            { urban: 0.799, distance: 4, expected: false },
            { urban: 0.8, distance: 4, expected: true },
        ]) {
            const request: RoadPlanningRequest = {
                bounds: { x: 0, y: 0, width: distance + 1, height: 1 },
                terrain: Array.from({ length: distance + 1 }, (_, x) => ({ urban: x === 0 ? urban : 0, elevation: 0 })),
                inheritedCells: [{ index: distance, directions: [{ x: 1, y: 0 }] }],
                protectedCells: protectedTarget ? [{ index: distance, directions: [] }] : [],
            };
            const connections = planRoadSnapshot(request).connections;
            assert.equal(connections.length, expected ? 1 : 0, `urban ${urban}, distance ${distance}, protected ${protectedTarget}`);
            if (expected) {
                assert.equal(connections[0].kind, protectedTarget ? 'boundary' : 'road');
                assert.deepEqual(connections[0].cells[0], { x: 0, y: 0 });
                assert.deepEqual(connections[0].cells.at(-1), { x: distance, y: 0 });
            }
        }
    }
});

test('urban-to-inherited connections respect distance, blocked cells and elevation', () => {
    const request: RoadPlanningRequest = {
        bounds: { x: 0, y: 0, width: 4, height: 2 },
        terrain: [
            { urban: 1, elevation: 0 }, { urban: 0, elevation: 1 }, { urban: 0, elevation: 0 }, { urban: 0, elevation: 0 },
            { urban: 0, elevation: 0 }, { urban: 0, elevation: 0 }, { urban: 0, elevation: 0 }, { urban: 0, elevation: 0 },
        ],
        inheritedCells: [{ index: 2, directions: [{ x: 1, y: 0 }] }, { index: 3, directions: [{ x: -1, y: 0 }] }],
    };
    const path = planRoadSnapshot(request).connections[0];
    assert.deepEqual(path.cells, [{ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 0 }]);
    assert.ok(path.travelTime < 6);
    const blocked: RoadPlanningRequest = {
        bounds: { x: 0, y: 0, width: 3, height: 1 },
        terrain: [{ urban: 1, elevation: 0 }, null, { urban: 0, elevation: 0 }],
        blocked: [1],
        inheritedCells: [{ index: 2, directions: [{ x: 1, y: 0 }] }],
    };
    assert.deepEqual(planRoadSnapshot(blocked).connections, []);
});

test('protected inherited road targets receive boundary-only connections without claiming connectivity', () => {
    const request: RoadPlanningRequest = {
        bounds: { x: 0, y: 0, width: 3, height: 1 },
        terrain: [{ urban: 1, elevation: 0 }, { urban: 0, elevation: 0 }, { urban: 0, elevation: 0 }],
        protectedCells: [{ index: 2, directions: [] }],
        inheritedCells: [{ index: 2, directions: [{ x: 1, y: 0 }] }],
    };
    const plan = planRoadSnapshot(request);
    assert.deepEqual(plan.connections, [{
        kind: 'boundary', cells: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }], travelTime: 1.5,
    }]);
    assert.deepEqual(plan.components, [[{ x: 0, y: 0 }]]);
});

test('protected urban boundary pairs obey the same endpoint product tiers', () => {
    for (const { urban, protectedUrban, distance, expected } of [
        { urban: 0.1, protectedUrban: 0.1, distance: 1, expected: false },
        { urban: 0.3, protectedUrban: 0.2, distance: 1, expected: true },
        { urban: 1, protectedUrban: 0.1199, distance: 2, expected: false },
        { urban: 1, protectedUrban: 0.12, distance: 2, expected: true },
        { urban: 1, protectedUrban: 0.1799, distance: 3, expected: false },
        { urban: 1, protectedUrban: 0.18, distance: 3, expected: true },
        { urban: 1, protectedUrban: 0.2399, distance: 4, expected: false },
        { urban: 1, protectedUrban: 0.24, distance: 4, expected: true },
    ]) {
        const request: RoadPlanningRequest = {
            bounds: { x: 0, y: 0, width: distance + 1, height: 1 },
            terrain: Array.from({ length: distance + 1 }, (_, x) => ({
                urban: x === 0 ? urban : x === distance ? protectedUrban : 0, elevation: 0,
            })),
            protectedCells: [{ index: distance, directions: [] }],
        };
        const connections = planRoadSnapshot(request).connections;
        assert.equal(connections.length, expected ? 1 : 0);
        if (expected) {
            assert.equal(connections[0].kind, 'boundary');
        }
    }
});

test('protected urban endpoints can receive boundary-only roads from inherited road cells', () => {
    const request: RoadPlanningRequest = {
        bounds: { x: 0, y: 0, width: 2, height: 1 },
        terrain: [{ urban: 1, elevation: 0 }, { urban: 0, elevation: 0 }],
        protectedCells: [{ index: 0, directions: [] }],
        inheritedCells: [{ index: 1, directions: [{ x: 1, y: 0 }] }],
    };
    assert.deepEqual(planRoadSnapshot(request).connections, [{
        kind: 'boundary', cells: [{ x: 1, y: 0 }, { x: 0, y: 0 }], travelTime: 0.5,
    }]);
});

test('a protected urban target gets boundary roads without joining networks through it', () => {
    const request: RoadPlanningRequest = {
        bounds: { x: 0, y: 0, width: 3, height: 1 },
        terrain: Array.from({ length: 3 }, () => ({ urban: 1, elevation: 0 })),
        protectedCells: [{ index: 1, directions: [] }],
    };
    const plan = planRoadSnapshot(request);
    assert.deepEqual(plan.connections, [
        { kind: 'boundary', cells: [{ x: 0, y: 0 }, { x: 1, y: 0 }], travelTime: 0.5 },
        { kind: 'boundary', cells: [{ x: 2, y: 0 }, { x: 1, y: 0 }], travelTime: 0.5 },
    ]);
    assert.deepEqual(plan.components, [
        [{ x: 0, y: 0 }], [{ x: 1, y: 0 }], [{ x: 2, y: 0 }],
    ]);
    assert.deepEqual(planRoadSnapshot(request), plan);
});

test('boundary road respects maximum distance, elevation, and existing protected connections', () => {
    const request: RoadPlanningRequest = {
        bounds: { x: 0, y: 0, width: 3, height: 1 },
        terrain: [{ urban: 1, elevation: 1 }, { urban: 0, elevation: 1 }, { urban: 1, elevation: 0 }],
        protectedCells: [{ index: 0, directions: [] }],
    };
    const plan = planRoadSnapshot(request);
    assert.deepEqual(plan.connections[0], {
        kind: 'boundary',
        cells: [{ x: 2, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 0 }],
        travelTime: 5.5,
    });
    assert.equal(planRoadSnapshot({ ...request, maxDistance: 1 }).connections.length, 0);
    const matched = planRoadSnapshot({
        ...request, protectedCells: [{ index: 0, directions: [{ x: 1, y: 0 }] }],
    });
    assert.equal(matched.connections.length, 1);
    assert.equal(matched.connections[0].kind, 'road');
    assert.equal(matched.components.length, 1);
});

test('boundary travel time integrates elevation only to the shared border', () => {
    const request: RoadPlanningRequest = {
        bounds: { x: 0, y: 0, width: 2, height: 1 },
        terrain: [{ urban: 1, elevation: 0 }, { urban: 1, elevation: 1 }],
        protectedCells: [{ index: 0, directions: [] }],
    };
    const plan = planRoadSnapshot(request);
    assert.equal(plan.connections[0].travelTime, 2);
    assert.deepEqual(plan.connections[0].cells, [{ x: 1, y: 0 }, { x: 0, y: 0 }]);
});

test('boundary pairs follow the same stable distance order as complete routes', () => {
    const request: RoadPlanningRequest = {
        bounds: { x: 0, y: 0, width: 3, height: 3 },
        terrain: [
            { urban: 0, elevation: 0 }, { urban: 1, elevation: 1 }, { urban: 0, elevation: 0 },
            { urban: 1, elevation: 0 }, { urban: 1, elevation: 0 }, { urban: 0, elevation: 0 },
            { urban: 0, elevation: 0 }, { urban: 0, elevation: 0 }, { urban: 0, elevation: 0 },
        ],
        protectedCells: [{ index: 4, directions: [] }],
    };
    const boundaries = planRoadSnapshot(request).connections.filter(({ kind }) => kind === 'boundary');
    assert.deepEqual(boundaries, [
        { kind: 'boundary', cells: [{ x: 1, y: 0 }, { x: 1, y: 1 }], travelTime: 2 },
        { kind: 'boundary', cells: [{ x: 0, y: 1 }, { x: 1, y: 1 }], travelTime: 0.5 },
    ]);
});

test('boundary pairs are planned at their distance before longer complete pairs', () => {
    const request: RoadPlanningRequest = {
        bounds: { x: 0, y: 0, width: 4, height: 1 },
        terrain: [1, 1, 0, 1].map((urban) => ({ urban, elevation: 0 })),
        protectedCells: [{ index: 0, directions: [] }],
    };
    const plan = planRoadSnapshot(request);
    assert.deepEqual(plan.connections, [
        { kind: 'boundary', cells: [{ x: 1, y: 0 }, { x: 0, y: 0 }], travelTime: 0.5 },
        { kind: 'road', cells: [{ x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }], travelTime: 2 },
        { kind: 'boundary', cells: [{ x: 3, y: 0 }, { x: 2, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 0 }], travelTime: 2.5 },
    ]);
    assert.deepEqual(plan.components, [
        [{ x: 0, y: 0 }], [{ x: 1, y: 0 }, { x: 3, y: 0 }],
    ]);
});

test('boundary connections cannot traverse a protected tile without existing road edges', () => {
    const request: RoadPlanningRequest = {
        bounds: { x: 0, y: 0, width: 4, height: 1 },
        terrain: [
            { urban: 1, elevation: 0 }, { urban: 0, elevation: 0 },
            { urban: 0, elevation: 0 }, { urban: 1, elevation: 0 },
        ],
        protectedCells: [{ index: 0, directions: [] }, { index: 2, directions: [] }],
    };
    const plan = planRoadSnapshot(request);
    assert.equal(plan.connections.length, 0);
    assert.equal(plan.components.length, 2);
});

test('protected snapshot entries are validated', () => {
    const request = snapshot();
    assert.throws(() => planRoadSnapshot({ ...request, protectedCells: [{ index: 3, directions: [] }] }), /invalid protected/);
    assert.throws(() => planRoadSnapshot({ ...request, protectedCells: [{ index: 0, directions: [{ x: 0, y: 0 }] }] }), /invalid protected/);
    assert.throws(() => planRoadSnapshot({
        ...request, protectedCells: [{ index: 0, directions: [] }, { index: 0, directions: [] }],
    }), /invalid protected/);
    assert.throws(() => planRoadSnapshot({
        ...request, terrain: [null, ...request.terrain.slice(1)], blocked: [0],
        protectedCells: [{ index: 0, directions: [] }],
    }), /invalid protected/);
});

test('worker returns the plan and terminates after completion', async () => {
    const fake = new FakeWorker();
    const planner = new RoadPlannerWorker(() => fake);
    const request = snapshot();
    const result = planner.plan(request);
    assert.deepEqual(fake.sent, request);
    const plan = planRoadSnapshot(request);
    fake.reply({ status: 'completed', plan });
    assert.deepEqual(await result, { status: 'completed', plan });
    assert.equal(fake.terminated, true);
    planner.dispose();
});

test('replacing a request cancels it and ignores late replies', async () => {
    const workers: FakeWorker[] = [];
    const planner = new RoadPlannerWorker(() => {
        const worker = new FakeWorker();
        workers.push(worker);
        return worker;
    });
    const first = planner.plan(snapshot());
    const second = planner.plan(snapshot());
    assert.deepEqual(await first, { status: 'cancelled' });
    assert.equal(workers[0].terminated, true);
    workers[0].reply({ status: 'completed', plan: { connections: [], components: [] } });
    assert.equal(workers[1].terminated, false);
    const plan = planRoadSnapshot(snapshot());
    workers[1].reply({ status: 'completed', plan });
    assert.deepEqual(await second, { status: 'completed', plan });
});

test('cancel and dispose terminate work and disposed planners reject requests', async () => {
    const fake = new FakeWorker();
    const planner = new RoadPlannerWorker(() => fake);
    const pending = planner.plan(snapshot());
    planner.dispose();
    assert.deepEqual(await pending, { status: 'cancelled' });
    assert.equal(fake.terminated, true);
    await assert.rejects(planner.plan(snapshot()), /disposed/);
    planner.cancel();
});

test('planning errors, worker failures and message errors reject rather than return a plan', async () => {
    for (const fail of [
        (worker: FakeWorker) => worker.reply({ status: 'error', message: 'bad terrain' }),
        (worker: FakeWorker) => worker.crash('worker crashed'),
        (worker: FakeWorker) => worker.unreadable(),
    ]) {
        const worker = new FakeWorker();
        const planner = new RoadPlannerWorker(() => worker);
        const result = planner.plan(snapshot());
        fail(worker);
        await assert.rejects(result, /Road planning/);
        assert.equal(worker.terminated, true);
    }
});

test('postMessage and worker creation errors reject without leaving a live worker', async () => {
    const worker = new FakeWorker();
    worker.failure = new Error('cannot clone');
    const planner = new RoadPlannerWorker(() => worker);
    await assert.rejects(planner.plan(snapshot()), /cannot clone/);
    assert.equal(worker.terminated, true);
    planner.cancel();
    const broken = new RoadPlannerWorker(() => { throw new Error('no worker'); });
    await assert.rejects(broken.plan(snapshot()), /no worker/);
});
