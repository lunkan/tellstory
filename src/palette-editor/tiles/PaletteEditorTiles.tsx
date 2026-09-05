import { Button } from '../../components/button/Button';
import { Table } from '../../components/table/Table';
import { Toolbar } from '../../components/toolbar/Toolbar';
import { ToolbarButtonGroup } from '../../components/toolbar/ToolbarButtonGroup';
import { usePaletteEditorStore } from '../../store/paletteEditorStore';
import styles from './PaletteEditorTiles.module.css';

export function PaletteEditorTiles() {
    const paletteData = usePaletteEditorStore((state) => state.data);

    const theadData = [
        { text: 'Name' },
        { text: 'Category' },
        { text: 'Cluster' },
        { text: 'Attention' },
        { text: 'Movement' },
        { text: 'Tags' },
        { text: 'Meta' },
        { text: '-' },
        { text: '-' },
    ];

    function getMarkerTBodyData(): any {
        if (!paletteData) return [];

        return paletteData.tiles?.map((tileData, i) => {
            return {
                id: i, cells: [
                    { text: tileData.name },
                    { text: tileData.category },
                    { text: tileData.cluster },
                    { text: tileData.attentionValue },
                    { text: tileData.movementCost },
                    { text: tileData.tags?.join() },
                    { text: tileData.meta.color },
                    { text: <button>Edit</button> },
                    { text: <button>Delete</button> }
                ],
            };
        });
    }

    return (
        <div className={styles.tabPanel}>
            <Toolbar>
                <ToolbarButtonGroup>
                    <Button text="Add marker"></Button>
                    <Button text="Generate markers"></Button>
                </ToolbarButtonGroup>
            </Toolbar>

            <Table theadData={theadData} tbodyData={getMarkerTBodyData()}></Table>
        </div>
    );
}