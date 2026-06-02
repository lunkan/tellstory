import { QuadNodeBoundsData, QuadNodes2DPoint, QuadNodes2DRect } from "../../storyteller/types";
import { QuadNodeKey } from "./quad-node-key";

const QUAD_TREE_ROOT_SIZE: number = Math.pow(2, QuadNodeKey.MAX_DEPTH);

export class QuadNodeBounds {
    public static fromKey(key: QuadNodeKey): QuadNodeBounds {
        let x = 0;
        let y = 0;
        let size = QUAD_TREE_ROOT_SIZE;

        for (let i = key.depth - 1; i >= 0; i--) {
            size /= 2;

            const q = Number((key.hash >> BigInt(i * 2)) & 0b11n);
            const qx = (q >> 1) & 1;
            const qy = q & 1;

            x += qx * size;
            y += qy * size;
        }

        return new QuadNodeBounds(x, y, size);
    }

    public readonly x: number = 0;
    public readonly y: number = 0;
    public readonly size: number = 0;

    public get left() {
        return this.x;
    }

    public get right() {
        return this.x + this.size;
    }

    public get top() {
        return this.y;
    }

    public get bottom() {
        return this.y + this.size;
    }

    constructor(x: number, y: number, size: number) {
        this.x = x;
        this.y = y;
        this.size = size;
    }

    public contains2DPoint(point: QuadNodes2DPoint): boolean {
        return this.left <= point.x && this.right > point.x && this.top <= point.y && this.bottom > point.y;
    }

    public intersects2DRect(rect: QuadNodes2DRect): boolean {
        return (
            this.x < rect.x + rect.width &&
            this.x + this.size > rect.x &&
            this.y < rect.y + rect.height &&
            this.y + this.size > rect.y
        );
    }

    public toString(): string {
        return `{x:${this.x}, y:${this.y}, size:${this.size}}`;
    }

    public getJSON(): QuadNodeBoundsData {
        return {
            x: this.x,
            y: this.y,
            size: this.size,
        };
    }
}