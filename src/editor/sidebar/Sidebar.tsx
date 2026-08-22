import { useState } from "react";
import { TileTab } from "./TileTab";
import { MarkerTab } from "./MarkerTab";

export function Sidebar() {
    const [activeTab, setActiveTab] = useState<'tile' | 'marker'>('tile');

    return (
        <div className="sidebar">
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