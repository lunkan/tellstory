import { getTileSizeMeter } from "../../../../engine/world/scale";
import styles from "./EditorMapZoomLevel.module.css";

type EditorMapZoomLevelProps = {
    depth: number;
    /** Levels above the leaf. Decides the physical size, which depth alone can't. */
    scale: number;
};

// 0 -  320km   -
// 1 -  160km   -
// 2 -  80km    -
// 3 -  40km    -
// 4 -  20km    -
// 5* - 10km    # Horizon
// 6 -  5km     # Region
// 7 -  2.5km   # District
// 8 -  1.25km  # Neighborhood
// 9 -  675m    # Local area
// 10 - 336m    # Nearby area
// 11 - 177m    # Immediate surroundings
// 12 - 89m     -

export function EditorMapZoomLevel({ depth, scale }: EditorMapZoomLevelProps) {
    return (
        <div className={styles.zoomLevel}>
            <div className={styles.depth}>{depth}</div>
            <div className={styles.depthLabel}>Depth</div>
            <div className={styles.depthSquareSize}>{getSquareWidth(scale)}</div>
        </div>
    );
}

function getSquareWidth(scale: number): string {
    // Each level above the leaf doubles the width
    const squareSizeMeter = Math.round(getTileSizeMeter(scale));
    if (squareSizeMeter < 1000) {
        return `${squareSizeMeter}m`;
    }

    const squareSizeKm = squareSizeMeter / 1000;
    const formattedSizeKm = Math.round(squareSizeKm * 100) / 100;
    return `${formattedSizeKm}km`;
}