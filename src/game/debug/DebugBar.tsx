import { useState } from "react";
import debugIcon from "../../assets/icons/debug.svg";
import { useSceneStore } from "../../store/sceneStore";

export function DebugBar() {
    const currentPosition = useSceneStore((state) => state.currentPosition);
    const [toggleDebug, setToggleDebug] = useState(false);

    function renderPositionLabel() {
        if (!toggleDebug) {
            return;
        }

        return (
            <div className="debug-bar--position-label">
                <div>X {currentPosition?.x} &nbsp;Y {currentPosition?.y} &nbsp;Z {currentPosition?.z}</div>
            </div>
        );
    }

    return (
        <div className="debug-bar">
            {renderPositionLabel()}
            <div>
                <button className="debug-btn" onClick={() => setToggleDebug(!toggleDebug)}>
                    <img src={debugIcon} />
                </button>
            </div>
        </div>
    );
}