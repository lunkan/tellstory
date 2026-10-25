import { QuadNode } from './quad-node';

/** Cost hook for a cell. Elevation for now, later also water, urban areas, ... Missing data counts as flat. */
export function getCellCost(cell: QuadNode | undefined): number {
    return cell?.getTile()?.terrain.find((terrain) => terrain.type === 'elevation')?.value ?? 0;
}
