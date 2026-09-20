import type { CSSProperties, InputHTMLAttributes } from "react";

import styles from './Input.module.css';

type InputSize = 'large' | 'medium' | 'small' | 'xSmall'

type InputSizeStyle = {
    padding: string;
};

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> & {
    label?: string;
    hint?: string;
    size?: InputSize;
};

export function Input({ label, hint, size, className, ...props }: InputProps) {
    const style: CSSProperties = {
        ...getStyleBySize(size || 'medium'),
    };

    return (
        <div className={className}>
            <label>
                {label && <div>{label}</div>}
                <input className={styles.input} style={style} autoComplete="off" {...props} />
            </label>
            {hint && <div className={styles.hint}>{hint}</div>}
        </div>
    );
}

function getStyleBySize(size: InputSize): InputSizeStyle {
    switch (size) {
        case 'large':
        case 'medium':
            return {
                padding: '8px',
            };
        case 'small':
            return {
                padding: '4px',
            };
        case 'xSmall':
            return {
                padding: '2px',
            };
    }
}