import type { CSSProperties, InputHTMLAttributes } from "react";

import styles from './Input.module.css';

type InputSize = 'large' | 'medium' | 'small' | 'xSmall'

type InputSizeStyle = {
    padding: string;
};

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> & {
    label?: string;
    size?: InputSize;
};

export function Input({ label, size, className, ...props }: InputProps) {
    const style: CSSProperties = {
        ...getStyleBySize(size || 'medium'),
    };

    return (
        <div className={className}>
            <label>
                {label && <span>{label}</span>}
                <input className={styles.input} style={style} {...props} />
            </label>
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