export interface DrawCommand {
    execute: (ctx: CanvasRenderingContext2D) => void
}

export type GridBounds = {
    x: number;
    y: number;
    xSize: number;
    ySize: number;
}

export type GridRect = {
    x: number;
    y: number;
    width: number;
    height: number;
}

export type GridPoint = {
    x: number;
    y: number;
}

export type TileCoordinate = {
    x: number;
    y: number;
    z: number;
}
