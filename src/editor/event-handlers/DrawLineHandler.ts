import tilesJSON from '../../../engine/config/tiles.json' with { type: 'json' };
import { QuadNode } from "../../../engine/world/quad-node";
import { Tile } from "../../../engine/world/tile";
import { CanvasRenderer } from "../utils/CanvasRenderer";
import { CanvasEventHandler } from "./CanvasEventHandler";

var previousNode: QuadNode | undefined;

export class DrawLineHandler extends CanvasEventHandler {
    private _type: string;
    private _value: number;
    private _lineColor: string;

    constructor (type: string, value: number, renderer: CanvasRenderer, point: DOMPoint, rightClick: boolean = false) {
        super(renderer);
        this._type = type;
        this._value = value;

        const tileConfig = tilesJSON.tiles.find((tileConfig) => tileConfig.name === this._type);
        this._lineColor = tileConfig?.meta?.color || '#000000';

        this.renderer.setActiveTile(null);

        if (rightClick) {
            previousNode = undefined;
            this.finish();
            return;
        }

        const viewportPoint = super.toViewportPoint(point);
        const node = this.renderer.getNodeFromPoint(viewportPoint);

        if (!node || node === previousNode) {
            this.finish();
            return;
        }

        if (!previousNode) {
            previousNode = node;
            return;
        }

        if (!this._isValidTarget(node)) {
            previousNode = undefined;
            this.finish();
            return;
        }

        this._setLineSegment(previousNode, node);
        this._setLineSegment(node, previousNode);
        this.renderer.refresh();
        previousNode = node;
        this.finish();
        return;
    }

    public pointerMove(point: DOMPoint): boolean {
        if (!previousNode) {
            return true;
        }

        const viewportPoint = super.toViewportPoint(point);
        const hoveredNode = this.renderer.getNodeFromPoint(viewportPoint);
        const validTarget = hoveredNode ? this._isValidTarget(hoveredNode) : false;

        const p1 = this.renderer.getViewPointFromNode(previousNode);
        const p2 = super.toViewportPoint(point);
        const dash = validTarget ? [] : [5, 15];
        this.renderer.setLine('vector', p1, p2, this._lineColor, dash);
        return true;
    }

    public pointerUp(_point: DOMPoint): boolean {
        this.renderer.clearLine('vector');
        return true;
    }

    private _isValidTarget(node: QuadNode): boolean {
        if (!previousNode || previousNode === node) {
            return false; // Same or undefined - ot allowed
        }

        return previousNode.isAdjacent(node);
    }

    private _setLineSegment(node: QuadNode, targetNode: QuadNode) : boolean {
        const vector = node.getNormalizedRelativePosition(targetNode);
        if (!vector) {
            return false;
        }

        if (!node.tile) {
            node.tile = new Tile();
        }

        node.tile.setVector({
            type: this._type,
            value: Math.max(0, Math.min(1, this._value)),
            direction: vector,
        });

        return true;
    }
}
