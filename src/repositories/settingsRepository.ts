import { SettingsData } from "../../shared/src/types";

async function getSettings(): Promise<SettingsData> {
    const response = await fetch(`/api/settings`);
    const data = await response.json();
    return data.settings;
}

async function configSettings(configSettings: { [key: string]: unknown }): Promise<SettingsData> {
    const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(configSettings),
    });

    const data: any = await res.json();
    if (!res.ok) {
        throw new Error(data.error ?? 'New game Request failed');
    }

    return data.settings;
}

export const settingsRepository = {
    getSettings,
    configSettings,
};
