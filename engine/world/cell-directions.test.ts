import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getCellDirections } from './cell-directions';
import { CellEdges, getCellEdges } from './cell-edges';
import { QuadNode } from './quad-node';

test('resolves ancestor edges and junction links without creating or changing nodes', () => {
    const root = QuadNode.createRoot(2);
    const host = root.findByPoint({ x: 0, y: 0, z: 1 }, true)!;
    host.setTileData({ vectors: [
        { type: 'road', value: 1, direction: { x: 1, y: 0 }, placement: [2] },
        { type: 'road', value: 1, direction: { x: 0, y: 1 }, placement: [1] },
        { type: 'river', value: 0.4, direction: { x: -1, y: 0 } },
    ] });
    const a = root.findByPoint({ x: 1, y: 0, z: 2 }, true)!;
    const b = root.findByPoint({ x: 0, y: 1, z: 2 }, true)!;
    const before = structuredClone(host.getOwnVectors());
    const hosts = root.findByRect({ x: 0, y: 0, width: 3, height: 3, z: 2 }, { selectAllDepth: true });
    const resolve = (cell: QuadNode) => getCellDirections(cell, getCellEdges(2, hosts, new Map([[cell.key.id, cell]])));
    assert.deepEqual(resolve(a).map(({ direction }) => direction), [{ x: 1, y: 0 }, { x: -1, y: 1 }]);
    assert.deepEqual(resolve(b).map(({ direction }) => direction), [{ x: 0, y: 1 }, { x: 1, y: -1 }]);
    assert.deepEqual(host.getOwnVectors(), before);
    assert.equal(root.findByPoint({ x: 3, y: 3, z: 2 }), undefined);
});

test('resolves only the selected cell along straight and diagonal links, preserving distinct styles', () => {
    const root = QuadNode.createRoot(3);
    const cell = root.findByPoint({ x: 3, y: 3, z: 3 }, true)!;
    const other = root.findByPoint({ x: 2, y: 3, z: 3 }, true)!;
    const style = { type: 'road', value: 1, scale: 2 };
    const drawn: CellEdges = {
        edges: [
            { cell, direction: { x: 1, y: 0 }, ...style },
            { cell, direction: { x: 1, y: 0 }, ...style },
            { cell: other, direction: { x: 0, y: 1 }, ...style },
            { cell, direction: { x: 1, y: 0 }, ...style, value: 0.5 },
        ],
        links: [
            { points: [{ x: 1.5, y: 3.5 }, { x: 5.5, y: 3.5 }], ...style },
            { points: [{ x: 3.5, y: 5.5 }, { x: 3.5, y: 1.5 }], ...style },
            { points: [{ x: 1.5, y: 1.5 }, { x: 5.5, y: 5.5 }], ...style, type: 'river' },
            { points: [{ x: 5.5, y: 3.5 }, { x: 1.5, y: 3.5 }], ...style, scale: 3 },
            { points: [{ x: 1.5, y: 2.5 }, { x: 5.5, y: 2.5 }], ...style },
        ],
    };
    assert.deepEqual(getCellDirections(cell, drawn).map(({ direction, type, value, scale }) => ({ direction, type, value, scale })), [
        { direction: { x: 1, y: 0 }, ...style },
        { direction: { x: 1, y: 0 }, ...style, value: 0.5 },
        { direction: { x: -1, y: 0 }, ...style },
        { direction: { x: 0, y: 1 }, ...style },
        { direction: { x: 0, y: -1 }, ...style },
        { direction: { x: -1, y: -1 }, ...style, type: 'river' },
        { direction: { x: 1, y: 1 }, ...style, type: 'river' },
        { direction: { x: 1, y: 0 }, ...style, scale: 3 },
        { direction: { x: -1, y: 0 }, ...style, scale: 3 },
    ]);
});

test('handles link endpoints, bends and degenerate segments', () => {
    const root = QuadNode.createRoot(3);
    const cell = root.findByPoint({ x: 3, y: 3, z: 3 }, true)!;
    const style = { type: 'road', value: 1, scale: 1 };
    const directions = getCellDirections(cell, { edges: [], links: [
        { ...style, points: [{ x: 1.5, y: 3.5 }, { x: 3.5, y: 3.5 }, { x: 3.5, y: 5.5 }] },
        { ...style, points: [{ x: 3.5, y: 3.5 }, { x: 3.5, y: 3.5 }] },
    ] });
    assert.deepEqual(directions.map(({ direction }) => direction), [{ x: -1, y: 0 }, { x: 0, y: 1 }]);
});

test('resolves links using the selected depth cell size', () => {
    const root = QuadNode.createRoot(3);
    const cell = root.findByPoint({ x: 2, y: 2, z: 2 }, true)!;
    const directions = getCellDirections(cell, { edges: [], links: [{
        type: 'road', value: 1, scale: 2,
        points: [{ x: 1, y: 3 }, { x: 7, y: 3 }],
    }] });
    assert.deepEqual(directions.map(({ direction }) => direction), [{ x: -1, y: 0 }, { x: 1, y: 0 }]);
});

test('quadtree change listeners can unsubscribe without affecting other listeners', () => {
    const root = QuadNode.createRoot(1);
    const child = root.findByPoint({ x: 0, y: 0, z: 1 }, true)!;
    let first = 0;
    let second = 0;
    const unsubscribe = root.subscribe(QuadNode.EVENT_DATA_CHANGE, () => first++);
    root.subscribe(QuadNode.EVENT_DATA_CHANGE, () => second++);
    child.setTileData({});
    unsubscribe();
    child.setTileData({});
    assert.equal(first, 1);
    assert.equal(second, 2);
});
