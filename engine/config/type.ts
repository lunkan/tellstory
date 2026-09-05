export type TileTag = string;
export type MarkerType = 'starting-location' | 'landmark';

export type TileMetaConfig = {
    color: string;
}

export type TileConfigData = {
    id: number;
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

export type VectorConfigData = {
    id: number;
    name: string;
    attentionValue: number;
    meta: TileMetaConfig;
}

export type MarkerConfigData = {
    id: number;
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
    vectors: VectorConfigData[];
    markers: MarkerConfigData[];
}