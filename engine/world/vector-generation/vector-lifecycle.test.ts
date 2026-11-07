import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getCellEdges } from '../cell-edges';
import { connectGeneratedNodes, connectNodes } from '../connect-nodes';
import { dehydrate } from '../hydrator/hydrate';
import { hydrateVectorPaths } from '../hydrator/hydrateVectorPaths';
import { placeVectors } from '../hydrator/placeVectors';
import { QuadNode } from '../quad-node';
import { getVectorCell } from '../vector-placement';
import { World } from '../world';

function setup(): { root: QuadNode; a: QuadNode; b: QuadNode; c: QuadNode } {
    const root = QuadNode.createRoot(3);
    root.setTileData({ terrain: [{ type: 'urban', value: 1 }] });
    root.detach();
    const [a, b, c] = root.getQuadrants(true);
    for (const node of root.getQuadrants()) {
        node.setTileData({ terrain: [{ type: 'urban', value: 1 }] });
    }
    return { root, a, b, c };
}

test('generated connections are mirrored, deduplicated and never saved before detach', () => {
    const { root, a, b, c } = setup();
    assert.equal(connectGeneratedNodes(a, b, 'road', 1), 'connected');
    assert.equal(connectGeneratedNodes(a, c, 'road', 1), 'connected');
    assert.equal(connectGeneratedNodes(a, b, 'road', 1), 'already-connected');
    assert.equal(a.getOwnVectors().length, 2);
    assert.deepEqual(a.getOwnVectors().map((vector) => vector.direction), [{ x: 0, y: 1 }, { x: 1, y: 0 }]);
    assert.deepEqual(b.getOwnVectors()[0].direction, { x: 0, y: -1 });
    assert.equal(a.isDetached(), false);
    assert.equal(root.getDetachedTiles().some((tile) => tile.nodeId === a.key.id), false);
    assert.deepEqual(a.getOwnVectors()[0], { type: 'road', value: 1, direction: { x: 0, y: 1 } });
});

test('detaching a generated tile saves all its edges without detaching neighbours', () => {
    const { root, a, b, c } = setup();
    connectGeneratedNodes(a, b, 'road', 1);
    connectGeneratedNodes(a, c, 'river', 0.5);
    a.detach();
    assert.equal(b.isDetached(), false);
    assert.equal(b.getOwnVectors().length, 1);
    const saved = root.getDetachedTiles().find((tile) => tile.nodeId === a.key.id);
    assert.ok(saved);
    assert.equal(saved.vectors.length, 2);
    assert.equal(saved.vectors.some((vector) => 'generated' in vector), false);
    assert.equal(a.getOwnVectors().length, 2);
});

test('detached vectors survive save and reload while hydrated vectors do not', () => {
    const { root, a, b } = setup();
    connectGeneratedNodes(a, b, 'road', 1);
    a.detach();
    const tiles = JSON.parse(JSON.stringify(root.getDetachedTiles()));
    const world = new World(
        { id: 1, name: 'test', size: 3, palette: 1, tiles },
        { id: 1, name: 'test', version: '1', tiles: [], vectors: [], markers: [] },
    );
    const loadedA = world.quadtree.findByKey(a.key);
    const loadedB = world.quadtree.findByKey(b.key);
    assert.ok(loadedA);
    assert.deepEqual(loadedA.getOwnVectors(), [{ type: 'road', value: 1, direction: { x: 0, y: 1 } }]);
    assert.equal(loadedB?.getOwnVectors().length ?? 0, 0);
});

test('locking a generated ancestor saves its terrain and vectors', () => {
    const { root, a, b } = setup();
    connectGeneratedNodes(a, b, 'road', 1);
    const child = a.getQuadrants(true)[0];
    child.setTileData({});
    child.detach();
    assert.equal(a.isLocked(), true);
    assert.equal(a.getOwnVectors().length, 1);
    const saved = root.getDetachedTiles().find((tile) => tile.nodeId === a.key.id);
    assert.ok(saved);
    assert.deepEqual(saved.vectors, [{ type: 'road', value: 1, direction: { x: 0, y: 1 } }]);
    assert.deepEqual(saved.terrain, [{ type: 'urban', value: 1 }]);
    const world = new World(
        { id: 1, name: 'test', size: 3, palette: 1, tiles: JSON.parse(JSON.stringify(root.getDetachedTiles())) },
        { id: 1, name: 'test', version: '1', tiles: [], vectors: [], markers: [] },
    );
    const loaded = world.quadtree.findByKey(a.key);
    assert.equal(loaded?.isLocked(), true);
    assert.deepEqual(loaded?.getOwnVectors(), saved.vectors);
});

