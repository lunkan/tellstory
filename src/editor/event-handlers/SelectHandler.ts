import { CanvasRenderer } from "../utils/CanvasRenderer";
import { CanvasEventHandler } from "./CanvasEventHandler";

export class SelectHandler extends CanvasEventHandler {
    private _screenStartX: number = -1;
    private _screenStartY: number = -1;

    constructor (renderer: CanvasRenderer, point: DOMPoint) {
        super(renderer);
        this._screenStartX = point.x;
        this._screenStartY = point.y;
        return;
    }

    public pointerMove(_point: DOMPoint): void { /* No action */ }

    public pointerUp(point: DOMPoint): void {
        if (Math.abs(this._screenStartX - point.x) > 5 && Math.abs(this._screenStartY - point.y) > 5) {
            return; // Not a click
        }

        const viewportPoint = super.toViewportPoint(point);
        this.renderer.setActiveTile(viewportPoint);
        this.finish();
    }
}