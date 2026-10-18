import { QuadNodeBounds } from "../../../engine/world/quad-node-bounds";
import { GridPoint } from "./types";

/**
 * Convert node bounds (world units) to a tile index in the grid at the current level,
 * i.e. the same space as GridBounds. tileSize is world units per tile (CanvasMatrix.getTileSize()).
 */
export function boundsToGridPoint(bounds: QuadNodeBounds, tileSize: number): GridPoint {
    return {
        x: Math.round(bounds.x / tileSize),
        y: Math.round(bounds.y / tileSize),
    };
}
