//import markersJSON from '../../../engine/config/markers.json' with { type: 'json' };
import { useState } from 'react';
import { config } from '../../../engine/config/config';
import { Chip } from '../../components/chip/Chip';
import { SelectedEntity, useEditorStore } from '../../store/editorStore';
import { MarkerConfig } from '../../../engine/config/type';

export function MarkerTab() {
    const selectedTerrain = useEditorStore((state) => state.selectedTerrain);
    const [tagFilters, setTagFilters] = useState<string[]>([]);

    function handleSelectMarker(entity: SelectedEntity): void {
        useEditorStore.getState().selectTerrain(entity);
    }

    function renderTerrainOption(entity: SelectedEntity) {
        const classes = ['editor-palett--option'];
        if (selectedTerrain?.name === entity.name) {
            classes.push('editor-palett--option--selected');
        }

        return (
            <button className={classes.join(' ')} onClick={() => handleSelectMarker(entity)}>
                <span style={{ backgroundColor: entity.meta.color }} className="editor-palett--option-color"></span>
                <span>{entity.name}</span>
            </button>
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
    const markers = config.getMarkersByFilter({ category: 'landmark' })
        .filter(markerFilter)
        .map((marker) => ({
            ...marker,
            category: 'marker',
            meta: {
                "color": "#000000"
            }
        }));

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