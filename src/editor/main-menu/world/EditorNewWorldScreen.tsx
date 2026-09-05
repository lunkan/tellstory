import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useEditorStore } from "../../../store/editorStore";


export function EditoreNewWorldScreen() {
    const [worldName, setWorldName] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        console.log('handleSubmit', worldName);

        try {
            const res = await fetch("/api/world", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: worldName }),
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

    return (
        <main className="editor-menu-screen">
            <div className="editor-menu-screen--menu">
                <h2>New world</h2>
                <form className="editor-menu-screen--form" onSubmit={handleSubmit}>
                    <label htmlFor="worldName">Name</label>
                    <input
                        id="worldName"
                        name="worldName"
                        type="text"
                        value={worldName}
                        autoComplete="off"
                        onChange={(e) => setWorldName(e.target.value)}
                    />
                    <button type="submit">Submit</button>
                </form>
                <button onClick={() => handleCancel()}>Cancel</button>
            </div>
        </main>
    );
}