type OverlayLine = {
    id: string;
    p1: DOMPoint;
    p2: DOMPoint;
    color: string;
    dash: number[];
    /** Draw the line itself. When false only the end dots are drawn. */
    showLine: boolean;
    /** Radius in view pixels of the circles at both ends. */
    radius: number;
};

const END_DOT_RADIUS = 5;

export class OverlayRenderer {
    public readonly overlay: HTMLCanvasElement;

    //private _transformMtx: DOMMatrix | undefined;
    private _refreshRequest: number | undefined;
    private _lines: OverlayLine[] = [];

    public get width(): number {
        return this.overlay.width;
    }

    public get height(): number {
        return this.overlay.height;
    }

    /*private get _ctx(): CanvasRenderingContext2D {
        const ctx = this.overlay.getContext('2d');
        if (!ctx) {
            throw Error('No CTX');
        }
        
        ctx.setTransform(this._transformMtx);
        return ctx;
    }*/

    constructor(overlay: HTMLCanvasElement) {
        this.overlay = overlay;
    }
    

    /*public setTransformMtx(transformMtx: DOMMatrix): void {
        this._transformMtx = transformMtx;
    }*/

    public setLine(lineId: string, p1: DOMPoint, p2: DOMPoint, color: string, dash: number[],     showLine: boolean = true, radius: number = 5): void {
        const line = this._lines.find((line) => line.id === lineId);
        if (line) {
                line.radius = radius;
            line.p1 = p1;
            line.p2 = p2;
            line.color = color;
            line.dash = dash;
            line.showLine = showLine;
        } else {
            this._lines.push({
                id: lineId,
                p1,
                p2,
                color,
                dash,
                showLine,
                radius,
            })
        }

        this._invalidate();
    }

    public clearLine(lineId: string): void {
        this._lines = this._lines.filter((line) => line.id !== lineId);
        this._invalidate();
    }

    public setViewport(width: number, height: number): void {
        this.overlay.width = width;
        this.overlay.height = height;
        this.clear();
    }

    public refresh(): void {
        this.clear();
    }

    public clear(): void {
        const ctx = this.overlay.getContext('2d');
        if (ctx) {
            ctx?.setTransform(1, 0, 0, 1, 0, 0);
            ctx?.clearRect(0, 0, this.width, this.height);
        }
    }

    private _draw(): void {
        this._drawLines();
    }

    private _drawLines(): void {
        const ctx = this.overlay.getContext('2d');
        if (!ctx) {
            return;
        }

        this._lines.forEach((line) => {
            const r = line.radius;
            ctx.strokeStyle = line.color;
            ctx.lineWidth = 2;
            ctx.setLineDash(line.dash);

            const dx = line.p2.x - line.p1.x;
            const dy = line.p2.y - line.p1.y;
            const dist = Math.hypot(dx, dy);
            // The line runs from the edge of the start circle to the end dot
            if (line.showLine && dist > r) {
                const ux = dx / dist;
                const uy = dy / dist;
                ctx.beginPath();
                ctx.moveTo(line.p1.x + ux * r, line.p1.y + uy * r);
                ctx.lineTo(line.p2.x, line.p2.y);
                ctx.stroke();
            }

            ctx.beginPath();
            ctx.arc(line.p1.x, line.p1.y, r, 0, Math.PI * 2);
            ctx.stroke();

            ctx.setLineDash([]);
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = '#ffffff';
            ctx.fillStyle = line.color;
            ctx.beginPath();
            ctx.arc(line.p2.x, line.p2.y, END_DOT_RADIUS, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        });
    }

    private _invalidate(): void {
        this.clear();

        if (this._refreshRequest) {
            cancelAnimationFrame(this._refreshRequest);
        }

        this._refreshRequest = requestAnimationFrame(() => {
            this._draw();
            this._refreshRequest = undefined;
        });
    } 
}