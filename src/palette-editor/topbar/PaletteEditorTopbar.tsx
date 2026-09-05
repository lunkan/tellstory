import { useNavigate } from "react-router-dom";

import styles from './PaletteEditorTopbar.module.css';
import { usePaletteEditorStore } from "../../store/paletteEditorStore";
import { useState } from "react";
import { PaletteEditorTopbarImportModal } from "./import-modal/PalettEditorTopbarImportModal";

export function PaletteEditorTopbar() {
    const paletteName = usePaletteEditorStore((state) => state.data?.name || 'Untitled');
    const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
    const navigate = useNavigate();

    function handleQuit(): void {
        navigate(`/`);
    }

    function handleLoad(): void {
        navigate(`/palette/load`);
    }

    function handleSave(): void {
        usePaletteEditorStore.getState().save();
    }

    function handleImport(): void {
        setIsImportModalOpen(true);
    }

    function handleExport(): void {
        usePaletteEditorStore.getState().save();
    }

    return (
        <>
            <div className={styles.topbar}>
                <div className={styles.group}>
                    <button className={styles.btn} onClick={() => handleSave()}>Save...</button>
                    <button className={styles.btn} onClick={() => handleLoad()}>Load...</button>
                    <button className={styles.btn} onClick={() => handleQuit()}>Quit...</button>
                </div>
                <div className={styles.group}>
                    <button className={styles.btn} onClick={() => handleImport()}>Import</button>
                    <button className={styles.btn} onClick={() => handleExport()}>Export</button>
                </div>
                <div className={styles.group}>
                    <div className={styles.label}>{paletteName}</div>
                </div>
                <div className={styles.group}></div>
            </div>
            <PaletteEditorTopbarImportModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)}></PaletteEditorTopbarImportModal>
        </>
    );
}