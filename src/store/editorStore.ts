import { create } from "zustand";
//import { QuadNode } from "../../engine/world/quad-node";
//import { QuadNodeKey } from "../../engine/world/quad-node-key";
import { World } from "../../engine/world/world";
import { worldRepository } from "../repositories/worldRepository";
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
    paintValue: number;
    editState: EditState;
    setWorldId: (worldId: number) => void;
    save: () => Promise<void>;
    selectTerrain: (entity: SelectedEntity) => void;
    setPaintValue: (value: number) => void;
    setEditState: (state: EditState) => void;
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
    paintValue: 0.5,
    editState: 'select',
    setWorldId: async (worldId) => {
        set({ worldId, loading: true });

        const worldData = await worldRepository.load(worldId);
        const world = new World(worldData);


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
}));
