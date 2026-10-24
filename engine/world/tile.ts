//import tilesJSON from '../config/tiles.json' with { type: 'json' };
import { config } from '../config/config';
import { TileMap } from '../schemas/tile-map-json-schema';
import { MarkerSetting, TerrainSetting, TileBounds, TileData, VectorSetting } from '../types';
//import { Marker } from './markers';

export class Tile {
    public readonly bounds: TileBounds;
    //public readonly mapData: TileMap | undefined;
    public readonly terrain: TerrainSetting[];
    public readonly vectors: VectorSetting[];
    public readonly markers: MarkerSetting[];

    public readonly isResolved: boolean;

    constructor(bounds: TileBounds, data?: Partial<TileData>) {
        this.bounds = bounds;
        //this.mapData = data?.mapData;
        this.terrain = data?.terrain?.map((t) => Object.freeze(t)) ?? [];
        this.vectors = data?.vectors?.map((v) => Object.freeze(v)) ?? [];
        this.markers = data?.markers?.map((m) => Object.freeze(m)) ?? [];
        this.isResolved = this.markers.some((t) => t.shape);
    }

    /*public get mapData() {
        return this._mapData;
    }

    public get terrain() {
        return this._terrain;
    }

    public get vectors() {
        return this._vectors;
    }

    public get markers() {
        return this._markers;
    }

    public get elevation(): number {
        return this._terrain.find((terrain) => terrain.type === 'elevation')?.value || 0;
    }

    public get type(): string {
        return this._terrain.find((terrain) => terrain.type !== 'elevation')?.type || '-';
    }

    public get value(): number {
        return this._terrain.find((terrain) => terrain.type !== 'elevation')?.value || 0;
    }

    private _terrain: TerrainSetting[] = [];
    private _vectors: VectorSetting[] = [];
    private _markers: MarkerSetting[] = [];
    private _mapData: TileMap | undefined;*/

    public set(tileData: Partial<TileData>): Tile {
        const mutatedTerrain = [...this.terrain];
        tileData.terrain?.forEach((terrain) => {
            const index = mutatedTerrain.findIndex((t) => t.type === terrain.type);
            if (index !== -1) {
                mutatedTerrain[index] = terrain;
            } else {
                mutatedTerrain.push(terrain);
            }
        });

        const mutatedVectors = [...this.vectors];
        tileData.vectors?.forEach((vector) => {
            const index = mutatedVectors.findIndex((v) => v.type === vector.type && v.direction.x === vector.direction.x && v.direction.y === vector.direction.y);
            if (index) {
                mutatedVectors[index] = vector;
            } else {
                mutatedVectors.push(vector);
            }
        });

        return new Tile(this.bounds, {
            terrain: mutatedTerrain,
            vectors: mutatedVectors,
            markers: tileData.markers,
            //mapData: tileData.mapData
        });
    }

    public update(tileData: Partial<TileData>): Tile {
        const mutatedTerrain = [...this.terrain];
        tileData.terrain?.forEach((terrain) => {
            const index = mutatedTerrain.findIndex((t) => t.type === terrain.type);
            if (index !== -1) {
                mutatedTerrain[index] = {
                    ...mutatedTerrain[index],
                    ...terrain,
                    value: this._clampValue(mutatedTerrain[index].value + terrain.value),
                };
            } else {
                mutatedTerrain.push(terrain);
            }
        });

        const mutatedVectors = [...this.vectors];
        tileData.vectors?.forEach((vector) => {
            const index = mutatedVectors.findIndex((v) => v.type === vector.type && v.direction.x === vector.direction.x && v.direction.y === vector.direction.y);
            if (index) {
                mutatedVectors[index] = {
                    ...mutatedVectors[index],
                    ...vector
                }
            } else {
                mutatedVectors.push(vector);
            }
        });

        return new Tile(this.bounds, {
            terrain: mutatedTerrain,
            vectors: mutatedVectors,
            markers: tileData.markers ? this.markers.concat(tileData.markers) : this.markers,
            //mapData: this.mapData // Don't append map
        });
    }


