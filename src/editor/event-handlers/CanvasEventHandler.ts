import { CanvasRenderer } from "../canvas/CanvasRenderer";

export abstract class CanvasEventHandler {
    protected renderer: CanvasRenderer;
    protected finish: () => void;

    protected get viewport(): HTMLCanvasElement {
        return this.renderer.canvas;
    }

    constructor(renderer: CanvasRenderer) {
        this.renderer = renderer;
        this.finish = this._registerListeners();
    }

    public abstract pointerMove(_point: DOMPoint): void;
    public abstract pointerUp(_point: DOMPoint): void;

    protected toViewportPoint(point: DOMPoint): DOMPoint {
        const viewportRect = this.viewport.getBoundingClientRect();
        const x = (point.x - viewportRect.left);
        const y = (point.y - viewportRect.top);
        return new DOMPoint(x, y);
    }

    protected toScreenPoint(point: DOMPoint): DOMPoint {
        const viewportRect = this.viewport.getBoundingClientRect();
        const x = (point.x + viewportRect.left);
        const y = (point.y + viewportRect.top);
        return new DOMPoint(x, y);
    }

    private _registerListeners(): () => void {
        const handlePointerMove = (e: PointerEvent) => {
            this.pointerMove(new DOMPoint(e.clientX, e.clientY));
        }

        const handlePointerUp = (e: PointerEvent) => {
            this.pointerUp(new DOMPoint(e.clientX, e.clientY));
        }

        document.addEventListener('pointermove', handlePointerMove);
        document.addEventListener('pointerup', handlePointerUp);

        return () => {
            document.removeEventListener('pointermove', handlePointerMove);
            document.removeEventListener('pointerup', handlePointerUp);
        }
    }
}