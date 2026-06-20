import { QuadNode } from "../../../engine/world/quad-node";
import { Tile } from "../../../engine/world/tile";
import { CanvasRenderer } from "../utils/CanvasRenderer";
import { CanvasEventHandler } from "./CanvasEventHandler";

export class DrawHandler extends CanvasEventHandler {
    private _type: string;
    private _value: number;
    private _currentNode: QuadNode | null = null;

    constructor (type: string, value: number, renderer: CanvasRenderer, point: DOMPoint) {
        super(renderer);
        this._type = type;
        this._value = value;

        this.renderer.setActiveTile(null);
        this.pointerMove(point);
        return;
    }

    public pointerMove(point: DOMPoint): void {
        const viewportPoint = super.toViewportPoint(point);
        const node = this.renderer.getNodeFromPoint(viewportPoint);
        if (!node || node === this._currentNode) {
            return;
        }

        this._currentNode = node;
        if (!node.tile) {
            node.tile = new Tile();
        }

        node.detach();
        node.tile.setTerrain({
            type: this._type,
            value: Math.max(0, Math.min(1, this._value)),
        });

        this.renderer.refresh();
    }

    public pointerUp(_point: DOMPoint): void {
        this.finish();
    }
}
