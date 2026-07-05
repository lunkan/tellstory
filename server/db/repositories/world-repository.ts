import db from "../database";
import { WorldData } from "../../../engine/types";
import { WorldDataSummary } from "../../types";

type SerializedWorldData = {
    id: number;
    name: string;
    tiles: string;
    markers: string;
}

function createWorld(name: string): Promise<number> {
    const serializedTilesData = JSON.stringify([]);
    const serializedMarkersData = JSON.stringify([]);

    return new Promise((resolve, reject) => {
        db.run(
            "INSERT INTO worlds (name, tiles, markers) VALUES (?, ?, ?)",
            [name, serializedTilesData, serializedMarkersData],
            function (err) {
                if (err) {
                    reject(err);
                    return;
                }

                resolve(this.lastID);
            }
        );
    });
}

function updateWorld(id: number, worldData: WorldData): Promise<boolean> {
    const serializedTilesData = JSON.stringify(worldData.tiles);
    const serializedMarkersData = JSON.stringify(worldData.markers);

    return new Promise((resolve, reject) => {
        db.run(
            "UPDATE worlds SET tiles = ?, markers = ? WHERE id = ?",
            [serializedTilesData, serializedMarkersData, id],
            function (err) {
                if (err) {
                    reject(err);
                    return;
                }

                resolve(true);
            }
        );
    });
}

function deleteWorld(id: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
        db.run(
            "DELETE FROM worlds WHERE id = ?",
            [id],
            function (err) {
                if (err) {
                    reject(err);
                    return;
                }

                resolve(true);
            }
        );
    });
}

function getWorld(id: number): Promise<WorldData> {
    return new Promise((resolve, reject) => {
        db.get(
            "SELECT id, name, tiles, markers FROM worlds WHERE id = ?",
            [id],
            (err, row: SerializedWorldData) => {
                if (err) {
                    reject(err);
                    return;
                }

                const { id, name, tiles, markers } = row;
                const deserializedTilesData = JSON.parse(tiles);
                const deserializedMarkersData = JSON.parse(markers);
                console.log('db:get', deserializedTilesData.length, deserializedMarkersData.length);
                resolve({ id, name, tiles: deserializedTilesData, markers: deserializedMarkersData });
            }
        );
    });
}

function getWorlds(): Promise<WorldDataSummary[]> {
    return new Promise((resolve, reject) => {
        db.all(
            "SELECT id, name FROM worlds",
            [],
            (err, rows: SerializedWorldData[]) => {
                if (err) {
                    reject(err);
                    return;
                }

                const worldSummaryData = rows.map((row) => ({ id: row.id, name: row.name }));
                resolve(worldSummaryData);
            }
        );
    });
}

export const worldRepository = {
    getWorld,
    getWorlds,
    createWorld,
    updateWorld,
    deleteWorld,
};
