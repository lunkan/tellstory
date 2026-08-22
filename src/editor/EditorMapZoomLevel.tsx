type EditorMapZoomLevelProps = {
    depth: number;
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

const WORLD_SIZE_METER: number = 320000;

export function EditorMapZoomLevel({ depth }: EditorMapZoomLevelProps) {
    return (
        <div className="editor-zoom-level">
            <div className="editor-zoom-level--depth">{depth}</div>
            <div className="editor-zoom-level--depth-label">Depth</div>
            <div className="editor-zoom-level--depth-square-size">{getSquareWidth(depth)}</div>
        </div>
    );
}

function getSquareWidth(depth: number): string {
    // Each depth level halves the width, which means dividing by 2^depth
    const squareSizeMeter = Math.round(WORLD_SIZE_METER / Math.pow(2, depth));
    if (squareSizeMeter < 1000) {
        return `${squareSizeMeter}m`;
    }

    const squareSizeKm = squareSizeMeter / 1000;
    const formattedSizeKm = Math.round(squareSizeKm * 100) / 100;
    return `${formattedSizeKm}km`;
}