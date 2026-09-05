import { TableBodyCell } from './TableBodyCell';
import { TableHeadCell } from './TableHeadCell';

import styles from './Table.module.css';
import { ColgroupData, TableTBodyData, TableTHeadData } from './types';

interface TableProps {
    colgroupData?: ColgroupData[];
    theadData: TableTHeadData;
    tbodyData: TableTBodyData;
}

export function Table({ theadData, tbodyData, colgroupData }: TableProps) {
    return (
        <table className={styles.table}>
            {colgroupData ?
                <colgroup>
                    {colgroupData.map((colData, i) => {
                        return <col key={i} width={colData.width}></col>;
                    })}
                </colgroup>
                : null}
            <thead>
                <tr>
                    {theadData.map((headerCellData, i) => {
                        return <TableHeadCell key={i} data={headerCellData} />;
                    })}
                </tr>
            </thead>
            <tbody>
                {tbodyData.map((row) => {
                    return <tr key={row.id} >
                        {row.cells.map((cell, i) => {
                            return <TableBodyCell key={i} data={cell} />;
                        })}
                    </tr>
                })}
            </tbody>
        </table>
    );
};