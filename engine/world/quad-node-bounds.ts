import { QuadNodeBoundsData, QuadNodes2DPoint, QuadNodes2DRect } from "../types";

export class QuadNodeBounds {
    /**
     * A leaf tile is always 1 unit, so a world capped at `maxDepth` spans
     * 2^maxDepth units. This is the only place the root extent is decided -
     * every other node derives its bounds from its parent.
     */
    public static createRoot(maxDepth: number): QuadNodeBounds {
        return new QuadNodeBounds(0, 0, Math.pow(2, maxDepth));
    }

    public static createChild(parent: QuadNodeBounds, quadrant: number): QuadNodeBounds {
        const size = parent.size / 2;
        const qx = (quadrant >> 1) & 1;
        const qy = quadrant & 1;

        return new QuadNodeBounds(parent.x + qx * size, parent.y + qy * size, size);
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