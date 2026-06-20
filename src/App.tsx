import { useEffect } from "react";
import { wsService } from "./websocket/websocketService";
//import { useGameStore } from "./store/gameStore";
import { TitleScreen } from "./TitleScreen";
import { GameScreen } from "./GameScreen";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { EditorScreen } from "./editor/EditorScreen";
import { EditoreMenuScreen } from "./editor/EditorMenuScreen";
import { EditoreNewWorldScreen } from "./editor/EditorNewWorldScreen";
import { EditoreLoadWorldScreen } from "./editor/EditorLoadWorldScreen";

export default function App() {
    //const activeGameId = useGameStore((state) => state.activeGameId);
  
    useEffect(() => {
        wsService.connect();
    }, []);

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<TitleScreen />} />
                <Route path="/game" element={<GameScreen />} />
                <Route path="/editor" element={<EditoreMenuScreen />} />
                <Route path="/editor/new" element={<EditoreNewWorldScreen />} />
                <Route path="/editor/load" element={<EditoreLoadWorldScreen />} />
                <Route path="/editor/:id" element={<EditorScreen />} />
            </Routes>
        </BrowserRouter>
    );

  /*if (activeGameId) {
    return (<GameScreen></GameScreen>);
  } else if (activeEditorId) {

  }

  if (!activeGameId) {
      return (<TitleScreen></TitleScreen>);
  }*/
}
