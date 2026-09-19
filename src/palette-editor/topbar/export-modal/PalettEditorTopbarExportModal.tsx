import { Button } from '../../../components/button/Button';
import { Modal } from '../../../components/modal/Modal';
import { usePaletteEditorStore } from '../../../store/paletteEditorStore';
import { downloadJsonFile } from './download-json';
import styles from './PalettEditorTopbarExportModal.module.css';
//import { usePaletteEditorStore } from "../../store/paletteEditorStore";
import { FormEvent, useEffect, useState } from "react";

interface PaletteEditorTopbarExportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function PaletteEditorTopbarExportModal({ isOpen, onClose }: PaletteEditorTopbarExportModalProps) {
    const loadingPalette = usePaletteEditorStore((state) => state.loading);
    const paletteData = usePaletteEditorStore((state) => state.data);
    const [exportFileName, setExportFileName] = useState<string>('');

    useEffect(() => {
        if (paletteData) {
            const versionSuffix = paletteData?.version.replaceAll('.', '-');
            const defaultName = `${paletteData?.name}-${versionSuffix}.json`;
            setExportFileName(defaultName);
        }
    }, [paletteData]);

    async function handleExportFileSubmit(e: FormEvent) {
        e.preventDefault();
        if (!exportFileName) return;

        // Must be valid fileName

        if (!exportFileName.endsWith('.json')) {
            console.error('Invalid extension. Must be .json');
            return;
        }


        console.log('EXPORT:::', paletteData);
        downloadJsonFile(paletteData, exportFileName);
        onClose();


        // Use FormData to prepare binary files for standard API transfer
        /*const formData = new FormData();
        formData.append("file", selectedImportFile);

        const rawJsonString = formData.get("userMetadata");
        if (rawJsonString && typeof rawJsonString === "string") {
            
        }*/

        /*if (selectedImportFile.type !== "application/json" && !selectedImportFile.name.endsWith(".json")) {
            alert("Please upload a valid .json file!");
            return;
        }

        try {
            const fileTextContent = await selectedImportFile.text();
            const parsedFile = JSON.parse(fileTextContent);

            console.log("Uploading file:", parsedFile);
            importPalette(parsedFile);
            console.log('DONE');
            // Example network request:
            // await fetch('/api/upload', { method: 'POST', body: formData });

            onClose();

        } catch (error) {
            console.error("Upload failed", error);
        }*/
    };

    function renderBusy() {
        return (<p>Busy loading</p>);
    }

    function renderForm() {
        return (<form onSubmit={handleExportFileSubmit} className={styles.form}>
            <input
                id="file-download-name-input"
                className={styles.form}
                value={exportFileName}
                onChange={(e) => setExportFileName(e.target.value)}
            />
            <Button type="submit" isDisabled={!exportFileName} text="Export"></Button>
        </form>);
    }

    return (
        <Modal heading="Export" isOpen={isOpen} onClose={onClose}>
            {loadingPalette ? renderBusy() : renderForm()}
        </Modal>
    );
}