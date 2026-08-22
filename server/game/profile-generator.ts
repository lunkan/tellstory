import { QuadNode } from "../../engine/world/quad-node";
import { World } from "../../engine/world/world";
import { DIRECTION, DIRECTION_NAME, getDirectionFromAdjacentVector, getDirectionFromQuadrantVector } from "../../shared/src/direction";
//import tilesJSON from '../../engine/config/tiles.json' with { type: 'json' };
import { Character } from "../../engine/core/character";
import { ChronicleEventType } from "../../engine/chronicle/chronicle";
import { LocationProfile, LocationProfileContext } from "../../storyteller/types";
import { kMaxLength } from "buffer";
import { config } from "../../engine/config/config";

export class EnvironmentalContext {
    public readonly eventId: String;

    private _world: World;
    private _player: Character;

    private _current: LocationProfile | undefined;
    private _previous: LocationProfile | undefined;
    private _adjacents: LocationProfile[] | undefined;
    private _quadrants: LocationProfile[] | undefined;

    private _contexts: Map<string, LocationProfileContext> = new Map();

    public get depth(): number {
        return this._player.getCurrentLocation().depth;
    }

    public get hasOverview(): boolean {
        return this.depth < World.MAX_ZOOM_DEPTH;
    }

    public get current(): LocationProfile {
        if (!this._current) {
            const node = this._player.getCurrentLocation();
            const context = this._getLocationContext(node);
            this._contexts.set(context.key, context);
            this._current = this._createLocationProfile(node);
        }

        return this._current;
    }

    public get previous(): LocationProfile {
        if (!this._previous) {
            const previousNode = this._player.getPreviousLocation();
            if (!previousNode) {
                throw Error('EnvironmentalContext: Request previous, but no previous location found');
            }

            const context = this._getLocationContext(previousNode);
            this._contexts.set(context.key, context);
            this._previous = this._createLocationProfile(previousNode);
        }

        return this._previous;
    }

    public get adjacents(): LocationProfile[] {
        if (!this._adjacents) {
            const adjacentNodes = this._player.getAdjacentNodes();
            adjacentNodes.forEach((node) => {
                const context = this._getLocationContext(node);
                this._contexts.set(context.key, context);
            });

            this._adjacents = adjacentNodes.map((node) => this._createLocationProfile(node));
        }

        return this._adjacents || [];
    }

    public get quadrants(): LocationProfile[] {
        if (!this._quadrants) {
            const quadrantNodes = this._player.getQuadrantNodes();
            quadrantNodes.forEach((node) => {
                const context = this._getLocationContext(node);
                this._contexts.set(context.key, context);
            });

            this._quadrants = quadrantNodes.map((node) => this._createLocationProfile(node));
        }

        return this._quadrants || [];
    }

    constructor(world: World, player: Character, eventId: string) {
        this.eventId = eventId;
        this._world = world;
        this._player = player;
    }

    public getContext(profile: LocationProfile): LocationProfileContext {
        if (!this._contexts.has(profile.key)) {
            throw Error(`EnvironmentalContext: Requested context for ${profile.key}, but no context found`);
        }

        return this._contexts.get(profile.key)!;
    }

    private _createLocationProfile(node: QuadNode): LocationProfile {
        if (!node.tile) {
            throw Error(`!Missing tile. Node not hybernated: ${node.key.id} `);
        }

        const landmarks = this._world.getMarkersFromNode(node)
            .filter((marker) => marker.type !== 'player-start')
            .map((marker) => ({ type: marker.type }));

        const terrainMarkers = node.tile.terrain.map((spacialMarker) => ({ type: spacialMarker.type, value: spacialMarker.value }));

        const vectorMarkers = node.tile.vectors.map((spacialVector) => {
            const direction = getDirectionFromAdjacentVector(spacialVector.direction.x, spacialVector.direction.y);
            const tileConfig = config.getTile(spacialVector.type);
            //tilesJSON.tiles.find((tileConfig) => tileConfig.name === spacialVector.type);

            return {
                type: spacialVector.type,
                value: spacialVector.value,
                direction: DIRECTION_NAME[direction],
                attention: tileConfig?.attentionValue || 0,
            };
        });



        return {
            key: node.key.id,
            size: this._getSize(node),
            spatialMarkers: [...terrainMarkers, ...vectorMarkers],
            landmarks,
        };
    }

    private _getLocationContext(node: QuadNode): LocationProfileContext {
        const memories = this._player.findMemories({
            types: [ChronicleEventType.Enter],
            locationId: node.key.id,
        });

        const direction = this._getDirection(node);

        return {
            key: node.key.id,
            frequency: memories.length,
            recency: memories.length > 0 ? 0 - memories[0].timestamp : -1,
            direction: direction,
            directionName: direction ? DIRECTION_NAME[direction] : '',
            size: this._getSize(node),
        }
    }

    private _getDirection(node: QuadNode): DIRECTION | undefined {
        const currentLocation = this._player.getCurrentLocation();
        const directionVector = currentLocation.getNormalizedRelativePosition(node);

        if (node === currentLocation || !directionVector) {
            return;
        } else if (currentLocation.depth === node.depth) {
            return getDirectionFromAdjacentVector(directionVector.x, directionVector.y);
        } else if (currentLocation.depth === node.depth - 1) {
            return getDirectionFromQuadrantVector(directionVector.x, directionVector.y);
        } else if (currentLocation.depth - 1 === node.depth) {
            return DIRECTION.UP;
        }

        throw Error('Location Profile context must be adjacent or quadrant node');
    }

    private _getSize(node: QuadNode): number {
        // Size in km. 320 = max
        return 320 / Math.pow(2, node.depth);
    }
}

export class ProfileGeneratorFactory {
    private _world: World;
    private _player: Character;

    constructor(world: World, player: Character) {
        this._world = world;
        this._player = player;
    }

    public create(eventId: string): EnvironmentalContext {
        return new EnvironmentalContext(this._world, this._player, eventId);
    }
}
