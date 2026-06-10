import { EditorMap } from "./EditorMap";
import { EditorTopbar } from "./EditorTopbar";
import { EditorPalett } from "./EditorPalett";

export function EditorScreen() {
    return (
        <main className="editor-screen">
            <EditorTopbar></EditorTopbar>
            <EditorMap></EditorMap>
            <EditorPalett></EditorPalett>
        </main>
    );
}