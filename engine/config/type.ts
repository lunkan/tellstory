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

export type VectorMetaConfig = TileMetaConfig & {
    /** Scales the drawn width of the vector. Defaults to 1. */
    widthMultiplier?: number;
}

export type VectorConfigData = {
    id: number;
    name: string;
    attentionValue: number;
    meta: VectorMetaConfig;
    tags: string[] | undefined,
}

export type VectorConfig = VectorConfigData & {
    tags: TileTag[],
}

export type MarkerMetaConfig = {
    color?: string,
}

export type MarkerAttentionConfig = {
    min: number;
    max: number;
}

export type MarkerConfigData = {
    id: number;
    name: string;
    category: string;
    attention?: MarkerAttentionConfig;
    tags: string[] | undefined,
    meta?: MarkerMetaConfig,
    /** Levels above the leaf this marker belongs at. See engine/world/scale.ts. */
    scale: number; // Is this really used?
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