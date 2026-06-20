import { CanvasRenderer } from "../utils/CanvasRenderer";

export class ZoomHandler {
    protected renderer: CanvasRenderer;

    protected get viewport(): HTMLCanvasElement {
        return this.renderer.canvas;
    }

    constructor(renderer: CanvasRenderer) {
        this.renderer = renderer;
    }

    public onWheel(wheelDelta: number, point: DOMPoint): void {
        const scaleMod = Math.max(1, this.renderer.scale);
        const zoomDelta = (wheelDelta * scaleMod) / 1000;

        var viewportRect = this.viewport.getBoundingClientRect();
        var x = (point.x - viewportRect.left) - viewportRect.width / 2; //x position within the element.
        var y = (point.y - viewportRect.top) - viewportRect.height / 2;  //y position within the element.
        this.renderer.zoom(zoomDelta, x, y);
    }
}
