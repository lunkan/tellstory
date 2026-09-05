import { TableTHeadCellData } from "./types";

import styles from './Table.module.css';

interface TableHeadCellProps {
    data: TableTHeadCellData;
}

export function TableHeadCell({ data }: TableHeadCellProps) {
    return (
        <td className={styles.headCell} title={data.text}>
            {data.text}
        </td>
    );
};