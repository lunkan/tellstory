import { useNavigate } from "react-router-dom";
import { useEditorStore } from "../store/editorStore";

export function EditorTopbar() {
    const editState = useEditorStore((state) => state.editState);
    const worldName = useEditorStore((state) => state.worldName);
    const navigate = useNavigate();

    function handleSelectTerrain(editState: 'draw' | 'transform' | 'select'): void {
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
                <button className="editor-topbar--btn" onClick={() => handleQuit('draw')}>Quit...</button>
            </div>
            <div className="editor-topbar--group">
                <div className="editor-topbar--name-label">{worldName}</div>
            </div>
            <div className="editor-topbar--group">
                <button className={editState === 'draw' ? 'editor-topbar--btn--selected' : 'editor-topbar--btn' } onClick={() => handleSelectTerrain('draw')}>Draw</button>
                <button className={editState === 'transform' ? 'editor-topbar--btn--selected' : 'editor-topbar--btn' } onClick={() => handleSelectTerrain('transform')}>Move</button>
                <button className={editState === 'select' ? 'editor-topbar--btn--selected' : 'editor-topbar--btn' } onClick={() => handleSelectTerrain('select')}>Select</button>
            </div>
            <div className="editor-topbar--group"></div>
        </div>
    );
}