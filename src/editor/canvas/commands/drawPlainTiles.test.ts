import assert from 'node:assert/strict';
import { test } from 'node:test';
import { config } from '../../../../engine/config/config';
import { QuadNode } from '../../../../engine/world/quad-node';
import { drawPlainTiles } from './drawPlainTiles';

test('plain mode draws missing and fully ocean-covered tiles as ocean', () => {
    config.set({
        id: 1, name: 'test', version: '1', vectors: [], markers: [],
        tiles: [
            { id: 1, name: 'ocean', category: 'typography', tags: [], cluster: 0,
                attentionValue: 1, movementCost: 0, meta: { color: '#247ba0' } },
            { id: 2, name: 'elevation', category: 'typography', tags: [], cluster: 0,
                attentionValue: 1, movementCost: 0, meta: { color: '#00ff00' } },
        ],
    });
    const root = QuadNode.createRoot(1);
    const node = root.findByPoint({ x: 0, y: 0, z: 1 }, true)!;
    const ctx: CanvasRenderingContext2D = Object.create(null);
    const fills: string[] = [];
    ctx.beginPath = () => {};
    ctx.rect = () => {};
    ctx.fill = () => { fills.push(String(ctx.fillStyle)); };
    const render = () => drawPlainTiles({ ctx, nodes: [node], tileSize: 1 });
    render();
    assert.equal(fills.pop(), 'rgb(36, 123, 160)');
    assert.equal(node.getTile(), undefined);
    node.setTileData({});
    render();
    assert.equal(fills.pop(), 'rgb(36, 123, 160)');
    node.setTileData({ terrain: [{ type: 'elevation', value: 0.9 }, { type: 'ocean', value: 1 }] });
    render();
    assert.equal(fills.pop(), 'rgb(36, 123, 160)');
});
