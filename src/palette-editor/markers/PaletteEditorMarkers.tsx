import { Table } from '../../components/table/Table';
import { Toolbar } from '../../components/toolbar/Toolbar';
import { ToolbarButtonGroup } from '../../components/toolbar/ToolbarButtonGroup';
import { Button } from '../../components/button/Button';
import styles from './PaletteEditorMarkers.module.css';
import { usePaletteEditorStore } from '../../store/paletteEditorStore';
import { useState } from 'react';
import { Input } from '../../components/input/Input';
import { MarkerConfigData } from '../../../engine/config/type';
import { Select } from '../../components/select/Select';
import { Chip } from '../../components/chip/Chip';
import { PaletteEditorMarkerTagModal } from './marker-tag-modal/PalettEditorMarkerTagModal';

type PendingUpdate = {
    id: number;
    [key: string]: unknown;
}

enum MARKER_CATEGORIES {
    StartingLocation = 'starting-location',
    Landmark = 'landmark',
};

export function PaletteEditorMarkers() {
    const paletteData = usePaletteEditorStore((state) => state.data);
    const updatePaletteData = usePaletteEditorStore((state) => state.updateData);
    const addMarkerData = usePaletteEditorStore((state) => state.addMarkerData);
    const removeMarker = usePaletteEditorStore((state) => state.removeMarker);
    const [editableRows, setEditableRows] = useState<number[]>([]);
    const [activeMarker, setActiveMarker] = useState<MarkerConfigData>();
    const [isTagModalOpen, setIsTagModalOpen] = useState<boolean>(false);
    const [pendingUpdates, setPendingUpdates] = useState<PendingUpdate[]>([]);

    const colgroupData = [
        { width: '15%' },
        { width: '15%' },
        { width: '5%' },
        { width: '30%' },
        { width: '15%' },
        { width: '10%' },
        { width: '10%' },
    ];

    const theadData = [
        { text: 'Name' },
        { text: 'Category' },
        { text: 'Att..' },
        { text: 'Tags' },
        { text: 'Meta' },
        { text: '-' },
        { text: '-' },
    ];

    function getEditState(id: number): Partial<MarkerConfigData> {
        const markerData = paletteData?.markers.find((marker) => marker.id === id);
        const pendingMarkerData = pendingUpdates.find((update) => update.id === id);

        return {
            ...markerData,
            ...pendingMarkerData,
        };
    }

    function getTagColorByName(tagName: string): string {
        const tile = paletteData?.tiles.find((tile) => tile.name === tagName);
        if (tile) {
            return tile.meta.color;
        }

        return '#fff';
    }

    function handleAddMarker(): void {
        const ids = addMarkerData([{}]);
        setEditableRows([...editableRows, ...ids]);
    }

    function handleAddTags(id: number): void {
        console.log('!handleAddTags');
        setActiveMarker(getEditState(id) as any);
        setIsTagModalOpen(true);
    }

    function handleClearTag(id: number, tagName: string): void {
        const marker = getEditState(id);

        if (!marker) {
            console.log('NO marker');
            return;
        }

        const mutatedTags = marker.tags?.filter((tag) => tag !== tagName) || [];
        updateCell(id, 'tags', mutatedTags);
    }

    function handleEdit(rowId: number): void {
        setEditableRows([...editableRows, rowId]);
    }

    function handleDelete(id: number): void {
        if (removeMarker(id)) {
            setEditableRows(editableRows.filter((currRowId) => currRowId !== id));
        }
    }

    function handleSave(id: number): void {
        const index = pendingUpdates.findIndex((pendingUpdate) => pendingUpdate.id === id);
        setEditableRows(editableRows.filter((currRowId) => currRowId !== id));

        if (index === -1) {
            return;
        }

        const pendingRowUpdates = pendingUpdates.splice(index, 1);
        setPendingUpdates(pendingUpdates);
        updatePaletteData({
            markers: pendingRowUpdates as any,
        });
    }

    function updateCell<K extends keyof PendingUpdate>(id: number, key: K, value: PendingUpdate[K]): void {
        const update = pendingUpdates.find((pendingUpdate) => pendingUpdate.id === id);
        if (update) {
            setPendingUpdates(pendingUpdates.map((update) => {
                if (update.id !== id) return update;
                return { ...update, [key]: value };
            }));
        } else {
            setPendingUpdates([...pendingUpdates, {
                id: id, [key]: value,
            }]);
        }
    }

    function handleTagModalClose(selectedTags?: string[]): void {
        console.log('Close the tag modal', selectedTags);

        if (selectedTags && activeMarker) {
            updateCell(activeMarker.id, 'tags', selectedTags);
        }

        setActiveMarker(undefined);
        setIsTagModalOpen(false);
    }

    function getMarkerTBodyData(): any {
        if (!paletteData) return [];

        return paletteData.markers?.map((markerData) => {
            if (!editableRows.includes(markerData.id)) {
                const tags =
                    <div className={styles.tagGroup}>
                        {markerData.tags?.map((tagName, i) =>
                            <Chip key={i} text={tagName} color={getTagColorByName(tagName)} size="small"></Chip>
                        )}
                    </div>
                    ;

                return {
                    id: markerData.id,
                    cells: [
                        { text: markerData.name },
                        { text: markerData.category },
                        { text: '?' },
                        { text: tags },
                        { text: '?' },
                        { text: <Button size="small" resizeMode="fill" onClick={() => handleEdit(markerData.id)} text="Edit"></Button> },
                        { text: <Button size="small" resizeMode="fill" onClick={() => handleDelete(markerData.id)} text="Delete"></Button> }
                    ],
                };
            }

            const pendingData = pendingUpdates.find((update) => update.id === markerData.id);
            const currentMarkerData = {
                ...markerData,
                ...pendingData,
            };

            const category =
                <Select
                    defaultValue={markerData.category}
                    onChange={e => updateCell(markerData.id, 'category', e.target.value)}
                >
                    {Object.values(MARKER_CATEGORIES).map((value) =>
                        <option key={value} value={value}>{value}</option>
                    )}
                </Select>
                ;

            const tags =
                <div className={styles.tagGroup}>
                    {currentMarkerData.tags?.map((tagName, i) =>
                        <Chip key={i} text={tagName} color={getTagColorByName(tagName)} size="small" onClear={() => handleClearTag(markerData.id, tagName)}></Chip>
                    )}
                    <Button text="+" size="xSmall" onClick={() => handleAddTags(markerData.id)}></Button>
                </div>
                ;

            return {
                id: markerData.id,
                cells: [
                    { text: <Input type="text" defaultValue={markerData.name} id={`name@${markerData.id}`} onChange={(e) => updateCell(markerData.id, 'name', e.target.value)}></Input> },
                    { text: category },
                    { text: '?' },
                    { text: tags },
                    { text: '?' },
                    { text: <Button resizeMode="fill" size="small" onClick={() => handleSave(markerData.id)} text="Save"></Button> },
                    { text: <Button resizeMode="fill" size="small" onClick={() => handleDelete(markerData.id)} text="Delete"></Button> }
                ],
            };
        });
    }

    /*
    activeTags: string[];
    onClose: () => void;
    */

    return (
        <div className={styles.tabPanel}>
            <Toolbar>
                <ToolbarButtonGroup>
                    <Button text="Add marker" onClick={handleAddMarker}></Button>
                    <Button text="Generate markers"></Button>
                </ToolbarButtonGroup>
            </Toolbar>

            <Table colgroupData={colgroupData} theadData={theadData} tbodyData={getMarkerTBodyData()}></Table>
            <PaletteEditorMarkerTagModal isOpen={isTagModalOpen} marker={activeMarker} onClose={handleTagModalClose}></PaletteEditorMarkerTagModal>
        </div>
    );
}