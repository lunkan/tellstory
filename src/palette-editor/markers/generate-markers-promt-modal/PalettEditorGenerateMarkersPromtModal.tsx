import { MarkerConfigData } from '../../../../engine/config/type';
import { Button } from '../../../components/button/Button';
import { Loader } from '../../../components/loader/Loader';
import { Modal } from '../../../components/modal/Modal';
import { usePaletteEditorStore } from '../../../store/paletteEditorStore';
import styles from './PalettEditorGenerateMarkersPromtModal.module.css';
import { FormEvent, useState } from "react";

interface PalettEditorGenerateMarkersPromtModalProps {
    isOpen: boolean;
    marker?: MarkerConfigData;
    onClose: (markers?: MarkerConfigData[]) => void;
}

export function PalettEditorGenerateMarkersPromtModal({ isOpen, onClose }: PalettEditorGenerateMarkersPromtModalProps) {
    const paletteData = usePaletteEditorStore((state) => state.data);
    const [isBusy, setIsBusy] = useState(false);
    const [promt, setPromt] = useState<string>('');

    async function handlePromtSubmit(e: FormEvent) {
        e.preventDefault();
        setIsBusy(true);

        const formData = new FormData(e.target as HTMLFormElement);
        const promt = formData.get('promt')?.toString();

        try {
            console.log('CALL CHATGPT', promt);
            const response = await fetch("/api/palette/generate-markers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: paletteData?.id, prompt: promt }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error ?? `Generate request failed (${response.status})`);
            }

            // Log the generated response text to the console
            console.log("AI Response:", data.markers);
            setIsBusy(false);
            onClose(data.markers);

            //return data.text;

        } catch (error) {
            console.error("Error communicating with OpenAI:", error);
            setIsBusy(false);
            //onClose();
        }


    };

    function renderBusy() {
        return (
            <Loader text="Contemplating..."></Loader>
        );
    }

    function renderForm() {
        return (
            <form onSubmit={handlePromtSubmit} className={styles.form}>
                <div className={styles.option}>

                    <label className={styles.wrapper}>
                        <div>Promt</div>
                        <textarea rows={5} name="promt" value={promt} onChange={(e) => setPromt(e.target.value)} />
                    </label>
                </div>
                <div className={styles.btnGroup}>
                    <Button type="submit" text="Send promt" isDisabled={!promt}></Button>
                </div>
            </form>
        );
    }

    return (
        <Modal heading="Generate markers" isOpen={isOpen} onClose={() => onClose()}>
            {isBusy ? renderBusy() : renderForm()}
        </Modal>
    );
}