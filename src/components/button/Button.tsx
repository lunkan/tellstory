import { CSSProperties } from 'react';
import styles from './Button.module.css';

type ButtonSize = 'large' | 'medium' | 'small' | 'xSmall'

type ButtonSizeStyle = {
    paddingBlock: string;
    paddingInline: string;
    height: string;
    minWidth: string;
};

interface ButtonProps {
    text: string;
    type?: "button" | "submit" | "reset";
    resizeMode?: "hug" | "fill";
    isDisabled?: boolean;
    size?: ButtonSize;
    onClick?: () => void;
}

export function Button({ text, type, isDisabled, size, resizeMode, onClick }: ButtonProps) {
    const style: CSSProperties = {
        ...getStyleBySize(size || 'medium'),
        width: resizeMode === 'fill' ? '100%' : 'auto',
    };

    return (
        <button type={type ? type : "button"} style={style} disabled={isDisabled} onClick={onClick} className={styles.button}>{text}</button>
    );
};

function getStyleBySize(size: ButtonSize): ButtonSizeStyle {
    switch (size) {
        case 'large':
        case 'medium':
            return {
                paddingBlock: '16px',
                paddingInline: '24px',
                height: '40px',
                minWidth: '40px',
            };
        case 'small':
            return {
                paddingBlock: '8px',
                paddingInline: '16px',
                height: '32px',
                minWidth: '32px',
            };
        case 'xSmall':
            return {
                paddingBlock: '4px',
                paddingInline: '4px',
                height: '22px',
                minWidth: '22px',
            };
    }
}