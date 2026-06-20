type EditorMapZoomLevelProps = {
  depth: number;
};

export function EditorMapZoomLevel({ depth }: EditorMapZoomLevelProps) {

    return (
        <div className="editor-zoom-level">
            <div className="editor-zoom-level--depth">{depth}</div>
            <div className="editor-zoom-level--depth-label">Depth</div>
        </div>
    );
}