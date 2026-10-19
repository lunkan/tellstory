import { isCircleShape, isLineShape, isRectangleShape, TileMapCircleShape, TileMapLineShape, TileMapObject, TileMapRectangleShape } from "../../../../engine/schemas/tile-map-json-schema";
import { QuadNode } from "../../../../engine/world/quad-node";


type DrawObjectOptions = {
    ctx: CanvasRenderingContext2D;
    nodes: QuadNode[]; //TileMapObject[];
    scale: number;
}

export function drawShapes(options: DrawObjectOptions): void {
    const { nodes } = options;

    nodes.forEach((node) => {
        const objects = node.getTile()?.markers;
        if (objects) {
            objects.forEach((object) => {
                if (!object.shape) {
                    return;
                }

                if (isRectangleShape(object.shape)) {
                    _drawRectangle(object.shape, options);
                    _drawLabel(object.shape.x, object.shape.y + object.shape.height + 10, object.type, options);
                } else if (isCircleShape(object.shape)) {
                    _drawCircle(object.shape, options);
                    _drawLabel(object.shape.x, object.shape.y + object.shape.radius + 10, object.type, options);
                } else if (isLineShape(object.shape)) {
                    _drawLine(object.shape, options);
                }
            });
        }
    });
}

function _drawRectangle(rect: TileMapRectangleShape, options: DrawObjectOptions): void {
    const { ctx, scale } = options

    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.rect(rect.x * scale, rect.y * scale, rect.width * scale, rect.height * scale);
    ctx.fill();
}


function _drawCircle(circle: TileMapCircleShape, options: DrawObjectOptions): void {
    const { ctx, scale } = options

    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.arc(circle.x * scale, circle.y * scale, circle.radius * scale, 0, Math.PI * 2);
    ctx.fill();
}

function _drawLine(line: TileMapLineShape, options: DrawObjectOptions): void {
    const { ctx, scale } = options

    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = line.width * scale;

    ctx.beginPath();
    ctx.moveTo(line.point1.x * scale, line.point1.y * scale);
    ctx.lineTo(line.point2.x * scale, line.point2.y * scale);
    ctx.stroke();
    ctx.fill();
}

function _drawLabel(x: number, y: number, text: string, options: DrawObjectOptions): void {
    const { ctx, scale } = options

    ctx.beginPath();

    // Set font size and family
    ctx.font = `${0.1}px Arial`;

    // Draw filled text at coordinates x=50, y=80
    ctx.fillText(text, x * scale, y * scale);
}

