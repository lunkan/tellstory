import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePaletteEditorStore } from "../../../store/paletteEditorStore";


export function EditoreNewPaletteScreen() {
    const newPalette = usePaletteEditorStore((state) => state.newPalette);
    const [paletteName, setPaletteName] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        console.log('handleSubmit', paletteName);

        try {
            await newPalette(paletteName);
            navigate(`/palette`);
        } catch (err) {
            //setError(err instanceof Error ? err.message : "Unknown error");
        } finally {
            //setLoading(false);
        }
    };

    function handleCancel() {
        console.log('handleCancel');
        navigate(`/editor`);
    }

    return (
        <main className="editor-menu-screen">
            <div className="editor-menu-screen--menu">
                <h2>New Palette</h2>
                <form className="editor-menu-screen--form" onSubmit={handleSubmit}>
                    <label htmlFor="paletteName">Name</label>
                    <input
                        id="paletteName"
                        name="paletteName"
                        type="text"
                        value={paletteName}
                        autoComplete="off"
                        onChange={(e) => setPaletteName(e.target.value)}
                    />
                    <button type="submit">Submit</button>
                </form>
                <button onClick={() => handleCancel()}>Cancel</button>
            </div>
        </main>
    );
}