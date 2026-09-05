import { useState } from 'react';
import styles from './PaletteEditorScreen.module.css';
import { PaletteEditorSelectedTab, PaletteEditorTabBar } from './tab-bar/PaletteEditorTabBar';
import { PaletteEditorTiles } from './tiles/PaletteEditorTiles';
import { PaletteEditorTopbar } from './topbar/PaletteEditorTopbar';
import { PaletteEditorMarkers } from './markers/PaletteEditorMarkers';
import { PaletteEditorVectors } from './vectors/PaletteEditorVectors';

export function PaletteEditorScreen() {
    const [selectedTab, setSelectedTab] = useState<PaletteEditorSelectedTab>('tiles');

    function handleSelectTab(selectedTab: PaletteEditorSelectedTab) {
        setSelectedTab(selectedTab);
    }

    return (
        <main className={styles.screen}>
            <PaletteEditorTopbar></PaletteEditorTopbar>
            <div className={styles.tabGroup}>
                <PaletteEditorTabBar selectedTab={selectedTab} onSelectTab={handleSelectTab}></PaletteEditorTabBar>
                <div className={styles.tabPanel}>
                    {(() => {
                        switch (selectedTab) {
                            case 'tiles':
                                return <PaletteEditorTiles></PaletteEditorTiles>;
                            case 'vectors':
                                return <PaletteEditorVectors></PaletteEditorVectors>;
                            case 'markers':
                                return <PaletteEditorMarkers></PaletteEditorMarkers>;
                            default:
                                return null;
                        }
                    })()}
                </div>
            </div>
        </main>
    );
}