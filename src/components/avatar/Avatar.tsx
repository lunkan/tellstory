import { CSSProperties } from 'react';
import styles from './Avatar.module.css';

type AvatarSize = 'large' | 'medium' | 'small' | 'xSmall'

type AvatarSizeStyle = {
    height: string;
    width: string;
};

interface AvatarProps {
    bgColor: string;
    size?: AvatarSize;
}

export function Avatar({ bgColor, size }: AvatarProps) {
    const style: CSSProperties = {
        ...getStyleBySize(size || 'medium'),
        backgroundColor: bgColor || 'transparent',
    };

    return (
        <span style={style} className={styles.canvas}></span>
    );
};

function getStyleBySize(size: AvatarSize): AvatarSizeStyle {
    switch (size) {
        case 'large':
        case 'medium':
            return {
                height: '32px',
                width: '32px',
            };
        case 'small':
            return {
                height: '24px',
                width: '24px',
            };
        case 'xSmall':
            return {
                height: '14px',
                width: '14px',
            };
    }
}