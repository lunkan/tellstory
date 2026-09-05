import { TableTBodyCellData } from "./types";

import styles from './Table.module.css';

interface TableBodyCellProps {
    data: TableTBodyCellData;
}

export function TableBodyCell({ data }: TableBodyCellProps) {
    return (
        <td className={styles.bodyCell}>
            {data.text}
        </td>
    );
};