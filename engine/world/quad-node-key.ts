
type QuadNodeChildIndex = 0 | 1 | 2 | 3;

export class QuadNodeKey {
    public static readonly QUADRANT_BIT_Length: number = 2;
    public static readonly MAX_DEPTH: number = 10;

    public static get HASH_BIT_SIZE() {
        return QuadNodeKey.MAX_DEPTH * QuadNodeKey.QUADRANT_BIT_Length;
    }

    public static extendHash(hash: bigint, quadrant: QuadNodeChildIndex): bigint {
        return (hash << 2n) | BigInt(quadrant);
    }

    public static fromId(nodeId: string): QuadNodeKey {
        const hashBits = nodeId.slice(0, QuadNodeKey.HASH_BIT_SIZE);
        const depthBits = nodeId.slice(QuadNodeKey.HASH_BIT_SIZE);
        return new QuadNodeKey(BigInt("0b" + hashBits), parseInt(depthBits, 2));
    }

    public static getHashFromPath(path: QuadNodeChildIndex[]): bigint {
        if (!path.length) {
            return 0n;
        }

        return path.reduce((hash, quadrantBit: QuadNodeChildIndex) => QuadNodeKey.extendHash(hash, quadrantBit), 0n);
    }

    public readonly hash: bigint;
    public readonly depth: number;

    public get id(): string {
        const hashString = this.hash.toString(2).padStart(QuadNodeKey.HASH_BIT_SIZE, '0');
        const depthString = this.depth.toString(2).padStart(QuadNodeKey.MAX_DEPTH.toString(2).length, '0');
        return hashString + depthString;
    }

    constructor(hash: bigint, depth: number) {
        this.hash = hash;
        this.depth = depth;
    }

    public getPath(): QuadNodeChildIndex[] {
        const result: QuadNodeChildIndex[] = [];
        for (let i = this.depth - 1; i >= 0; i--) {
            const shift = BigInt(i * 2);
            const quadrant = Number((this.hash >> shift) & 0b11n);
            result.push(quadrant as QuadNodeChildIndex);
        }

        return result;
    }

    public createParentKey(): QuadNodeKey {
        const parentHash = this.hash >> 2n;
        return new QuadNodeKey(parentHash, this.depth - 1);
    }

    public createChildKey(quadrant: QuadNodeChildIndex): QuadNodeKey {
        const childHash = (this.hash << 2n) | BigInt(quadrant);
        return new QuadNodeKey(childHash, this.depth + 1);
    }

    public isMatch(key: QuadNodeKey): boolean {
        return key.depth === this.depth && this.hash === key.hash;
    }

    public isDescendant(key: QuadNodeKey): boolean {
        if (key.depth < this.depth) {
            return false;
        }

        const shift = BigInt((key.depth - this.depth) * QuadNodeKey.QUADRANT_BIT_Length);
        const normChildHash = key.hash >> shift;
        return normChildHash === this.hash;
    }

    public toString() {
        const hashString = this.hash.toString(2).padStart(QuadNodeKey.HASH_BIT_SIZE, '0');
        return hashString + '@' + this.depth;
    }
}