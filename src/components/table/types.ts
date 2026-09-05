export type TableTHeadData = TableTHeadCellData[];
export type TableTBodyData = TableTBodyRowData[];

export type ColgroupData = {
    width: string;
}

export type TableTHeadCellData = {
    text: string;
}

export type TableTBodyRowData = {
    id: number,
    cells: TableTBodyCellData[];
}

export type TableTBodyCellData = {
    text: any;
}