import { dehydrate } from "../../../engine/world/hydrator/hydrate";
import { QuadNode } from "../../../engine/world/quad-node";
import { Tile } from "../../../engine/world/tile";
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

        this._setLineSegment(previousNode, node, vectorValue);
        this._setLineSegment(node, previousNode, vectorValue);

        this._updateParentLineSegment(previousNode, node, vectorValue);


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

        if (node.isLocked()) {
            return false;
        }

        return previousNode.isAdjacent(node);
    }

    private _setLineSegment(node: QuadNode, targetNode: QuadNode, value: number): boolean {
        const vector = node.getNormalizedRelativePosition(targetNode);
        if (!vector) {
            return false;
        }

        if (!node.tile) {
            node.tile = new Tile();
        }

        node.detach();
        node.getQuadrants().forEach((quadNode) => dehydrate(quadNode));

        node.tile.setVector({
            type: this._type,
            value: value,
            direction: vector,
        });

        return true;
    }

    private _updateParentLineSegment(node: QuadNode, targetNode: QuadNode, value: number): void {
        const nodeParent: QuadNode | undefined = node.parent;
        const targetNodeParent: QuadNode | undefined = targetNode.parent;
        if (!nodeParent || !targetNodeParent || nodeParent === targetNodeParent) {
            return;
        }

        const delta1 = nodeParent.getNormalizedRelativePosition(targetNodeParent);
        const delta2 = targetNodeParent.getNormalizedRelativePosition(nodeParent);

        if (!delta1 || !delta2) {
            return;
        }

        nodeParent.tile?.applyVector({
            type: this._type,
            value: value,
            direction: { x: delta1.x, y: delta1.y },
        });

        targetNodeParent.tile?.applyVector({
            type: this._type,
            value: value,
            direction: { x: delta2.x, y: delta2.y },
        });

        this._updateParentLineSegment(nodeParent, targetNodeParent, value);

        /*let parentNode = node.parent;
        while (parentNode && 5 <= parentNode.depth) {
            value = value * 0.25;
            parentNode.tile!.applyVector({
                type: this._type,
                value: value,
                direction: vector,
            });

            parentNode = parentNode.parent;
        }*/
    }
}
