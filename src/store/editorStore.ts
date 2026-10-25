import { create } from "zustand";
//import { QuadNode } from "../../engine/world/quad-node";
//import { QuadNodeKey } from "../../engine/world/quad-node-key";
import { World } from "../../engine/world/world";
import { worldRepository } from "../repositories/worldRepository";
import { paletteRepository } from "../repositories/paletteRepository";
import { QuadNode } from "../../engine/world/quad-node";
import { TileData } from "../../engine/types";
import { TileMapObject } from "../../engine/schemas/tile-map-json-schema";
import { MarkerConfig, VectorConfig } from "../../engine/config/type";
import { MAX_ZOOM_OUT } from "../../engine/world/scale";
//import { Tile } from "../../engine/world/tile";
//import { Marker } from "../../engine/world/markers";

export interface SelectedEntity {
    name: string;
    category: string;
    meta: {
        color: string;
    }
}

export type EditState = 'draw' | 'erase' | 'transform' | 'select' | null;
export type MapMode = 'plain' | 'map';

interface EditorStore {
    worldId: number;
    loading: boolean;
    worldName: string | 'untitled';
    world: World | null;
    maxDepth: number | null;
    minDepth: number | null;
    mapScale: number | null;
    //quadtree: QuadNode | null;
    //markers: Marker[];
    //startingLocations: Marker[];
    selectedTerrain: SelectedEntity | VectorConfig | MarkerConfig | null;
    selectedNode: QuadNode | null;
    paintValue: number;
    editState: EditState;
    nodeDepth: number;
    mapMode: MapMode;
    newWorld: (name: string, size: number, palette: number) => Promise<boolean>;
    setWorldId: (worldId: number) => Promise<void>;
    save: () => Promise<void>;
    selectTerrain: (entity: SelectedEntity | VectorConfig | MarkerConfig) => void;
    selectNode: (node: QuadNode | null) => void;
    setPaintValue: (value: number) => void;
    setEditState: (state: EditState) => void;
    setNodeDepth: (depth: number) => void;
    setMapMode: (value: MapMode) => void;
    generateMap: (node: QuadNode) => void;
}

