import React, { useEffect, useRef } from 'react';
import styles from './Modal.module.css';
import { Button } from '../button/Button';

interface ModalProps {
    isOpen: boolean;
    heading: string;
    children: React.ReactNode;
    onClose: () => void;
}

export function Modal({ isOpen, heading, children, onClose }: ModalProps) {
    const dialogRef = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;

        if (isOpen) {
            dialog.showModal();
        } else {
            dialog.close();
        }
    }, [isOpen]);

    // Sync native "Escape" key closes back to React state
    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;

        const handleCancel = (e: Event) => {
            e.preventDefault(); // Prevent native close to let React handle state
            onClose();
        };

        dialog.addEventListener("cancel", handleCancel);
        return () => dialog.removeEventListener("cancel", handleCancel);
    }, [onClose]);

    return (
        <dialog ref={dialogRef} className={styles.modal}>
            <div className={styles.head}>
                <h2 className={styles.heading}>{heading}</h2>
                <Button onClick={onClose} text="&times;"></Button>
            </div>
            <div className={styles.body}>{children}</div>
        </dialog>
    );
};