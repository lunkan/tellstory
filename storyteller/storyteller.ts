import { Author } from "./author/author";
import { Explorer } from "./explorer/explorer";
import { LocationProfile, LocationProfileContext } from "./types";

export class Storyteller {
    private _explorer: Explorer;
    private _author: Author;

    constructor(worldId: number) {
        this._author = new Author();
        this._explorer = new Explorer();
        this._explorer.load(worldId);
    }

    public async describeEnterWorld(current: LocationProfile): Promise<string> {
        const currentRequest = this._explorer.getLocationDescription(current);
        return currentRequest.then((description) => {
            return this._author.describeEnterWorld(description);
        })
    }

    public async describeSceneTransition(from: LocationProfile, to: LocationProfile, toContext: LocationProfileContext): Promise<string> {
        const fromRequest = this._explorer.getLocationDescription(from);
        const toRequest = this._explorer.getLocationDescription(to);
        const [fromDescription, toDescription] = await Promise.all([fromRequest, toRequest]);
        return this._author.describeSceneTransition(fromDescription, toDescription, toContext);
    }

    public async describeProximity(current: LocationProfile, proximity: LocationProfile[], contexts: LocationProfileContext[]): Promise<string> {
        return this._explorer.getProximityDescription(current, proximity, contexts).then((proximityDescription) => {
            return this._author.describeProximity(proximityDescription, contexts);
        });
    }

    public async describeAdjacentDirection(current: LocationProfile, adjacent: LocationProfile, contexts: LocationProfileContext): Promise<string> {
        const currentRequest = this._explorer.getLocationDescription(current);
        const adjacentRequest = this._explorer.getLocationDescription(adjacent);
        const [currentDescription, adjacentDescription] = await Promise.all([currentRequest, adjacentRequest]);
        return this._author.describeAdjacentDirection(currentDescription, adjacentDescription, contexts);
    }

    public async describQuadrantDirection(current: LocationProfile, quadrant: LocationProfile, contexts: LocationProfileContext): Promise<string> {
        const currentRequest = this._explorer.getLocationDescription(current);
        const quadrantRequest = this._explorer.getLocationDescription(quadrant);
        const [currentDescription, quadrantDescription] = await Promise.all([currentRequest, quadrantRequest]);
        return this._author.describeQuadrantDirection(currentDescription, quadrantDescription, contexts);
    }
}