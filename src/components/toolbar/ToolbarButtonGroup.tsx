import styles from './Toolbar.module.css';

interface ToolbarButtonGroupProps {
    children: React.ReactNode;
}

export function ToolbarButtonGroup({ children }: ToolbarButtonGroupProps) {
    return (
        <div className={styles.group}>{children}</div>
    );
};