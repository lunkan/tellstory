import tilesJSON from '../../../engine/config/tiles.json' with { type: 'json' };
import { SelectedEntity, useEditorStore } from '../../store/editorStore';

export function TileTab() {
    const selectedTerrain = useEditorStore((state) => state.selectedTerrain);

    function handleSelectTerrain(entity: SelectedEntity): void {
        useEditorStore.getState().selectTerrain(entity);
    }

    function renderTerrainOption(entity: SelectedEntity) {
        const classes = ['editor-palett--option'];
        if (selectedTerrain?.name === entity.name) {
            classes.push('editor-palett--option--selected');
        }

        return (
            <button className={classes.join(' ')} onClick={() => handleSelectTerrain(entity)}>
                <span style={{ backgroundColor: entity.meta.color }} className="editor-palett--option-color"></span>
                <span>{entity.name}</span>
            </button>
        );
    }

    const typography = tilesJSON.tiles.filter((tileConfig) => tileConfig.category === 'typography');
    const vectors = tilesJSON.tiles.filter((tileConfig) => tileConfig.category === 'vector');
    const biome = tilesJSON.tiles.filter((tileConfig) => tileConfig.category === 'biome');
    const urban = tilesJSON.tiles.filter((tileConfig) => tileConfig.category === 'urban');

    return (
        <div className="tab-panel">
            <div className="editor-palett--options">
                <h3 className="editor-palett--options-heading">Typography</h3>
                <ul className="editor-palett--options-list">
                    {typography.map((tileConfig, i) => (
                        <li key={i}>{renderTerrainOption(tileConfig)}</li>
                    ))}
                </ul>
                <h3 className="editor-palett--options-heading">Vectors</h3>
                <ul className="editor-palett--options-list">
                    {vectors.map((tileConfig, i) => (
                        <li key={i}>{renderTerrainOption(tileConfig)}</li>
                    ))}
                </ul>
                <h3 className="editor-palett--options-heading">Biome</h3>
                <ul className="editor-palett--options-list">
                    {biome.map((tileConfig, i) => (
                        <li key={i}>{renderTerrainOption(tileConfig)}</li>
                    ))}
                </ul>
                <h3 className="editor-palett--options-heading">Urban</h3>
                <ul className="editor-palett--options-list">
                    {urban.map((tileConfig, i) => (
                        <li key={i}>{renderTerrainOption(tileConfig)}</li>
                    ))}
                </ul>
            </div>
        </div>
    );
}