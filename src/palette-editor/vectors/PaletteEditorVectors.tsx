import { Button } from '../../components/button/Button';
import { Table } from '../../components/table/Table';
import { Toolbar } from '../../components/toolbar/Toolbar';
import { ToolbarButtonGroup } from '../../components/toolbar/ToolbarButtonGroup';
import { usePaletteEditorStore } from '../../store/paletteEditorStore';
import styles from './PaletteEditorVEctors.module.css';

export function PaletteEditorVectors() {
    const paletteData = usePaletteEditorStore((state) => state.data);

    const theadData = [
        { text: 'Name' },
        { text: 'Attention' },
        { text: 'Meta' },
        { text: '-' },
        { text: '-' },
    ];

    function getMarkerTBodyData(): any {
        if (!paletteData) return [];

        return paletteData.vectors?.map((tileData, i) => {
            return {
                id: i, cells: [
                    { text: tileData.name },
                    { text: tileData.attentionValue },
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
                    <Button text="Add vector"></Button>
                    <Button text="Generate vectors"></Button>
                </ToolbarButtonGroup>
            </Toolbar>

            <Table theadData={theadData} tbodyData={getMarkerTBodyData()}></Table>
        </div>
    );
}