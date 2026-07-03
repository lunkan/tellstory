
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

export function getDepthName(depth: number): string {
    switch (depth) {
        case 5:
            return 'Horizon';
        case 6:
            return 'Region';
        case 7:
            return 'District';
        case 8:
            return 'Neighborhood';
        case 9:
            return 'Local area';
        case 10:
            return 'Nearby area';
        case 11:
            return 'Immediate surroundings';
        default:
            return `Depth out of bounds (${depth})`;
    }
}
