import { useNavigate } from "react-router-dom";


export function EditoreMenuScreen() {
    const navigate = useNavigate();

    async function handleContinue() {
    }

    async function handleNew() {
        try {
            const res = await fetch("/world", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: 'Hello new' }),
            });
            
            const data: any = await res.json();
            if (!res.ok) {
                throw new Error(data.error ?? 'New game Request failed');
            }

            navigate(`/editor/${data.id}`);

        } catch (err) {
            //setError(err instanceof Error ? err.message : "Unknown error");
        } finally {
            //setLoading(false);
        }
    }

    async function handleLoad() {
        console.log('Load');
    }

    return (
        <main className="editor-menu-screen">
            <div className="editor-menu-screen--menu">
                <h2>Editor</h2>
                <button className="editor-screen--menu-btn" onClick={() => handleContinue()}>Continue (...)</button>
                <button className="editor-screen--menu-btn" onClick={() => handleNew()}>New</button>
                <button className="editor-screen--menu-btn" onClick={() => handleLoad()}>Load</button>
            </div>
        </main>
    );
}