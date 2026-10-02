import { MarkerSetting, } from "../../../../engine/types";

type DrawMarkersOptions = {
    ctx: CanvasRenderingContext2D;
    markers: MarkerSetting[];
}

export function drawMarkers(options: DrawMarkersOptions) {
    const { ctx, markers } = options;

    const scale = ctx.getTransform().a;
    const baseDiameter = 5 / scale;

    const adjustedScale = ctx.getTransform().a;

    for (const marker of markers) {
        const attentionDiameter = marker.attention ? marker.attention + 1 : 1;
        const diameter = baseDiameter * attentionDiameter;

        const color = marker.type === 'player-start' ? '#ff0000' : '#000000'
        ctx.beginPath();
        ctx.arc(marker.point.x, marker.point.y, diameter, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        // Set font size and family
        ctx.font = `${12 / adjustedScale}px Arial`;

        // Set text color
        //ctx.fillStyle = "blue";

        // Draw filled text at coordinates x=50, y=80
        ctx.fillText(marker.type, marker.point.x + diameter + 8 / adjustedScale, marker.point.y);
    }
}