    /** Same tile with only the given markers' `placement` changed. Keys are indexes into `markers`. */
    public withMarkerPlacements(placements: Map<number, string>): Tile {
        return new Tile(this.bounds, {
            terrain: this.terrain,
            vectors: this.vectors,
            markers: this.markers.map((marker, index) => {
                const placement = placements.get(index);
                return placement === undefined ? marker : { ...marker, placement };
            }),
        });
    }

    /*public setMap(tileMapData: TileMap): void {
        this._mapData = tileMapData;
    }

    public addMarker(marker: MarkerSetting): void {
        this._markers.push(marker);
    }

    public setVector(vector: VectorSetting): void {
        const currentVector = this._vectors.find((v) => v.type === vector.type && v.direction.x === vector.direction.x && v.direction.y === vector.direction.y);
        if (currentVector) {
            currentVector.value = vector.value;
            return;
        }

        this._vectors.push(vector);
    }*/

    /*private _applyVector(vector: VectorSetting): void {
        const currentVector = this._vectors.find((v) => v.type === vector.type && v.direction.x === vector.direction.x && v.direction.y === vector.direction.y);
        if (currentVector) {
            currentVector.value = vector.value + vector.value;
            return;
        }

        this._vectors.push(vector);
    }*/

    public hasTag(tag: string): boolean {
        return this.terrain.some((terrain) => {
            const tileConfig = config.getTile(terrain.type);
            if (tileConfig && Array.isArray(tileConfig.tags)) {
                return tileConfig.tags.includes(tag);
            }

            return false;
        });
    }

    public getVectorsByType(type: string): VectorSetting[] {
        return this.vectors.filter((v) => v.type === type);
    }

    public hasTerrain(name: string): boolean {
        return this.terrain.some((terrain) => terrain.type === name);
    }

    /*public addTerrain(...option: TerrainSetting[]): void {
        this._terrain.push(...option);
    }*/

    public getTerrain(type: string): TerrainSetting | undefined {
        return this.terrain.find((terrain) => terrain.type === type);
    }

    // Adds/reduce value on top of current
    /*private _applyTerrain(mutadedTerrain: TerrainSetting): void {
        if (this.hasTerrain(mutadedTerrain.type)) {
            this._terrain = this._terrain.map((terrain) => {
                if (terrain.type !== mutadedTerrain.type) {
                    return terrain;
                }

                return {
                    ...terrain,
                    value: this._clampValue(mutadedTerrain.value + terrain.value),
                };
            });
        } else {
            this._terrain.push(mutadedTerrain);
        }
    }*/

    // Overrides value
    /*public setTerrain(mutadedTerrain: TerrainSetting): void {
        if (this.hasTerrain(mutadedTerrain.type)) {
            this._terrain = this._terrain.map((terrain) => {
                if (terrain.type !== mutadedTerrain.type) {
                    return terrain;
                }

                return {
                    ...terrain,
                    value: this._clampValue(terrain.value),
                };
            });
        } else {
            this._terrain.push(mutadedTerrain);
        }
    }*/

    /*public getTerrainMetrics(): Metric {
        const entries = this._terrain.map(({ type, value }) => [type, value]) || [];
        return Object.fromEntries(entries);
    }*/

    /*public toString(): string {
        // What???
        return JSON.stringify({
            elevation: this.value,
            type: this.type,
            value: this.value,
        }, null, 4);
    }*/

    public getJSON(): TileData {
        return {
            bounds: this.bounds,
            vectors: this.vectors,
            terrain: this.terrain,
            markers: this.markers,
            //mapData: this.mapData
        };
    }

    private _clampValue(value: number): number {
        return Math.max(0, Math.min(1, value));
    }
}