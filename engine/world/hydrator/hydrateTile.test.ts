import assert from 'node:assert/strict';
import { test } from 'node:test';
import { config } from '../../config/config';
import { mergeSeeds, seedFromString } from '../../util/number-generator';
import { QuadNode } from '../quad-node';
import { hydrate } from './hydrate';
import { invalidateTerrainNeighbours } from './invalidate-terrain';
import { DEFAULT_TERRAIN_CLUSTER, TERRAIN_CLUSTER_MULTIPLIERS, TERRAIN_NEIGHBOUR_INFLUENCE, TERRAIN_SMOOTHNESS, TERRAIN_VARIATION, oceanFromElevation } from './hydrateTile';
import { planTerrainChildren } from './terrain-planner';

function twoParents(): { root: QuadNode; left: QuadNode; right: QuadNode } {
    const root = QuadNode.createRoot(4);
    root.setTileData({ terrain: [{ type: 'elevation', value: 0 }] });
    root.detach();
    const left = root.findByPoint({ x: 0, y: 0, z: 1 }, true)!;
    const right = root.findByPoint({ x: 8, y: 0, z: 1 }, true)!;
    left.setTileData({ terrain: [{ type: 'elevation', value: 0 }] });
    right.setTileData({ terrain: [{ type: 'elevation', value: 1 }, { type: 'custom-forest', value: 1 }] });
    left.detach();
    right.detach();
    return { root, left, right };
}

function value(node: QuadNode, type = 'elevation'): number {
    const terrain = node.getTile()?.terrain.find((item) => item.type === type);
    assert.ok(terrain, `Missing ${type}`);
    return terrain.value;
}

test('all terrain types smooth toward parent-depth neighbours, with bounded values and average divergence', () => {
    const { left, right } = twoParents();
    const leftChildren = left.getQuadrants(true);
    const rightChildren = right.getQuadrants(true);
    hydrate(leftChildren[0]);
    hydrate(rightChildren[0]);
    const nearLeft = left.getQuadrantAt(1, 0)!;
    const farLeft = left.getQuadrantAt(0, 0)!;
    const nearRight = right.getQuadrantAt(0, 0)!;
    const farRight = right.getQuadrantAt(1, 0)!;
    assert.equal(value(farLeft), 0);
    assert.ok(value(nearLeft) > value(farLeft));
    assert.ok(value(nearRight) < value(farRight));
    assert.ok(value(nearLeft, 'custom-forest') > 0);
    assert.ok(leftChildren.reduce((sum, child) => sum + value(child), 0) / 4 > 0);
    assert.ok([...leftChildren, ...rightChildren].flatMap((child) => child.getTile()!.terrain)
        .every(({ value: v }) => v >= 0 && v <= 1));
});

test('empty neighbouring nodes contribute zero elevation but not other terrain', () => {
    config.set({
        id: 1, name: 'test', version: '1', vectors: [], markers: [],
        tiles: [
            { id: 1, name: 'elevation', category: 'typography', tags: [], cluster: 0,
                attentionValue: 1, movementCost: 0, meta: { color: '#000' } },
            { id: 2, name: 'forest', category: 'forest', tags: [], cluster: 0,
                attentionValue: 1, movementCost: 0, meta: { color: '#000' } },
        ],
    });
    const root = QuadNode.createRoot(2);
    const parent = root.findByPoint({ x: 0, y: 0, z: 1 }, true)!;
    const east = root.findByPoint({ x: 2, y: 0, z: 1 }, true)!;
    const south = root.findByPoint({ x: 0, y: 2, z: 1 }, true)!;
    parent.setTileData({ terrain: [{ type: 'elevation', value: 0.12 }, { type: 'forest', value: 0.5 }] });
    parent.detach();
    south.setTileData({ terrain: [{ type: 'elevation', value: 0.12 }, { type: 'forest', value: 0.5 }] });
    const before = structuredClone(root.getDetachedTiles());
    const children = [
        parent.getQuadrantAt(0, 0, true)!, parent.getQuadrantAt(1, 0, true)!,
        parent.getQuadrantAt(0, 1, true)!, parent.getQuadrantAt(1, 1, true)!,
    ];
    hydrate(children[0]);

    const planned = (type: string, centre: number, neighbours: number[]) =>
        planTerrainChildren(centre, neighbours, mergeSeeds(parent.key.hash, seedFromString(type)), {
            smoothness: TERRAIN_SMOOTHNESS.get(type) ?? TERRAIN_NEIGHBOUR_INFLUENCE,
            variation: TERRAIN_VARIATION, cluster: 0,
        });
    const elevation = planned('elevation', 0.12, [0.12, 0, 0.12, 0.12]);
    const forest = planned('forest', 0.5, [0.5, 0.5, 0.5, 0.5]);
    assert.deepEqual(children.map((child) => value(child)), elevation);
    assert.deepEqual(children.map((child) => value(child, 'forest')), forest);
    assert.ok(elevation[1] < elevation[0]);
    assert.ok(value(children[1], 'ocean') > value(children[0], 'ocean'));
    assert.equal(value(children[1], 'ocean'), oceanFromElevation(elevation[1]));
    assert.equal(east.getTile(), undefined);
    assert.deepEqual(root.getDetachedTiles(), before);
});

