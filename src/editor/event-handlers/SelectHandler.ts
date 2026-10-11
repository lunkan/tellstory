
import { QuadNode } from "../../../engine/world/quad-node";
import { CanvasRenderer } from "../canvas/CanvasRenderer";
import { CanvasEventHandler } from "./CanvasEventHandler";

export class SelectHandler extends CanvasEventHandler {
    private _screenStartX: number = -1;
    private _screenStartY: number = -1;
    private _selectCallback: (node: QuadNode | null) => void;

    constructor(renderer: CanvasRenderer, point: DOMPoint, callback: (node: QuadNode | null) => void) {
        super(renderer);
        this._screenStartX = point.x;
        this._screenStartY = point.y;
        this._selectCallback = callback;
        return;
    }

    public pointerMove(_point: DOMPoint): void { /* No action */ }

    public pointerUp(point: DOMPoint): void {
        if (Math.abs(this._screenStartX - point.x) > 5 && Math.abs(this._screenStartY - point.y) > 5) {
            return; // Not a click
        }

        const viewportPoint = super.toViewportPoint(point);
        const selectedNode = this.renderer.getNodeFromPoint(viewportPoint);
        this._selectCallback(selectedNode);
        this.renderer.setActiveTile(viewportPoint);
        this.finish();
    }
}