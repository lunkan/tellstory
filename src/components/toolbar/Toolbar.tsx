import styles from './Toolbar.module.css';

interface ToolbarProps {
    children: React.ReactNode;
}

export function Toolbar({ children }: ToolbarProps) {
    return (
        <div className={styles.toolbar}>{children}</div>
    );
};