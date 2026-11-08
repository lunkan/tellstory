import assert from 'node:assert/strict';
import { test } from 'node:test';
import { QuadNode } from '../../../../engine/world/quad-node';
import { drawElevation } from './drawElevation';

function context() {
    let paths = 0;
    const ctx: CanvasRenderingContext2D = Object.create(null);
    ctx.beginPath = () => {};
    ctx.moveTo = () => { paths++; };
    ctx.lineTo = () => {};
    ctx.closePath = () => {};
    ctx.fill = () => {};
    return { ctx, paths: () => paths };
}

test('sea mask follows ocean coverage rather than elevation', () => {
    const root = QuadNode.createRoot(1);
    const node = root.findByPoint({ x: 0, y: 0, z: 1 }, true)!;
    const render = (ocean: number, elevation: number): number => {
        node.setTileData({ terrain: [{ type: 'ocean', value: ocean }, { type: 'elevation', value: elevation }] });
        const terrain = context();
        const sea = context();
        drawElevation({
            ctx: terrain.ctx, seaCtx: sea.ctx, nodes: [node], tileSize: 1,
            gridBounds: { x: 0, y: 0, xSize: 1, ySize: 1 },
        });

        return sea.paths();
    };
    assert.equal(render(0, 0), 0);
    assert.ok(render(1, 0.9) > 0);
    assert.equal(render(0.5, 0.5), 0);
    assert.equal(render(0.549, 0.5), 0);
    assert.ok(render(0.55, 0.5) > 0);
});

test('ocean contour moves toward water between land and sea cells', () => {
    const root = QuadNode.createRoot(1);
    const land = root.findByPoint({ x: 0, y: 0, z: 1 }, true)!;
    const seaNode = root.findByPoint({ x: 1, y: 0, z: 1 }, true)!;
    land.setTileData({ terrain: [{ type: 'ocean', value: 0 }] });
    seaNode.setTileData({ terrain: [{ type: 'ocean', value: 1 }] });
    const sea = context();
    const points: [number, number][] = [];
    sea.ctx.moveTo = (x, y) => { points.push([x, y]); };
    sea.ctx.lineTo = (x, y) => { points.push([x, y]); };
    drawElevation({
        ctx: context().ctx, seaCtx: sea.ctx, nodes: [land, seaNode], tileSize: 1,
        gridBounds: { x: 0, y: 0, xSize: 2, ySize: 1 },
    });
    assert.ok(points.some(([x, y]) => Math.abs(x - 1.05) < 1e-12 && y === 0.5));
});

test('sea mask covers nodes with missing tiles or missing terrain', () => {
    const root = QuadNode.createRoot(1);
    const node = root.findByPoint({ x: 0, y: 0, z: 1 }, true)!;
    const render = (): number => {
        const terrain = context();
        const sea = context();
        drawElevation({
            ctx: terrain.ctx, seaCtx: sea.ctx, nodes: [node], tileSize: 1,
            gridBounds: { x: 0, y: 0, xSize: 1, ySize: 1 },
        });
        return sea.paths();
    };
    assert.equal(node.getTile(), undefined);
    assert.ok(render() > 0);
    assert.equal(node.getTile(), undefined);
    node.setTileData({});
    assert.ok(render() > 0);
    node.setTileData({ terrain: [{ type: 'elevation', value: 0.5 }] });
    assert.equal(render(), 0);
});
