import { PaletteData } from '../types';
import { TileConfig, MarkerConfig, VectorConfig } from './type';

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
const vectorMap: Map<string, VectorConfig> = new Map();
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

    paletteData.vectors.forEach((vectorConfigData) => {
        const vectorConfig = {
            ...vectorConfigData,
            tags: vectorConfigData.tags || [],
        };

        vectorMap.set(vectorConfig.name, vectorConfig);
    });

    paletteData.markers.forEach((markerConfigData) => {
        const tags = markerConfigData.tags || [];
        const color = tags.map((tag) => {
            const matchingTile = tileMap.get(tag);
            return matchingTile?.meta?.color;
        }).find((color) => !!color);

        // Set default colors by matching tile/ terrain
        const meta = markerConfigData.meta || {};
        meta.color = color || '#000'; //meta.color || color;
        const markerConfig = {
            ...markerConfigData,
            tags,
            meta,
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
        const matchTags = tagFilter ? markerConfig.tags.some((tag) => tagFilter?.includes(tag)) : true;
        const matchCategory = filter.category ? markerConfig.category === filter.category : true;
        //const matchScale = filter.scale !== undefined ? markerConfig.scale === filter.scale : true;

        const matchScale = filter.scale ? isMarkerMatchingScale(filter.scale, markerConfig) : true;



        //console.log('S', markerConfig.name, matchScale, filter.scale);

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

function isMarkerMatchingScale(scale: number = 0, marker: MarkerConfig): boolean {
    if (scale === undefined || !marker.attention) {
        return true;
    } else if ((marker.attention?.min || 0) > scale) {
        return false;
    }

    return (marker.attention?.max || 0) >= scale;
}

function getVectors(): VectorConfig[] {
    return [...vectorMap.values()];
}

function getVector(name: string): VectorConfig | undefined {
    return vectorMap.get(name);
}

export const config = {
    isInitilized,
    set,
    getTile,
    getTilesByFilter,
    getVectors,
    getVector,
    getMarker,
    getMarkersByFilter,
    getMarkerTags,
};