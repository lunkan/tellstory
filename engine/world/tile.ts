import { Metric, TerrainSetting, TileData, VectorSetting } from "../../storyteller/types";

export class Tile {
    public get terrain() {
        return this._terrain;
    }

    public get vectors() {
        return this._vectors;
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

    public setVector(vector: VectorSetting): void {
        const currentVector = this._vectors.find((v) => v.type === vector.type && v.direction.x === vector.direction.x && v.direction.y === vector.direction.y);
        if (currentVector) {
            currentVector.value = vector.value;
            return;
        }

        this._vectors.push(vector);
    }

    public getVectorsByType(type: string): VectorSetting[] {
        return this._vectors.filter((v) => v.type === type);
    }


    public hasTerrain(name: string): boolean {
        return this._terrain.some((terrain) => terrain.type === name);
    }

    public addTerrain(...option: TerrainSetting[]): void {
        this._terrain.push(...option);
    }

    public getTerrain(type: string): TerrainSetting | undefined {
        return this._terrain.find((terrain) => terrain.type === type);
    }

    public setTerrain(mutadedTerrain: TerrainSetting): void {
        if (this.hasTerrain(mutadedTerrain.type)) {
            this._terrain = this._terrain.map((terrain) => terrain.type === mutadedTerrain.type ? mutadedTerrain : terrain);
        } else {
            this._terrain.push(mutadedTerrain);
        }
    }

    public getTerrainMetrics(): Metric {
        const entries = this._terrain.map(({ type, value }) => [type, value]) || [];
        return Object.fromEntries(entries);
    }

    public toString(): string {
        return JSON.stringify({
            elevation: this.value,
            type: this.type,
            value: this.value,
        }, null, 4);
    }

    public getJSON(): TileData {
        return {
            elevation: this.elevation,
            type: this.type,
            value: this.value,
        };
    }
}