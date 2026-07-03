import { useState } from "react";
import debugIcon from "../../assets/icons/debug.svg";
import { useSceneStore } from "../../store/sceneStore";
import { isSceneDescriptionMessage } from "../../../shared/src/message";

const DESCRIPTION_ORDER = ['intro', 'sceneTransition', 'scene', 'immidency', 'proximity'];
export const DESCRIPTION_ORDER_MAP = new Map(
    DESCRIPTION_ORDER.map((type, index) => [type, index])
);

export function DebugBar() {
    const currentPosition = useSceneStore((state) => state.currentPosition);
    const messages = useSceneStore((state) => state.messages);
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

    function renderMessages() {
        if (!toggleDebug) {
            return;
        }

        const descriptions = messages
            .filter((message) => isSceneDescriptionMessage(message))
            .sort((a, b) => {
                return (DESCRIPTION_ORDER_MAP.get(a.type) ?? Infinity) - (DESCRIPTION_ORDER_MAP.get(b.type) ?? Infinity);
            });

        return (
            <div className="debug-messages">
                {descriptions.map((description, i) => (
                    <div key={i} className="debug-message">
                        <div className="debug-message-bullet" style={{ backgroundColor: description.consumed ? '#029f78' : '#999' }}></div>
                        <div>{description.label}</div>
                    </div>
                ))}
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
            {renderMessages()}
        </div>
    );
}