import assert from 'node:assert/strict';
import { test } from 'node:test';
import { dehydrate } from '../hydrator/hydrate';
import { QuadNode } from '../quad-node';
import { MAX_ROAD_CONNECTION_DISTANCE } from './road-plan';
import { invalidateNearbyVectors } from './invalidate-nearby-vectors';

const vector = { type: 'road', value: 1, direction: { x: 1 as const, y: 0 as const } };

test('vector-only dehydration clears existing descendants but preserves protected tiles and other data', () => {
    const root = QuadNode.createRoot(3);
    root.setTileData({});
    root.detach();
    const parent = root.getQuadrants(true)[0];
    parent.setTileData({ terrain: [{ type: 'urban', value: 1 }], vectors: [vector], markers: [{ type: 'house', id: 'm' }] });
    const child = parent.getQuadrants(true)[0];
    child.setTileData({ terrain: [{ type: 'urban', value: 0.4 }], vectors: [vector] });
    const grandchild = child.getQuadrants(true)[0];
    grandchild.setTileData({ terrain: [{ type: 'urban', value: 0.8 }], vectors: [vector] });
    child.detach();
    const saved = structuredClone(root.getDetachedTiles());
    dehydrate(parent, { vectors: true });
    assert.deepEqual(root.getDetachedTiles(), saved);
    assert.equal(parent.isLocked(), true);
    assert.equal(parent.getOwnVectors().length, 1);
    assert.equal(child.getOwnVectors().length, 1);
    assert.equal(grandchild.getOwnVectors().length, 0);
    assert.equal(grandchild.hasTile(), true);
    assert.equal(grandchild.getTile()?.terrain[0].value, 0.8);
});

test('terrain edit invalidation uses configured margin, diagonals and existing descendants only', () => {
    const root = QuadNode.createRoot(5);
    root.setTileData({});
    root.detach();
    const nodeAt = (x: number, y: number) => {
        const node = root.findByPoint({ x: x * 2, y: y * 2, z: 4 }, true);
        assert.ok(node);
        node.setTileData({ terrain: [{ type: 'urban', value: 1 }], vectors: [vector] });
        return node;
    };
    const edited = nodeAt(5, 5);
    const diagonal = nodeAt(5 + MAX_ROAD_CONNECTION_DISTANCE, 5 + MAX_ROAD_CONNECTION_DISTANCE);
    const outside = nodeAt(5 + MAX_ROAD_CONNECTION_DISTANCE + 1, 5);
    const descendant = diagonal.getQuadrants(true)[0];
    descendant.setTileData({ vectors: [vector] });
    const beforeCount = root.getAllQuadrants().length;
    invalidateNearbyVectors(edited);
    assert.equal(root.getAllQuadrants().length, beforeCount);
    assert.equal(edited.getOwnVectors().length, 0);
    assert.equal(diagonal.getOwnVectors().length, 0);
    assert.equal(descendant.getOwnVectors().length, 0);
    assert.equal(outside.getOwnVectors().length, 1);
    assert.equal(diagonal.getTile()?.terrain[0].value, 1);
});
