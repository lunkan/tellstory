import assert from 'node:assert/strict';
import { test } from 'node:test';
import { config } from '../config/config';
import { Tile } from './tile';
import { QuadNode } from './quad-node';
import { hydrate } from './hydrator/hydrate';
import { oceanFromElevation } from './hydrator/hydrateTile';

const bounds = { x: 0, y: 0, width: 1, height: 1 };

test('resolves coverage on demand without changing configured or saved values', () => {
    const tile = new Tile(bounds, { terrain: [
        { type: 'ocean', value: 0.7 }, { type: 'forest', value: 1 },
        { type: 'urban', value: 1 }, { type: 'elevation', value: 0.4 },
    ] });
    const resolved = tile.getResolvedTerrain();
    assert.ok(Math.abs(resolved[1].value - 0.15) < 1e-12);
    assert.ok(Math.abs(resolved[2].value - 0.15) < 1e-12);
    assert.equal(resolved[0].value, 0.7);
    assert.equal(resolved[3].value, 0.4);
    assert.equal(tile.getTerrain('forest')?.value, 1);
    assert.equal(tile.getJSON().terrain[1].value, 1);
    const changed = tile.set({ terrain: [{ type: 'urban', value: 0 }] });
    assert.ok(Math.abs(changed.getResolvedTerrainByType('forest')!.value - 0.3) < 1e-12);
    assert.equal(tile.getResolvedTerrainByType('urban')!.value, resolved[2].value);
});

test('does not scale land below available coverage or independent typography values', () => {
    config.set({
        id: 1, name: 'test', version: '1', vectors: [], markers: [],
        tiles: [{ id: 1, name: 'climate', category: 'typography', tags: [], cluster: 0,
            attentionValue: 1, movementCost: 0, meta: { color: '#000' } }],
    });
    const tile = new Tile(bounds, { terrain: [
        { type: 'ocean', value: 0.7 }, { type: 'forest', value: 0.1 },
        { type: 'urban', value: 0.1 }, { type: 'climate', value: 1 },
    ] });
    assert.deepEqual(tile.getResolvedTerrain(), [...tile.terrain, { type: 'elevation', value: 0 }]);
    assert.equal(new Tile(bounds, { terrain: [{ type: 'ocean', value: 1 }, { type: 'urban', value: 1 }] })
        .getResolvedTerrainByType('urban')?.value, 0);
});

test('missing elevation and ocean resolve as sea without changing stored terrain', () => {
    const empty = new Tile(bounds);
    assert.deepEqual(empty.getResolvedTerrain(), [
        { type: 'elevation', value: 0 }, { type: 'ocean', value: 1 },
    ]);
    assert.deepEqual(empty.getJSON().terrain, []);
    assert.equal(empty.getTerrain('elevation'), undefined);
    assert.equal(empty.getTerrain('ocean'), undefined);

    const landWithoutElevation = new Tile(bounds, { terrain: [{ type: 'urban', value: 1 }] });
    assert.equal(landWithoutElevation.getResolvedTerrainByType('urban')?.value, 0);
    assert.equal(landWithoutElevation.getTerrain('urban')?.value, 1);
    assert.equal(landWithoutElevation.getResolvedTerrainByType('ocean')?.value, 1);

    const explicitOcean = new Tile(bounds, { terrain: [
        { type: 'ocean', value: 0 }, { type: 'urban', value: 1 },
    ] });
    assert.equal(explicitOcean.getResolvedTerrainByType('ocean')?.value, 0);
    assert.equal(explicitOcean.getResolvedTerrainByType('urban')?.value, 1);
    assert.equal(explicitOcean.getResolvedTerrainByType('elevation')?.value, 0);

    const explicitElevation = new Tile(bounds, { terrain: [
        { type: 'elevation', value: 0.5 }, { type: 'urban', value: 1 },
    ] });
    assert.equal(explicitElevation.getResolvedTerrainByType('urban')?.value, 1);
    assert.equal(explicitElevation.getResolvedTerrainByType('ocean'), undefined);
});

