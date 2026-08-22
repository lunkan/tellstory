import { MarkerSetting, } from "../../../engine/types";
import { DrawCommand } from "./types";

export class DrawMarkersCommand implements DrawCommand {
    private _markers: MarkerSetting[];

    constructor(markers: MarkerSetting[]) {
        this._markers = markers;
    }

    public execute(ctx: CanvasRenderingContext2D): void {
        for (const marker of this._markers) {
            this._drawMarker(marker, ctx);
        }
    }

    private _drawMarker(marker: MarkerSetting, ctx: CanvasRenderingContext2D): void {
        const color = marker.type === 'player-start' ? '#ff0000' : '#000000'
        ctx.beginPath();
        ctx.arc(marker.point.x, marker.point.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
    }
}