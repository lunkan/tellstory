import { create } from "zustand";
//import { QuadNode } from "../../engine/world/quad-node";
//import { QuadNodeKey } from "../../engine/world/quad-node-key";
import { World } from "../../engine/world/world";
import { worldRepository } from "../repositories/worldRepository";
import { paletteRepository } from "../repositories/paletteRepository";
import { QuadNode } from "../../engine/world/quad-node";
import { TileData, TileDataEntry } from "../../engine/types";
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

interface EditorStore {
    worldId: number;
    loading: boolean;
    worldName: string | 'untitled';
    world: World | null;
    //quadtree: QuadNode | null;
    //markers: Marker[];
    //startingLocations: Marker[];
    selectedTerrain: SelectedEntity | null;
    selectedNode: QuadNode | null;
    paintValue: number;
    editState: EditState;
    newWorld: (name: string, size: number, palette: number) => Promise<boolean>;
    setWorldId: (worldId: number) => Promise<void>;
    save: () => Promise<void>;
    selectTerrain: (entity: SelectedEntity) => void;
    selectNode: (node: QuadNode | null) => void;
    setPaintValue: (value: number) => void;
    setEditState: (state: EditState) => void;
    generateMap: (node: QuadNode) => void;
}

export const useEditorStore = create<EditorStore>((set, get) => ({
    worldId: NaN,
    loading: false,
    worldName: 'untitled',
    world: null,
    //quadtree: null,
    //markers: [],
    //startingLocations: [],
    selectedTerrain: null,
    selectedNode: null,
    paintValue: 0.5,
    editState: 'select',
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
    generateMap: async (node) => {

        // Only Some of these
        const ancestorMarkers = node.getAncestors()
            .filter((node) => !!node.tile)
            .flatMap((node) => node.tile!.markers);

        const currentMarkers = node.tile?.markers || [];

        // Maybe not all at once - maybe street lamps etc can be generated on deeper depth
        const decendentMarkers = node.getAllQuadrants(true)
            .filter((node) => !!node.tile)
            .flatMap((node) => node.tile!.markers);

        const tileData: TileData = {
            vectors: [],
            terrain: node.tile?.terrain || [],
            markers: [...ancestorMarkers, ...currentMarkers, ...decendentMarkers],
        };

        const response = await worldRepository.generateMapByNode(tileData);
        console.log('STOR:generateMap', response);
    }
}));
