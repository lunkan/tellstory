import { create } from "zustand";
import { QuadNode } from "../../engine/world/quad-node";
import { QuadNodeKey } from "../../engine/world/quad-node-key";
import { worldRepository } from "../editor/repositories/worldRepository";
import { Tile } from "../../engine/world/tile";
import { Marker } from "../../storyteller/types";

interface EditorStore {
  worldId: number;
  loading: boolean;
  worldName: string | 'untitled';
  quadtree: QuadNode | null;
  markers: Marker[];
  selectedTerrain: string;
  paintValue: number;
  editState: 'draw' | 'transform' | 'select' | null;
  setWorldId: (worldId: number) => void;
  save: () => Promise<void>;
  selectTerrain: (name: string) => void;
  setPaintValue: (value: number) => void;
  setEditState: (state: 'draw' | 'transform' | 'select' | null) => void;
}

export const useEditorStore = create<EditorStore>((set, get) => ({
  worldId: NaN,
  loading: false,
  worldName: 'untitled',
  quadtree: null,
  markers: [],
  selectedTerrain: '',
  paintValue: 0,
  editState: 'select',
  setWorldId: async (worldId) => {
    set({ worldId, loading: true });

    const worldData = await worldRepository.load(worldId);
    const quadtree = new QuadNode();

    for(const tileEntry of worldData.tiles) {
      const tile = new Tile();
      tileEntry.terrain.forEach((terrainSetting) => tile.setTerrain(terrainSetting));
      tileEntry.vectors.forEach((vectorSetting) => tile.setVector(vectorSetting));

      const nodeKey = QuadNodeKey.fromId(tileEntry.nodeId);
      const node = quadtree.findByKey(nodeKey, true);
  
      if (node) {
          node.detach();
          node.tile = tile;
      }
    }

    set(() => ({
      quadtree: quadtree,
      markers: worldData.markers,
      worldName: worldData.name,
      loading: false,
    }));
  },
  save: async () => {
    const quadtree = get().quadtree;
    const tiles = quadtree?.getDetachedTiles() || [];

    console.log('save: markers', get().markers);

    await worldRepository.save({
      id: get().worldId,
      name: get().worldName,
      markers: get().markers,
      tiles,
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
