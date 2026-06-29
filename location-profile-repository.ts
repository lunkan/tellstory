import db from "./database";
import { ExplorerLocationProfile } from "./storyteller/types";

export function createLocationProfile(profile: ExplorerLocationProfile): Promise<number> {
    return new Promise((resolve, reject) => {
        db.run(
            "INSERT INTO locationProfiles (key, description, reminiscence, summary) VALUES (?, ?, ?, ?)",
            [profile.key, profile.description, profile.reminiscence, profile.summary],
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

export function getLocationProfiles(): Promise<ExplorerLocationProfile[]> {
    return new Promise((resolve, reject) => {
        db.all(
            "SELECT key, description, reminiscence, summary FROM locationProfiles",
            [],
            (err, rows: ExplorerLocationProfile[]) => {
                if (err) {
                    reject(err);
                    return;
                }

                resolve(rows);
            }
        );
    });
}