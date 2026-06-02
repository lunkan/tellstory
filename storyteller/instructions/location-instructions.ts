/*import tileInstructionsJSON from '../config/tile-instructions.json' with { type: 'json' };

import { Moment } from "../../engine/chronicle/moment.js";
import { ChronicleEvent, ChronicleEventType } from '../../engine/chronicle/chronicle';
import { TerrainSetting, Tile } from '../../engine/world/tile';


export function getLocationStateInstructions(terrain: TerrainSetting[]): string[] {
    return terrain.map((terrain) => {
        const terrainConfig = tileInstructionsJSON.tiles.find((tile) => tile.name === terrain.type);
        if (!terrainConfig) {
            console.error(`No config for terrain ${terrain.type} found!`);
            return;
        }

        const instructionByThreshold = terrainConfig.instructions.state.find((state) => terrain.value <= state.threshold);
        if (!instructionByThreshold) {
            console.error(`No config state threshold for terrain ${terrain.type} found!`);
            return;
        }

        return instructionByThreshold.text.length ? instructionByThreshold.text : undefined;
    }).filter((state) => state !== undefined);
}

export function getLocationShiftInstructions(locationA?: Tile, locationB?: Tile): string[] {
    if (!locationA || !locationB) {
        return [];
    }

    const locationATerrainTypes = locationA.terrain.map((terrain) => terrain.type);
    const locationBTerrainTypes = locationB.terrain.map((terrain) => terrain.type);
    const commonTerrainTypes = [...new Set([...locationATerrainTypes, ...locationBTerrainTypes])];


    return commonTerrainTypes.map((terrainType) => {
        const terrainConfig = tileInstructionsJSON.tiles.find((tile) => tile.name === terrainType);
        if (!terrainConfig) {
            console.error(`No config for terrain ${terrainConfig} found!`);
            return;
        }

        const previousTerrainType = locationA.terrain.find((terrain) => terrain.type === terrainType);
        const currentTerrainType = locationB.terrain.find((terrain) => terrain.type === terrainType);
        const delta = (currentTerrainType?.value || 0) - (previousTerrainType?.value || 0);

        const instructionByThreshold = terrainConfig.instructions.shift.find((shift) => delta <= shift.threshold);
        if (!instructionByThreshold) {
            console.error(`No config shift threshold for terrain ${terrainType} found!`);
            return;
        }
        
        return instructionByThreshold.text.length ? instructionByThreshold.text : undefined;
    }).filter((state) => state !== undefined);
}

export function getLocationHistoryInstructions(currentTime: number, enterEvents: ChronicleEvent[]): string[] {
    if (!enterEvents.length) {
        return ['Character have never been here before'];
    }

    const previousVisit = enterEvents[0];
    const elapsedTime = currentTime - previousVisit.timestamp;
    if (elapsedTime < 5) {
        return ['Character was just reasently here'];
    } else if (elapsedTime < 10) {
        return ['Character was here some days ago'];
    } else {
        return ['Character has been here but it was long time ago'];
    }
}*/