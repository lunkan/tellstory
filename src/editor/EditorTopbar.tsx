import { useNavigate } from "react-router-dom";
import { EditState, useEditorStore } from "../store/editorStore";
import { useState } from "react";
import { PressureControl } from "./topbar/PressureControl";

export function EditorTopbar() {
    const editState = useEditorStore((state) => state.editState);
    const worldName = useEditorStore((state) => state.worldName);
    const [pressureDialogOpen, setPressureDialogOpen] = useState(false);
    const navigate = useNavigate();

    function handleSelectTerrain(editState: EditState): void {
        useEditorStore.getState().setEditState(editState);
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
                <button className={editState === 'erase' ? 'editor-topbar--btn--selected' : 'editor-topbar--btn'} onClick={() => handleSelectTerrain('erase')}>Erase</button>
                <button className={editState === 'draw' ? 'editor-topbar--btn--selected' : 'editor-topbar--btn'} onClick={() => handleSelectTerrain('draw')}>Draw</button>
                <button className={editState === 'transform' ? 'editor-topbar--btn--selected' : 'editor-topbar--btn'} onClick={() => handleSelectTerrain('transform')}>Move</button>
                <button className={editState === 'select' ? 'editor-topbar--btn--selected' : 'editor-topbar--btn'} onClick={() => handleSelectTerrain('select')}>Select</button>
            </div>
            <div className="editor-topbar--group"></div>
        </div>
    );
}