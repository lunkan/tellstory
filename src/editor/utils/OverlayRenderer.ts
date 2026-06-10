type OverlayLine = {
    id: string;
    p1: DOMPoint;
    p2: DOMPoint;
    color: string;
    dash: number[];
};

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

    public setLine(lineId: string, p1: DOMPoint, p2: DOMPoint, color: string, dash: number[]): void {
        const line = this._lines.find((line) => line.id === lineId);
        if (line) {
            line.p1 = p1;
            line.p2 = p2;
            line.color = color;
            line.dash = dash;
        } else {
            this._lines.push({
                id: lineId,
                p1,
                p2,
                color,
                dash,
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
            ctx.strokeStyle = line.color;
            ctx.lineWidth = 2;
            ctx.setLineDash(line.dash);
            ctx.beginPath();
            ctx.moveTo(line.p1.x, line.p1.y);
            ctx.lineTo(line.p2.x, line.p2.y);
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