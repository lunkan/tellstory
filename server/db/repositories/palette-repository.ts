import { PaletteData } from "../../../engine/types";
import { PaletteDataSummary } from "../../types";
import db from "../database";

type SerializedPaletteData = {
    id: number;
    name: string;
    data: string;
}

function createPalette(data: PaletteData): Promise<number> {
    const serializedData = JSON.stringify(data);

    return new Promise((resolve, reject) => {
        db.run(
            "INSERT INTO palettes (name, data) VALUES (?, ?)",
            [data.name, serializedData],
            function (err) {
                if (err) {
                    reject(err);
                    return;
                }

                console.log('DB:createPalette', this.lastID, data.name, serializedData);

                resolve(this.lastID);
            }
        );
    });
}

function updatePalette(id: number, paletteData: PaletteData): Promise<boolean> {
    const serializedData = JSON.stringify(paletteData);

    console.log('updatePalette', id, paletteData);

    return new Promise((resolve, reject) => {
        db.run(
            "UPDATE palettes SET data = ? WHERE id = ?",
            [serializedData, id],
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

function deletePalette(id: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
        db.run(
            "DELETE FROM palettes WHERE id = ?",
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

function getPalette(id: number): Promise<PaletteData> {
    console.log('GET:getPalette', id);
    return new Promise((resolve, reject) => {
        db.get(
            "SELECT data FROM palettes WHERE id = ?",
            [id],
            (err, row: SerializedPaletteData) => {
                if (err) {
                    reject(err);
                    return;
                }

                if (!row) {
                    reject(new Error(`No palette with id ${id}`));
                    return;
                }

                const { data } = row;
                const deserializedData = JSON.parse(data);
                deserializedData.id = id;
                console.log('db:get', deserializedData);
                resolve(deserializedData);
            }
        );
    });
}

function getPalettes(): Promise<PaletteDataSummary[]> {
    return new Promise((resolve, reject) => {
        db.all(
            "SELECT id, name FROM palettes",
            [],
            (err, rows: SerializedPaletteData[]) => {
                if (err) {
                    reject(err);
                    return;
                }

                const paletteSummaryData = rows.map((row) => ({ id: row.id, name: row.name }));
                resolve(paletteSummaryData);
            }
        );
    });
}

export const paletteRepository = {
    getPalette,
    getPalettes,
    createPalette,
    updatePalette,
    deletePalette,
};
