import { Button } from '@dashalundqvist/editor_ui_poc';
import { getCellEdges } from '../../../../engine/world/cell-edges';
import { getCellDirections } from '../../../../engine/world/cell-directions';
import { QuadNode } from '../../../../engine/world/quad-node';
import { useEditorStore } from '../../../store/editorStore';
import style from './SidebarSelect.module.css';
import { QuadNodeKey } from '../../../../engine/world/quad-node-key';

const VECTOR_CONTEXT_MARGIN = 4;

type SidebarSelectNodeProps = {
    node: QuadNode;
}

function SidebarSelectEmpty() {
    return (
        <div>None selected</div>
    );
}

function SidebarSelectNode({ node }: SidebarSelectNodeProps) {
    const generateMap = useEditorStore((state) => state.generateMap);
    //const [, refresh] = useReducer((version: number) => version + 1, 0);



    const ancestorMarkers = node.getAncestors()
        .filter((ancestorNode) => !!ancestorNode.getTile())
        .flatMap((ancestorNode) => ancestorNode.getOwnMarkers())
        .filter((marker) => !!marker.placement && (marker.placement === node.key.id || node.key.isDescendant(QuadNodeKey.fromId(marker.placement))));

    const root = node.getAncestors().at(-1) ?? node;
    //useEffect(() => root.subscribe(QuadNode.EVENT_DATA_CHANGE, () => refresh()), [root]);

    const { x, y, size } = node.bounds;
    const margin = VECTOR_CONTEXT_MARGIN * size;
    const nearbyNodes = root.findByRect({
        x: x - margin, y: y - margin,
        width: size + 2 * margin, height: size + 2 * margin, z: node.depth,
    }, { selectAllDepth: true });

    const cells = new Map([[node.key.id, node]]);
    const ancestorVectors = getCellDirections(node, getCellEdges(node.depth, nearbyNodes, cells))
        .filter((vector) => vector.scale > node.scale);

    return (
        <div className={style.layout}>
            <div className={style.top}>
                <Button onClick={() => generateMap(node)}>Generate map</Button>
                <Button>Detach</Button>
                <Button>Clear</Button>
            </div>

            <div className={style.content}>

                <div className={style.group}>
                    <h4 className={style.groupHeading}>Coordinates</h4>
                    <div className={style.hGroup}>
                        <div className={style.hEntry}>
                            <div className={style.key}>X:</div>
                            <div className={style.value}>{node.bounds.x}</div>
                        </div>
                        <div className={style.hEntry}>
                            <div className={style.key}>Y:</div>
                            <div className={style.value}>{node.bounds.y}</div>
                        </div>
                        <div className={style.hEntry}>
                            <div className={style.key}>Z:</div>
                            <div className={style.value}>{node.depth}</div>
                        </div>
                    </div>
                </div>

                <div className={style.group}>
                    <h4 className={style.groupHeading}>Status</h4>
                    <div className={style.entry}>
                        <div className={style.key}>Hydrated</div>
                        <div className={style.value}>{node.hasTile() ? 'true' : 'false'}</div>
                    </div>
                    <div className={style.entry}>
                        <div className={style.key}>Detatched</div>
                        <div className={style.value}>{node.isDetached() ? 'true' : 'false'}</div>
                    </div>
                    <div className={style.entry}>
                        <div className={style.key}>Locked</div>
                        <div className={style.value}>{node.isLocked() ? 'true' : 'false'}</div>
                    </div>
                </div>

                <div className={style.group}>
                    <h4 className={style.groupHeading}>Terrain</h4>
                    {node.getTile()?.terrain.map((terrain, i) =>
                        <div key={i} className={style.entry}>
                            <div className={style.key}>{terrain.type}</div>
                            <div className={style.value}>{terrain.value}</div>
                        </div>
                    )}
                </div>

                <div className={style.group}>
                    <h4 className={style.groupHeading}>Vectors</h4>
                    <div>
                        <h5 className={style.markerGroupHeading}>Ancestors</h5>
                        {ancestorVectors.map((cellEdge, i) =>
                            <div key={i} className={style.entry}>
                                <div className={style.key}>{cellEdge.type}</div>
                                <div className={style.direction}>
                                    <div>x: {cellEdge.direction.x}</div>
                                    <div>y: {cellEdge.direction.y}</div>
                                </div>
                            </div>
                        )}
                    </div>
                    <div>
                        <h5 className={style.markerGroupHeading}>Current</h5>
                        {node.getTile()?.vectors.map((vector, i) =>
                            <div key={i} className={style.entry}>
                                <div className={style.key}>{vector.type}</div>
                                <div className={style.direction}>
                                    <div>x: {vector.direction.x}</div>
                                    <div>y: {vector.direction.y}</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className={style.group}>
                    <h4 className={style.groupHeading}>Markers</h4>
                    <div>
                        <h5 className={style.markerGroupHeading}>Ancestors</h5>
                        {ancestorMarkers.map((marker, i) =>
                            <div key={i} className={style.entry}>
                                <div className={style.key}>{marker.type}</div>
                                <div className={style.value}>{marker.attention}</div>
                            </div>
                        )}
                    </div>
                    <div>
                        <h5 className={style.markerGroupHeading}>Current</h5>
                        {node.getTile()?.markers.map((marker, i) =>
                            <div key={i} className={style.entry}>
                                <div className={style.key}>{marker.type}</div>
                                <div className={style.value}>{marker.attention}</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export function SidebarSelect() {
    const selectedNode = useEditorStore((state) => state.selectedNode);

    return (
        <div className={style.wrapper}>
            {selectedNode ? <SidebarSelectNode node={selectedNode} /> : <SidebarSelectEmpty />}
        </div>
    );
}