import { CanvasRenderer } from "../utils/CanvasRenderer";
import { CanvasEventHandler } from "./CanvasEventHandler";

export class MoveHandler extends CanvasEventHandler {
    private _screenStartX: number = -1;
    private _screenStartY: number = -1;

    constructor (renderer: CanvasRenderer, point: DOMPoint) {
        super(renderer);
        this._screenStartX = point.x;
        this._screenStartY = point.y;
    }

    public pointerMove(point: DOMPoint): void {
        const screenVector = this._getScreenVector(point);
        this.viewport.style.transform = `translate(${screenVector.x}px, ${screenVector.y}px)`;
    }

    public pointerUp(point: DOMPoint): void {
        if (point.x === this._screenStartX && point.y ===  this._screenStartY) {
            return;
        }

        this.viewport.style.transform = '';
        const screenVector = this._getScreenVector(point);
        this.renderer.move(screenVector.x, screenVector.y);
        this.finish();
    }

    private _getScreenVector(point: DOMPoint): DOMPoint {
        const screenDeltaX = point.x - this._screenStartX;
        const screenDeltaY = point.y - this._screenStartY;
        return new DOMPoint(screenDeltaX, screenDeltaY);
    }
}
