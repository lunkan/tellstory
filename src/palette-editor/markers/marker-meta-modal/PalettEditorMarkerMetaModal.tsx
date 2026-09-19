import { MarkerConfigData, MarkerMetaConfig } from '../../../../engine/config/type';
import { Button } from '../../../components/button/Button';
import { Modal } from '../../../components/modal/Modal';
import styles from './PalettEditorMarkerMetaModal.module.css';
import { FormEvent, useEffect, useState } from "react";

interface PaletteEditorMarkerMetaModalProps {
    isOpen: boolean;
    marker?: MarkerConfigData;
    onClose: (metaTags?: MarkerMetaConfig) => void;
}

export function PaletteEditorMarkerMetaModal({ isOpen, marker, onClose }: PaletteEditorMarkerMetaModalProps) {
    const [color, setColor] = useState<string>('');

    useEffect(() => {
        setColor(marker?.meta?.color || '');
    }, [marker])

    async function handleSelectMetaTagsSubmit(e: FormEvent) {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        const metaTags = {
            color: formData.get('color')?.toString(),
        };

        //const selectedTags = formData.getAll('tag').map((tag) => tag.toString());
        onClose(metaTags);
    };

    return (
        <Modal heading="Add meta tags" isOpen={isOpen && !!marker} onClose={() => onClose()}>
            {isOpen && marker &&
                <form onSubmit={handleSelectMetaTagsSubmit} className={styles.form}>
                    <div className={styles.option}>
                        <label className={styles.wrapper}>
                            <input name="color" value={color} onChange={(e) => setColor(e.target.value)} />
                            <span>Color</span>
                        </label>
                    </div>
                    <div className={styles.btnGroup}>
                        <Button type="submit" text="Update meta tags"></Button>
                    </div>
                </form>
            }
        </Modal>
    );
}