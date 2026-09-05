import type { InputHTMLAttributes } from "react";

import styles from './Input.module.css';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
    label?: string;
};

export function Input({ label, ...props }: InputProps) {
    return (
        <label>
            {label && <span>{label}</span>}
            <input className={styles.input} {...props} />
        </label>
    );
}