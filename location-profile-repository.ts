import db from "./database";
import { LocationProfile } from "./storyteller/types";

export function createLocationProfile(profile: LocationProfile): Promise<number> {
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

export function getLocationProfiles(): Promise<LocationProfile[]> {
  return new Promise((resolve, reject) => {
    db.all(
      "SELECT key, description, reminiscence, summary FROM locationProfiles",
      [],
      (err, rows: LocationProfile[]) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(rows);
      }
    );
  });
}