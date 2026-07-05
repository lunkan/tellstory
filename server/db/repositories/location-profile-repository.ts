import db from "../database";

type ExplorerLocationProfile = {
    key: string;
    description: string;
};

function createLocationProfile(profile: ExplorerLocationProfile): Promise<number> {
    return new Promise((resolve, reject) => {
        db.run(
            //"INSERT INTO locationProfiles (key, description, reminiscence, summary) VALUES (?, ?, ?, ?)",
            "INSERT INTO locationProfiles (key, description) VALUES (?, ?)",
            [profile.key, profile.description], //profile.reminiscence, profile.summary],
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

function getLocationProfiles(): Promise<ExplorerLocationProfile[]> {
    return new Promise((resolve, reject) => {
        db.all(
            //"SELECT key, description, reminiscence, summary FROM locationProfiles",
            "SELECT key, description FROM locationProfiles",
            [],
            (err, rows: ExplorerLocationProfile[]) => {
                if (err) {
                    console.log('So much error', err);
                    reject(err);
                    return;
                }

                resolve(rows);
            }
        );
    });
}

function clearAll(): Promise<boolean> {
    return new Promise((resolve, reject) => {
        db.run("DELETE FROM locationProfiles;", (err) => {
            if (err) {
                reject(err);
            } else {
                console.log("All rows deleted.");
                resolve(true);
            }
        });
    });
}

export const locationProfileRepository = {
    createLocationProfile,
    getLocationProfiles,
    clearAll,
};