test('visiting distant deep tiles in opposite orders yields identical terrain', () => {
    function run(reverse: boolean): number[][] {
        const { root } = twoParents();
        const points = [{ x: 6, y: 2, z: 4 }, { x: 9, y: 2, z: 4 }];
        for (const point of reverse ? [...points].reverse() : points) {
            hydrate(root.findByPoint(point, true));
        }
        return points.map((point) => root.findByPoint(point)!.getTile()!.terrain.map(({ value: v }) => v));
    }
    assert.deepEqual(run(false), run(true));
});

test('planner respects smoothness and variation settings independently', () => {
    const neighbours = [0, 1, 0, 0];
    const options = { smoothness: 0, variation: 0, cluster: 0 };
    assert.deepEqual(planTerrainChildren(0, neighbours, 1n, options), [0, 0, 0, 0]);
    assert.deepEqual(planTerrainChildren(0, neighbours, 1n, { ...options, smoothness: 1 }), [0, 0.25, 0, 0.25]);
    const noVariation = planTerrainChildren(0.5, [0.5, 0.5, 0.5, 0.5], 1n, options);
    const variation = planTerrainChildren(0.5, [0.5, 0.5, 0.5, 0.5], 1n, { ...options, variation: 0.08 });
    assert.deepEqual(noVariation, [0.5, 0.5, 0.5, 0.5]);
    assert.notDeepEqual(variation, noVariation);
    assert.deepEqual(variation, planTerrainChildren(0.5, [0.5, 0.5, 0.5, 0.5], 1n, { ...options, variation: 0.08 }));
    assert.throws(() => planTerrainChildren(0.5, neighbours, 1n, { ...options, smoothness: -1 }), /Terrain values/);
});

test('clustering concentrates terrain independently of smoothing while preserving the smoothed total', () => {
    const neighbours = [0.2, 0.8, 0.5, 0.5];
    const base = { smoothness: 0.5, variation: 0, cluster: 0 };
    const smooth = planTerrainChildren(0.5, neighbours, 1n, base);
    const forest = planTerrainChildren(0.5, neighbours, 1n, { ...base, cluster: 0.5 });
    const urban = planTerrainChildren(0.5, neighbours, 1n, { ...base, cluster: 0.8 });
    const spread = (values: number[]) => Math.max(...values) - Math.min(...values);
    const total = (values: number[]) => values.reduce((sum, value) => sum + value, 0);
    assert.ok(spread(urban) > spread(forest));
    assert.ok(spread(forest) > spread(smooth));
    assert.ok(Math.abs(total(urban) - total(smooth)) < 1e-12);
    assert.ok(Math.abs(total(forest) - total(smooth)) < 1e-12);
    assert.ok(urban[1] > urban[0] && urban[3] > urban[2]);
    assert.deepEqual(urban, planTerrainChildren(0.5, neighbours, 1n, { ...base, cluster: 0.8 }));
    assert.ok(urban.every((value) => value >= 0 && value <= 1));
});

test('hard-coded settings favour clustered urban and smoother elevation, with generic defaults', () => {
    assert.ok(TERRAIN_SMOOTHNESS.get('elevation')! > TERRAIN_SMOOTHNESS.get('forrest')!);
    assert.ok(TERRAIN_SMOOTHNESS.get('forrest')! > TERRAIN_SMOOTHNESS.get('urban')!);
    assert.ok(DEFAULT_TERRAIN_CLUSTER * TERRAIN_CLUSTER_MULTIPLIERS.get('urban')! > DEFAULT_TERRAIN_CLUSTER);
    assert.ok(TERRAIN_NEIGHBOUR_INFLUENCE >= 0 && TERRAIN_NEIGHBOUR_INFLUENCE <= 1);
});

