import styles from './PaletteEditorTabBar.module.css';

export type PaletteEditorSelectedTab = 'tiles' | 'markers' | 'vectors';

interface PaletteEditorTabBarProps {
    onSelectTab: (selectedTab: PaletteEditorSelectedTab) => void;
    selectedTab: PaletteEditorSelectedTab;
}

export function PaletteEditorTabBar({ selectedTab, onSelectTab }: PaletteEditorTabBarProps) {
    return (
        <div className={styles.tabBar}>
            <button className={selectedTab === 'tiles' ? styles.selectedTab : styles.tab} onClick={() => onSelectTab('tiles')}>Tiles</button>
            <button className={selectedTab === 'vectors' ? styles.selectedTab : styles.tab} onClick={() => onSelectTab('vectors')}>Vectors</button>
            <button className={selectedTab === 'markers' ? styles.selectedTab : styles.tab} onClick={() => onSelectTab('markers')}>Markers</button>
        </div>
    );
}