import { dehydrate } from "../../../engine/world/hydrator/hydrate";
import { QuadNode } from "../../../engine/world/quad-node";
import { Tile } from "../../../engine/world/tile";
import { SelectedEntity } from "../../store/editorStore";
import { CanvasRenderer } from "../canvas/CanvasRenderer";
import { CanvasEventHandler } from "./CanvasEventHandler";

export class DrawHandler extends CanvasEventHandler {
    private _type: string;
    private _value: number;
    private _currentNode: QuadNode | null = null;

    constructor(entity: SelectedEntity, value: number, renderer: CanvasRenderer, point: DOMPoint) {
        super(renderer);
        this._type = entity.name;
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

        console.log('pointerMove', node.isLocked());
        if (node.isLocked()) {
            return;
        }

        this._currentNode = node;

        if (!node.tile) {
            node.tile = new Tile();
        }

        node.detach();
        node.getQuadrants().forEach((quadNode) => dehydrate(quadNode));

        let value = this._value;
        node.tile.setTerrain({
            type: this._type,
            value,
        });

        let parentNode = node.parent;
        while (parentNode && 5 <= parentNode.depth) {
            value = value * 0.25;
            parentNode.tile!.applyTerrain({
                type: this._type,
                value,
            });

            parentNode = parentNode.parent;
        }

        this.renderer.refresh();
    }

    public pointerUp(_point: DOMPoint): void {
        this.finish();
    }
}
