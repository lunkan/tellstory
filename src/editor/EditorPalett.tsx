import tilesJSON from '../../engine/config/tiles.json' with { type: 'json' };
import { useEditorStore } from '../store/editorStore';

export function EditorPalett() {
    const selectedTerrain = useEditorStore((state) => state.selectedTerrain);
    const paintValue = useEditorStore((state) => state.paintValue);

    function handleSelectTerrain(name: string): void {
        useEditorStore.getState().selectTerrain(name);
    }

    function handleValueRangeChange(value: string): void {
        useEditorStore.getState().setPaintValue(parseFloat(value));
    }

    function renderTerrainOption(tileConfig: any) {
        const classes = ['editor-palett--terrain-option'];
        if (selectedTerrain === tileConfig.name) {
            classes.push('editor-palett--terrain-option--selected');
        }

        return (
            <button className={classes.join(' ')} onClick={() => handleSelectTerrain(tileConfig.name)}>
                <span style={{backgroundColor: tileConfig.meta?.color }} className="editor-palett--terrain-option-color"></span>
                <span>{tileConfig.name}</span>
            </button>
        );
    }

    const typography = tilesJSON.tiles.filter((tileConfig) => tileConfig.category === 'typography');
    const vectors = tilesJSON.tiles.filter((tileConfig) => tileConfig.category === 'vector');
    const biome = tilesJSON.tiles.filter((tileConfig) => tileConfig.category === 'biome');
    const buildings = tilesJSON.tiles.filter((tileConfig) => tileConfig.category === 'building');

    return (
        <div className="editor-palett">
            <h2>Palett</h2>
            <div className="editor-palett-controls">
                <div className="editor-palett-controls--label">
                    <span>Value</span>
                    <span>{paintValue}</span>
                </div>
                <input
                    className="editor-palett-controls--range"
                    type="range"
                    min="-1"
                    max="1"
                    defaultValue="0"
                    step="0.05"
                    onChange={(e) => handleValueRangeChange(e.target.value)}
                />
            </div>
            <div className="editor-palett--terrain-options">
                <h3 className="editor-palett--terrain-options-heading">Typography</h3>
                <ul className="editor-palett--terrain-options-list">
                    {typography.map((tileConfig, i) => (
                        <li key={i}>{renderTerrainOption(tileConfig)}</li>
                    ))}
                </ul>
                <h3 className="editor-palett--terrain-options-heading">Vectors</h3>
                <ul className="editor-palett--terrain-options-list">
                    {vectors.map((tileConfig, i) => (
                        <li key={i}>{renderTerrainOption(tileConfig)}</li>
                    ))}
                </ul>
                <h3 className="editor-palett--terrain-options-heading">Biome</h3>
                <ul className="editor-palett--terrain-options-list">
                    {biome.map((tileConfig, i) => (
                        <li key={i}>{renderTerrainOption(tileConfig)}</li>
                    ))}
                </ul>
                <h3 className="editor-palett--terrain-options-heading">Buildings</h3>
                <ul className="editor-palett--terrain-options-list">
                    {buildings.map((tileConfig, i) => (
                        <li key={i}>{renderTerrainOption(tileConfig)}</li>
                    ))}
                </ul>
            </div>
        </div>
    );
}