import { useState } from "react";
import { TileTab } from "./TileTab";
import { MarkerTab } from "./MarkerTab";
import { useEditorStore } from "../../store/editorStore";

export function Sidebar() {
    const paintValue = useEditorStore((state) => state.paintValue);
    const [activeTab, setActiveTab] = useState<'tile' | 'marker'>('tile');

    function handleValueRangeChange(value: string): void {
        useEditorStore.getState().setPaintValue(parseFloat(value));
    }

    return (
        <div className="sidebar">
            <div className="sidebar-controls">
                <div className="sidebar-controls--label">
                    <span>Value</span>
                    <span>{paintValue}</span>
                </div>
                <input
                    className="sidebar-controls--range"
                    type="range"
                    min="-1"
                    max="1"
                    defaultValue="0"
                    step="0.05"
                    onChange={(e) => handleValueRangeChange(e.target.value)}
                />
            </div>

            <div className="sidebar-tab-container">
                <div className="sidebar-tab-bar">
                    <button className="sidebar-tab" onClick={() => setActiveTab('tile')}>TILE</button>
                    <button className="sidebar-tab" onClick={() => setActiveTab('marker')}>MARKER</button>
                </div>
                {activeTab === 'tile' ? (<TileTab></TileTab>) : (<MarkerTab></MarkerTab>)}
            </div>
        </div>
    );
}