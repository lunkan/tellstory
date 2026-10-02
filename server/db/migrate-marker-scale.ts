import db from "./database.js";
import { QuadNodeKey } from "../../engine/world/quad-node-key.js";

// One-off data migration for the per-world size change.
// npx tsx server/db/migrate-marker-scale.ts
//
// 1. worlds.size was added with DEFAULT 0, which is not a loadable world.
//    Rows predating the column were authored at full depth, so backfill them.
// 2. Marker configs were tagged with a root-anchored `depth`. Physical scale is
//    now counted from the leaf, so `scale = MAX_DEPTH - depth`. Everything
//    authored so far assumed a full depth world, which makes this exact.
//
// Safe to re-run: markers already carrying `scale` are left alone.

const MAX_DEPTH = QuadNodeKey.MAX_DEPTH;

type PaletteRow = { id: number; data: string };

function backfillWorldSizes(): Promise<void> {
    return new Promise((resolve, reject) => {
        db.run(
            "UPDATE worlds SET size = ? WHERE size < 1 OR size > ?",
            [MAX_DEPTH, MAX_DEPTH],
            function (err) {
                if (err) {
                    reject(err);
                    return;
                }

                console.log(`worlds: set size = ${MAX_DEPTH} on ${this.changes} row(s)`);
                resolve();
            }
        );
    });
}

function migrateMarkerScales(): Promise<void> {
    return new Promise((resolve, reject) => {
        db.all("SELECT id, data FROM palettes", [], (err, rows: PaletteRow[]) => {
            if (err) {
                reject(err);
                return;
            }

            const pending = rows.map((row) => {
                const palette = JSON.parse(row.data);
                const markers = palette.markers || [];

                let converted = 0;
                for (const marker of markers) {
                    if (marker.scale !== undefined) {
                        continue; // Already migrated
                    }

                    marker.scale = MAX_DEPTH - (marker.depth ?? 0);
                    delete marker.depth;
                    converted++;
                }

                if (!converted) {
                    console.log(`palette ${row.id}: nothing to convert`);
                    return Promise.resolve();
                }

                return new Promise<void>((res, rej) => {
                    db.run(
                        "UPDATE palettes SET data = ? WHERE id = ?",
                        [JSON.stringify(palette), row.id],
                        (updateErr) => {
                            if (updateErr) {
                                rej(updateErr);
                                return;
                            }

                            console.log(`palette ${row.id}: converted ${converted} marker(s)`);
                            res();
                        }
                    );
                });
            });

            Promise.all(pending).then(() => resolve(), reject);
        });
    });
}

backfillWorldSizes()
    .then(migrateMarkerScales)
    .then(() => console.log("Migration complete"))
    .catch((err) => {
        console.error("Migration failed:", err.message);
        process.exitCode = 1;
    });
