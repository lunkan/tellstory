import { DIRECTION } from "../../shared/src/direction";

async function create(worldId: number): Promise<void> {
    console.log('handleStart');
    const res = await fetch("/api/game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ worldId }),
    });

    const data: any = await res.json();
    if (!res.ok) {
        throw new Error(data.error ?? 'New game Request failed');
    }
}

async function move(direction: DIRECTION): Promise<void> {
    console.log('handleMove', direction);
    const res = await fetch("/api/game/move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ direction }),
    });

    const data: any = await res.json();
    if (!res.ok) {
        throw new Error(data.error ?? 'New game Request failed');
    }
}

async function zoom(depth: number): Promise<void> {
    console.log('HandleZoom', depth);
    const res = await fetch("/api/game/zoom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ depth }),
    });

    const data: any = await res.json();
    if (!res.ok) {
        throw new Error(data.error ?? 'New game Request failed');
    }
}

export const gameRepository = {
    create,
    move,
    zoom,
};