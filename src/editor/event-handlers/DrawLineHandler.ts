import { connectNodes } from "../../../engine/world/connect-nodes";
import { QuadNode } from "../../../engine/world/quad-node";
import { SelectedEntity } from '../../store/editorStore';
import { CanvasRenderer } from "../canvas/CanvasRenderer";
import { CanvasEventHandler } from "./CanvasEventHandler";

var previousNode: QuadNode | undefined;

export class DrawLineHandler extends CanvasEventHandler {
    private _type: string;
    private _value: number;
    private _lineColor: string;

    constructor(entity: SelectedEntity, value: number, renderer: CanvasRenderer, point: DOMPoint, rightClick: boolean = false) {
        super(renderer);
        this._type = entity.name;
        this._value = value;
        this._lineColor = entity.meta.color;

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

        const vectorValue = Math.max(0, Math.min(1, this._value));
        connectNodes(previousNode, node, this._type, vectorValue); // Existing connections are ignored

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
        // A valid target snaps the end dot to its centre. Otherwise it follows the pointer and no line is drawn
        const p2 = hoveredNode && validTarget ? this.renderer.getViewPointFromNode(hoveredNode) : viewportPoint;
        this.renderer.setLine('vector', p1, p2, this._lineColor, [5, 10], validTarget, this.renderer.getViewSizeFromNode(previousNode) / 4);
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

        if (node.isLocked()) {
            return false;
        }

        return previousNode.isAdjacent(node);
    }
}