export const useEditorStore = create<EditorStore>((set, get) => ({
    worldId: NaN,
    loading: false,
    worldName: 'untitled',
    world: null,
    maxDepth: null,
    minDepth: null,
    mapScale: null,
    //quadtree: null,
    //markers: [],
    //startingLocations: [],
    selectedTerrain: null,
    selectedNode: null,
    paintValue: 0.5,
    editState: 'select',
    nodeDepth: 2,
    mapMode: 'map',
    newWorld: async (name: string, size: number, palette: number) => {
        const worldId = await worldRepository.create(name, size, palette);
        if (!worldId) {
            return false;
        }

        await get().setWorldId(worldId);
        return true;
    },
    setWorldId: async (worldId) => {
        set({ worldId, loading: true });

        const worldData = await worldRepository.load(worldId);
        const paletteData = await paletteRepository.load(worldData.palette);
        const world = new World(worldData, paletteData);

        const maxDepth = world?.quadtree.maxDepth ?? null;
        const minDepth = Math.max(0, maxDepth - MAX_ZOOM_OUT);



        /*const quadtree = new QuadNode();
 
        for (const tileEntry of worldData.tiles) {
            const tile = new Tile();
            tileEntry.terrain.forEach((terrainSetting) => tile.setTerrain(terrainSetting));
            tileEntry.vectors.forEach((vectorSetting) => tile.setVector(vectorSetting));
 
            const nodeKey = QuadNodeKey.fromId(tileEntry.nodeId);
            const node = quadtree.findByKey(nodeKey, true);
 
            if (node) {
                node.detach();
                node.tile = tile;
            }
        }*/

        set(() => ({
            world,
            maxDepth,
            minDepth,
            //quadtree: quadtree,
            //markers: worldData.markers,
            worldName: worldData.name,
            loading: false,
        }));
    },
    save: async () => {
        const world = get().world;
        if (!world) {
            console.log('No world to save');
            return;
        }

        console.log('save', world.getData());

        await worldRepository.save({
            ...world.getData(),
            id: get().worldId,
            name: get().worldName,
        });
    },
    selectTerrain: (selectedTerrain) => {
        set(() => ({
            selectedTerrain: selectedTerrain,
        }));
    },
    selectNode: (node) => {
        set(() => ({
            selectedNode: node,
        }));
    },
    setPaintValue: (value) => {
        set(() => ({
            paintValue: value,
        }));
    },
    setEditState: (state) => {
        set(() => ({
            editState: state,
        }));
    },
    setNodeDepth: (depth: number) => {
        const maxDepth = get().maxDepth;
        const minDepth = get().minDepth;
        if (maxDepth && minDepth) {
            const nodeDepth = Math.max(minDepth, Math.min(depth, maxDepth));

            set(() => ({
                nodeDepth,
                mapScale: maxDepth - nodeDepth,
            }));
        }
    },
    setMapMode: (value) => {
        set(() => ({
            mapMode: value,
        }));
    },
    generateMap: async (node) => {
        const world = get().world;
        if (!world) {
            return;
        }

        // Only Some of these
        const ancestorMarkers = node.getAncestors()
            .filter((node) => !!node.hasTile())
            .flatMap((node) => node.getTile()!.markers);

        const currentMarkers = node.getTile()?.markers || [];

        // Maybe not all at once - maybe street lamps etc can be generated on deeper depth
        const decendentMarkers = node.getAllQuadrants(true)
            .filter((node) => !!node.hasTile())
            .flatMap((node) => node.getTile()!.markers);

        const tileData: TileData = {
            bounds: node.getTileBounds(),
            vectors: [],
            terrain: node.getTile()?.terrain || [],
            markers: [...ancestorMarkers, ...currentMarkers, ...decendentMarkers],
        };

        const tileMap = await worldRepository.generateMapByNode(tileData);
        //node.tile?.setMap(tileMap);

        // find nodes by attention level - and apply to correct level

        const groupedObjects = tileMap.objects.reduce((groups, object) => {
            const nodeDepth = world.getDepthFromScale(object.attention);
            const group = groups.get(nodeDepth) || [];
            group.push(object);
            groups.set(nodeDepth, group);
            return groups;
        }, new Map<number, TileMapObject[]>());

        console.log('groupedObjects', groupedObjects);


        let currentNode: QuadNode | undefined = node;
        while (currentNode) {
            const objectsMatchingDepth = groupedObjects.get(currentNode.depth);
            const tile = currentNode.getTile();
            console.log('*', currentNode.depth, objectsMatchingDepth?.length, tile);
            if (objectsMatchingDepth && tile) {
                const mutatedMarkers = tile.markers.map((marker) => {
                    const matchingObjectIndex = objectsMatchingDepth.findIndex((object) => object.id === marker.id);
                    if (matchingObjectIndex !== -1) {
                        const matchingObject = objectsMatchingDepth.splice(matchingObjectIndex, 1)[0];
                        return {
                            ...marker,
                            ...matchingObject,
                        };
                    }

                    return marker;
                });

                // New objects = remaining objectsMatchingDepth
                console.log('markers', [...mutatedMarkers, ...objectsMatchingDepth]);
                currentNode.setTileData({
                    markers: [...mutatedMarkers, ...objectsMatchingDepth],
                });
            }

            currentNode = currentNode.parent;
        }


        /*node.setTileData({
            mapData: tileMap,
        });*/

        /*
        const world = get().world.updateNode(nodeId, {
            mapDate: tileMap,
        });
 
        set(() => ({
            world,
        }));*/

        console.log('STOR:generateMap', tileMap);
    }
}));
