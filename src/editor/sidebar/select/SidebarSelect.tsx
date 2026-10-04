import { Button } from '@dashalundqvist/editor_ui_poc';
import { QuadNode } from '../../../../engine/world/quad-node';
import { useEditorStore } from '../../../store/editorStore';
import style from './SidebarSelect.module.css';

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

    const ancestorMarkers = node.getAncestors()
        .filter((node) => !!node.tile)
        .flatMap((node) => node.tile!.markers);

    const decendentMarkers = node.getAllQuadrants(true)
        .filter((node) => !!node.tile)
        .flatMap((node) => node.tile!.markers);

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
                    <div className={style.entry}>
                        <div className={style.key}>X</div>
                        <div className={style.value}>{node.bounds.x}</div>
                    </div>
                    <div className={style.entry}>
                        <div className={style.key}>Y</div>
                        <div className={style.value}>{node.bounds.y}</div>
                    </div>
                    <div className={style.entry}>
                        <div className={style.key}>Z</div>
                        <div className={style.value}>{node.depth}</div>
                    </div>
                </div>

                <div className={style.group}>
                    <h4 className={style.groupHeading}>Status</h4>
                    <div className={style.entry}>
                        <div className={style.key}>Hydrated</div>
                        <div className={style.value}>{node.isGenerated()}</div>
                    </div>
                    <div className={style.entry}>
                        <div className={style.key}>Locked</div>
                        <div className={style.value}>{node.isLocked()}</div>
                    </div>
                </div>

                <div className={style.group}>
                    <h4 className={style.groupHeading}>Terrain</h4>
                    {node.tile?.terrain.map((terrain, i) =>
                        <div key={i} className={style.entry}>
                            <div className={style.key}>{terrain.type}</div>
                            <div className={style.value}>{terrain.value}</div>
                        </div>
                    )}
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
                        {node.tile?.markers.map((marker, i) =>
                            <div key={i} className={style.entry}>
                                <div className={style.key}>{marker.type}</div>
                                <div className={style.value}>{marker.attention}</div>
                            </div>
                        )}
                    </div>
                    <div>
                        <h5 className={style.markerGroupHeading}>Decendents</h5>
                        {decendentMarkers.map((marker, i) =>
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