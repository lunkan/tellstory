import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
    findRoadPath,
    findRoadPaths,
    MAX_CONSECUTIVE_NON_URBAN_TILES,
    ROAD_ELEVATION_COST,
    RoadCell,
    RoadPathOptions,
    RoadTerrain,
} from './road-path';
import { findShortestPath } from './shortest-path';

function roadOptions(width: number, height: number, terrainAt: (cell: RoadCell) => RoadTerrain): RoadPathOptions {
    return {
        start: { x: 0, y: 0 },
        end: { x: width - 1, y: height - 1 },
        bounds: { x: 0, y: 0, width, height },
        terrainAt,
    };
}

test('flat roads use the shortest eight-neighbour distance', () => {
    const result = findRoadPath(roadOptions(4, 3, () => ({ elevation: 0, urban: 1 })));
    assert.ok(result);
    assert.ok(Math.abs(result.travelTime - (1 + 2 * Math.SQRT2)) < 1e-12);
    assert.deepEqual(result.cells[0], { x: 0, y: 0 });
    assert.deepEqual(result.cells.at(-1), { x: 3, y: 2 });
});

test('elevation changes travel time and can make a non-monotone detour faster', () => {
    const options: RoadPathOptions = {
        ...roadOptions(5, 3, ({ x, y }) => ({ elevation: x === 2 && y === 1 ? 1 : 0, urban: 1 })),
        start: { x: 0, y: 1 },
        end: { x: 4, y: 1 },
    };
    const detour = findRoadPath(options);
    assert.ok(detour);
    assert.equal(detour.travelTime, 2 + 2 * Math.SQRT2);
    assert.ok(!detour.cells.some(({ x, y }) => x === 2 && y === 1));

    const direct = findRoadPath({ ...options, elevationCost: 0 });
    assert.ok(direct);
    assert.equal(direct.travelTime, 4);
    assert.ok(direct.cells.some(({ x, y }) => x === 2 && y === 1));
    assert.equal(ROAD_ELEVATION_COST, 4);
});

test('step cost averages endpoint elevations and includes diagonal distance', () => {
    const options = roadOptions(2, 2, ({ x, y }) => ({
        elevation: x === 1 && y === 1 ? 1 : 0,
        urban: 1,
    }));
    const result = findRoadPath({ ...options, elevationCost: 2 });
    assert.ok(result);
    assert.equal(result.travelTime, 2 * Math.SQRT2);

    const singleStep = roadOptions(2, 1, ({ x }) => ({ elevation: x, urban: 1 }));
    assert.equal(findRoadPath(singleStep)?.travelTime, 1 + ROAD_ELEVATION_COST / 2);
});

test('the default gap limit admits exactly five non-urban cells, but not six', () => {
    assert.equal(MAX_CONSECUTIVE_NON_URBAN_TILES, 5);
    const options = roadOptions(7, 1, ({ x }) => ({ elevation: 0, urban: x === 0 || x === 6 ? 1 : 0 }));
    assert.equal(findRoadPath(options)?.travelTime, 6);

    const tooWide = roadOptions(8, 1, ({ x }) => ({ elevation: 0, urban: x === 0 || x === 7 ? 1 : 0 }));
    assert.equal(findRoadPath(tooWide), undefined);
    assert.equal(findRoadPath({ ...tooWide, maxConsecutiveNonUrbanTiles: 6 })?.travelTime, 7);
});

test('urban cells reset the gap counter and non-urban endpoints count', () => {
    const options = roadOptions(8, 1, ({ x }) => ({ elevation: 0, urban: x === 3 ? 0.1 : 0 }));
    assert.equal(findRoadPath({ ...options, maxConsecutiveNonUrbanTiles: 4 })?.travelTime, 7);
    assert.equal(findRoadPath({ ...options, maxConsecutiveNonUrbanTiles: 3 }), undefined);
    assert.equal(findRoadPath({ ...options, maxConsecutiveNonUrbanTiles: 0 }), undefined);
    assert.equal(findRoadPath({
        ...options, maxConsecutiveNonUrbanTiles: 4,
        terrainAt: ({ x }) => ({ elevation: 0, urban: x === 3 ? 0.099 : 0 }),
    }), undefined);
});

test('gap state preserves a more expensive arrival that permits reaching the goal', () => {
    const options: RoadPathOptions = {
        start: { x: 0, y: 1 },
        end: { x: 5, y: 1 },
        bounds: { x: 0, y: 0, width: 6, height: 2 },
        maxConsecutiveNonUrbanTiles: 2,
        terrainAt: ({ x, y }) => ({
            elevation: y === 0 ? 1 : 0,
            urban: (x === 0 && y === 1) || (x === 3 && y === 0) || (x === 5 && y === 1) ? 1 : 0,
        }),
    };
    const result = findRoadPath(options);
    assert.ok(result);
    assert.ok(result.cells.some(({ x, y }) => x === 3 && y === 0));
    assert.deepEqual(result.cells.at(-1), options.end);
});

