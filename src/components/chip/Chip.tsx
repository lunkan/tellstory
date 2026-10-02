import type { CSSProperties, ReactNode } from "react";
import styles from './Chip.module.css';

type ChipProps = {
    text: string;
    color?: string;
    size?: 'large' | 'medium' | 'small';
    leading?: ReactNode;
    active?: boolean;
    onClear?: () => void;
    onClick?: () => void;
};

export function Chip({
    text,
    color = "#e5e7eb",
    size = 'medium',
    leading,
    active,
    onClear,
    onClick,
}: ChipProps) {

    const style: CSSProperties = {
        backgroundColor: color,
        fontSize: size === 'small' ? '12px' : '14px',
        paddingTop: size === 'small' ? '3px' : '4px',
        paddingBottom: size === 'small' ? '3px' : '4px',
        border: active ? 'solid 1px #ff0000' : '0px',
    };

    return (
        <span className={styles.chip} style={style} onClick={onClick}>
            {leading && (
                <span>
                    {leading}
                </span>
            )}
            <span>{text}</span>
            {onClear && (
                <button type="button" className={styles.clearBtn} onClick={onClear}>
                    <span>×</span>
                </button>
            )}
        </span>
    );
}