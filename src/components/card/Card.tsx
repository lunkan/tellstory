import styles from './Card.module.css';

interface CardProps {
    heading: string;
    children: React.ReactNode;
}

export function Card({ heading, children }: CardProps) {
    return (
        <div className={styles.card}>
            <div className={styles.head}>
                <h2 className={styles.heading}>{heading}</h2>
            </div>
            <div className={styles.body}>{children}</div>
        </div>
    );
};