test('generated connections may end at locked or detached tiles without modifying them', () => {
    const { a, b, c } = setup();
    b.getQuadrants(true)[0].detach();
    c.detach();
    const lockedBefore = b.getOwnVectors();
    const detachedBefore = c.getOwnVectors();
    assert.equal(connectGeneratedNodes(a, b, 'road', 1), 'connected');
    assert.equal(connectGeneratedNodes(a, c, 'road', 1), 'connected');
    assert.equal(b.getOwnVectors(), lockedBefore);
    assert.equal(c.getOwnVectors(), detachedBefore);
    assert.equal(a.getOwnVectors().length, 2);
    assert.equal(connectGeneratedNodes(b, c, 'road', 1), 'protected');
    const visible = new Map([[a.key.id, a], [b.key.id, b], [c.key.id, c]]);
    assert.equal(getCellEdges(a.depth, [a, b, c], visible).edges.length, 2);
});

test('missing editable terrain does not produce a partial connection', () => {
    const { a, b } = setup();
    b.setTileData(undefined);
    assert.equal(connectGeneratedNodes(a, b, 'road', 1), 'missing-tile');
    assert.equal(a.getOwnVectors().length, 0);
    assert.equal(b.hasTile(), false);
});

test('dehydration removes terrain and vectors together only on hydrated tiles', () => {
    const { a, b, c } = setup();
    connectGeneratedNodes(a, b, 'road', 1);
    connectGeneratedNodes(a, c, 'river', 1);
    b.detach();
    dehydrate(a);
    dehydrate(b);
    assert.equal(a.hasTile(), false);
    assert.deepEqual(a.getOwnVectors(), []);
    assert.equal(b.hasTile(), true);
    assert.equal(b.getOwnVectors().length, 1);
});

test('generated edges use normal placement and rendering at deeper depths', () => {
    const { a, b } = setup();
    connectGeneratedNodes(a, b, 'road', 1);
    assert.equal(getVectorCell(a.getOwnVectors()[0], a, a.depth), a);
    for (const node of a.getQuadrants(true)) {
        node.setTileData({});
    }
    hydrateVectorPaths([a], a.depth + 1);
    assert.equal(a.getOwnVectors()[0].placement?.length, 1);
    assert.ok(getVectorCell(a.getOwnVectors()[0], a, a.depth + 1));
    const children = a.getQuadrants();
    const visible = new Map(children.map((child) => [child.key.id, child]));
    assert.equal(getCellEdges(a.depth + 1, [a, ...children], visible).edges.length, 1);
});

test('detached edges use existing placement at deeper depths', () => {
    const { a, b } = setup();
    connectGeneratedNodes(a, b, 'road', 1);
    a.detach();
    for (const child of a.getQuadrants(true)) {
        child.setTileData({});
    }
    placeVectors(a);
    const vector = a.getOwnVectors()[0];
    assert.equal(vector.placement?.length, 1);
    assert.ok(getVectorCell(vector, a, a.depth + 1));
});

test('drawing an existing generated edge detaches both endpoints', () => {
    const { root, a, b } = setup();
    connectGeneratedNodes(a, b, 'road', 1);
    const changed: QuadNode[] = [];
    root.subscribe(QuadNode.EVENT_DATA_CHANGE, ({ target }) => changed.push(target));
    assert.equal(connectNodes(a, b, 'road', 1), true);
    assert.equal(connectNodes(a, b, 'road', 1), false);
    assert.equal(a.isDetached(), true);
    assert.equal(b.isDetached(), true);
    assert.equal(a.getOwnVectors().length, 1);
    assert.equal(b.getOwnVectors().length, 1);
    assert.ok(changed.includes(a));
    assert.ok(changed.includes(b));
    assert.equal(root.getDetachedTiles().filter((tile) => tile.vectors.length).length, 2);
});

test('generation preserves an existing creator edge on a detached endpoint', () => {
    const { a, b } = setup();
    b.setTileData({ vectors: [{ type: 'road', value: 0.3, direction: { x: 0, y: -1 } }] });
    b.detach();
    assert.equal(connectGeneratedNodes(a, b, 'road', 1), 'connected');
    assert.equal(b.getOwnVectors()[0].value, 0.3);
    assert.equal(a.isDetached(), false);
});

test('creator edges of one type retain multiple directions', () => {
    const { a, b, c } = setup();
    assert.equal(connectNodes(a, b, 'road', 1), true);
    assert.equal(connectNodes(a, c, 'road', 1), true);
    assert.deepEqual(a.getOwnVectors().map((vector) => vector.direction), [{ x: 0, y: 1 }, { x: 1, y: 0 }]);
});

test('connections reject nodes from different worlds and non-adjacent nodes', () => {
    const { a } = setup();
    const other = setup().b;
    assert.throws(() => connectGeneratedNodes(a, other, 'road', 1), /adjacent nodes in the same world/);
    assert.equal(connectNodes(a, other, 'road', 1), false);
    assert.throws(() => connectGeneratedNodes(a, a, 'road', 1), /adjacent nodes/);
});
