import { config } from '../../../../engine/config/config';
import { VectorConfig } from '../../../../engine/config/type';
import { useEditorStore } from '../../../store/editorStore';

export function VectorTab() {
    const selected = useEditorStore((state) => state.selectedTerrain);

    function handleSelectTerrain(entity: VectorConfig): void {
        useEditorStore.getState().selectTerrain(entity);
    }

    function renderVectorOption(entity: VectorConfig) {
        const classes = ['editor-palett--option'];
        if (selected?.name === entity.name) {
            classes.push('editor-palett--option--selected');
        }

        return (
            <button className={classes.join(' ')} onClick={() => handleSelectTerrain(entity)}>
                <span style={{ backgroundColor: entity.meta.color }} className="editor-palett--option-color"></span>
                <span>{entity.name}</span>
            </button>
        );
    }

    const vectors = config.getVectors().map((vector) => ({
        ...vector,
        category: 'vector',
        /*meta: {
            "color": "#000000"
        }*/
    }));

    /*
    
                <h3 className="editor-palett--options-heading">Vectors</h3>
                <ul className="editor-palett--options-list">
                    {vectors.map((tileConfig, i) => (
                        <li key={i}>{renderTerrainOption(tileConfig)}</li>
                    ))}
                </ul>
    */

    return (
        <div className="tab-panel">
            <div className="editor-palett--options">
                <h3 className="editor-palett--options-heading">Vectors</h3>
                <ul className="editor-palett--options-list">
                    {vectors.map((tileConfig, i) => (
                        <li key={i}>{renderVectorOption(tileConfig)}</li>
                    ))}
                </ul>
            </div>
        </div>
    );
}