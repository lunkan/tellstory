import { Metric, TerrainSetting, TileData } from "../../storyteller/types";

export class Tile {
    public get terrain() {
        return this._terrain;
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

    public addTerrain(...option: TerrainSetting[]): void {
        this._terrain.push(...option);
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