test('neighbour hydration does not persist generated terrain', () => {
    const { root, left } = twoParents();
    const before = structuredClone(root.getDetachedTiles());
    hydrate(left.getQuadrantAt(1, 0, true));
    assert.deepEqual(root.getDetachedTiles(), before);
});

test('already hydrated siblings retain terrain, markers and vectors', () => {
    const { left } = twoParents();
    const children = left.getQuadrants(true);
    children[0].setTileData({
        terrain: [{ type: 'elevation', value: 0.9 }],
        vectors: [{ type: 'road', value: 1, direction: { x: 1, y: 0 } }],
        markers: [{ type: 'custom', attention: 1, id: 'existing' }],
    });
    const before = structuredClone(children[0].getTile());
    hydrate(children[1]);
    assert.deepEqual(structuredClone(children[0].getTile()), before);
});

test('terrain edits invalidate affected generated neighbours and preserve protected tiles', () => {
    const { root, left, right } = twoParents();
    const adjacent = left.getQuadrantAt(1, 0, true)!;
    const protectedParent = root.findByPoint({ x: 0, y: 8, z: 1 }, true)!;
    protectedParent.setTileData({ terrain: [{ type: 'elevation', value: 0 }] });
    protectedParent.detach();
    const protectedChild = protectedParent.getQuadrantAt(0, 1, true)!;
    protectedChild.setTileData({ terrain: [{ type: 'elevation', value: 0.3 }] });
    hydrate(adjacent);
    protectedChild.detach();
    const protectedBefore = structuredClone(protectedChild.getTile());
    const before = value(adjacent);
    right.setTileData({ terrain: [{ type: 'elevation', value: 0.5 }] });
    invalidateTerrainNeighbours(right);
    assert.equal(adjacent.hasTile(), false);
    assert.deepEqual(structuredClone(protectedChild.getTile()), protectedBefore);
    hydrate(adjacent);
    assert.ok(value(adjacent) < before);
    assert.ok(value(adjacent) > 0);
});

test('regeneration after an edit matches a fresh world visited in another order', () => {
    const points = [{ x: 6, y: 2, z: 4 }, { x: 9, y: 2, z: 4 }];
    const changed = twoParents();
    points.forEach((point) => hydrate(changed.root.findByPoint(point, true)));
    changed.right.setTileData({ terrain: [{ type: 'elevation', value: 0.6 }] });
    invalidateTerrainNeighbours(changed.right);
    points.forEach((point) => hydrate(changed.root.findByPoint(point, true)));

    const fresh = twoParents();
    fresh.right.setTileData({ terrain: [{ type: 'elevation', value: 0.6 }] });
    [...points].reverse().forEach((point) => hydrate(fresh.root.findByPoint(point, true)));
    for (const point of points) {
        assert.deepEqual(changed.root.findByPoint(point)!.getTile()?.terrain, fresh.root.findByPoint(point)!.getTile()?.terrain);
    }
});

test('hydration uses palette cluster and type-specific settings for urban, forest and dynamic terrain', () => {
    config.set({
        id: 1, name: 'test', version: '1', vectors: [], markers: [],
        tiles: ['urban', 'forrest', 'custom', 'constructor'].map((name, id) => ({
            id, name, category: 'biome', tags: [], cluster: name === 'custom' ? 0 : 0.5,
            attentionValue: 1, movementCost: 0, meta: { color: '#000' },
        })),
    });
    const root = QuadNode.createRoot(1);
    root.setTileData({ terrain: ['urban', 'forrest', 'custom', 'constructor'].map((type) => ({ type, value: 0.5 })) });
    root.detach();
    const children = root.getQuadrants(true);
    hydrate(children[0]);
    const spread = (type: string) => {
        const values = children.map((child) => value(child, type));
        return Math.max(...values) - Math.min(...values);
    };
    assert.ok(spread('urban') > spread('forrest'));
    assert.ok(spread('forrest') > spread('custom'));
    assert.ok(children.every((child) => Number.isFinite(value(child, 'constructor'))));
});
