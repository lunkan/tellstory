import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePaletteEditorStore } from "../../../store/paletteEditorStore";

export function EditoreLoadPaletteScreen() {
    const storedPalettes = usePaletteEditorStore((state) => state.storedPalettes);
    const loadStoredPalettes = usePaletteEditorStore((state) => state.loadStoredPalettes);
    const deletePaletteById = usePaletteEditorStore((state) => state.deletePaletteById);
    const setPaletteId = usePaletteEditorStore((state) => state.loadPalette);
    const [deleteToggle, setDeleteToggle] = useState<boolean>(false);
    const navigate = useNavigate();

    useEffect(() => {
        loadStoredPalettes();
    }, []);

    function handleSelectPalette(paletteId: number) {
        if (deleteToggle) {
            console.log('delete', paletteId);
            deletePaletteById(paletteId);
        } else {
            setPaletteId(paletteId);
            navigate(`/palette`);
        }
    }

    console.log('EditoreLoadPaletteScreen', storedPalettes, !storedPalettes.length);

    function handleCancel() {
        navigate(`/editor`);
    }

    if (!storedPalettes.length) {
        return (
            <main className="editor-menu-screen">
                <div className="editor-menu-screen--menu">
                    ...Loading
                </div>
            </main>
        )
    }

    return (
        <main className="editor-menu-screen">
            <div className="editor-menu-screen--menu">
                <div className="editor-menu-screen--header">
                    <h2>Palettes</h2>
                    <input
                        type="checkbox"
                        value="toggleDelete"
                        onChange={(e) => setDeleteToggle(e.target.checked)}
                    />
                </div>
                <ul className="editor-menu-screen--list">
                    {storedPalettes.map((paletteSummary, i) => (
                        <li key={i}>
                            <button className="editor-screen--menu-btn" onClick={() => handleSelectPalette(paletteSummary.id)}>{paletteSummary.name}{deleteToggle ? ' (Delete) ' : ''}</button>
                        </li>
                    ))}
                </ul>
                <button className="editor-screen--menu-btn" onClick={() => handleCancel()}>Cancel</button>
            </div>
        </main>
    );
}