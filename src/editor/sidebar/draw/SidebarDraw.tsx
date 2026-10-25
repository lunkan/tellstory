import { useState } from "react";
import { TileTab } from "./TileTab";
import { MarkerTab } from "./MarkerTab";
import { VectorTab } from "./VectorTab";

export function SidebarDraw() {
    const [activeTab, setActiveTab] = useState<'tile' | 'vector' | 'marker'>('tile');

    const renderTab = () => {
        switch (activeTab) {
            case 'tile':
                return <TileTab></TileTab>;
            case 'vector':
                return <VectorTab></VectorTab>;
            case 'marker':
                return <MarkerTab></MarkerTab>;
        }
    };

    return (
        <div className="sidebar">
            <div className="sidebar-tab-container">
                <div className="sidebar-tab-bar">
                    <button className="sidebar-tab" onClick={() => setActiveTab('tile')}>TILE</button>
                    <button className="sidebar-tab" onClick={() => setActiveTab('vector')}>VECTOR</button>
                    <button className="sidebar-tab" onClick={() => setActiveTab('marker')}>MARKER</button>
                </div>
                {renderTab()}
            </div>
        </div>
    );
}