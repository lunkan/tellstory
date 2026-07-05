import { create } from "zustand";
import { settingsRepository } from "../repositories/settingsRepository";
import { SettingsConfig, type SettingsData } from "../../shared/src/types";

interface SettingsStore {
    settings: SettingsData,
    sync: () => void;
    config: (settingsConfig: SettingsConfig) => void;
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
    settings: {
        descriptionInstructionsOnly: false,
        descriptionPersonalized: true,
        descriptionNarrator: true,
    },
    sync: async () => {
        const settings = await settingsRepository.getSettings();
        set({
            settings,
        });
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