test('multi-destination search matches separate searches and omits unreachable targets', () => {
    const options: RoadPathOptions = {
        start: { x: 0, y: 1 },
        end: { x: 4, y: 1 },
        bounds: { x: 0, y: 0, width: 7, height: 3 },
        maxConsecutiveNonUrbanTiles: 1,
        terrainAt: ({ x, y }) => ({
            urban: (x === 0 && y === 1) || (x === 2 && y === 1) || (x === 4 && y === 1) ? 1 : 0,
            elevation: x === 1 && y === 1 ? 1 : 0,
        }),
    };
    const ends = [{ x: 2, y: 1 }, { x: 4, y: 1 }, { x: 6, y: 1 }, { x: 2, y: 1 }, options.start];
    const results = findRoadPaths(options, ends);
    for (const end of ends) {
        assert.deepEqual(results.get(`${end.x},${end.y}`), findRoadPath({ ...options, end }));
    }
    assert.equal(results.has('6,1'), false);
    assert.equal(results.size, 3);
    assert.deepEqual(findRoadPaths(options, []), new Map());
});

test('returns a zero-time route for a valid start equal to the end', () => {
    const options = roadOptions(1, 1, () => ({ elevation: 1, urban: 1 }));
    assert.deepEqual(findRoadPath(options), { cells: [{ x: 0, y: 0 }], travelTime: 0 });
});

test('blocked endpoints are unreachable without reading their terrain', () => {
    const options = roadOptions(2, 1, () => ({ elevation: 0, urban: 1 }));
    const terrainAt = ({ x }: RoadCell): RoadTerrain | undefined => x === 1 ? undefined : { elevation: 0, urban: 1 };
    assert.equal(findRoadPath({ ...options, terrainAt, isBlocked: ({ x }) => x === 1 }), undefined);
    assert.equal(findRoadPath({ ...options, terrainAt, isBlocked: ({ x }) => x === 0 }), undefined);
});

test('missing or invalid terrain and invalid settings fail explicitly', () => {
    const options = roadOptions(2, 1, () => ({ elevation: 0, urban: 1 }));
    assert.throws(() => findRoadPath({ ...options, terrainAt: () => undefined }), /terrain unavailable/);
    assert.throws(() => findRoadPath({ ...options, terrainAt: () => ({ elevation: NaN, urban: 1 }) }), /terrain values/);
    assert.throws(() => findRoadPath({ ...options, elevationCost: -1 }), /elevation cost/);
    assert.throws(() => findRoadPath({ ...options, maxConsecutiveNonUrbanTiles: 1.5 }), /non-urban/);
    assert.throws(() => findRoadPath({ ...options, end: { x: 2, y: 0 } }), /endpoints/);
    assert.throws(() => findRoadPath({ ...options, bounds: { x: 0, y: 0, width: 0, height: 1 } }), /bounds/);
});

test('generic search finds the cheapest route and breaks ties independently of neighbour order', () => {
    const graph: Record<string, { state: string; cost: number }[]> = {
        start: [{ state: 'b', cost: 1 }, { state: 'a', cost: 1 }, { state: 'goal', cost: 5 }],
        a: [{ state: 'goal', cost: 1 }],
        b: [{ state: 'goal', cost: 1 }],
        goal: [],
    };
    const search = (reverse: boolean) => findShortestPath({
        start: 'start',
        key: (state) => state,
        isGoal: (state) => state === 'goal',
        neighbours: (state) => reverse ? [...graph[state]].reverse() : graph[state],
    });
    assert.deepEqual(search(false), { states: ['start', 'a', 'goal'], cost: 2 });
    assert.deepEqual(search(true), search(false));
    assert.throws(() => findShortestPath({
        start: 'a',
        key: (state) => state,
        isGoal: () => false,
        neighbours: () => [{ state: 'b', cost: -1 }],
    }), /step cost/);
});

test('generic search distinguishes route states that share a cell', () => {
    type State = { cell: string; gap: number };
    const result = findShortestPath<State>({
        start: { cell: 'start', gap: 0 },
        key: ({ cell, gap }) => `${cell},${gap}`,
        isGoal: ({ cell }) => cell === 'goal',
        neighbours: ({ cell, gap }) => {
            if (cell === 'start') {
                return [
                    { state: { cell: 'junction', gap: 2 }, cost: 1 },
                    { state: { cell: 'urban', gap: 0 }, cost: 2 },
                ];
            }
            if (cell === 'urban') {
                return [{ state: { cell: 'junction', gap: 1 }, cost: 1 }];
            }
            if (cell === 'junction' && gap === 1) {
                return [{ state: { cell: 'goal', gap: 2 }, cost: 1 }];
            }
            return [];
        },
    });
    assert.deepEqual(result, {
        states: [
            { cell: 'start', gap: 0 },
            { cell: 'urban', gap: 0 },
            { cell: 'junction', gap: 1 },
            { cell: 'goal', gap: 2 },
        ],
        cost: 4,
    });
});
