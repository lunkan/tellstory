import { useEffect } from "react";
import { wsService } from "./websocket/websocketService";
import { GameScreen } from "./game/GameScreen";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { EditorScreen } from "./editor/EditorScreen";
import { EditoreMenuScreen } from "./editor/EditorMenuScreen";
import { EditoreNewWorldScreen } from "./editor/EditorNewWorldScreen";
import { EditoreLoadWorldScreen } from "./editor/EditorLoadWorldScreen";
import { NewGameScreenScreen } from "./game-menu/NewGameScreen";
import { TitleScreen } from "./TitleScreen";
import { AdminScreen } from "./admin/AdminScreen";
import { useSettingsStore } from "./store/settingsStore";

export default function App() {
    const syncSettings = useSettingsStore((state) => state.sync);

    useEffect(() => {
        wsService.connect();
        syncSettings();
    }, []);

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<TitleScreen />} />
                <Route path="/menu" element={<NewGameScreenScreen />} />
                <Route path="/game" element={<GameScreen />} />
                <Route path="/admin" element={<AdminScreen />} />
                <Route path="/editor" element={<EditoreMenuScreen />} />
                <Route path="/editor/new" element={<EditoreNewWorldScreen />} />
                <Route path="/editor/load" element={<EditoreLoadWorldScreen />} />
                <Route path="/editor/:id" element={<EditorScreen />} />
            </Routes>
        </BrowserRouter>
    );
}
