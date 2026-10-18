import { useNavigate } from "react-router-dom";
import { EditState, MapMode, useEditorStore } from "../store/editorStore";
import { useState } from "react";
import { PressureControl } from "./topbar/PressureControl";

export function EditorTopbar() {
    const editState = useEditorStore((state) => state.editState);
    const worldName = useEditorStore((state) => state.worldName);
    const setMapMode = useEditorStore((state) => state.setMapMode);
    const mapMode = useEditorStore((state) => state.mapMode);
    //const [pressureDialogOpen, setPressureDialogOpen] = useState(false);
    const navigate = useNavigate();

    function handleSelectTerrain(editState: EditState): void {
        useEditorStore.getState().setEditState(editState);
    }

    function handleSelectMapMode(mapMode: MapMode): void {
        setMapMode(mapMode);
    }

    function handleQuit(): void {
        navigate(`/`);
    }

    function handleLoad(): void {
        navigate(`/editor/load`);
    }

    function handleSave(): void {
        useEditorStore.getState().save();
    }

    return (
        <div className="editor-topbar">
            <div className="editor-topbar--group">
                <button className="editor-topbar--btn" onClick={() => handleSave()}>Save...</button>
                <button className="editor-topbar--btn" onClick={() => handleLoad()}>Load...</button>
                <button className="editor-topbar--btn" onClick={() => handleQuit()}>Quit...</button>
            </div>
            <div className="editor-topbar--group">
                <div className="editor-topbar--name-label">{worldName}</div>
            </div>
            <div className="editor-topbar--group">
                <PressureControl></PressureControl>
            </div>
            <div className="editor-topbar--group">
                <button className={mapMode === 'plain' ? 'editor-topbar--btn--selected' : 'editor-topbar--btn'} onClick={() => handleSelectMapMode('plain')}>Plain Mode</button>
                <button className={mapMode === 'map' ? 'editor-topbar--btn--selected' : 'editor-topbar--btn'} onClick={() => handleSelectMapMode('map')}>Map Mode</button>
            </div>
            <div className="editor-topbar--group">
                <button className={editState === 'erase' ? 'editor-topbar--btn--selected' : 'editor-topbar--btn'} onClick={() => handleSelectTerrain('erase')}>Erase</button>
                <button className={editState === 'draw' ? 'editor-topbar--btn--selected' : 'editor-topbar--btn'} onClick={() => handleSelectTerrain('draw')}>Draw</button>
                <button className={editState === 'transform' ? 'editor-topbar--btn--selected' : 'editor-topbar--btn'} onClick={() => handleSelectTerrain('transform')}>Move</button>
                <button className={editState === 'select' ? 'editor-topbar--btn--selected' : 'editor-topbar--btn'} onClick={() => handleSelectTerrain('select')}>Select</button>
            </div>
            <div className="editor-topbar--group"></div>
        </div>
    );
}