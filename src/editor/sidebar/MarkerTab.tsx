//import markersJSON from '../../../engine/config/markers.json' with { type: 'json' };
import { config } from '../../../engine/config/config';
import { SelectedEntity, useEditorStore } from '../../store/editorStore';

export function MarkerTab() {
    const selectedTerrain = useEditorStore((state) => state.selectedTerrain);

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

    //const playerStart = markersJSON.markers.filter((marker) => marker.name === 'player-start')
    const playerStart = config.getMarkersByFilter({ category: 'starting-location' })
        .map((marker) => ({
            ...marker,
            category: 'marker',
            meta: {
                "color": "#ff0000"
            }
        }));

    //const markers = markersJSON.markers.filter((marker) => marker.name !== 'player-start')
    const markers = config.getMarkersByFilter({ category: 'landmark' })
        .map((marker) => ({
            ...marker,
            category: 'marker',
            meta: {
                "color": "#000000"
            }
        }))

    return (
        <div className="tab-panel">
            <div className="editor-palett--options">
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