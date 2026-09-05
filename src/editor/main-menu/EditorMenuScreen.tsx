import { useNavigate } from "react-router-dom";


export function EditoreMenuScreen() {
    const navigate = useNavigate();

    function handleContinue() { }

    function handleNew() {
        navigate(`/editor/new`);
    }

    function handleLoad() {
        console.log('Load');
        navigate(`/editor/load`);
    }

    function handleNewResource() {
        navigate(`/palette/new`);
    }

    function handleLoadResource() {
        console.log('Load Resource');
        navigate(`/palette/load`);
    }

    function handleCancel() {
        navigate(`/`);
    }

    return (
        <main className="editor-menu-screen">
            <div className="editor-menu-screen--menu">
                <h2>Map Editor</h2>
                <button className="editor-screen--menu-btn" onClick={() => handleContinue()}>Continue (...)</button>
                <button className="editor-screen--menu-btn" onClick={() => handleNew()}>New</button>
                <button className="editor-screen--menu-btn" onClick={() => handleLoad()}>Load</button>
            </div>
            <div className="editor-menu-screen--menu">
                <h2>Resource Editor</h2>
                <button className="editor-screen--menu-btn" onClick={() => handleContinue()}>Continue (...)</button>
                <button className="editor-screen--menu-btn" onClick={() => handleNewResource()}>New</button>
                <button className="editor-screen--menu-btn" onClick={() => handleLoadResource()}>Load</button>
            </div>
            <button className="editor-screen--menu-btn" onClick={() => handleCancel()}>Cancel</button>
        </main>
    );
}