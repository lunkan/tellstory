import { MarkerSetting, } from "../../../../engine/types";

type DrawMarkersOptions = {
    ctx: CanvasRenderingContext2D;
    markers: MarkerSetting[];
}

export function drawMarkers(options: DrawMarkersOptions) {
    const { ctx, markers } = options;

    const scale = ctx.getTransform().a;
    const diameter = 5 / scale;

    //console.log('drawMarkers', ctx.getTransform().a, ctx.getTransform().b, ctx.getTransform().c, ctx.getTransform().d);

    for (const marker of markers) {
        const color = marker.type === 'player-start' ? '#ff0000' : '#000000'
        ctx.beginPath();
        ctx.arc(marker.point.x, marker.point.y, diameter, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
    }
}