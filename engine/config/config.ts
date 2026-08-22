import { TileConfig, MarkerConfig, ConfigData } from './type';

type TileConfigFilter = {
    category: string;
};

type MarkerConfigFilter = {
    category: string;
    tags?: string[];
    depth?: number;
};

const tileMap: Map<string, TileConfig> = new Map();
const markerMap: Map<string, MarkerConfig> = new Map();

let initilized: boolean = false;

function isInitilized(): boolean {
    return initilized;
}

function init(configData: ConfigData): void {
    // Reset on init
    tileMap.clear();
    markerMap.clear();
    initilized = false;

    // Tiles
    configData.tiles.forEach((tileConfigData) => {
        const tileConfig = {
            ...tileConfigData,
            tags: tileConfigData.tags || [],
        };

        tileMap.set(tileConfig.name, tileConfig);
    });

    // Markers
    configData.markers.forEach((markerConfigData) => {
        const markerConfig = {
            ...markerConfigData,
            tags: markerConfigData.tags || [],
        };

        markerMap.set(markerConfig.name, markerConfig);
    });

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

function getMarker(name: string): MarkerConfig | undefined {
    return markerMap.get(name);
}

function getMarkersByFilter(filter: MarkerConfigFilter): MarkerConfig[] {
    const markers: MarkerConfig[] = [];
    for (const markerConfig of markerMap.values()) {
        const matchTags = filter.tags ? markerConfig.tags.some((tag) => filter.tags!.includes(tag)) : true;
        const matchCategory = filter.category ? markerConfig.category === filter.category : true;
        const matchDepth = filter.depth ? markerConfig.depth === filter.depth : true;

        if (matchTags && matchCategory && matchDepth) {
            markers.push(markerConfig);
        }
    }

    return markers;
}

export const config = {
    isInitilized,
    init,
    getTile,
    getTilesByFilter,
    getMarker,
    getMarkersByFilter,
};