/*
0: 320km    1
1: 160km    2
2: 80km     4
3: 40km     8
4: 20km     16
5: 10km     32 *
6: 5km      64
7: 2,5km    128
8: 1,25km   256
9: 625m    512
10: 312m    1024
11: 156m    2048
12: 78m     4096

2^12 = 4096x4096
*/

/*import { DrawCommand } from "./types";

export type GridPoint = {
    x: number;
    y: number;
}

export type GridRect = {
    x: number;
    y: number;
    width: number;
    height: number;
}

export type TileCoordinate = {
    x: number;
    y: number;
    z: number;
}

export type TileRect = {
    x: number;
    y: number;
    xSize: number;
    ySize: number;
}

type DrawConfig = {
    width: number;
    height: number;
    transform: DOMMatrix;
}

export class CanvasLayer {
    public readonly canvas: HTMLCanvasElement;

    private _ctx: CanvasRenderingContext2D;

    constructor() {
        this.canvas = document.createElement("canvas");
        const ctx = this.canvas.getContext('2d');
        if (!ctx) {
            throw Error('No CTX');
        }

        this._ctx = ctx;
    }

    public clear(): void {
        this._ctx?.setTransform(1, 0, 0, 1, 0, 0);
        this._ctx?.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    public draw(config: DrawConfig, commands: DrawCommand[]): void {
        this.canvas.width = config.width;
        this.canvas.height = config.height;
        this._ctx.setTransform(config.transform);

        for (const command of commands) {
            command.execute(this._ctx);
        }
    }
}*/
