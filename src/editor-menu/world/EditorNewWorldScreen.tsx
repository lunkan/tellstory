import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useEditorStore } from "../../store/editorStore";
import { Input } from "../../components/input/Input";
import { Button } from "../../components/button/Button";
import { Select } from "../../components/select/Select";
import { usePaletteEditorStore } from "../../store/paletteEditorStore";
import { Card } from "../../components/card/Card";


export function EditoreNewWorldScreen() {
    const storedPalettes = usePaletteEditorStore((state) => state.storedPalettes);
    const loadStoredPalettes = usePaletteEditorStore((state) => state.loadStoredPalettes);
    const [worldName, setWorldName] = useState('');
    const [worldSize, setWorldSize] = useState(15);
    const [worldPalette, setWorldPalette] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        loadStoredPalettes();
    }, []);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        console.log('handleSubmit', worldName);

        try {
            const res = await fetch("/api/world", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: worldName,
                    size: worldSize,
                    palette: worldPalette
                }),
            });

            const data: any = await res.json();
            if (!res.ok) {
                throw new Error(data.error ?? 'New game Request failed');
            }

            useEditorStore.getState().setWorldId(data.worldId);
            navigate(`/editor/${data.worldId}`);

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

    function getWorldSizeHint(): string {
        const meters = Math.pow(2, worldSize) * 100;
        if (meters < 1000) {
            return `${meters}m x ${meters}m`;
        }

        return `${Math.round(meters / 1000)}km x ${Math.round(meters / 1000)}km`;
    }

    return (
        <main className="editor-menu-screen">
            <Card heading="New world">
                <form className="editor-menu-screen--form" onSubmit={handleSubmit}>
                    <Input
                        label="Name"
                        name="worldName"
                        value={worldName}
                        onChange={(e) => setWorldName(e.target.value)}
                    />
                    <Input
                        label="Size"
                        type="number"
                        min="1"
                        max="20"
                        step="1"
                        name="worldSize"
                        value={worldSize}
                        hint={getWorldSizeHint()}
                        onChange={(e) => setWorldSize(Number(e.target.value))}
                    />
                    <Select
                        label="Palette"
                        name="worldPalette"
                        value={worldPalette}
                        onChange={(e) => setWorldPalette(e.target.value)}
                    >
                        {storedPalettes.map((palette, i) =>
                            <option key={i} value={palette.id}>{palette.name}</option>
                        )}
                    </Select>
                    <Button type="submit" text="Submit" isDisabled={!worldName || !worldPalette}></Button>
                </form>
                <Button text="Cancel" onClick={() => handleCancel()}></Button>
            </Card>
        </main>
    );
}