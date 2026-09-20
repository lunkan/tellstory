import { WorldData } from "../../engine/types";

async function create(name: string, size: number, palette: number): Promise<number> {
    const res = await fetch("/api/world", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            name,
            size,
            palette,
            tiles: []
        }),
    });

    const data: any = await res.json();
    if (!res.ok) {
        throw new Error(data.error ?? 'New game Request failed');
    }

    return data.worldId;
}

async function load(worldId: number): Promise<WorldData> {
    const response = await fetch(`/api/world/${worldId}`);
    const data = await response.json();
    return data.worldData;
}

async function save(world: Pick<WorldData, 'id' | 'name' | 'tiles'>): Promise<boolean> {
    const res = await fetch(`/api/world/${world.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(world),
    });

    const data: any = await res.json();
    if (!res.ok) {
        throw new Error(data.error ?? 'New game Request failed');
    }

    return true;
}

export const worldRepository = {
    create,
    load,
    save,
};
