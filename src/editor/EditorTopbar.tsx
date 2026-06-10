import { useEditorStore } from "../store/editorStore";

export function EditorTopbar() {
    const editState = useEditorStore((state) => state.editState);

    function handleSelectTerrain(editState: 'draw' | 'transform' | 'select'): void {
        useEditorStore.getState().setEditState(editState);
    }

    return (
        <div className="editor-topbar">
            <div className="editor-topbar--group">
                <button className="editor-topbar--btn">Save...</button>
                <button className="editor-topbar--btn">Load...</button>
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