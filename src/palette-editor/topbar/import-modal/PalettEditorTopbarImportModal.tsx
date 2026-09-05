import { Button } from '../../../components/button/Button';
import { Modal } from '../../../components/modal/Modal';
import { usePaletteEditorStore } from '../../../store/paletteEditorStore';
import styles from './PalettEditorTopbarImportModal.module.css';
//import { usePaletteEditorStore } from "../../store/paletteEditorStore";
import { ChangeEvent, FormEvent, useState } from "react";

interface PaletteEditorTopbarImportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function PaletteEditorTopbarImportModal({ isOpen, onClose }: PaletteEditorTopbarImportModalProps) {
    const loadingPalette = usePaletteEditorStore((state) => state.loading);
    const paletteData = usePaletteEditorStore((state) => state.data);
    const importPalette = usePaletteEditorStore((state) => state.import);

    //const paletteName = usePaletteEditorStore((state) => state.data?.name || 'Untitled');
    const [selectedImportFile, setSelectedImportFile] = useState<File | null>(null);

    function handleImportFileChange(event: ChangeEvent<HTMLInputElement>) {
        if (event.target.files && event.target.files.length > 0) {
            setSelectedImportFile(event.target.files[0]);
        }
    };

    async function handleImportFileSubmit(e: FormEvent) {
        e.preventDefault();
        if (!selectedImportFile) return;

        // Use FormData to prepare binary files for standard API transfer
        /*const formData = new FormData();
        formData.append("file", selectedImportFile);

        const rawJsonString = formData.get("userMetadata");
        if (rawJsonString && typeof rawJsonString === "string") {
            
        }*/

        if (selectedImportFile.type !== "application/json" && !selectedImportFile.name.endsWith(".json")) {
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
        }
    };

    return (
        <Modal heading="Import" isOpen={isOpen} onClose={onClose}>
            <p>{loadingPalette ? 'Loading' : 'Not loading'}</p>
            <p>{paletteData ? 'Defined' : 'undefined'}</p>
            <p className={styles.text}>Import ... supports ....</p>
            <form onSubmit={handleImportFileSubmit} className={styles.form}>
                <input
                    id="file-upload-input"
                    type="file"
                    accept=".json"
                    className={styles.form}
                    onChange={handleImportFileChange}
                />
                <Button type="submit" isDisabled={!selectedImportFile} text="Import"></Button>
            </form>
        </Modal>
    );
}