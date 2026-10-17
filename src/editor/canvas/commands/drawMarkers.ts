
import { QuadNode } from "../../../../engine/world/quad-node";

/*type DrawMarkersOptions = {
    ctx: CanvasRenderingContext2D;
    nodes: QuadNode[];
}*/

type DrawObjectOptions = {
    ctx: CanvasRenderingContext2D;
    nodes: QuadNode[]; //objects: TileMapObject[];
    scale: number;
}

export function drawMarkers(options: DrawObjectOptions) {
    const { ctx, nodes, scale } = options;

    nodes.forEach((node) => {
        const objects = node.getTile()?.markers;
        if (objects) {
            // Meters, like shape - markers without a position fall back to the node center
            const tileBounds = node.getTileBounds();
            const centerX = tileBounds.x + tileBounds.width / 2;
            const centerY = tileBounds.y + tileBounds.height / 2;

            objects.forEach((object) => {
                const x = (object.shape as any)?.x ?? centerX;
                const y = (object.shape as any)?.y ?? centerY;

                ctx.fillStyle = '#ff0000';
                ctx.beginPath();
                ctx.arc(x * scale, y * scale, 5 * scale, 0, Math.PI * 2);
                ctx.fill();
            });
        }
    });

}

/*export function drawMarkers(options: DrawMarkersOptions) {
    const { ctx, nodes } = options;

    nodes.forEach((node) => {
        //if (!node.getTile()?.isResolved) {
        _drawNodeMarkers(ctx, node);
        //}
    });

}

function _drawNodeMarkers(ctx: CanvasRenderingContext2D, node: QuadNode): void {
    const markers = node.getTile()?.markers || [];
    const bounds = node.bounds;
    const scale = ctx.getTransform().a;
    const tileSize = bounds.right - bounds.left;

    const distributionCellHeight = tileSize / markers.length;

    for (let i = 0; i < markers.length; i++) {
        const marker = markers[i];
        const y = i * distributionCellHeight + distributionCellHeight / 2 + bounds.y;
        const x = bounds.x + tileSize / 2;

        //const attentionDiameter = marker.attention ? Math.sqrt(marker.attention) + 1 : 1;
        const diameter = 5 / scale; // (5 * attentionDiameter) / scale; //baseDiameter; // * attentionDiameter;

        const textHeight = 12 / scale;

        const color = marker.type === 'player-start' ? '#ff0000' : '#000000'
        ctx.beginPath();
        ctx.arc(x, y, diameter, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        // Set font size and family
        ctx.font = `${textHeight}px Arial`;

        // Draw filled text at coordinates x=50, y=80
        ctx.fillText(marker.type, x + diameter + 8 / scale, y + textHeight / 4);
    }
}*/
