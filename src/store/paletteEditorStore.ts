import { create } from "zustand";
import { PaletteData } from "../../engine/types";
import { paletteRepository } from "../repositories/paletteRepository";
import { PaletteDataSummary } from "../../server/types";
import { deepMerge } from "../utils/deep-merge";
import { MarkerConfigData } from "../../engine/config/type";

interface EditorStore {
    loading: boolean;
    data: PaletteData | null;
    storedPalettes: PaletteDataSummary[];
    loadStoredPalettes: () => void;
    newPalette: (name: string) => Promise<number>;
    deletePaletteById: (id: number) => Promise<boolean>;
    loadPalette: (id: number) => void;
    save: () => Promise<boolean>;
    addMarkerData: (newMarkers: Partial<MarkerConfigData>[]) => number[];
    removeMarker: (id: number) => boolean;
    updateData: (updates: Partial<PaletteData>) => boolean;
    import: (data: PaletteData) => Promise<boolean>;
}

export const usePaletteEditorStore = create<EditorStore>((set, get) => ({
    loading: false,
    data: null,
    storedPalettes: [],
    loadStoredPalettes: async () => {
        const paletteList = await paletteRepository.loadAll();
        set(() => ({
            storedPalettes: paletteList,
        }));
    },
    newPalette: async (name: string) => {
        const id = await paletteRepository.create(name);
        await get().loadPalette(id);
        return id;
    },
    deletePaletteById: async (paletteId) => {
        console.log('deletePaletteById', paletteId);
        if (await paletteRepository.remove(paletteId)) {
            // Hmm what about if cutrrent is palette
            console.log('Update');
            get().loadStoredPalettes();
            return true;
        }

        return false;
    },
    loadPalette: async (paletteId) => {
        set({ loading: true });
        const data = await paletteRepository.load(paletteId);
        console.log('loadPalette', paletteId, data);
        set(() => ({
            data,
            loading: false,
        }));
    },
    save: async () => {
        const data = get().data;
        console.log('save', data);
        if (!data) {
            console.log('No palette data to save');
            return false;
        }

        console.log('save', data);

        await paletteRepository.save(data);
        return true;
    },
    addMarkerData: (newMarkers: Partial<MarkerConfigData>[]) => {
        const data = get().data;
        if (!data) {
            return [];
        }

        let idIncrementor = data.markers.reduce((acc, value) => Math.max(acc, value.id), 0);
        const markers = newMarkers.map((marker) => {
            return {
                category: 'landmark',
                ...marker,
                id: ++idIncrementor,
            }
        })

        const mutatedData = {
            ...data,
            markers: [
                ...markers,
                ...data.markers,
            ],
        } as any;

        set({
            data: mutatedData,
        });

        return markers.map((marker) => marker.id);
    },
    removeMarker: (id: number) => {
        const data = get().data;
        if (!data) {
            return false;
        }

        const mutatedData = {
            ...data,
            markers: data.markers.filter((marker) => marker.id !== id),
        } as any;

        set({
            data: mutatedData,
        });

        return true;
    },
    updateData: (updates: Partial<PaletteData>) => {
        const data = get().data;
        if (!data) {
            return false;
        }

        const mutadedPalette = deepMerge(data, updates, { mergeArraysById: true }) as PaletteData;
        set({
            data: mutadedPalette,
        });

        return true;
    },
    import: async (palettData: PaletteData) => {
        const data = get().data;
        if (!data) {
            return false; // No current palette
        }

        set({ loading: true });


        const mutadedPalette = {
            ...data,
            tiles: [
                ...data.tiles,
                ...palettData.tiles,
            ],
            vectors: [
                ...data.vectors,
                ...palettData.vectors,
            ],
            markers: [
                ...data.markers,
                ...palettData.markers,
            ],
        };

        set({
            data: mutadedPalette,
            loading: false,
        });

        return true;
    },
}));
