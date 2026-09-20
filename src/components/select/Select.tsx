import type { SelectHTMLAttributes } from "react";

import styles from './Select.module.css';

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
    label?: string;
};

export function Select({ label, children, ...props }: SelectProps) {
    return (
        <label>
            {label && <div>{label}</div>}

            <select className={styles.select} {...props}>
                {children}
            </select>
        </label>
    );
}