import { TileCoordinate } from "../types";

type DrawSelectedTileOptions = {
    ctx: CanvasRenderingContext2D;
    selectedTile: TileCoordinate | null | undefined;
    tileSize: number;
}

export function drawSelectedTile(options: DrawSelectedTileOptions) {
    const { ctx, selectedTile, tileSize } = options;

    const scale = ctx.getTransform().a;

    console.log('drawSelectedTile', drawSelectedTile);
    if (!selectedTile) return;

    // 1. Set the border color
    ctx.strokeStyle = '#fff';

    // 2. Set the border thickness (optional)
    ctx.lineWidth = 4 / scale;

    // 3. Draw the line rectangle at x=50, y=50 with width=200, height=100
    ctx.strokeRect(selectedTile?.x * tileSize, selectedTile?.y * tileSize, tileSize, tileSize);
}