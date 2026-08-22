import { CanvasRenderer } from "../canvas/CanvasRenderer";


export class ZoomHandler {
    protected renderer: CanvasRenderer;

    protected get viewport(): HTMLCanvasElement {
        return this.renderer.canvas;
    }

    constructor(renderer: CanvasRenderer) {
        this.renderer = renderer;
    }

    // Larger => faster zoom per wheel notch. Applied exponentially so every
    // zoom level gets the same perceptual step.
    protected static readonly ZOOM_SENSITIVITY = 0.001;

    public onWheel(wheelDelta: number, point: DOMPoint): void {
        // Multiply scale by a constant factor per notch instead of adding a
        // clamped step, so the relative change is identical at every level.
        const factor = Math.exp(wheelDelta * ZoomHandler.ZOOM_SENSITIVITY);
        const zoomDelta = this.renderer.scale * (factor - 1);

        var viewportRect = this.viewport.getBoundingClientRect();
        var x = (point.x - viewportRect.left) - viewportRect.width / 2; //x position within the element.
        var y = (point.y - viewportRect.top) - viewportRect.height / 2;  //y position within the element.
        this.renderer.zoom(zoomDelta, x, y);
    }
}
