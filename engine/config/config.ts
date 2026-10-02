import { PaletteData } from '../types';
import { TileConfig, MarkerConfig } from './type';

type TileConfigFilter = {
    category: string;
};

type MarkerConfigFilter = {
    category?: string;
    tags?: string[];
    scale?: number; // Not existing
    attention?: {
        min?: number,
        max?: number,
    };
};

const tileMap: Map<string, TileConfig> = new Map();
const markerMap: Map<string, MarkerConfig> = new Map();
const markerTags: string[] = [];

let initilized: boolean = false;

function isInitilized(): boolean {
    return initilized;
}

function set(paletteData: PaletteData): void {
    // Reset on init
    tileMap.clear();
    markerMap.clear();
    markerTags.length = 0;
    initilized = false;

    paletteData.tiles.forEach((tileConfigData) => {
        const tileConfig = {
            ...tileConfigData,
            tags: tileConfigData.tags || [],
        };

        tileMap.set(tileConfig.name, tileConfig);
    });

    paletteData.markers.forEach((markerConfigData) => {
        const markerConfig = {
            ...markerConfigData,
            tags: markerConfigData.tags || [],
        };

        markerMap.set(markerConfig.name, markerConfig);
    });

    // Create markerTagSet
    const allMarkerTags = [...markerMap.values()].flatMap((markerConfig) => markerConfig.tags);
    const markerTagSet = new Set(allMarkerTags);
    markerTags.push(...[...markerTagSet]);

    initilized = true;
}

function getTile(name: string): TileConfig | undefined {
    return tileMap.get(name);
}

function getTilesByFilter(filter: TileConfigFilter): TileConfig[] {
    const tiles: TileConfig[] = [];
    for (const tileConfig of tileMap.values()) {
        if (tileConfig.category === filter.category) {
            tiles.push(tileConfig);
        }
    }

    return tiles;
}

function getMarkerTags(): string[] {
    return markerTags;
}

function getMarker(name: string): MarkerConfig | undefined {
    return markerMap.get(name);
}

function getMarkersByFilter(filter: MarkerConfigFilter): MarkerConfig[] {

    const tagFilter = filter.tags?.filter((name) => name === 'urban') as any;
    const markers: MarkerConfig[] = [];
    for (const markerConfig of markerMap.values()) {
        //const matchTags = filter.tags ? markerConfig.tags.some((tag) => filter.tags!.includes(tag)) : true;
        const matchTags = tagFilter ? markerConfig.tags.some((tag) => tag !== 'elevation' && tagFilter?.includes(tag)) : true;
        const matchCategory = filter.category ? markerConfig.category === filter.category : true;
        //const matchScale = filter.scale !== undefined ? markerConfig.scale === filter.scale : true;
        const matchScale = isMarkerMatchingScale(filter.scale, markerConfig);

        /*if (matchTags) {
            console.log('YEES2', matchScale, matchCategory);
        }*/

        //console.log('---', filter.tags, ' : ', markerConfig.tags, matchTags);
        //scale 0.

        // scale 0  - 78m     # Immediate surroundings (leaf)
        // scale 1  - 156m    # Nearby area
        // scale 2  - 313m    # Local area
        // scale 3  - 625m    # Neighborhood
        // scale 4  - 1.25km  # District
        // scale 5  - 2.5km   # Region
        // scale 6  - 5km
        // scale 7  - 10km    # Horizon (max zoom out)
        // ...
        // scale 12 - 320km   # root of a full depth world

        if (matchTags && matchCategory && matchScale) {
            markers.push(markerConfig);
        }
    }

    return markers;
}

function isMarkerMatchingScale(scale: number | undefined, marker: MarkerConfig): boolean {
    //console.log('M:', marker.name, ':', marker.attention?.min, marker.attention?.max, ' - ', scale, '***', (marker.attention?.min || 0) < (scale || 0), ' - ', (marker.attention?.max || 0) >= (scale || 0));

    if (scale === undefined || !marker.attention) return true;
    else if ((marker.attention.min || 0) < scale) return false;
    return (marker.attention?.max || 0) >= scale;
}

export const config = {
    isInitilized,
    set,
    getTile,
    getTilesByFilter,
    getMarker,
    getMarkersByFilter,
    getMarkerTags,
};