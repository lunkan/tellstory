import { QuadNode } from "../../../../engine/world/quad-node";
import { QuadNodeBounds } from "../../../../engine/world/quad-node-bounds";


type DrawObjectOptions = {
    ctx: CanvasRenderingContext2D;
    nodes: QuadNode[]; //TileMapObject[];
    scale: number;
}

export function drawObjects(options: DrawObjectOptions): void {
    const { ctx, nodes, scale } = options;

    nodes.forEach((node) => {
        const objects = node.getTile()?.markers;
        if (objects && objects.length) {
            console.log('*', objects?.length, node.bounds);

            const objectPoints = _getObjectPoints(node.bounds, objects.length);
            objects.forEach((object, i) => {
                const [x, y] = objectPoints[i];
                const radius = 5 * (object.attention ?? 1);

                ctx.fillStyle = '#000000';
                ctx.beginPath();
                ctx.arc(x, y, radius * scale, 0, Math.PI * 2);
                ctx.fill();

                _drawLabel(x, y, radius, object.type, options);

                /*if (isRectangleShape(object.shape)) {
                    _drawRectangle(object.shape, options);
                    _drawLabel(object.shape.x, object.shape.y + object.shape.height + 10, object.type, options);
                } else if (isCircleShape(object.shape)) {
                    _drawCircle(object.shape, options);
                    _drawLabel(object.shape.x, object.shape.y + object.shape.radius + 10, object.type, options);
                } else if (isLineShape(object.shape)) {
                    _drawLine(object.shape, options);
                }*/
            });
        }
    });
}

const SINGLE_RING_MAX = 6;
const SINGLE_RING_RADIUS = 0.25;  // fraction of bounds.size
const OUTER_RING_RADIUS = 0.35;
const INNER_RING_RADIUS = 0.17;

function _getObjectPoints(bounds: QuadNodeBounds, size: number): number[][] {
    const cx = bounds.x + bounds.size / 2;
    const cy = bounds.y + bounds.size / 2;

    if (size <= 0) {
        return [];
    }
    if (size === 1) {
        return [[cx, cy]];
    }
    if (size <= SINGLE_RING_MAX) {
        return _getRingPoints(cx, cy, SINGLE_RING_RADIUS * bounds.size, size, 0);
    }

    // Split points proportionally to ring circumference so spacing is roughly equal on both rings
    const outerRadius = OUTER_RING_RADIUS * bounds.size;
    const innerRadius = INNER_RING_RADIUS * bounds.size;
    const innerCount = Math.max(1, Math.round(size * innerRadius / (innerRadius + outerRadius)));
    const outerCount = size - innerCount;

    // Offset inner ring by half an outer step so inner points sit between outer points
    const innerOffset = Math.PI / outerCount;

    return [
        ..._getRingPoints(cx, cy, outerRadius, outerCount, 0),
        ..._getRingPoints(cx, cy, innerRadius, innerCount, innerOffset),
    ];
}

function _getRingPoints(cx: number, cy: number, radius: number, count: number, angleOffset: number): number[][] {
    const step = (Math.PI * 2) / count;
    const points: number[][] = [];

    // Start at the top (-PI/2) so layouts look upright
    for (let i = 0; i < count; i++) {
        const angle = -Math.PI / 2 + angleOffset + i * step;
        points.push([cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius]);
    }

    return points;
}

// Label sizes in screen pixels; constant regardless of zoom
const LABEL_FONT_SIZE = 12;
const LABEL_PADDING_X = 6;
const LABEL_PADDING_Y = 2;
const LABEL_GAP = 8;  // screen pixels between marker edge and top of label

function _drawLabel(x: number, y: number, radius: number, text: string, options: DrawObjectOptions): void {
    const { ctx, scale } = options;

    // Screen pixels -> world units at the current zoom
    const pixel = 1 / ctx.getTransform().a;

    const fontSize = LABEL_FONT_SIZE * pixel;
    const paddingX = LABEL_PADDING_X * pixel;
    const paddingY = LABEL_PADDING_Y * pixel;
    const top = y + radius * scale + LABEL_GAP * pixel;  // below the marker circle (radius * scale)
    const textOffsetY = (LABEL_PADDING_Y + 1) * pixel; // Push text slightly down to be better aligned

    ctx.font = `${fontSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    const width = ctx.measureText(text).width + paddingX * 2;
    const height = fontSize + paddingY * 2;

    ctx.fillStyle = '#000000';
    ctx.fillRect(x - width / 2, top, width, height);

    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, x, top + textOffsetY);
}

/*function _drawRectangle(rect: TileMapRectangleShape, options: DrawObjectOptions): void {
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
*/
