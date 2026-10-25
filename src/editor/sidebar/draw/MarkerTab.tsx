//import markersJSON from '../../../engine/config/markers.json' with { type: 'json' };
import { useState } from 'react';
import { config } from '../../../../engine/config/config';
import { Chip } from '../../../components/chip/Chip';
import { useEditorStore } from '../../../store/editorStore';
import { MarkerConfig } from '../../../../engine/config/type';
import styles from './Sidebardraw.module.css';

export function MarkerTab() {
    const selectedTerrain = useEditorStore((state) => state.selectedTerrain);
    const nodeDepth = useEditorStore((state) => state.nodeDepth);
    const [tagFilters, setTagFilters] = useState<string[]>([]);

    function handleSelectMarker(entity: MarkerConfig): void {
        useEditorStore.getState().selectTerrain(entity);
    }

    function toggleMarkerLayer(entity: MarkerConfig, checked: boolean): void {
        console.log('entity', entity, checked);
        //useEditorStore.getState().selectTerrain(entity);
    }

    function renderTerrainOption(entity: MarkerConfig) {
        const rowClasses = [styles.row];
        if (selectedTerrain?.name === entity.name) {
            rowClasses.push(styles.selected);
        }

        // <button className={styles.rowToggle} onClick={() => toggleMarkerLayer(entity)}></button>
        return (
            <div className={rowClasses.join(' ')}>
                <input type="checkbox" defaultChecked={true} onChange={(e) => toggleMarkerLayer(entity, e.target.checked)} />
                <button className={styles.rowContent} onClick={() => handleSelectMarker(entity)}>
                    <span className={styles.rowColor} style={{ backgroundColor: entity.meta?.color }}></span>
                    <span className={styles.rowLabel} >{entity.name}</span>
                    <span className={styles.rowDepthLabel} >{entity.attention?.min}</span>
                </button>
            </div>
        );
    }

    function onMarkerFilterByTag(tagName: string): void {
        if (tagFilters.includes(tagName)) {
            setTagFilters(tagFilters.filter((currentTagName) => currentTagName !== tagName));
        } else {
            setTagFilters([...tagFilters, tagName]);
        }
    }

    function markerFilter(marker: MarkerConfig): boolean {
        if (marker.attention?.min && marker.attention.min > nodeDepth) return false;
        if (!tagFilters.length) return true;

        return marker.tags.some((tagName) => tagFilters.includes(tagName));
    }

    //const playerStart = markersJSON.markers.filter((marker) => marker.name === 'player-start')
    const playerStart = config.getMarkersByFilter({ category: 'starting-location' })
        .filter(markerFilter)
        .map((marker) => ({
            ...marker,
            category: 'marker',
            meta: {
                "color": "#ff0000"
            }
        }));

    //const markers = markersJSON.markers.filter((marker) => marker.name !== 'player-start')

    const markers: MarkerConfig[] = config.getMarkersByFilter({ category: 'landmark' })
        .filter(markerFilter);
    /*.map((marker) => ({
        ...marker,
        category: 'marker',
        meta: {
            "color": "#000000"
        }
    }));*/

    const tagFilterData = config.getMarkerTags().map((tagFilter) => {
        return {
            name: tagFilter,
            active: tagFilters.includes(tagFilter),
        };
    })

    return (
        <div className="tab-panel">
            <div className="editor-palett--options">
                <div className="editor-palett--marker-filter-chip-group">
                    {tagFilterData.map((tagFilter, i) => (
                        <Chip key={i} text={tagFilter.name} active={tagFilter.active} onClick={() => onMarkerFilterByTag(tagFilter.name)}></Chip>
                    ))}
                </div>

                <h3 className="editor-palett--options-heading">Player start</h3>
                <ul className="editor-palett--options-list">
                    {playerStart.map((playerStartConfig, i) => (
                        <li key={i}>{renderTerrainOption(playerStartConfig)}</li>
                    ))}
                </ul>
                <h3 className="editor-palett--options-heading">Landmarks</h3>
                <ul className="editor-palett--options-list">
                    {markers.map((marker, i) => (
                        <li key={i}>{renderTerrainOption(marker)}</li>
                    ))}
                </ul>
            </div>
        </div>
    );
}