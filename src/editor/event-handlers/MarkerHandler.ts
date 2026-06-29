import { Tile } from "../../../engine/world/tile";
import { SelectedEntity } from "../../store/editorStore";
import { CanvasRenderer } from "../utils/CanvasRenderer";
import { CanvasEventHandler } from "./CanvasEventHandler";

var markerIncrementor: number = 0;

export class MarkerHandler extends CanvasEventHandler {
    constructor(entity: SelectedEntity, renderer: CanvasRenderer, point: DOMPoint, rightClick: boolean = false) {
        super(renderer);
        this.renderer.setActiveTile(null);

        const viewportPoint = super.toViewportPoint(point);
        const gridPoint = this.renderer.getGridPoint(viewportPoint);

        if (rightClick) {
            console.log('TODO: REmove on right click');
        }

        markerIncrementor++;
        //this.renderer.markers.push({
        this.renderer.world.markers.addMarker({
            point: gridPoint,
            type: entity.name,
            id: `marker@${markerIncrementor}`,
        });

        this.renderer.refresh();
    }

    public pointerMove(_point: DOMPoint): void { /* No action */ }

    public pointerUp(_point: DOMPoint): void {
        this.finish()
    }
}
