import { MarkerSetting } from '../types';
import { QuadNode } from './quad-node';

/**
 * Id of the node a marker currently sits in. Placement is not saved, so a marker without one
 * (just loaded, or not narrowed yet) sits in the node that holds it.
 */
export function getMarkerPlacement(marker: MarkerSetting, host: QuadNode): string {
    return marker.placement ?? host.key.id;
}
