import { MarkerConfigData } from '../../../../engine/config/type';
import { Button } from '../../../components/button/Button';
import { Modal } from '../../../components/modal/Modal';
import { usePaletteEditorStore } from '../../../store/paletteEditorStore';
import styles from './PalettEditorMarkerTagModal.module.css';
import { FormEvent } from "react";

interface PaletteEditorMarkerTagModalProps {
    isOpen: boolean;
    marker?: MarkerConfigData;
    onClose: (selectedTags?: string[]) => void;
}

export function PaletteEditorMarkerTagModal({ isOpen, marker, onClose }: PaletteEditorMarkerTagModalProps) {
    const paletteData = usePaletteEditorStore((state) => state.data);

    async function handleSelectTagsSubmit(e: FormEvent) {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        const selectedTags = formData.getAll('tag').map((tag) => tag.toString());
        onClose(selectedTags);
    };

    const tagNames = paletteData?.tiles.map((tile) => tile.name);

    return (
        <Modal heading="Add marker tags" isOpen={isOpen && !!marker} onClose={() => onClose()}>
            {isOpen && marker &&
                <form onSubmit={handleSelectTagsSubmit} className={styles.form}>
                    {tagNames?.map((tagName) =>
                        <div key={tagName} className={styles.option}>
                            <label className={styles.wrapper}>
                                <input type="checkbox" name="tag" value={tagName} defaultChecked={marker.tags?.includes(tagName) || false} />
                                {tagName}
                            </label>
                        </div>
                    )}
                    <div className={styles.btnGroup}>
                        <Button type="submit" text="Update tags"></Button>
                    </div>
                </form>
            }
        </Modal>
    );
}