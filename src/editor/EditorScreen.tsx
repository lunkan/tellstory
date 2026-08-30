import { EditorMap } from "./map/EditorMap";
import { EditorTopbar } from "./EditorTopbar";
import { Sidebar } from "./sidebar/Sidebar";
import { useEditorStore } from "../store/editorStore";

export function EditorScreen() {
    const loading = useEditorStore((state) => state.loading);

    if (loading) {
        return (
            <main className="editor-screen">
                <div>Loading</div>
            </main>
        );
    }

    return (
        <main className="editor-screen">
            <EditorTopbar></EditorTopbar>
            <EditorMap></EditorMap>
            <Sidebar></Sidebar>
        </main>
    );
}