interface AppLoadingScreenProps {
    failed: boolean;
    onRetry: () => void;
}

export function AppLoadingScreen({ failed, onRetry }: AppLoadingScreenProps) {
    if (failed) {
        return (
            <main className="app-loading-screen">
                <p className="app-loading-screen--label">Could not reach the server</p>
                <button className="title-screen--btn" onClick={() => onRetry()}>Retry</button>
            </main>
        );
    }

    return (
        <main className="app-loading-screen">
            <div className="app-loading-screen--spinner" />
            <p className="app-loading-screen--label">Connecting to server</p>
        </main>
    );
}
