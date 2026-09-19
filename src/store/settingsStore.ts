import { create } from "zustand";
import { settingsRepository } from "../repositories/settingsRepository";
import { SettingsConfig, type SettingsData } from "../../shared/src/types";

type SyncStatus = "loading" | "ready" | "error";

// The API server boots slower than Vite, so the first sync can arrive before it
// is listening. Retry a handful of times before giving up.
const SYNC_RETRY_DELAYS_MS = [300, 600, 1200, 2400, 4000];

interface SettingsStore {
    settings: SettingsData,
    status: SyncStatus;
    sync: () => Promise<void>;
    config: (settingsConfig: SettingsConfig) => void;
}

function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

let syncInFlight: Promise<void> | null = null;

export const useSettingsStore = create<SettingsStore>((set, get) => ({
    settings: {
        descriptionInstructionsOnly: false,
        descriptionPersonalized: true,
        descriptionNarrator: true,
    },
    status: "loading",
    sync: () => {
        if (syncInFlight) {
            return syncInFlight;
        }

        set({ status: "loading" });

        syncInFlight = (async () => {
            for (let attempt = 0; ; attempt++) {
                try {
                    const settings = await settingsRepository.getSettings();
                    set({ settings, status: "ready" });
                    return;
                } catch (error) {
                    const retryDelay = SYNC_RETRY_DELAYS_MS[attempt];
                    if (retryDelay === undefined) {
                        console.error("Could not load settings from the API server", error);
                        set({ status: "error" });
                        return;
                    }

                    await delay(retryDelay);
                }
            }
        })().finally(() => {
            syncInFlight = null;
        });

        return syncInFlight;
    },
    config: async (settingsConfig: SettingsConfig) => {
        set({
            settings: {
                ...get().settings,
                ...settingsConfig,
            },
        });

        const updatedSettings = await settingsRepository.configSettings(settingsConfig);

        set({
            settings: updatedSettings,
        });
    },
}));
