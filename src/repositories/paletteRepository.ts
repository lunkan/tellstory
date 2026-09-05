import { PaletteData } from "../../engine/types";
import { PaletteDataSummary } from "../../server/types";

async function loadAll(): Promise<PaletteDataSummary[]> {
    const response = await fetch(`/api/palette/`);
    const data = await response.json();
    if (!data.success) {
        throw new Error(data.error ?? 'loadAll Request failed');
    }

    return data.palettes;
}

async function create(name: string): Promise<number> {
    const res = await fetch("/api/palette", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
    });

    const data: any = await res.json();
    if (!res.ok) {
        throw new Error(data.error ?? 'New game Request failed');
    }

    return data.paletteId;
}

async function load(paletteId: number): Promise<PaletteData> {
    const response = await fetch(`/api/palette/${paletteId}`);
    const data = await response.json();
    return data.paletteData;
}

async function save(palette: PaletteData): Promise<boolean> {
    console.log('save palette', palette);
    const res = await fetch(`/api/palette/${palette.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(palette),
    });

    const data: any = await res.json();
    if (!res.ok) {
        throw new Error(data.error ?? 'New game Request failed');
    }

    return true;
}

async function remove(paletteId: number): Promise<boolean> {
    const res = await fetch(`/api/palette/${paletteId}`, {
        method: "DELETE",
    });

    return res.ok;
}

export const paletteRepository = {
    loadAll,
    create,
    load,
    save,
    remove,
};
