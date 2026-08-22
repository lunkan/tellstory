/*import * as QTns from 'js-quadtree';
import type { QuadTree as QuadTreeType } from 'js-quadtree';
// js-quadtree exposes named exports under ESM (Vite) but only a CJS default
// export under Node/tsx. Normalize across both interop shapes.
const QT = ((QTns as any).default ?? QTns) as typeof QTns;
const { QuadTree, Box, Point } = QT;
import markersJSON from '../config/markers.json' with { type: 'json' };
import { QuadNodes2DPoint } from '../types';

export type Marker = {
    point: QuadNodes2DPoint;
    type: string;
    id: string;
};

export type MarkerConfigEntry = {
    name: string;
    tags: string[];
    zMin: number;
};

export class Markers {
    private _quadTree: QuadTreeType;
    private _size: number;

    constructor(size: number) {
        this._size = size;
        this._quadTree = new QuadTree(new Box(0, 0, size, size));
    }

    public addMarker(marker: Marker): void {
        this._quadTree.insert(new Point(marker.point.x, marker.point.y, marker));
    }

    public getMarkers(x: number, y: number, z: number, size: number): Marker[] {
        const points = this._quadTree.query(new Box(x, y, size, size));
        return points.map((point) => point.data).filter((marker) => {
            const markerConfig = markersJSON.markers.find((markerConfig) => markerConfig.name === marker.type);
            return z >= (markerConfig?.zMin || 0);
        });
    }

    public getAll(): Marker[] {
        const points = this._quadTree.query(new Box(0, 0, this._size, this._size));
        return points.map((point) => point.data);
    }
}*/