import { QuadNodeDelta, QuadNodePoint } from "../../storyteller/types";
import { WorldGenerator } from "../world-generator/world-generator";
import { QuadNode } from "./quad-node";
import { QuadNodeKey } from "./quad-node-key";

export class World {
    private _quadtree: QuadNode;
    private _worldGen: WorldGenerator;

    constructor() {
        const rootKey = new QuadNodeKey(0n, 0);
        this._quadtree = new QuadNode(rootKey);
        this._worldGen = new WorldGenerator;
    }

    /*public getNormalizedRelativePosition(keyA: QuadNodeKey, keyB: QuadNodeKey): QuadNodePoint | undefined {
        const nodeA = this._quadtree.findByKey(keyA);
        const nodeB = this._quadtree.findByKey(keyB);

        if (!nodeA || !nodeB) {
            return;
        }

        const z = this._compare(nodeA.depth, nodeB.depth);
        if (z > 0) {
            return { x: 0, y: 0, z };
        }

        return {
            x: this._compare(nodeA.depth, nodeB.depth),
            y: this._compare(nodeA.depth, nodeB.depth),
            z,
        };
    }*/

    public findNodeBykey(key: QuadNodeKey): QuadNode | undefined {
        return this._quadtree.findByKey(key);
    }

    public findNodeByPoint(point: QuadNodePoint): QuadNode | undefined {
        return this._quadtree.findByPoint(point, true);
    }

    public findNeighbourNode(key: QuadNodeKey, deltaX: QuadNodeDelta, deltaY: QuadNodeDelta): QuadNode | undefined {
        const refNode = this._quadtree.findByKey(key);
        if (!refNode) {
            return;
        }

        const x = refNode.bounds.x + deltaX * refNode.bounds.size;
        const y = refNode.bounds.y + deltaY * refNode.bounds.size;

        const neighbourNode = this._quadtree.findByPoint({ x, y, z: refNode.depth}, true);
        return this._hydrate(neighbourNode);
    }

    public findAdjacentNodes(key: QuadNodeKey): QuadNode[] {
        const node = this._quadtree.findByKey(key);
        if (!node) {
            return [];
        }

        const size = node.bounds.size;
        const x = node.bounds.x - size;
        const y = node.bounds.y - size;

        return this._quadtree
            .findByRect({x, y, z: node.depth, width: size * 3, height: size * 3 }, true)
            .filter((adjacentNode) => adjacentNode !== node)
            .map((adjacentNode) => this._hydrate(adjacentNode)!);
    }

    public findQuadrantNodes(key: QuadNodeKey): QuadNode[] {
        const node = this._quadtree.findByKey(key);
        if (!node) {
            return [];
        }

        const quadrantNodes = node.getQuadrants(true);
        return quadrantNodes.map((quadrantNode) => this._hydrate(quadrantNode)!);
    }

    public findQuadrantNode(key: QuadNodeKey, x: 1 | 0, y: 1 | 0): QuadNode | undefined {
        const node = this._quadtree.findByKey(key);
        if (!node) {
            return;
        }

        const quadrantNode = node.getQuadrantAt(x, y, true);
        return this._hydrate(quadrantNode);
    }

    public findParentNode(key: QuadNodeKey): QuadNode | undefined {
        const parentKey = key.createParentKey();
        const parentNode = this._quadtree.findByKey(parentKey);
        return this._hydrate(parentNode);
    }

    private _hydrate(node: QuadNode | undefined): QuadNode | undefined {
        if (!node) {
            return;
        } else if (node.tile) {
            return node;
        }

        node.tile = this._worldGen.generateTile(node.key);
        return node;
    }

    private _compare(a: number, b: number) {
        if (a > b) return 1;
        if (a < b) return -1;
        return 0;
    }
}
