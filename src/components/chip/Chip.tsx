import type { CSSProperties } from "react";
import styles from './Chip.module.css';

type ChipProps = {
    text: string;
    color?: string;
    size?: 'large' | 'medium' | 'small';
    onClear?: () => void;
};

export function Chip({
    text,
    color = "#e5e7eb",
    size = 'medium',
    onClear,
}: ChipProps) {

    const style: CSSProperties = {
        backgroundColor: color,
        fontSize: size === 'small' ? '12px' : '14px',
        paddingTop: size === 'small' ? '3px' : '4px',
        paddingBottom: size === 'small' ? '3px' : '4px',
    };

    return (
        <span className={styles.chip} style={style}>
            <span>{text}</span>
            {onClear && (
                <button type="button" className={styles.clearBtn} onClick={onClear}>
                    <span>×</span>
                </button>
            )}
        </span>
    );
}