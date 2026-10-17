import { MarkerConfig } from "../../../engine/config/type";
import { QuadNode } from "../../../engine/world/quad-node";
import { LEAF_SIZE_METER } from "../../../engine/world/scale";
import { CanvasRenderer } from "../canvas/CanvasRenderer";
import { CanvasEventHandler } from "./CanvasEventHandler";

var markerIncrementor: number = 0;

export class MarkerHandler extends CanvasEventHandler {
    constructor(depth: number, markerConfig: MarkerConfig, renderer: CanvasRenderer, point: DOMPoint, rightClick: boolean = false) {
        super(renderer);
        //this.renderer.setActiveTile(null);

        const viewportPoint = super.toViewportPoint(point);
        const gridPoint = this.renderer.getGridPoint(viewportPoint);

        if (rightClick) {
            console.log('TODO: REmove on right click');
        }

        markerIncrementor++;
        //this.renderer.markers.push({
        /*this.renderer.world.markers.addMarker({
            point: gridPoint,
            type: entity.name,
            id: `marker@${markerIncrementor}`,
        });*/

        // New!!!
        const node = this.renderer.getNodeFromPoint(viewportPoint);

        /*if (!node || node.depth < depth) {
            
        }*/

        let currentNode: QuadNode | null | undefined = node;
        while (currentNode && currentNode.depth > depth) {
            currentNode = currentNode.parent;
        }

        if (!currentNode) {
            return; // No one found. Should not add low level markers when zoomed out, or if none 
        }



        //</canvas>



        if (!currentNode.hasTile()) {
            //node.tile = new Tile();
            currentNode.setTileData({});
        }




        // 1) Find correct level by marker attention - check
        // 2) Check if map is generated (or maybe allways has point - yes! Generated markers are pointless)

        const tile = currentNode.getTile();

        //if (tile?.isResolved) {
        currentNode.setTileData({
            markers: [...tile!.markers, {
                type: markerConfig.name,
                id: `marker@${markerIncrementor}`,
                attention: markerConfig.attention?.min || 0,
                shape: {
                    type: 'circle',
                    // grid units are leaves, the shape is in meters from the map origin
                    x: gridPoint.x * LEAF_SIZE_METER,
                    y: gridPoint.y * LEAF_SIZE_METER,
                    radius: 5,
                },
            }],
        });

        return;
        //}

        // () =>
        // 3) Add like before

        // Conclusion - add point to markers not map.
        // Generate - objects - change 

        // ????
        /*currentNode.detach();
        currentNode.updateTileData({
            markers: [{
                point: gridPoint,
                type: markerConfig.name,
                id: `marker@${markerIncrementor}`,
            }],
        });*/




        /*node.tile?.addMarker({
            point: gridPoint,
            type: entity.name,
            id: `marker@${markerIncrementor}`,
        });*/

        //this.renderer.refresh();
    }

    public pointerMove(_point: DOMPoint): void { /* No action */ }

    public pointerUp(_point: DOMPoint): void {
        this.finish()
    }
}
