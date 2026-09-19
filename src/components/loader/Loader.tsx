import { CSSProperties } from 'react';
import styles from './Loader.module.css';

type LoaderSize = 'large' | 'medium' | 'small' | 'xSmall'

type LoaderSizeStyle = {
    height: string;
    width: string;
};

interface LoaderProps {
    size?: LoaderSize;
    text?: string;
}

export function Loader({ size, text }: LoaderProps) {
    const style: CSSProperties = {
        ...getStyleBySize(size || 'medium'),
    };

    return (
        <div className={styles.wrapper}>
            <div style={style} className={styles.spinner} />
            {text && <p className={styles.text}>{text}</p>}
        </div>
    );
};

function getStyleBySize(size: LoaderSize): LoaderSizeStyle {
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