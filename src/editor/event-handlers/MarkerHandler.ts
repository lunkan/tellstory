import { Tile } from "../../../engine/world/tile";
import { CanvasRenderer } from "../utils/CanvasRenderer";
import { CanvasEventHandler } from "./CanvasEventHandler";

var markerIncrementor: number = 0; 

export class MarkerHandler extends CanvasEventHandler {
    constructor (type: string, renderer: CanvasRenderer, point: DOMPoint, rightClick: boolean = false) {
        super(renderer);
        this.renderer.setActiveTile(null);

        const viewportPoint = super.toViewportPoint(point);
        const gridPoint = this.renderer.getGridPoint(viewportPoint);

        if (rightClick) {
            console.log('TODO: REmove on right click');
        }

        markerIncrementor++;
        this.renderer.markers.push({
            point: gridPoint,
            type: type,
            id: `marker@${markerIncrementor}`,
        });

        this.renderer.refresh();
    }

    public pointerMove(_point: DOMPoint): void { /* No action */ }

    public pointerUp(_point: DOMPoint): void {
        this.finish()
     }
}
