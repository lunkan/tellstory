import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useEditorStore } from "../store/editorStore";
import { WorldDataSummary } from "../../server/types";
//import { WorldDataSummary } from "../../storyteller/types";


export function EditoreLoadWorldScreen() {
    const [loading, setLoading] = useState<boolean>(true);
    const [worlds, setWorlds] = useState<WorldDataSummary[]>([]);
    const [deleteToggle, setDeleteToggle] = useState<boolean>(false);
    const navigate = useNavigate();

    useEffect(() => {
        loadWorlds();
    }, []);

    function loadWorlds(): void {
        fetch(`/world`).then((response) => {
            response.json().then((data) => {
                setLoading(false);
                setWorlds(data.worlds);
            });
        });
    }

    function handleSelectWorld(worldId: number) {
        if (deleteToggle) {
            fetch(`/world/${worldId}`, {
                method: "DELETE",
            }).then(() => {
                console.log('Deleted');
                loadWorlds();
            });
        } else {
            useEditorStore.getState().setWorldId(worldId);
            navigate(`/editor/${worldId}`);
        }
    }

    function handleCancel() {
        navigate(`/editor`);
    }

    if (loading) {
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
                    <h2>Worlds</h2>
                    <input
                        type="checkbox"
                        value="toggleDelete"
                        onChange={(e) => setDeleteToggle(e.target.checked)}
                    />
                </div>
                <ul className="editor-menu-screen--list">
                    {worlds.map((worldData, i) => (
                        <li key={i}>
                            <button className="editor-screen--menu-btn" onClick={() => handleSelectWorld(worldData.id)}>{worldData.name}{deleteToggle ? ' (Delete) ' : ''}</button>
                        </li>
                    ))}
                </ul>
                <button className="editor-screen--menu-btn" onClick={() => handleCancel()}>Cancel</button>
            </div>
        </main>
    );
}