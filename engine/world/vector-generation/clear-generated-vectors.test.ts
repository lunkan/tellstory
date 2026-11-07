import assert from 'node:assert/strict';
import { test } from 'node:test';
import { connectGeneratedNodes } from '../connect-nodes';
import { QuadNode } from '../quad-node';
import { clearGeneratedVectors } from './clear-generated-vectors';

function setup(): { root: QuadNode; left: QuadNode; right: QuadNode } {
    const root = QuadNode.createRoot(2);
    root.setTileData({ terrain: [{ type: 'urban', value: 1 }] });
    root.detach();
    const left = root.findByPoint({ x: 0, y: 0, z: 2 }, true);
    const right = root.findByPoint({ x: 1, y: 0, z: 2 }, true);
    assert.ok(left && right);
    left.setTileData({
        terrain: [{ type: 'urban', value: 0.5 }, { type: 'elevation', value: 0.2 }],
        markers: [{ type: 'house', id: 'm' }],
    });
    right.setTileData({ terrain: [{ type: 'urban', value: 1 }] });
    return { root, left, right };
}

test('clears only the requested generated vector type and emits one change per modified tile', () => {
    const { root, left, right } = setup();
    connectGeneratedNodes(left, right, 'road', 1);
    connectGeneratedNodes(left, right, 'river', 0.5);
    const terrain = structuredClone(left.getTile()!.terrain);
    const markers = structuredClone(left.getOwnMarkers());
    const river = structuredClone(left.getOwnVectors().filter((vector) => vector.type === 'river'));
    const changes: QuadNode[] = [];
    root.subscribe(QuadNode.EVENT_DATA_CHANGE, ({ target }) => changes.push(target));

    assert.equal(clearGeneratedVectors([left, right, left], 'road'), 2);
    assert.deepEqual(changes, [left, right]);
    assert.deepEqual(left.getTile()!.terrain, terrain);
    assert.deepEqual(left.getOwnMarkers(), markers);
    assert.deepEqual(left.getOwnVectors(), river);
    assert.equal(left.isDetached(), false);
    assert.equal(clearGeneratedVectors([left, right], 'road'), 0);
    assert.deepEqual(changes, [left, right]);
});

test('preserves detached and locked nodes while clearing editable neighbours', () => {
    const { root, left, right } = setup();
    connectGeneratedNodes(left, right, 'road', 1);
    right.detach();
    const locked = left.parent!;
    locked.setTileData({ vectors: [{ type: 'road', value: 1, direction: { x: 1, y: 0 } }] });
    assert.equal(locked.isLocked(), true);
    const saved = structuredClone(root.getDetachedTiles());

    assert.equal(clearGeneratedVectors([locked, left, right], 'road'), 1);
    assert.equal(left.hasTile(), true);
    assert.deepEqual(left.getOwnVectors(), []);
    assert.equal(right.getOwnVectors().length, 1);
    assert.equal(locked.getOwnVectors().length, 1);
    assert.deepEqual(root.getDetachedTiles(), saved);
});

test('clearing an editable tile below a locked parent preserves unrecoverable terrain', () => {
    const { root, left, right } = setup();
    connectGeneratedNodes(left, right, 'road', 1);
    right.detach();
    assert.equal(left.parent?.isLocked(), true);
    const before = structuredClone(left.getTile());
    clearGeneratedVectors([left], 'road');
    assert.equal(left.hasTile(), true);
    assert.deepEqual(left.getTile()?.terrain, before?.terrain);
    assert.deepEqual(left.getTile()?.markers, before?.markers);
    assert.equal(left.getOwnVectors().length, 0);
    assert.equal(root.getDetachedTiles().some((tile) => tile.nodeId === left.key.id), false);
});
