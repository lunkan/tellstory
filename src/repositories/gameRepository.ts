import { DIRECTION } from "../../shared/src/direction";

async function create(worldId: number): Promise<void> {
    console.log('handleStart');
    const res = await fetch("/game", {
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
    console.log('handleMove');
    const res = await fetch("/game/move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ direction }),
    });

    const data: any = await res.json();
    if (!res.ok) {
        throw new Error(data.error ?? 'New game Request failed');
    }
}

export const gameRepository = {
    create,
    move
};