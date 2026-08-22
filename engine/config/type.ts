export type TileTag = string;
export type MarkerType = 'starting-location' | 'landmark';

export type TileMetaConfig = {
    color: string;
}

export type TileConfigData = {
    name: string;
    category: string;
    tags: TileTag[] | undefined,
    cluster: number;
    attentionValue: number;
    movementCost: number;
    meta: TileMetaConfig;
}

export type TileConfig = TileConfigData & {
    tags: TileTag[],
}

export type MarkerConfigData = {
    name: string;
    category: string;
    tags: string[] | undefined,
    depth: number;
}

export type MarkerConfig = MarkerConfigData & {
    tags: string[];
}

export type ConfigData = {
    name: string;
    version: string;
    tiles: TileConfigData[];
    markers: MarkerConfigData[];
}