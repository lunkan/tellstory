import db from "../database";
import { SettingsConfig, SettingsData } from "../../../shared/src/types";

type SerializedSettingsData = {
    id: number;
    data: string;
}

const SETTINGS_ID = 1;
const DEFAULT_SETTINGS = {
    descriptionInstructionsOnly: false,
    descriptionPersonalized: true,
    descriptionNarrator: true,
};

async function updateSettings(settingsConfig: SettingsConfig): Promise<boolean> {
    const query = `
        INSERT INTO settings (id, data)
        VALUES (?, ?)
        ON CONFLICT(id) DO UPDATE SET
        data = excluded.data
    `;

    const currentSettings = await getSettings();
    const updatedSettings = {
        ...currentSettings,
        ...settingsConfig
    }

    const serializedSettingsData = JSON.stringify(updatedSettings);

    return new Promise((resolve, reject) => {
        db.run(
            query,
            [SETTINGS_ID, serializedSettingsData],
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

async function getSettings(): Promise<SettingsData> {
    const query = "SELECT id, data FROM settings WHERE id = ?";

    return new Promise((resolve, reject) => {
        db.get(
            query,
            [SETTINGS_ID],
            (err, row: SerializedSettingsData) => {
                if (err) {
                    reject(err);
                    return;
                }

                if (!row) {
                    console.log('Settings undefined - returning default');
                    resolve(DEFAULT_SETTINGS);
                    return;
                }

                const { data } = row;
                const deserializedSettingsData = JSON.parse(data);
                resolve(deserializedSettingsData);
            }
        );
    });
}

export const settingsRepository = {
    updateSettings,
    getSettings,
};