test('nodes resolve missing, present and locked tiles without creating or changing data', () => {
    const root = QuadNode.createRoot(1);
    const empty = root.getQuadrants(true)[0];
    const before = root.getDetachedTiles();
    const resolved = empty.getResolvedTerrain();
    assert.deepEqual(resolved, new Tile(bounds).getResolvedTerrain());
    resolved[0].value = 0.75;
    assert.deepEqual(empty.getResolvedTerrain(), new Tile(bounds).getResolvedTerrain());
    assert.equal(empty.getTile(), undefined);
    assert.deepEqual(root.getDetachedTiles(), before);

    root.setTileData({ terrain: [{ type: 'elevation', value: 0.5 }, { type: 'urban', value: 0.8 }] });
    root.detach();
    assert.deepEqual(root.getResolvedTerrain(), root.getTile()?.getResolvedTerrain());
    empty.setTileData({ terrain: [{ type: 'elevation', value: 0.8 }, { type: 'urban', value: 0.4 }] });
    empty.detach();
    assert.equal(root.isLocked(), true);
    const calculated = root.getTile();
    assert.ok(calculated);
    assert.deepEqual(root.getResolvedTerrain(), calculated.getResolvedTerrain());
    assert.notEqual(root.getResolvedTerrain().find((item) => item.type === 'urban')?.value, 0.8);
});

test('hydration derives ocean from generated elevation, keeping protected ocean unchanged', () => {
    config.set({
        id: 1, name: 'test', version: '1', vectors: [], markers: [],
        tiles: [{ id: 1, name: 'elevation', category: 'typography', tags: [], cluster: 0,
            attentionValue: 1, movementCost: 0, meta: { color: '#000' } }],
    });
    for (const [elevation, expected] of [[0, 1], [0.05, 1], [0.1, 0.5], [0.15, 0], [0.5, 0]] as const) {
        const root = QuadNode.createRoot(1);
        root.setTileData({ terrain: [{ type: 'elevation', value: elevation }, { type: 'urban', value: 1 }] });
        root.detach();
        const children = root.getQuadrants(true);
        hydrate(children[1]);
        children[0].setTileData({ terrain: [{ type: 'ocean', value: 0.3 }] });
        children[0].detach();
        hydrate(children[1]);
        assert.equal(children[0].getTile()?.getTerrain('ocean')?.value, 0.3);
        assert.ok(Math.abs(oceanFromElevation(elevation) - expected) < 1e-12);
        const generatedElevation = children[1].getTile()!.getTerrain('elevation')!.value;
        assert.equal(children[1].getTile()!.getTerrain('ocean')!.value, oceanFromElevation(generatedElevation));
    }
});

test('missing elevation produces ocean on generated children', () => {
    const root = QuadNode.createRoot(1);
    root.setTileData({ terrain: [{ type: 'urban', value: 1 }] });
    root.detach();
    const child = root.getQuadrants(true)[0];
    hydrate(child);
    assert.equal(child.getTile()?.getTerrain('ocean')?.value, 1);
    assert.equal(child.getTile()?.getResolvedTerrainByType('urban')?.value, 0);
});

test('fully ocean-covered generated tiles do not receive land markers', () => {
    config.set({
        id: 1, name: 'test', version: '1', vectors: [],
        tiles: [{ id: 1, name: 'urban', category: 'urban', tags: [], cluster: 0,
            attentionValue: 1, movementCost: 0, meta: { color: '#000' } }],
        markers: [{ id: 1, name: 'house', category: 'marker', tags: ['urban'], scale: 0 }],
    });
    const root = QuadNode.createRoot(1);
    root.setTileData({ terrain: [{ type: 'urban', value: 1 }] });
    root.detach();
    const child = root.getQuadrants(true)[0];
    hydrate(child);
    assert.equal(child.getTile()?.getTerrain('urban')?.value, 1);
    assert.equal(child.getTile()?.getResolvedTerrainByType('urban')?.value, 0);
    assert.deepEqual(child.getOwnMarkers(), []);
});
